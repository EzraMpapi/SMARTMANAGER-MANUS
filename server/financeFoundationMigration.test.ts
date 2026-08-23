import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260824_050_fin_foundation.sql", import.meta.url),
  "utf8",
);

describe("finance foundation migration", () => {
  it("is additive and does not weaken existing security boundaries", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.fin_periods");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.fin_accounts");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.fin_idempotency_keys");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.fin_approval_requests");
    expect(migration).not.toMatch(/\bDROP TABLE\b/i);
    expect(migration).not.toContain("DISABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("public.current_company_id()");
  });

  it("enforces tenant-safe keys, Tanzania currency defaults, and bounded states", () => {
    expect(migration).toContain("UNIQUE (company_id, id)");
    expect(migration).toContain("UNIQUE (company_id, account_code)");
    expect(migration).toContain("UNIQUE (company_id, scope, idempotency_key)");
    expect(migration).toContain("DEFAULT 'TZS'");
    expect(migration).toContain("CHECK (currency = 'TZS')");
    expect(migration).toContain("CHECK (status IN ('Open', 'Soft Closed', 'Closed'))");
    expect(migration).toContain("CHECK (status IN ('Started', 'Succeeded', 'Failed'))");
  });

  it("requires maker-checker separation and role-gated authenticated access", () => {
    expect(migration).toContain("fin_approval_decider_differs_from_maker");
    expect(migration).toContain("decided_by <> requested_by");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.fin_require");
    expect(migration).toContain("CREATE POLICY");
    expect(migration).toContain("public.fin_can_view()");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.fin_require(text) FROM PUBLIC");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.fin_require(text) TO authenticated");
    expect(migration).toContain("No direct authenticated INSERT/UPDATE/DELETE policy");
  });
});
