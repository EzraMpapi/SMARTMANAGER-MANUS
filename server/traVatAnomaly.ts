import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { traVatAnomalyEvents, traVatAnomalySettings, type TraVatAnomalySettings } from "../drizzle/schema";
import { fiscalReceipts } from "./traFiscal";
import { getDb } from "./db";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { notifyOwner } from "./_core/notification";

export const DAILY_TRA_VAT_ANOMALY_CRON = "0 0 6 * * *";

export type VatAnomalyEvaluation = {
  period: string;
  currentVat: number;
  historicalAverageVat: number;
  variancePercent: number;
  thresholdPercent: number;
  status: "healthy" | "triggered" | "suppressed";
  deliveryStatus: "not_applicable" | "sent" | "failed" | "suppressed";
  message?: string;
};

export type VatAnomalySettingsInput = {
  companyId: string;
  enabled: boolean;
  thresholdPercent: number;
  cooldownMinutes: number;
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VAT anomaly database is unavailable." });
  return db;
}

export function validateVatAnomalySettings(input: Pick<VatAnomalySettingsInput, "thresholdPercent" | "cooldownMinutes">) {
  if (!Number.isInteger(input.thresholdPercent) || input.thresholdPercent < 5 || input.thresholdPercent > 500) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "VAT anomaly threshold must be a whole percentage between 5% and 500%." });
  }
  if (!Number.isInteger(input.cooldownMinutes) || input.cooldownMinutes < 15 || input.cooldownMinutes > 10080) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "VAT anomaly cooldown must be between 15 minutes and 7 days." });
  }
}

export function calculateVatVariance(currentVat: number, historicalAverageVat: number) {
  if (historicalAverageVat <= 0) return 0;
  return Number((((currentVat - historicalAverageVat) / historicalAverageVat) * 100).toFixed(2));
}

function monthStart(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function periodFromDate(date: Date) {
  return date.toISOString().slice(0, 7);
}

function shiftPeriod(period: string, offset: number) {
  const start = monthStart(period);
  start.setUTCMonth(start.getUTCMonth() + offset);
  return periodFromDate(start);
}

export function previousCompleteMonth(reference = new Date()) {
  const currentMonthStart = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  currentMonthStart.setUTCMonth(currentMonthStart.getUTCMonth() - 1);
  return periodFromDate(currentMonthStart);
}

async function getMonthlyVatTotals(companyId: string, endPeriod: string) {
  const db = await requireDb();
  const startPeriod = shiftPeriod(endPeriod, -6);
  const start = monthStart(startPeriod);
  const end = new Date(monthStart(endPeriod));
  end.setUTCMonth(end.getUTCMonth() + 1);
  const monthExpression = sql<string>`DATE_FORMAT(${fiscalReceipts.receiptTimestamp}, '%Y-%m')`;
  const rows = await db.select({
    period: monthExpression,
    vat: sql<string>`COALESCE(SUM(CASE WHEN ${fiscalReceipts.status} IN ('VERIFIED', 'SUBMITTED') THEN CAST(${fiscalReceipts.vatAmount} AS DECIMAL(14,2)) ELSE 0 END), 0)`,
  }).from(fiscalReceipts).where(and(
    eq(fiscalReceipts.companyId, companyId),
    gte(fiscalReceipts.receiptTimestamp, start),
    lt(fiscalReceipts.receiptTimestamp, end),
    inArray(fiscalReceipts.status, ["VERIFIED", "SUBMITTED"]),
  )).groupBy(monthExpression);
  const totals = new Map(rows.map((row) => [row.period, Number(row.vat || 0)]));
  return Array.from({ length: 7 }, (_, index) => {
    const period = shiftPeriod(endPeriod, index - 6);
    return { period, vat: Number((totals.get(period) || 0).toFixed(2)) };
  });
}

export async function getVatAnomalySettings(companyId: string): Promise<TraVatAnomalySettings> {
  const db = await requireDb();
  const rows = await db.select().from(traVatAnomalySettings).where(eq(traVatAnomalySettings.companyId, companyId)).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(traVatAnomalySettings).values({ companyId, enabled: true, thresholdPercent: 50, cooldownMinutes: 1440, cronExpression: DAILY_TRA_VAT_ANOMALY_CRON });
  const created = await db.select().from(traVatAnomalySettings).where(eq(traVatAnomalySettings.companyId, companyId)).limit(1);
  if (!created[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VAT anomaly settings could not be initialized." });
  return created[0];
}

export async function evaluateVatAnomaly(companyId: string, settings: TraVatAnomalySettings, period = previousCompleteMonth(), branchId?: string): Promise<VatAnomalyEvaluation> {
  const db = await requireDb();
  const monthlyTotals = await getMonthlyVatTotals(companyId, period);
  const currentVat = monthlyTotals.find((item) => item.period === period)?.vat || 0;
  const historical = monthlyTotals.filter((item) => item.period !== period).map((item) => item.vat).filter((value) => value > 0);
  const historicalAverageVat = historical.length ? Number((historical.reduce((sum, value) => sum + value, 0) / historical.length).toFixed(2)) : 0;
  const variancePercent = calculateVatVariance(currentVat, historicalAverageVat);
  const isAnomaly = settings.enabled && historicalAverageVat > 0 && variancePercent >= settings.thresholdPercent;
  const base = { period, currentVat, historicalAverageVat, variancePercent, thresholdPercent: settings.thresholdPercent };

  await db.update(traVatAnomalySettings).set({ lastEvaluatedAt: new Date(), updatedAt: new Date() }).where(eq(traVatAnomalySettings.id, settings.id));
  if (!isAnomaly) return { ...base, status: "healthy", deliveryStatus: "not_applicable" };

  const message = `TRA VAT anomaly alert for ${companyId}${branchId ? `/${branchId}` : ""}: output VAT for ${period} is TZS ${currentVat.toLocaleString()} versus a historical average of TZS ${historicalAverageVat.toLocaleString()} (${variancePercent}% above average; threshold ${settings.thresholdPercent}%).`;
  const lastAlertAt = settings.lastAlertAt?.getTime() || 0;
  const cooldownActive = lastAlertAt > 0 && Date.now() - lastAlertAt < settings.cooldownMinutes * 60 * 1000;
  if (cooldownActive) {
    await db.insert(traVatAnomalyEvents).values({ companyId, branchId: branchId || null, period, currentVat: currentVat.toFixed(2), historicalAverageVat: historicalAverageVat.toFixed(2), variancePercent: variancePercent.toFixed(2), thresholdPercent: settings.thresholdPercent, status: "suppressed", deliveryStatus: "suppressed", message: `${message} Notification suppressed during the configured cooldown.` });
    return { ...base, status: "suppressed", deliveryStatus: "suppressed", message };
  }

  const delivered = await notifyOwner({ title: "TRA VAT anomaly alert", content: message }).catch(() => false);
  const deliveryStatus = delivered ? "sent" : "failed";
  await db.insert(traVatAnomalyEvents).values({ companyId, branchId: branchId || null, period, currentVat: currentVat.toFixed(2), historicalAverageVat: historicalAverageVat.toFixed(2), variancePercent: variancePercent.toFixed(2), thresholdPercent: settings.thresholdPercent, status: "triggered", deliveryStatus, message });
  await db.update(traVatAnomalySettings).set({ lastAlertAt: new Date(), lastDeliveryStatus: deliveryStatus, lastMessage: message, updatedAt: new Date() }).where(eq(traVatAnomalySettings.id, settings.id));
  return { ...base, status: "triggered", deliveryStatus, message };
}

export async function saveVatAnomalySettings(owner: { openId: string }, sessionToken: string, input: VatAnomalySettingsInput) {
  validateVatAnomalySettings(input);
  const db = await requireDb();
  const existing = await getVatAnomalySettings(input.companyId);
  if (existing.scheduleCronTaskUid) {
    await updateHeartbeatJob(existing.scheduleCronTaskUid, { enable: input.enabled, cron: existing.cronExpression, payload: { settingsId: existing.id }, description: `Daily TRA VAT anomaly evaluation for ${input.companyId}` }, sessionToken);
  } else if (input.enabled) {
    const heartbeat = await createHeartbeatJob({
      name: `tra-vat-anomaly-${owner.openId}-${existing.id}`,
      cron: existing.cronExpression,
      path: "/api/scheduled/traVatAnomaly",
      payload: { settingsId: existing.id },
      description: `Daily TRA VAT anomaly evaluation for ${input.companyId}`,
    }, sessionToken);
    await db.update(traVatAnomalySettings).set({ scheduleCronTaskUid: heartbeat.taskUid }).where(eq(traVatAnomalySettings.id, existing.id));
  }
  await db.update(traVatAnomalySettings).set({ enabled: input.enabled, thresholdPercent: input.thresholdPercent, cooldownMinutes: input.cooldownMinutes, updatedAt: new Date() }).where(eq(traVatAnomalySettings.id, existing.id));
  return getVatAnomalySettings(input.companyId);
}

export async function listVatAnomalyEvents(companyId: string, limit = 30) {
  const db = await requireDb();
  return db.select().from(traVatAnomalyEvents).where(eq(traVatAnomalyEvents.companyId, companyId)).orderBy(desc(traVatAnomalyEvents.createdAt)).limit(Math.min(Math.max(limit, 1), 100));
}

export type VatTrendPoint = {
  period: string;
  vat: number;
  verifiedReceipts: number;
  failedReceipts: number;
  totalReceipts: number;
  serverConfirmedRate: number | null;
  anomalyEvents: number;
  triggeredAnomalies: number;
  suppressedAnomalies: number;
};

type VatTrendReceiptRow = { period: string; vat: string | number | null; verifiedReceipts: string | number | null; failedReceipts: string | number | null; totalReceipts: string | number | null };
type VatTrendAnomalyRow = { period: string; anomalyEvents: string | number | null; triggeredAnomalies: string | number | null; suppressedAnomalies: string | number | null };

export function buildVatTrendPoints(endPeriod: string, requestedPeriods = 12, receiptRows: VatTrendReceiptRow[] = [], anomalyRows: VatTrendAnomalyRow[] = []): VatTrendPoint[] {
  const periods = Math.min(Math.max(Math.trunc(requestedPeriods), 3), 24);
  const startPeriod = shiftPeriod(endPeriod, -(periods - 1));
  const receiptsByPeriod = new Map(receiptRows.map((row) => [row.period, row]));
  const anomaliesByPeriod = new Map(anomalyRows.map((row) => [row.period, row]));
  return Array.from({ length: periods }, (_, index) => {
    const period = shiftPeriod(startPeriod, index);
    const receipts = receiptsByPeriod.get(period);
    const anomalies = anomaliesByPeriod.get(period);
    const verifiedReceipts = Number(receipts?.verifiedReceipts || 0);
    const totalReceipts = Number(receipts?.totalReceipts || 0);
    return {
      period,
      vat: Number(Number(receipts?.vat || 0).toFixed(2)),
      verifiedReceipts,
      failedReceipts: Number(receipts?.failedReceipts || 0),
      totalReceipts,
      serverConfirmedRate: totalReceipts ? Number(((verifiedReceipts / totalReceipts) * 100).toFixed(1)) : null,
      anomalyEvents: Number(anomalies?.anomalyEvents || 0),
      triggeredAnomalies: Number(anomalies?.triggeredAnomalies || 0),
      suppressedAnomalies: Number(anomalies?.suppressedAnomalies || 0),
    };
  });
}

export async function getVatTrendSummary(companyId: string, requestedPeriods = 12): Promise<VatTrendPoint[]> {
  const db = await requireDb();
  const periods = Math.min(Math.max(Math.trunc(requestedPeriods), 3), 24);
  const endPeriod = previousCompleteMonth();
  const startPeriod = shiftPeriod(endPeriod, -(periods - 1));
  const start = monthStart(startPeriod);
  const end = new Date(monthStart(endPeriod));
  end.setUTCMonth(end.getUTCMonth() + 1);
  const receiptPeriod = sql<string>`DATE_FORMAT(${fiscalReceipts.receiptTimestamp}, '%Y-%m')`;
  const receiptRows = await db.select({
    period: receiptPeriod,
    vat: sql<string>`COALESCE(SUM(CASE WHEN ${fiscalReceipts.status} IN ('VERIFIED', 'SUBMITTED') THEN CAST(${fiscalReceipts.vatAmount} AS DECIMAL(14,2)) ELSE 0 END), 0)`,
    verifiedReceipts: sql<number>`COALESCE(SUM(CASE WHEN ${fiscalReceipts.status} IN ('VERIFIED', 'SUBMITTED') THEN 1 ELSE 0 END), 0)`,
    failedReceipts: sql<number>`COALESCE(SUM(CASE WHEN ${fiscalReceipts.status} IN ('FAILED', 'REJECTED') THEN 1 ELSE 0 END), 0)`,
    totalReceipts: sql<number>`COUNT(*)`,
  }).from(fiscalReceipts).where(and(
    eq(fiscalReceipts.companyId, companyId),
    gte(fiscalReceipts.receiptTimestamp, start),
    lt(fiscalReceipts.receiptTimestamp, end),
  )).groupBy(receiptPeriod);
  const anomalyRows = await db.select({
    period: traVatAnomalyEvents.period,
    anomalyEvents: sql<number>`COUNT(*)`,
    triggeredAnomalies: sql<number>`SUM(CASE WHEN ${traVatAnomalyEvents.status} = 'triggered' THEN 1 ELSE 0 END)`,
    suppressedAnomalies: sql<number>`SUM(CASE WHEN ${traVatAnomalyEvents.status} = 'suppressed' THEN 1 ELSE 0 END)`,
  }).from(traVatAnomalyEvents).where(and(
    eq(traVatAnomalyEvents.companyId, companyId),
    gte(traVatAnomalyEvents.createdAt, start),
    lt(traVatAnomalyEvents.createdAt, end),
  )).groupBy(traVatAnomalyEvents.period);
  return buildVatTrendPoints(endPeriod, periods, receiptRows, anomalyRows);
}

export async function runScheduledVatAnomalyCheck(taskUid: string) {
  const db = await requireDb();
  const rows = await db.select().from(traVatAnomalySettings).where(and(eq(traVatAnomalySettings.scheduleCronTaskUid, taskUid), eq(traVatAnomalySettings.enabled, true))).limit(1);
  const settings = rows[0];
  if (!settings) return { ok: true as const, skipped: "orphan-or-paused" as const };
  const evaluation = await evaluateVatAnomaly(settings.companyId, settings, previousCompleteMonth());
  return { ok: true as const, settingsId: settings.id, evaluation };
}
