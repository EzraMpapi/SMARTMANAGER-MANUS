import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260816_007_pos_sync_reconciliation.sql", import.meta.url), "utf8");

describe("POS sync reconciliation migration", () => {
  it("records only tenant-visible server reconciliation outcomes with a unique idempotency key", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.pos_sync_events");
    expect(migration).toContain("UNIQUE (company_id, idempotency_key)");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("company_id = (SELECT public.current_company_id())");
  });

  it("derives the caller tenant and validates synchronization transaction ownership", () => {
    expect(migration).toContain("v_user_id uuid := auth.uid()");
    expect(migration).toContain("v_company_id uuid := public.current_company_id()");
    expect(migration).toContain("A synchronized POS event must reference a workspace transaction.");
    expect(migration).toContain("ON CONFLICT (company_id, idempotency_key) DO UPDATE");
    expect(migration).not.toContain("WITH CHECK (true)");
  });
});
