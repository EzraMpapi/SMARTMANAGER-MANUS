import { afterEach, describe, expect, it, vi } from "vitest";
import { parseEmailRecipients, sendTransactionalEmail, workspaceEmailHtml } from "./transactionalEmail";
import { ENV } from "./_core/env";

const originalKey = ENV.resendApiKey;
const originalFrom = ENV.resendFromEmail;

afterEach(() => {
  ENV.resendApiKey = originalKey;
  ENV.resendFromEmail = originalFrom;
  vi.unstubAllGlobals();
});

describe("transactional email delivery", () => {
  it("normalizes display-name recipients and rejects malformed addresses", () => {
    expect(parseEmailRecipients("A Team <A@Example.com>; second@example.com", "recipient")).toEqual(["a@example.com", "second@example.com"]);
    expect(() => parseEmailRecipients("not-an-email", "recipient")).toThrow(/valid recipient/i);
  });

  it("builds an escaped branded email shell with plain-text fallback kept separately", () => {
    expect(workspaceEmailHtml({ title: "<Unsafe>", preheader: "Preview", body: "First\nSecond" })).toContain("&lt;Unsafe&gt;");
    expect(workspaceEmailHtml({ title: "Subject", preheader: "Preview", body: "First\nSecond" })).toContain("First<br />Second");
  });

  it("reports provider rejection without claiming delivery and never sends credentials to the client", async () => {
    ENV.resendApiKey = "test-server-key";
    ENV.resendFromEmail = "noreply@example.com";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 422, json: async () => ({ message: "rejected" }) })));
    await expect(sendTransactionalEmail({ to: ["recipient@example.com"], subject: "Notice", text: "Plain text", html: "<p>Plain text</p>", category: "notification" })).rejects.toThrow(/No email was sent/i);
  });

  it("returns a provider acceptance identifier only after a confirmed server response", async () => {
    ENV.resendApiKey = "test-server-key";
    ENV.resendFromEmail = "noreply@example.com";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ id: "email-provider-id" }) })));
    await expect(sendTransactionalEmail({ to: ["recipient@example.com"], subject: "Notice", text: "Plain text", html: "<p>Plain text</p>", category: "notification" })).resolves.toMatchObject({ deliveryId: "email-provider-id" });
  });
});
