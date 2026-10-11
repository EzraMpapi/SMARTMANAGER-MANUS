import { ENV } from "./_core/env";
import { sendTransactionalEmail } from "./transactionalEmail";

type StoragePermissionFailure = {
  requestId: string;
  bucket: string;
  supabaseHost: string;
  status: number;
  statusText: string;
  providerCode: string;
  providerStatusCode: number | string;
};

type FailureState = { timestamps: number[]; lastAlertAt: number };

const failureStates = new Map<string, FailureState>();

function timeoutSignal(milliseconds: number) {
  return typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
    ? AbortSignal.timeout(milliseconds)
    : undefined;
}

function configuredAlertChannels() {
  return {
    webhook: ENV.storagePermissionAlertWebhookUrl.trim(),
    email: ENV.storagePermissionAlertEmail.trim(),
  };
}

export async function notifyStoragePermissionAlert(failure: StoragePermissionFailure): Promise<void> {
  const now = Date.now();
  const threshold = Math.max(1, ENV.storagePermissionAlertThreshold);
  const windowMs = Math.max(60_000, ENV.storagePermissionAlertWindowMs);
  const cooldownMs = Math.max(60_000, ENV.storagePermissionAlertCooldownMs);
  const key = `${failure.supabaseHost}/${failure.bucket}`;
  const prior = failureStates.get(key) || { timestamps: [], lastAlertAt: 0 };
  prior.timestamps = prior.timestamps.filter((timestamp) => now - timestamp <= windowMs);
  prior.timestamps.push(now);
  failureStates.set(key, prior);

  if (prior.timestamps.length < threshold || now - prior.lastAlertAt < cooldownMs) {
    console.warn("[StorageAlert] permission_failure_recorded", {
      requestId: failure.requestId,
      bucket: failure.bucket,
      supabaseHost: failure.supabaseHost,
      failureCount: prior.timestamps.length,
      threshold,
      windowMs,
      cooldownMs,
      alertSuppressed: prior.timestamps.length < threshold ? "threshold_not_reached" : "cooldown_active",
    });
    return;
  }

  const channels = configuredAlertChannels();
  if (!channels.webhook && !channels.email) {
    console.error("[StorageAlert] no_alert_channel_configured", {
      requestId: failure.requestId,
      bucket: failure.bucket,
      supabaseHost: failure.supabaseHost,
      failureCount: prior.timestamps.length,
      threshold,
    });
    return;
  }

  prior.lastAlertAt = now;
  const alertId = `storage-permission-${failure.requestId}`;
  const payload = {
    event: "storage.permission_failure_threshold",
    alertId,
    occurredAt: new Date(now).toISOString(),
    requestId: failure.requestId,
    bucket: failure.bucket,
    supabaseHost: failure.supabaseHost,
    status: failure.status,
    statusText: failure.statusText,
    providerCode: failure.providerCode,
    providerStatusCode: failure.providerStatusCode,
    failureCount: prior.timestamps.length,
    threshold,
    windowMs,
  };

  console.error("[StorageAlert] threshold_reached", {
    ...payload,
    webhookConfigured: Boolean(channels.webhook),
    emailConfigured: Boolean(channels.email),
  });

  const deliveries: Promise<void>[] = [];
  if (channels.webhook) {
    deliveries.push((async () => {
      try {
        const response = await fetch(channels.webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Smart-Manager-Event": payload.event, "X-Smart-Manager-Alert-Id": alertId },
          body: JSON.stringify(payload),
          signal: timeoutSignal(5_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        console.info("[StorageAlert] webhook_delivered", { alertId, status: response.status });
      } catch (error) {
        console.error("[StorageAlert] webhook_failed", { alertId, error: error instanceof Error ? error.message : String(error) });
      }
    })());
  }
  if (channels.email) {
    deliveries.push((async () => {
      try {
        const delivery = await sendTransactionalEmail({
          to: [channels.email],
          subject: `Smart Manager storage permission alert — ${failure.bucket}`,
          text: `Repeated Supabase Storage permission failures were detected.\n\nBucket: ${failure.bucket}\nSupabase host: ${failure.supabaseHost}\nStatus: ${failure.status}\nProvider code: ${failure.providerCode}\nFailures in window: ${prior.timestamps.length}\nRequest ID: ${failure.requestId}`,
          html: `<p>Repeated Supabase Storage permission failures were detected.</p><ul><li>Bucket: ${failure.bucket}</li><li>Supabase host: ${failure.supabaseHost}</li><li>Status: ${failure.status}</li><li>Provider code: ${failure.providerCode}</li><li>Failures in window: ${prior.timestamps.length}</li><li>Request ID: ${failure.requestId}</li></ul>`,
          category: "notification",
          idempotencyKey: alertId,
        });
        console.info("[StorageAlert] email_delivered", { alertId, deliveryId: delivery.deliveryId });
      } catch (error) {
        console.error("[StorageAlert] email_failed", { alertId, error: error instanceof Error ? error.message : String(error) });
      }
    })());
  }
  await Promise.all(deliveries);
}
