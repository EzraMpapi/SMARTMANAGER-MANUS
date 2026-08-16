import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260816_010_fix_pos_return_audit_format.sql", import.meta.url), "utf8");

describe("POS return audit-format repair migration", () => {
  it("removes PostgreSQL-incompatible printf precision formatting from the return audit write", () => {
    expect(migration).not.toContain("%.2f");
    expect(migration).toContain("'Return processed for receipt ' || coalesce(v_doc_number, p_transaction_id::text) || ': ' || p_refund_total::text || '.'");
  });

  it("keeps the authenticated tenant boundary, idempotency, inventory locking, and authenticated-only privilege contract", () => {
    expect(migration).toContain("v_user_id uuid := auth.uid()");
    expect(migration).toContain("v_company_id uuid := public.current_company_id()");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path TO public, pg_temp");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("pos_return_commits");
    expect(migration).toContain("REVOKE ALL ON FUNCTION");
    expect(migration).toContain("TO authenticated");
    expect(migration).not.toMatch(/WITH CHECK \(true\)/i);
  });
});
