import { describe, expect, it, vi } from "vitest";
import { parseEmailRecipients, sendTransactionalEmail, workspaceEmailHtml } from "./transactionalEmail";

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
});
