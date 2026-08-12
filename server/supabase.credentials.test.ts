import { describe, expect, it } from "vitest";

describe("Supabase server credentials", () => {
  it("can authenticate a read-only companies query without mutating data", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;
    expect(url, "VITE_SUPABASE_URL must be configured").toMatch(/^https:\/\//);
    expect(secret, "SUPABASE_SECRET_KEY must be configured").toBeTruthy();

    const response = await fetch(`${url}/rest/v1/companies?select=id&limit=1`, {
      headers: {
        accept: "application/json",
        apikey: secret as string,
        authorization: `Bearer ${secret}`,
      },
    });

    expect(response.status, await response.text()).toBe(200);
  }, 20_000);
});
