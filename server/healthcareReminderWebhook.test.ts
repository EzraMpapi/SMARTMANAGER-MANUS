import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { recordProviderDeliveryStatus } from "./healthcareReminders";
import { verifyHealthcareSmsWebhookSignature } from "./healthcareReminderWebhook";

const original = { url: ENV.supabaseUrl, key: ENV.supabaseSecretKey, webhookSecret: ENV.healthcareSmsWebhookSecret };

describe("healthcare SMS delivery-status webhook", () => {
  afterEach(() => {
    ENV.supabaseUrl = original.url;
    ENV.supabaseSecretKey = original.key;
    ENV.healthcareSmsWebhookSecret = original.webhookSecret;
    vi.unstubAllGlobals();
  });

  it("accepts only an HMAC signature calculated over the exact raw payload", () => {
    ENV.healthcareSmsWebhookSecret = "test-webhook-secret";
    const body = Buffer.from('{"eventId":"evt-0001"}');
    const signature = createHmac("sha256", ENV.healthcareSmsWebhookSecret).update(body).digest("hex");
    expect(verifyHealthcareSmsWebhookSignature(body, `sha256=${signature}`)).toBe(true);
    expect(verifyHealthcareSmsWebhookSignature(body, "sha256=bad")).toBe(false);
  });

  it("ignores an unknown delivery idempotency key without creating a new delivery record", async () => {
    ENV.supabaseUrl = "https://example.invalid";
    ENV.supabaseSecretKey = "service-key";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(recordProviderDeliveryStatus({ eventId: "evt-0001", idempotencyKey: "appointment-reminder:known", status: "delivered", occurredAt: "2026-08-21T08:00:00.000Z" })).resolves.toMatchObject({ accepted: true, updated: false, ignored: "unknown_delivery" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("records a provider delivery state once and does not reapply the same provider event", async () => {
    ENV.supabaseUrl = "https://example.invalid";
    ENV.supabaseSecretKey = "service-key";
    const existing = { id: "22222222-2222-4222-8222-222222222222", company_id: "11111111-1111-4111-8111-111111111111", status: "Sent", data: { idempotencyKey: "appointment-reminder:known", providerEventId: "evt-old" } };
    const firstFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PATCH") return new Response(null, { status: 204 });
      return new Response(JSON.stringify([existing]), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", firstFetch);
    await expect(recordProviderDeliveryStatus({ eventId: "evt-0002", idempotencyKey: "appointment-reminder:known", status: "delivered", occurredAt: "2026-08-21T08:00:00.000Z", providerMessageId: "message-001" })).resolves.toMatchObject({ updated: true, duplicate: false });
    expect(firstFetch).toHaveBeenCalledTimes(2);
    const patched = JSON.parse(String(firstFetch.mock.calls[1][1]?.body));
    expect(patched).toMatchObject({ status: "Delivered", data: { providerEventId: "evt-0002", providerEventStatus: "delivered", providerMessageId: "message-001" } });

    existing.data.providerEventId = "evt-0002";
    const duplicateFetch = vi.fn(async () => new Response(JSON.stringify([existing]), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", duplicateFetch);
    await expect(recordProviderDeliveryStatus({ eventId: "evt-0002", idempotencyKey: "appointment-reminder:known", status: "delivered", occurredAt: "2026-08-21T08:00:00.000Z" })).resolves.toMatchObject({ updated: false, duplicate: true });
    expect(duplicateFetch).toHaveBeenCalledTimes(1);
  });
});
