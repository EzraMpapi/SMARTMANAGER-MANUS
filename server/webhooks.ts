import { desc, eq } from "drizzle-orm";
import { webhookDeliveries } from "../drizzle/schema";
import { getDb } from "./db";

let globalWebhookConfig = {
  url: "",
  enabled: false,
  secret: "",
};

type DeliveryStatus = "success" | "failed" | "retrying";
type WebhookEvent = { action: string; module: string; details?: string; actor: string; severity?: string; companyId?: string };
type DeliveryRecord = {
  id: string;
  timestamp: string;
  status: DeliveryStatus;
  event: Record<string, unknown>;
  attempts: number;
  responseCode?: number;
  error?: string;
  companyId?: string;
};

const deadLetterQueue: Array<{ id: string; timestamp: string; event: Record<string, unknown>; error: string; attempts: number }> = [];
const deliveryHistory: DeliveryRecord[] = [];

export function getWebhookConfig() {
  return globalWebhookConfig;
}

export function updateWebhookConfig(config: { url: string; enabled: boolean; secret?: string }) {
  globalWebhookConfig = {
    url: config.url,
    enabled: config.enabled,
    secret: config.secret || globalWebhookConfig.secret,
  };
  return globalWebhookConfig;
}

export function getDeadLetterQueue() {
  return deadLetterQueue;
}

export function getWebhookDeliveryHistory() {
  return deliveryHistory;
}

async function persistDelivery(record: DeliveryRecord) {
  const db = await getDb();
  if (!db) return;
  await db.insert(webhookDeliveries).values({
    deliveryId: record.id,
    companyId: record.companyId || "platform",
    action: String(record.event.action || record.event.event || "WEBHOOK_EVENT"),
    module: String(record.event.module || "Admin"),
    severity: String(record.event.severity || "INFO"),
    status: record.status,
    attempts: record.attempts,
    responseCode: record.responseCode ?? null,
    error: record.error ?? null,
    eventSummary: JSON.stringify({
      action: record.event.action || record.event.event,
      module: record.event.module,
      severity: record.event.severity,
    }),
  });
}

function recordDelivery(delivery: Omit<DeliveryRecord, "id" | "timestamp">) {
  const record: DeliveryRecord = {
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...delivery,
  };
  deliveryHistory.unshift(record);
  if (deliveryHistory.length > 100) deliveryHistory.pop();
  void persistDelivery(record).catch((error) => console.warn("Webhook delivery persisted in memory fallback:", error));
  return record;
}

export async function listWebhookDeliveryHistory() {
  try {
    const db = await getDb();
    if (!db) return deliveryHistory;
    const rows = await db.select().from(webhookDeliveries).orderBy(desc(webhookDeliveries.createdAt)).limit(100);
    return rows.map((row) => ({
      id: row.deliveryId,
      timestamp: row.createdAt.toISOString(),
      status: row.status as DeliveryStatus,
      event: { action: row.action, module: row.module, severity: row.severity },
      attempts: row.attempts,
      responseCode: row.responseCode ?? undefined,
      error: row.error ?? undefined,
      companyId: row.companyId,
    }));
  } catch (error) {
    console.warn("Webhook delivery history loaded from memory fallback:", error);
    return deliveryHistory;
  }
}

async function sendWebhookPayload(payload: Record<string, unknown>) {
  let attempts = 0;
  let responseCode: number | undefined;
  let lastError = "";

  while (attempts < 3) {
    attempts++;
    try {
      const response = await fetch(globalWebhookConfig.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(globalWebhookConfig.secret ? { "X-Webhook-Secret": globalWebhookConfig.secret } : {}),
        },
        body: JSON.stringify(payload),
      });
      responseCode = response.status;
      if (response.ok) return { success: true, attempts, responseCode };
      lastError = `HTTP status ${response.status}`;
    } catch (error: any) {
      lastError = error.message || "Network error";
    }
    if (attempts < 3) await new Promise((resolve) => setTimeout(resolve, attempts * 1000));
  }
  return { success: false, attempts, responseCode, error: lastError };
}

export async function dispatchWebhookEvent(event: WebhookEvent) {
  if (!globalWebhookConfig.enabled || !globalWebhookConfig.url) return { skipped: true };
  const payload = {
    timestamp: new Date().toISOString(),
    source: "BusinessSphere ERP",
    severity: event.severity || "INFO",
    ...event,
  };
  const result = await sendWebhookPayload(payload);

  if (result.success) {
    recordDelivery({ status: "success", event: payload, attempts: result.attempts, responseCode: result.responseCode, companyId: event.companyId });
  } else {
    recordDelivery({ status: "failed", event: payload, attempts: result.attempts, responseCode: result.responseCode, error: result.error, companyId: event.companyId });
    deadLetterQueue.unshift({
      id: `dlq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      event: payload,
      error: result.error || "Webhook delivery failed",
      attempts: result.attempts,
    });
    if (deadLetterQueue.length > 50) deadLetterQueue.pop();
  }
  return result;
}

export async function testWebhookPing() {
  if (!globalWebhookConfig.url) throw new Error("No webhook URL configured.");
  const result = await sendWebhookPayload({
    timestamp: new Date().toISOString(),
    source: "BusinessSphere ERP",
    event: "PING_TEST",
    message: "Test webhook connectivity dispatched.",
  });
  recordDelivery({
    status: result.success ? "success" : "failed",
    event: { event: "PING_TEST", action: "PING_TEST", module: "Admin", severity: "INFO" },
    attempts: result.attempts,
    responseCode: result.responseCode,
    error: result.error,
  });
  return { ok: result.success, status: result.responseCode || 0 };
}

export async function retryWebhookDelivery(deliveryId: string) {
  let record = deliveryHistory.find((item) => item.id === deliveryId);
  if (!record) {
    const db = await getDb();
    if (db) {
      const [row] = await db.select().from(webhookDeliveries).where(eq(webhookDeliveries.deliveryId, deliveryId)).limit(1);
      if (row) {
        record = {
          id: row.deliveryId,
          timestamp: row.createdAt.toISOString(),
          status: row.status as DeliveryStatus,
          event: { action: row.action, module: row.module, severity: row.severity },
          attempts: row.attempts,
          responseCode: row.responseCode ?? undefined,
          error: row.error ?? undefined,
          companyId: row.companyId,
        };
      }
    }
  }
  if (!record) throw new Error("Webhook delivery record was not found.");
  return dispatchWebhookEvent({
    action: String(record.event.action || "WEBHOOK_RETRY"),
    module: String(record.event.module || "Admin"),
    severity: String(record.event.severity || "INFO"),
    details: `Manual retry of delivery ${deliveryId}`,
    actor: "Administrator retry",
    companyId: record.companyId,
  });
}
