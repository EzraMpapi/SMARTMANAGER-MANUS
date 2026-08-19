import { desc, eq } from "drizzle-orm";
import { webhookDeliveries } from "../drizzle/schema";
import { traGatewayAlertEvents, traVatAnomalyEvents } from "../drizzle/schema";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";

export function canReadTenantPushDeliveryHistory(role: string) {
  return ["owner", "Organization Owner", "CEO", "Super Administrator", "System Administrator", "admin"].some((allowedRole) => role.toLowerCase().includes(allowedRole.toLowerCase()));
}

export type PushDeliveryHistoryItem = {
  id: string;
  timestamp: string;
  channel: "webhook" | "owner_push";
  module: string;
  event: string;
  status: "success" | "failed" | "suppressed" | "retrying";
  attempts: number;
  responseCode?: number;
  error?: string;
  details: string;
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Security delivery history database is unavailable." });
  return db;
}

export async function listTenantPushDeliveryHistory(companyId: string, limit = 50): Promise<PushDeliveryHistoryItem[]> {
  const db = await requireDb();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const [webhookRows, gatewayRows, vatRows] = await Promise.all([
    db.select().from(webhookDeliveries).where(eq(webhookDeliveries.companyId, companyId)).orderBy(desc(webhookDeliveries.createdAt)).limit(safeLimit),
    db.select().from(traGatewayAlertEvents).where(eq(traGatewayAlertEvents.companyId, companyId)).orderBy(desc(traGatewayAlertEvents.createdAt)).limit(safeLimit),
    db.select().from(traVatAnomalyEvents).where(eq(traVatAnomalyEvents.companyId, companyId)).orderBy(desc(traVatAnomalyEvents.createdAt)).limit(safeLimit),
  ]);

  const webhookHistory: PushDeliveryHistoryItem[] = webhookRows.map((row) => ({
    id: `webhook:${row.deliveryId}`,
    timestamp: row.createdAt.toISOString(),
    channel: "webhook",
    module: row.module,
    event: row.action,
    status: row.status,
    attempts: row.attempts,
    responseCode: row.responseCode ?? undefined,
    error: row.error ?? undefined,
    details: row.eventSummary || "Tenant webhook event delivery.",
  }));
  const gatewayHistory: PushDeliveryHistoryItem[] = gatewayRows.map((row) => ({
    id: `gateway:${row.id}`,
    timestamp: row.createdAt.toISOString(),
    channel: "owner_push",
    module: "TRA Portal",
    event: "Gateway timeout alert",
    status: row.deliveryStatus === "sent" ? "success" : row.deliveryStatus === "failed" ? "failed" : "suppressed",
    attempts: 1,
    details: row.message,
  }));
  const vatHistory: PushDeliveryHistoryItem[] = vatRows.map((row) => ({
    id: `vat:${row.id}`,
    timestamp: row.createdAt.toISOString(),
    channel: "owner_push",
    module: "TRA Portal",
    event: "VAT anomaly alert",
    status: row.deliveryStatus === "sent" ? "success" : row.deliveryStatus === "failed" ? "failed" : "suppressed",
    attempts: 1,
    details: row.message,
  }));

  return [...webhookHistory, ...gatewayHistory, ...vatHistory]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, safeLimit);
}
