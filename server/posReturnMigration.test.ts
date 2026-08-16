import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260816_005_pos_return_engine.sql", import.meta.url), "utf8");

describe("POS return engine migration", () => {
  it("adds an idempotent, tenant-scoped return boundary without weakening RLS", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.pos_return_commits");
    expect(migration).toContain("UNIQUE (company_id, idempotency_key)");
    expect(migration).toContain("company_id = (SELECT public.current_company_id())");
    expect(migration).not.toContain("WITH CHECK (true)");
    expect(migration).not.toContain("DISABLE ROW LEVEL SECURITY");
  });

  it("locks and validates original sale, unreturned quantity, inventory, payment refund, and audit history", () => {
    expect(migration).toContain("v_user_id uuid := auth.uid()");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("exceeds the unreturned balance");
    expect(migration).toContain("The submitted refund total does not match the original sale tax calculation");
    expect(migration).toContain("INSERT INTO public.sales_payments");
    expect(migration).toContain("INSERT INTO public.audit_log");
  });
});
