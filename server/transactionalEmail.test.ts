import { describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { parseEmailRecipients, sendTransactionalEmail, sendWelcomeEmail, workspaceEmailHtml } from "./transactionalEmail";

describe("transactional email delivery", () => {
  it("normalizes display-name recipients and rejects malformed addresses", () => {
    expect(parseEmailRecipients("A Team <A@Example.com>; second@example.com", "recipient")).toEqual(["a@example.com", "second@example.com"]);
    expect(() => parseEmailRecipients("not-an-email", "recipient")).toThrow(/valid recipient/i);
  });

  it("builds an escaped branded email shell with plain-text fallback kept separately", () => {
    expect(workspaceEmailHtml({ title: "<Unsafe>", preheader: "Preview", body: "First\nSecond" })).toContain("&lt;Unsafe&gt;");
    expect(workspaceEmailHtml({ title: "Subject", preheader: "Preview", body: "First\nSecond" })).toContain("First<br />Second");
  });

  it("rejects manual delivery truthfully while email delivery is disabled and does not call an external provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendTransactionalEmail({ to: ["recipient@example.com"], subject: "Notice", text: "Plain text", html: "<p>Plain text</p>", category: "notification" })).rejects.toThrow(/delivery is disabled.*No email was sent/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a branded welcome email when the Resend provider is configured", async () => {
    const originalApiKey = ENV.resendApiKey;
    const originalFromEmail = ENV.resendFromEmail;
    ENV.resendApiKey = "re_test_key";
    ENV.resendFromEmail = "Smart Manager <noreply@example.com>";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "email-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendWelcomeEmail({ to: "Owner@Example.com", fullName: "Amina Owner", companyName: "Kilomo LTD", companyId: "11111111-1111-4111-8111-111111111111" })).resolves.toMatchObject({ sent: true, deliveryId: "email-1" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST" }));
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.to).toEqual(["owner@example.com"]);
    expect(payload.subject).toContain("Kilomo LTD");
    ENV.resendApiKey = originalApiKey;
    ENV.resendFromEmail = originalFromEmail;
  });

  it("skips welcome delivery safely when the provider is not configured", async () => {
    const originalApiKey = ENV.resendApiKey;
    const originalFromEmail = ENV.resendFromEmail;
    ENV.resendApiKey = "";
    ENV.resendFromEmail = "";
    await expect(sendWelcomeEmail({ to: "owner@example.com", fullName: "Amina Owner", companyName: "Kilomo LTD" })).resolves.toEqual({ sent: false, reason: "not_configured" });
    ENV.resendApiKey = originalApiKey;
    ENV.resendFromEmail = originalFromEmail;
  });
});
