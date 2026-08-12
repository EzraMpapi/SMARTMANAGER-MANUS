import { TRPCError } from "@trpc/server";

let globalWebhookConfig = {
  url: "",
  enabled: false,
  secret: "",
};

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

export async function dispatchWebhookEvent(event: { action: string; module: string; details?: string; actor: string; severity?: string }) {
  if (!globalWebhookConfig.enabled || !globalWebhookConfig.url) return;
  try {
    await fetch(globalWebhookConfig.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(globalWebhookConfig.secret ? { "X-Webhook-Secret": globalWebhookConfig.secret } : {}),
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: "BusinessSphere ERP",
        severity: event.severity || "INFO",
        ...event,
      }),
    });
  } catch (err) {
    console.error("Failed to dispatch webhook event:", err);
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
  return { ok: response.ok, status: response.status };
}
