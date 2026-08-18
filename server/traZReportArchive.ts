import { parse as parseCookie } from "cookie";
import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { traZReportArchiveSchedules, traZReportArchives, type TraZReportArchiveSchedule, type TraZReportArchive } from "../drizzle/schema";
import { fiscalReceipts, zReports } from "./traFiscal";
import { getDb } from "./db";
import { createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { storagePut } from "./storage";

export const DAILY_TRA_ARCHIVE_CRON = "0 0 1 * * *";

export type TraArchiveSummary = {
  companyId: string;
  branchId: string;
  businessDate: string;
  totalTransactions: number;
  verifiedTransactions: number;
  excludedTransactions: number;
  grossSales: number;
  taxableSales: number;
  vatTotal: number;
  netSales: number;
  receiptNumbers: string[];
};

export type TraArchiveScheduleInput = { companyId: string; branchId: string };

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "TRA archive database is unavailable." });
  return db;
}

export function getSessionToken(req: { headers: { cookie?: string; authorization?: string } }): string {
  const cookieToken = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const authorization = req.headers.authorization;
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

export function previousUtcBusinessDate(now = new Date()): string {
  const previous = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return previous.toISOString().slice(0, 10);
}

export function assertBusinessDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TRPCError({ code: "BAD_REQUEST", message: "Business date must use YYYY-MM-DD." });
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Business date is invalid." });
  }
}

async function getReceiptsForBusinessDate(companyId: string, branchId: string, businessDate: string) {
  const db = await requireDb();
  return db.select({
    id: fiscalReceipts.id,
    receiptNumber: fiscalReceipts.receiptNumber,
    status: fiscalReceipts.status,
    grossAmount: fiscalReceipts.grossAmount,
    vatAmount: fiscalReceipts.vatAmount,
    netAmount: fiscalReceipts.netAmount,
    receiptTimestamp: fiscalReceipts.receiptTimestamp,
    sourceType: fiscalReceipts.sourceType,
    sourceId: fiscalReceipts.sourceId,
  }).from(fiscalReceipts).where(and(
    eq(fiscalReceipts.companyId, companyId),
    eq(fiscalReceipts.branchId, branchId),
    sql`DATE(${fiscalReceipts.receiptTimestamp}) = ${businessDate}`,
  )).orderBy(fiscalReceipts.receiptTimestamp);
}

export async function buildTraArchiveSummary(companyId: string, branchId: string, businessDate: string): Promise<TraArchiveSummary> {
  assertBusinessDate(businessDate);
  const rows = await getReceiptsForBusinessDate(companyId, branchId, businessDate);
  const verifiedRows = rows.filter((row) => row.status === "VERIFIED" || row.status === "SUBMITTED");
  const sum = (field: "grossAmount" | "vatAmount" | "netAmount") => verifiedRows.reduce((total, row) => total + Number(row[field] ?? 0), 0);
  return {
    companyId,
    branchId,
    businessDate,
    totalTransactions: rows.length,
    verifiedTransactions: verifiedRows.length,
    excludedTransactions: rows.length - verifiedRows.length,
    grossSales: Number(sum("grossAmount").toFixed(2)),
    taxableSales: Number(sum("netAmount").toFixed(2)),
    vatTotal: Number(sum("vatAmount").toFixed(2)),
    netSales: Number(sum("netAmount").toFixed(2)),
    receiptNumbers: verifiedRows.map((row) => row.receiptNumber),
  };
}

function stableZNumber(companyId: string, branchId: string, businessDate: string) {
  const safeCompany = companyId.replace(/[^a-zA-Z0-9]/g, "").slice(-18) || "COMPANY";
  const safeBranch = branchId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "MAIN";
  return `Z-${safeCompany}-${safeBranch}-${businessDate.replace(/-/g, "")}`.slice(0, 64);
}

async function getArchiveRow(companyId: string, branchId: string, businessDate: string) {
  const db = await requireDb();
  const rows = await db.select().from(traZReportArchives).where(and(
    eq(traZReportArchives.companyId, companyId),
    eq(traZReportArchives.branchId, branchId),
    eq(traZReportArchives.businessDate, businessDate),
  )).limit(1);
  return rows[0];
}

async function persistFailure(companyId: string, branchId: string, businessDate: string, summary: TraArchiveSummary, error: string) {
  const db = await requireDb();
  const existing = await getArchiveRow(companyId, branchId, businessDate);
  if (existing) {
    await db.update(traZReportArchives).set({ status: "failed", summary, error }).where(eq(traZReportArchives.id, existing.id));
    return db.select().from(traZReportArchives).where(eq(traZReportArchives.id, existing.id)).limit(1).then((rows) => rows[0]);
  }
  const inserted = await db.insert(traZReportArchives).values({
    companyId,
    branchId,
    businessDate,
    zNumber: stableZNumber(companyId, branchId, businessDate),
    status: "failed",
    summary,
    error,
  });
  const id = Number((inserted as { insertId?: number }).insertId);
  return db.select().from(traZReportArchives).where(eq(traZReportArchives.id, id)).limit(1).then((rows) => rows[0]);
}

export async function archiveTraZReport(companyId: string, branchId: string, businessDate: string): Promise<TraZReportArchive> {
  const existing = await getArchiveRow(companyId, branchId, businessDate);
  if (existing?.status === "archived" && existing.storageKey) return existing;

  const summary = await buildTraArchiveSummary(companyId, branchId, businessDate);
  const zNumber = existing?.zNumber || stableZNumber(companyId, branchId, businessDate);
  const receiptRows = await getReceiptsForBusinessDate(companyId, branchId, businessDate);
  const payload = {
    archiveVersion: 1,
    generatedAt: new Date().toISOString(),
    zNumber,
    summary,
    receipts: receiptRows.map((row) => ({
      id: row.id,
      receiptNumber: row.receiptNumber,
      status: row.status,
      grossAmount: Number(row.grossAmount ?? 0),
      vatAmount: Number(row.vatAmount ?? 0),
      netAmount: Number(row.netAmount ?? 0),
      receiptTimestamp: row.receiptTimestamp,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
    })),
  };
  const archiveData = Buffer.from(JSON.stringify(payload, null, 2), "utf8");

  try {
    const stored = await storagePut(`tra/${companyId}/${branchId}/z-reports/${businessDate}.json`, archiveData, "application/json");
    const db = await requireDb();
    const zRows = await db.select().from(zReports).where(and(
      eq(zReports.companyId, companyId),
      eq(zReports.branchId, branchId),
      eq(zReports.businessDate, businessDate),
    )).limit(1);
    const zReport = zRows[0];
    if (zReport) {
      await db.update(zReports).set({
        status: "archived",
        zNumber,
        totalTransactions: summary.verifiedTransactions,
        grossSales: summary.grossSales.toFixed(2),
        taxableSales: summary.taxableSales.toFixed(2),
        vatTotal: summary.vatTotal.toFixed(2),
        rawPayload: payload,
        updatedAt: new Date(),
      }).where(eq(zReports.id, zReport.id));
    } else {
      await db.insert(zReports).values({
        companyId,
        branchId,
        businessDate,
        zNumber,
        status: "archived",
        totalTransactions: summary.verifiedTransactions,
        grossSales: summary.grossSales.toFixed(2),
        taxableSales: summary.taxableSales.toFixed(2),
        vatTotal: summary.vatTotal.toFixed(2),
        rawPayload: payload,
      });
    }

    if (existing) {
      await db.update(traZReportArchives).set({
        zReportId: zReport?.id ?? null,
        zNumber,
        status: "archived",
        storageKey: stored.key,
        storageUrl: stored.url,
        archiveBytes: archiveData.byteLength,
        summary,
        error: null,
      }).where(eq(traZReportArchives.id, existing.id));
      const rows = await db.select().from(traZReportArchives).where(eq(traZReportArchives.id, existing.id)).limit(1);
      return rows[0];
    }

    const inserted = await db.insert(traZReportArchives).values({
      companyId,
      branchId,
      businessDate,
      zReportId: zReport?.id ?? null,
      zNumber,
      status: "archived",
      storageKey: stored.key,
      storageUrl: stored.url,
      archiveBytes: archiveData.byteLength,
      summary,
    });
    const archiveId = Number((inserted as { insertId?: number }).insertId);
    const rows = await db.select().from(traZReportArchives).where(eq(traZReportArchives.id, archiveId)).limit(1);
    if (!rows[0]) throw new Error("TRA Z-report archive metadata could not be loaded after upload.");
    return rows[0];
  } catch (error) {
    const failed = await persistFailure(companyId, branchId, businessDate, summary, error instanceof Error ? error.message : String(error));
    if (!failed) throw error;
    return failed;
  }
}

export async function getTraArchiveSchedule(companyId: string, branchId: string) {
  const db = await requireDb();
  const rows = await db.select().from(traZReportArchiveSchedules).where(and(
    eq(traZReportArchiveSchedules.companyId, companyId),
    eq(traZReportArchiveSchedules.branchId, branchId),
  )).limit(1);
  return rows[0] ?? null;
}

export async function listTraArchives(companyId: string, limit = 30) {
  const db = await requireDb();
  return db.select().from(traZReportArchives)
    .where(eq(traZReportArchives.companyId, companyId))
    .orderBy(desc(traZReportArchives.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}

export async function createOrActivateTraArchiveSchedule(owner: { id: number; openId: string }, sessionToken: string, input: TraArchiveScheduleInput) {
  if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "An authenticated session is required to activate daily Z-report archives." });
  const db = await requireDb();
  let schedule = await getTraArchiveSchedule(input.companyId, input.branchId);
  if (!schedule) {
    const inserted = await db.insert(traZReportArchiveSchedules).values({
      ownerUserId: owner.id,
      ownerOpenId: owner.openId,
      companyId: input.companyId,
      branchId: input.branchId,
      cronExpression: DAILY_TRA_ARCHIVE_CRON,
      isActive: true,
    });
    const id = Number((inserted as { insertId?: number }).insertId);
    const rows = await db.select().from(traZReportArchiveSchedules).where(eq(traZReportArchiveSchedules.id, id)).limit(1);
    schedule = rows[0];
  }
  if (!schedule) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Daily TRA archive schedule could not be created." });

  if (schedule.scheduleCronTaskUid) {
    await updateHeartbeatJob(schedule.scheduleCronTaskUid, {
      cron: schedule.cronExpression,
      path: "/api/scheduled/traZReportArchive",
      payload: { scheduleId: schedule.id },
      description: `Daily TRA Z-report archive for ${input.companyId}/${input.branchId}`,
      enable: true,
    }, sessionToken);
  } else {
    try {
      const heartbeat = await createHeartbeatJob({
        name: `tra-z-report-archive-${schedule.id}`,
        cron: schedule.cronExpression,
        path: "/api/scheduled/traZReportArchive",
        payload: { scheduleId: schedule.id },
        description: `Daily TRA Z-report archive for ${input.companyId}/${input.branchId}`,
      }, sessionToken);
      await db.update(traZReportArchiveSchedules).set({ scheduleCronTaskUid: heartbeat.taskUid, isActive: true }).where(eq(traZReportArchiveSchedules.id, schedule.id));
    } catch (error) {
      if (!schedule.scheduleCronTaskUid) await db.delete(traZReportArchiveSchedules).where(eq(traZReportArchiveSchedules.id, schedule.id));
      throw error;
    }
  }
  const refreshed = await db.select().from(traZReportArchiveSchedules).where(eq(traZReportArchiveSchedules.id, schedule.id)).limit(1);
  return refreshed[0];
}

export async function updateTraArchiveSchedule(ownerOpenId: string, sessionToken: string, scheduleId: number, isActive: boolean) {
  const db = await requireDb();
  const rows = await db.select().from(traZReportArchiveSchedules).where(and(
    eq(traZReportArchiveSchedules.id, scheduleId),
    eq(traZReportArchiveSchedules.ownerOpenId, ownerOpenId),
  )).limit(1);
  const schedule = rows[0];
  if (!schedule) throw new TRPCError({ code: "NOT_FOUND", message: "TRA archive schedule not found." });
  if (schedule.scheduleCronTaskUid) await updateHeartbeatJob(schedule.scheduleCronTaskUid, { enable: isActive }, sessionToken);
  await db.update(traZReportArchiveSchedules).set({ isActive }).where(eq(traZReportArchiveSchedules.id, scheduleId));
  const refreshed = await db.select().from(traZReportArchiveSchedules).where(eq(traZReportArchiveSchedules.id, scheduleId)).limit(1);
  return refreshed[0];
}

export async function deleteTraArchiveSchedule(ownerOpenId: string, sessionToken: string, scheduleId: number) {
  const db = await requireDb();
  const rows = await db.select().from(traZReportArchiveSchedules).where(and(
    eq(traZReportArchiveSchedules.id, scheduleId),
    eq(traZReportArchiveSchedules.ownerOpenId, ownerOpenId),
  )).limit(1);
  const schedule = rows[0];
  if (!schedule) throw new TRPCError({ code: "NOT_FOUND", message: "TRA archive schedule not found." });
  if (schedule.scheduleCronTaskUid) await deleteHeartbeatJob(schedule.scheduleCronTaskUid, sessionToken);
  await db.delete(traZReportArchiveSchedules).where(eq(traZReportArchiveSchedules.id, scheduleId));
  return { success: true as const };
}

export async function runScheduledTraZReportArchive(taskUid: string) {
  const db = await requireDb();
  const rows = await db.select().from(traZReportArchiveSchedules).where(and(
    eq(traZReportArchiveSchedules.scheduleCronTaskUid, taskUid),
    eq(traZReportArchiveSchedules.isActive, true),
  )).limit(1);
  const schedule = rows[0];
  if (!schedule) return { ok: true as const, skipped: "orphan-or-paused" as const };
  const businessDate = previousUtcBusinessDate();
  const archive = await archiveTraZReport(schedule.companyId, schedule.branchId, businessDate);
  await db.update(traZReportArchiveSchedules).set({
    lastRunAt: new Date(),
    lastRunStatus: archive.status,
    lastArchiveId: archive.id,
  }).where(eq(traZReportArchiveSchedules.id, schedule.id));
  return { ok: true as const, scheduleId: schedule.id, businessDate, archive };
}

export async function getTraArchiveScheduleByTaskUid(taskUid: string): Promise<TraZReportArchiveSchedule | undefined> {
  const db = await requireDb();
  const rows = await db.select().from(traZReportArchiveSchedules).where(eq(traZReportArchiveSchedules.scheduleCronTaskUid, taskUid)).limit(1);
  return rows[0];
}
