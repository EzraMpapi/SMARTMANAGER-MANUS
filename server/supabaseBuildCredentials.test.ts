import { describe, expect, it } from "vitest";

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SECRET_KEY ?? "";

function hasLiveSupabaseCredentials() {
  if (!supabaseUrl || !serviceKey) return false;

  try {
    const hostname = new URL(supabaseUrl).hostname;
    return hostname.length > 0 && !hostname.endsWith(".invalid");
  } catch {
    return false;
  }
}

const credentialCheck = hasLiveSupabaseCredentials() ? it : it.skip;

describe("Supabase build credentials", () => {
  credentialCheck("authenticate against the lightweight PostgREST root endpoint", async () => {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    expect(response.status, `Supabase credential validation returned HTTP ${response.status}.`).toBeLessThan(400);
  }, 15_000);
});
