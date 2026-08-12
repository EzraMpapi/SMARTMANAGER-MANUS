import { TRPCError } from "@trpc/server";

let globalWebhookConfig = {
  url: "",
  enabled: false,
  secret: "",
};

const deadLetterQueue: Array<{ id: string; timestamp: string; event: any; error: string; attempts: number }> = [];
const deliveryHistory: Array<{ id: string; timestamp: string; status: "success" | "failed"; event: any; attempts: number; responseCode?: number; error?: string }> = [];

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

function recordDelivery(delivery: { status: "success" | "failed"; event: any; attempts: number; responseCode?: number; error?: string }) {
  deliveryHistory.unshift({ id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString(), ...delivery });
  if (deliveryHistory.length > 100) deliveryHistory.pop();
}

export async function dispatchWebhookEvent(event: { action: string; module: string; details?: string; actor: string; severity?: string }) {
  if (!globalWebhookConfig.enabled || !globalWebhookConfig.url) return;
  const payload = {
    timestamp: new Date().toISOString(),
    source: "BusinessSphere ERP",
    severity: event.severity || "INFO",
    ...event,
  };

  let attempts = 0;
  let success = false;
  let lastError = "";
  let responseCode: number | undefined;

  while (attempts < 3 && !success) {
    attempts++;
    try {
      const res = await fetch(globalWebhookConfig.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(globalWebhookConfig.secret ? { "X-Webhook-Secret": globalWebhookConfig.secret } : {}),
        },
        body: JSON.stringify(payload),
      });
      responseCode = res.status;
      if (res.ok) {
        success = true;
      } else {
        lastError = `HTTP status ${res.status}`;
      }
    } catch (err: any) {
      lastError = err.message || "Network error";
    }
    if (!success && attempts < 3) {
      await new Promise((r) => setTimeout(r, attempts * 1000));
    }
  }

  if (success) {
    recordDelivery({ status: "success", event: payload, attempts, responseCode });
  } else {
    recordDelivery({ status: "failed", event: payload, attempts, responseCode, error: lastError });
    deadLetterQueue.unshift({
      id: `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      event: payload,
      error: lastError,
      attempts,
    });
    if (deadLetterQueue.length > 50) deadLetterQueue.pop();
  }
}

export async function testWebhookPing() {
  if (!globalWebhookConfig.url) {
    throw new Error("No webhook URL configured.");
  }
  const response = await fetch(globalWebhookConfig.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(globalWebhookConfig.secret ? { "X-Webhook-Secret": globalWebhookConfig.secret } : {}),
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      source: "BusinessSphere ERP",
      event: "PING_TEST",
      message: "Test webhook connectivity successfully dispatched.",
    }),
  });
  const event = { event: "PING_TEST", source: "BusinessSphere ERP" };
  recordDelivery({ status: response.ok ? "success" : "failed", event, attempts: 1, responseCode: response.status, error: response.ok ? undefined : `HTTP status ${response.status}` });
  return { ok: response.ok, status: response.status };
}
