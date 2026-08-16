import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260816_006_pos_customer_credit.sql", import.meta.url), "utf8");

describe("POS customer credit migration", () => {
  it("allows guest transactions but requires a tenant-owned customer before extending credit", () => {
    expect(migration).toContain("Customer Credit requires an existing workspace customer.");
    expect(migration).toContain("FROM public.crm_contacts");
    expect(migration).toContain("company_id = v_company_id");
    expect(migration).toContain("'Guest'");
  });

  it("reuses the authenticated transaction boundary rather than bypassing RLS or inventory rules", () => {
    expect(migration).toContain("public.complete_pos_sale(p_idempotency_key");
    expect(migration).toContain("auth.uid() IS NULL");
    expect(migration).not.toContain("WITH CHECK (true)");
    expect(migration).not.toContain("DISABLE ROW LEVEL SECURITY");
  });
});
