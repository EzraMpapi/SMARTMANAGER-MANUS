import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260816_004_pos_transaction_engine.sql", import.meta.url), "utf8");

describe("POS transaction engine migration", () => {
  it("creates an additive idempotency boundary without weakening RLS", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.pos_transaction_commits");
    expect(migration).toContain("UNIQUE (company_id, idempotency_key)");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("company_id = (SELECT public.current_company_id())");
    expect(migration).not.toContain("WITH CHECK (true)");
    expect(migration).not.toContain("DISABLE ROW LEVEL SECURITY");
  });

  it("uses the authenticated tenant and locks stock before creating confirmed sale rows", () => {
    expect(migration).toContain("v_user_id uuid := auth.uid()");
    expect(migration).toContain("v_company_id uuid := public.current_company_id()");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("INSERT INTO public.pos_transactions");
    expect(migration).toContain("INSERT INTO public.inventory_stock_movements");
    expect(migration).toContain("INSERT INTO public.sales_payments");
    expect(migration).toContain("INSERT INTO public.audit_log");
  });

  it("rejects underpayment and non-cash overpayment rather than claiming a completed sale", () => {
    expect(migration).toContain("Payment allocations do not cover the POS total.");
    expect(migration).toContain("Only cash tender may exceed the POS total");
    expect(migration).toContain("idempotent_replay");
  });
});
