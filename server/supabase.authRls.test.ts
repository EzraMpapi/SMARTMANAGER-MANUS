import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
const tenantAToken = process.env.SUPABASE_RLS_TEST_JWT_A ?? "";
const tenantBToken = process.env.SUPABASE_RLS_TEST_JWT_B ?? "";
const runLiveJwtChecks = Boolean(supabaseUrl && publishableKey && tenantAToken && tenantBToken);

function jwtSubject(token: string) {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Supabase RLS test token is not a JWT.");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).sub as string;
}

async function postgrest(token: string, path: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`PostgREST ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

describe.skipIf(!runLiveJwtChecks)("live Supabase JWT claim and tenant RLS boundaries", () => {
  it("resolves each real JWT subject to its own profile and database-derived company", async () => {
    for (const token of [tenantAToken, tenantBToken]) {
      const subject = jwtSubject(token);
      const profiles = await postgrest(token, `profiles?select=id,company_id&id=eq.${encodeURIComponent(subject)}&limit=1`);
      const company = await postgrest(token, "rpc/current_company_id");
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe(subject);
      expect(profiles[0].company_id).toBe(company);
    }
  });

  it("keeps tenant reads isolated for a company-scoped ERP table without client-supplied company filters", async () => {
    const [tenantARows, tenantBRows] = await Promise.all([
      postgrest(tenantAToken, "pos_shifts?select=company_id&limit=100"),
      postgrest(tenantBToken, "pos_shifts?select=company_id&limit=100"),
    ]);
    const tenantACompany = await postgrest(tenantAToken, "rpc/current_company_id");
    const tenantBCompany = await postgrest(tenantBToken, "rpc/current_company_id");
    expect(tenantACompany).not.toBe(tenantBCompany);
    expect(tenantARows.every((row: { company_id: string }) => row.company_id === tenantACompany)).toBe(true);
    expect(tenantBRows.every((row: { company_id: string }) => row.company_id === tenantBCompany)).toBe(true);
  });
});

describe("Supabase JWT RLS test gating", () => {
  it("keeps live claim checks disabled unless both dedicated test JWTs are supplied", () => {
    expect(runLiveJwtChecks).toBe(Boolean(supabaseUrl && publishableKey && tenantAToken && tenantBToken));
  });

  it("ships an authenticated-only grant for the RLS tenant resolver", () => {
    const migration = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260815_004_grant_current_company_id_to_authenticated.sql"), "utf8");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.current_company_id() FROM PUBLIC");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated");
    expect(migration).not.toContain("TO anon");
  });
});
