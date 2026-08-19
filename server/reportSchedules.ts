import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { dashboardReportSchedules, type DashboardReportSchedule } from "../drizzle/schema";
import { getDb } from "./db";
import { runScheduledDashboardReport } from "./dashboardReports";
import { createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { ENV } from "./_core/env";
import { assertTransactionalEmailDeliveryEnabled, parseEmailRecipients } from "./transactionalEmail";

export type ReportFormat = "csv" | "pdf";
export type ReportFrequency = "daily" | "weekly" | "monthly";
export type ReportModules = {
  finance: boolean;
  sales: boolean;
  crm: boolean;
  inventory: boolean;
  operations: boolean;
};
export type ReportDateRange = { start: string; end: string };
export type ReportScheduleInput = {
  companyId: string;
  name: string;
  recipientEmail: string;
  ccEmails?: string;
  frequency: ReportFrequency;
  format: ReportFormat;
  modules: ReportModules;
  dateRange: ReportDateRange;
};

const CRON_BY_FREQUENCY: Record<ReportFrequency, string> = {
  daily: "0 0 9 * * *",
  weekly: "0 0 9 * * 1",
  monthly: "0 0 9 1 * *",
};

function assertValidScheduleInput(input: ReportScheduleInput): void {
  if (!input.companyId || input.companyId.length > 100) throw new TRPCError({ code: "BAD_REQUEST", message: "A valid company is required." });
  if (!input.name.trim() || input.name.length > 120) throw new TRPCError({ code: "BAD_REQUEST", message: "Report name must be 1–120 characters." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.recipientEmail)) throw new TRPCError({ code: "BAD_REQUEST", message: "A valid recipient email is required." });
  parseEmailRecipients(input.ccEmails, "CC");
  if (!Object.keys(CRON_BY_FREQUENCY).includes(input.frequency)) throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported report frequency." });
  if (!(["csv", "pdf"] as string[]).includes(input.format)) throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported report format." });
  if (input.dateRange.start && input.dateRange.end && input.dateRange.start > input.dateRange.end) throw new TRPCError({ code: "BAD_REQUEST", message: "Report start date must be on or before the end date." });
}

function serializeSchedule(row: DashboardReportSchedule) {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    recipientEmail: row.recipientEmail,
    ccEmails: row.ccEmails || "",
    frequency: row.frequency as ReportFrequency,
    format: row.format as ReportFormat,
    modules: row.modules as ReportModules,
    dateRange: row.dateRange as ReportDateRange,
    scheduleCronTaskUid: row.scheduleCronTaskUid,
    isActive: row.isActive,
    lastSentAt: row.lastSentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function assertSupabaseCompanyAccess(companyId: string, sessionToken: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey || !sessionToken || sessionToken === ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "A valid Supabase session is required to schedule reports." });
  }
  const params = new URLSearchParams({ select: "id", id: `eq.${companyId}`, limit: "1" });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/companies?${params.toString()}`, {
    headers: { accept: "application/json", apikey: ENV.supabaseAnonKey, authorization: `Bearer ${sessionToken}` },
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(rows) || rows.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this company." });
  }
  return true as const;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Report scheduling database is unavailable." });
  return db;
}

async function getOwnedSchedule(id: number, ownerOpenId: string) {
  const db = await requireDb();
  const rows = await db.select().from(dashboardReportSchedules)
    .where(and(eq(dashboardReportSchedules.id, id), eq(dashboardReportSchedules.ownerOpenId, ownerOpenId)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Report schedule not found." });
  return { db, row };
}

export async function listReportSchedules(ownerOpenId: string) {
  const db = await requireDb();
  const rows = await db.select().from(dashboardReportSchedules)
    .where(eq(dashboardReportSchedules.ownerOpenId, ownerOpenId))
    .orderBy(desc(dashboardReportSchedules.createdAt));
  return rows.map(serializeSchedule);
}

export async function createReportSchedule(owner: { id: number; openId: string }, sessionToken: string, input: ReportScheduleInput) {
  assertValidScheduleInput(input);
  assertTransactionalEmailDeliveryEnabled();
  await assertSupabaseCompanyAccess(input.companyId, sessionToken);
  const db = await requireDb();
  const [insertResult] = await db.insert(dashboardReportSchedules).values({
    ownerUserId: owner.id,
    ownerOpenId: owner.openId,
    companyId: input.companyId,
    name: input.name.trim(),
    recipientEmail: input.recipientEmail.trim().toLowerCase(),
    ccEmails: parseEmailRecipients(input.ccEmails, "CC").join(","),
    cronExpression: CRON_BY_FREQUENCY[input.frequency],
    frequency: input.frequency,
    format: input.format,
    modules: input.modules,
    dateRange: input.dateRange,
    isActive: true,
  });
  const scheduleId = Number((insertResult as { insertId?: number }).insertId);
  if (!scheduleId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create report schedule." });
  try {
    const heartbeat = await createHeartbeatJob({
      name: `dashboard-report-${owner.openId}-${scheduleId}`,
      cron: CRON_BY_FREQUENCY[input.frequency],
      path: "/api/scheduled/dashboardReport",
      payload: { scheduleId },
      description: `BusinessSphere dashboard ${input.format.toUpperCase()} report: ${input.name}`,
    }, sessionToken);
    await db.update(dashboardReportSchedules)
      .set({ scheduleCronTaskUid: heartbeat.taskUid })
      .where(and(eq(dashboardReportSchedules.id, scheduleId), eq(dashboardReportSchedules.ownerOpenId, owner.openId)));
  } catch (error) {
    await db.delete(dashboardReportSchedules).where(eq(dashboardReportSchedules.id, scheduleId));
    throw error;
  }
  const created = await db.select().from(dashboardReportSchedules).where(eq(dashboardReportSchedules.id, scheduleId)).limit(1);
  return serializeSchedule(created[0]);
}

export async function updateReportSchedule(ownerOpenId: string, sessionToken: string, id: number, patch: Partial<ReportScheduleInput> & { isActive?: boolean }) {
  const { db, row } = await getOwnedSchedule(id, ownerOpenId);
  const next = {
    companyId: patch.companyId ?? row.companyId,
    name: patch.name ?? row.name,
    recipientEmail: patch.recipientEmail ?? row.recipientEmail,
    ccEmails: patch.ccEmails ?? row.ccEmails ?? "",
    frequency: patch.frequency ?? row.frequency as ReportFrequency,
    format: patch.format ?? row.format as ReportFormat,
    modules: patch.modules ?? row.modules as ReportModules,
    dateRange: patch.dateRange ?? row.dateRange as ReportDateRange,
  } satisfies ReportScheduleInput;
  assertValidScheduleInput(next);
  if (patch.companyId) await assertSupabaseCompanyAccess(next.companyId, sessionToken);
  if (row.scheduleCronTaskUid) {
    await updateHeartbeatJob(row.scheduleCronTaskUid, {
      cron: CRON_BY_FREQUENCY[next.frequency],
      payload: { scheduleId: id },
      description: `BusinessSphere dashboard ${next.format.toUpperCase()} report: ${next.name}`,
      enable: patch.isActive ?? row.isActive,
    }, sessionToken);
  }
  await db.update(dashboardReportSchedules).set({
    companyId: next.companyId,
    name: next.name.trim(),
    recipientEmail: next.recipientEmail.trim().toLowerCase(),
    ccEmails: parseEmailRecipients(next.ccEmails, "CC").join(","),
    cronExpression: CRON_BY_FREQUENCY[next.frequency],
    frequency: next.frequency,
    format: next.format,
    modules: next.modules,
    dateRange: next.dateRange,
    isActive: patch.isActive ?? row.isActive,
  }).where(and(eq(dashboardReportSchedules.id, id), eq(dashboardReportSchedules.ownerOpenId, ownerOpenId)));
  const updated = await db.select().from(dashboardReportSchedules).where(eq(dashboardReportSchedules.id, id)).limit(1);
  return serializeSchedule(updated[0]);
}

export async function deleteReportSchedule(ownerOpenId: string, sessionToken: string, id: number) {
  const { db, row } = await getOwnedSchedule(id, ownerOpenId);
  if (row.scheduleCronTaskUid) await deleteHeartbeatJob(row.scheduleCronTaskUid, sessionToken);
  await db.delete(dashboardReportSchedules).where(and(eq(dashboardReportSchedules.id, id), eq(dashboardReportSchedules.ownerOpenId, ownerOpenId)));
  return { success: true as const };
}

export async function sendReportScheduleNow(ownerOpenId: string, id: number) {
  const { row } = await getOwnedSchedule(id, ownerOpenId);
  if (!row.scheduleCronTaskUid) throw new TRPCError({ code: "BAD_REQUEST", message: "Report schedule task is not configured." });
  return runScheduledDashboardReport(row.scheduleCronTaskUid);
}

export async function getReportScheduleByTaskUid(taskUid: string) {
  const db = await requireDb();
  const rows = await db.select().from(dashboardReportSchedules)
    .where(eq(dashboardReportSchedules.scheduleCronTaskUid, taskUid))
    .limit(1);
  return rows[0];
}

export async function markReportSent(id: number) {
  const db = await requireDb();
  await db.update(dashboardReportSchedules).set({ lastSentAt: new Date() }).where(eq(dashboardReportSchedules.id, id));
}
