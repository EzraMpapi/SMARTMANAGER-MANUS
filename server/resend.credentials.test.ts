import { describe, expect, it } from "vitest";

describe("Resend configuration", () => {
  it("accepts the configured API key without sending mail", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey, "RESEND_API_KEY must be configured").toBeTruthy();

    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    });

    const body = await response.json().catch(() => ({}));
    const recognizedKey = response.status === 200 || (response.status === 401 && body?.name === "restricted_api_key");
    expect(recognizedKey, JSON.stringify(body)).toBe(true);
    expect(process.env.RESEND_FROM_EMAIL, "RESEND_FROM_EMAIL must be configured").toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  }, 20_000);
});
