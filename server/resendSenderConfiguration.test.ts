import { describe, expect, it } from "vitest";

function senderDomain(from: string) {
  const address = (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase();
  return address.split("@")[1] || "";
}

describe("Resend sender configuration", () => {
  const senderConfigured = Boolean(senderDomain(process.env.RESEND_FROM_EMAIL || ""));
  const verifySender = senderConfigured ? it : it.skip;

  verifySender("authenticates with Resend and confirms the configured sender domain can send", async () => {
    const apiKey = process.env.RESEND_API_KEY || "";
    const from = process.env.RESEND_FROM_EMAIL || "";
    expect(apiKey).not.toBe("");
    expect(senderDomain(from)).not.toBe("");

    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(response.status).toBe(200);
    const payload = await response.json() as { data?: Array<{ name?: string; status?: string; capabilities?: { sending?: string } }> };
    const configuredDomain = senderDomain(from);
    const isSendReady = Boolean(payload.data?.some((domain) => (
      domain.name?.toLowerCase() === configuredDomain
      && domain.status === "verified"
      && domain.capabilities?.sending === "enabled"
    )));
    expect(isSendReady).toBe(true);
  }, 15_000);
});
