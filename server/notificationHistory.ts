import { desc, eq } from "drizzle-orm";
import { webhookDeliveries, traGatewayAlertEvents, traVatAnomalyEvents } from "../drizzle/schema";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { selectSupabaseRows } from "./supabaseRest";

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

type SupabaseWebhookDelivery = {
  delivery_id: string;
  module: string;
  action: string;
  status: PushDeliveryHistoryItem["status"];
  attempts: number;
  response_code: number | null;
  error: string | null;
  event_summary: string | null;
  created_at: string;
};
type SupabaseAlertEvent = { id: number; delivery_status: "sent" | "failed" | string; message: string; created_at: string };

function mapAlert(row: SupabaseAlertEvent, idPrefix: string, event: string): PushDeliveryHistoryItem {
  return { id: `${idPrefix}:${row.id}`, timestamp: row.created_at, channel: "owner_push", module: "TRA Portal", event, status: row.delivery_status === "sent" ? "success" : row.delivery_status === "failed" ? "failed" : "suppressed", attempts: 1, details: row.message };
}

async function listSupabaseHistory(companyId: string, limit: number, sessionToken: string): Promise<PushDeliveryHistoryItem[]> {
  const query = { company_id: `eq.${companyId}`, order: "created_at.desc", limit };
  const [webhookRows, gatewayRows, vatRows] = await Promise.all([
    selectSupabaseRows<SupabaseWebhookDelivery>("webhook_deliveries", { ...query, select: "delivery_id,module,action,status,attempts,response_code,error,event_summary,created_at" }, sessionToken),
    selectSupabaseRows<SupabaseAlertEvent>("tra_gateway_alert_events", { ...query, select: "id,delivery_status,message,created_at" }, sessionToken),
    selectSupabaseRows<SupabaseAlertEvent>("tra_vat_anomaly_events", { ...query, select: "id,delivery_status,message,created_at" }, sessionToken),
  ]);
  const webhookHistory = webhookRows.map((row) => ({ id: `webhook:${row.delivery_id}`, timestamp: row.created_at, channel: "webhook" as const, module: row.module, event: row.action, status: row.status, attempts: row.attempts, responseCode: row.response_code ?? undefined, error: row.error ?? undefined, details: row.event_summary || "Tenant webhook event delivery." }));
  return [...webhookHistory, ...gatewayRows.map((row) => mapAlert(row, "gateway", "Gateway timeout alert")), ...vatRows.map((row) => mapAlert(row, "vat", "VAT anomaly alert"))].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
}

export async function listTenantPushDeliveryHistory(companyId: string, limit = 50, sessionToken = ""): Promise<PushDeliveryHistoryItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const db = await getDb();
  if (!db) {
    if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "A valid account session is required to read security delivery history." });
    return listSupabaseHistory(companyId, safeLimit, sessionToken);
  }
  const [webhookRows, gatewayRows, vatRows] = await Promise.all([
    db.select().from(webhookDeliveries).where(eq(webhookDeliveries.companyId, companyId)).orderBy(desc(webhookDeliveries.createdAt)).limit(safeLimit),
    db.select().from(traGatewayAlertEvents).where(eq(traGatewayAlertEvents.companyId, companyId)).orderBy(desc(traGatewayAlertEvents.createdAt)).limit(safeLimit),
    db.select().from(traVatAnomalyEvents).where(eq(traVatAnomalyEvents.companyId, companyId)).orderBy(desc(traVatAnomalyEvents.createdAt)).limit(safeLimit),
  ]);
  const webhookHistory = webhookRows.map((row) => ({ id: `webhook:${row.deliveryId}`, timestamp: row.createdAt.toISOString(), channel: "webhook" as const, module: row.module, event: row.action, status: row.status, attempts: row.attempts, responseCode: row.responseCode ?? undefined, error: row.error ?? undefined, details: row.eventSummary || "Tenant webhook event delivery." }));
  const gatewayHistory = gatewayRows.map((row) => mapAlert({ id: row.id, delivery_status: row.deliveryStatus, message: row.message, created_at: row.createdAt.toISOString() }, "gateway", "Gateway timeout alert"));
  const vatHistory = vatRows.map((row) => mapAlert({ id: row.id, delivery_status: row.deliveryStatus, message: row.message, created_at: row.createdAt.toISOString() }, "vat", "VAT anomaly alert"));
  return [...webhookHistory, ...gatewayHistory, ...vatHistory].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, safeLimit);
}
