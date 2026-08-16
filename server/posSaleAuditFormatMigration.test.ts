import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260816_009_fix_pos_sale_audit_format.sql", import.meta.url), "utf8");

describe("POS sale audit-format repair migration", () => {
  it("removes PostgreSQL-incompatible printf precision formatting from the audit write", () => {
    expect(migration).not.toContain("%.2f");
    expect(migration).toContain("'Receipt ' || p_doc_number || ' completed for ' || p_total::text || '.'");
  });

  it("preserves authenticated tenant resolution, security definer search path, inventory lock, idempotency, and privilege hardening", () => {
    expect(migration).toContain("v_user_id uuid := auth.uid()");
    expect(migration).toContain("v_company_id uuid := public.current_company_id()");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path TO public, pg_temp");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("pos_transaction_commits");
    expect(migration).toContain("REVOKE ALL ON FUNCTION");
    expect(migration).toContain("TO authenticated");
    expect(migration).not.toMatch(/WITH CHECK \(true\)/i);
  });
});
