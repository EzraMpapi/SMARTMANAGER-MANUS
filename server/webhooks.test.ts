import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchWebhookEvent, getWebhookDeliveryHistory, retryWebhookDelivery, updateWebhookConfig } from "./webhooks";

describe("webhook delivery activity", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    updateWebhookConfig({ url: "", enabled: false, secret: "" });
  });

  it("records a successful delivery for administrator monitoring", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    updateWebhookConfig({ url: "https://example.test/audit", enabled: true });

    await dispatchWebhookEvent({ action: "UPDATE_BUDGET_LIMIT", module: "Finance", actor: "admin" });

    const latest = getWebhookDeliveryHistory()[0];
    expect(latest).toMatchObject({ status: "success", attempts: 1, responseCode: 204 });
    expect(latest.event.action).toBe("UPDATE_BUDGET_LIMIT");
  });

  it("records failures after retries so the dashboard can surface them", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    updateWebhookConfig({ url: "https://example.test/audit", enabled: true });

    const delivery = dispatchWebhookEvent({ action: "DELETE_INVOICE", module: "Finance", actor: "admin" });
    await vi.runAllTimersAsync();
    await delivery;

    const latest = getWebhookDeliveryHistory()[0];
    expect(latest).toMatchObject({ status: "failed", attempts: 3, responseCode: 503 });
  });

  it("replays a selected failed delivery through the protected retry path", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    updateWebhookConfig({ url: "https://example.test/audit", enabled: true });
    const failedDelivery = dispatchWebhookEvent({ action: "DELETE_INVOICE", module: "Finance", actor: "admin" });
    await vi.runAllTimersAsync();
    await failedDelivery;
    const failedId = getWebhookDeliveryHistory()[0].id;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 202 }));
    const result = await retryWebhookDelivery(failedId);

    expect(result).toMatchObject({ success: true, responseCode: 202 });
    expect(getWebhookDeliveryHistory()[0]).toMatchObject({ status: "success", responseCode: 202 });
  });
});
