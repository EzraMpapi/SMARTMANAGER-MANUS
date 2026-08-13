import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260813_002_rebuild_public_erp_schema.sql", import.meta.url), "utf8");

describe("BusinessSphere public ERP reconstruction migration", () => {
  it("rebuilds application tables while excluding Supabase system infrastructure", () => {
    expect(migration).toContain("DROP TABLE IF EXISTS public.%I CASCADE");
    expect(migration).toContain("CREATE TABLE public.audit_log");
    expect(migration).not.toContain("DROP SCHEMA");
    expect(migration).not.toContain("DROP TABLE auth.");
    expect(migration).not.toContain("DELETE FROM auth.users");
  });

  it("restores tenant-safe identity, policy, and trigger contracts", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.current_company_id()");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.create_company_and_owner(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.join_company_with_code(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.supplier_update_delivery_date(");
    expect(migration).toContain("businesssphere_on_auth_user_created");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("company_id = (SELECT public.current_company_id())");
    expect(migration).toContain("businesssphere_protect_profile_tenant");
  });

  it("keeps the dashboard-facing audit and onboarding response contracts", () => {
    expect(migration).toContain("module text");
    expect(migration).toContain("details text");
    expect(migration).toContain("jsonb_build_object('id', v_company_id, 'join_code', v_join_code)");
    expect(migration).toContain("jsonb_build_object('id', v_company_id)");
  });
});
