import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260825_005_workspace_presence_recovery.sql", import.meta.url), "utf8");

describe("workspace presence recovery migration", () => {
  it("backfills only companies without a workspace and never changes tenant memberships or access policies", () => {
    const backfill = migration.slice(migration.indexOf("-- Backfill one neutral default workspace"));
    expect(migration).toContain("INSERT INTO public.workspaces (company_id, name, description)");
    expect(migration).toContain("WHERE NOT EXISTS (\n  SELECT 1 FROM public.workspaces w WHERE w.company_id = c.id\n)");
    expect(backfill).not.toMatch(/(?:DELETE|UPDATE)\s+public\.(profiles|companies|company_memberships|workspaces)/i);
    expect(migration).not.toMatch(/ALTER\s+TABLE.*(?:DISABLE\s+ROW\s+LEVEL\s+SECURITY|NO\s+FORCE\s+ROW\s+LEVEL\s+SECURITY)/is);
  });

  it("makes each authenticated onboarding path create a workspace while retaining explicit auth checks", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.create_company_and_owner(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.join_company_with_code(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.ensure_current_company()");
    expect(migration.match(/INSERT INTO public\.workspaces \(company_id, name, description\)/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration.match(/IF v_user_id IS NULL THEN/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.create_company_and_owner(text, text, text, text, text) FROM PUBLIC, anon;");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.create_company_and_owner(text, text, text, text, text) TO authenticated;");
  });
});
