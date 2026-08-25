import { describe, expect, it } from "vitest";

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SECRET_KEY ?? "";

describe("Supabase build credentials", () => {
  it("authenticate against the lightweight PostgREST root endpoint", async () => {
    if (!supabaseUrl || !serviceKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be configured for this credential validation.");
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    expect(response.status, `Supabase credential validation returned HTTP ${response.status}.`).toBeLessThan(400);
  }, 15_000);
});
