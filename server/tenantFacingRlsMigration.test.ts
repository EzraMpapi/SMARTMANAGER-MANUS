import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20261116_002_tenant_facing_preferences_rls.sql",
  ),
  "utf8",
);

describe("tenant-facing preference RLS migration", () => {
  it("keeps personal preferences inside both the verified tenant and auth user", () => {
    expect(migration).toContain("user_table_preferences_own_tenant_select");
    expect(migration).toContain("company_id = public.current_company_id() and user_id = auth.uid()");
    expect(migration).toContain("grant select, insert, update, delete on table public.user_table_preferences to authenticated");
  });

  it("allows telemetry only inside the current tenant and only for authenticated users", () => {
    expect(migration).toContain("dashboard_layout_telemetry_tenant_select");
    expect(migration).toContain("dashboard_layout_telemetry_tenant_insert");
    expect(migration).toContain("on public.dashboard_layout_telemetry for insert to authenticated");
    expect(migration).toContain("with check (company_id = public.current_company_id())");
    expect(migration).not.toContain("to anon");
  });

  it("keeps shared preset mutations creator-owned while allowing tenant reads", () => {
    expect(migration).toContain("dashboard_team_presets_tenant_select");
    expect(migration).toContain("created_by = auth.uid()");
    expect(migration).toContain("dashboard_team_presets_creator_update");
    expect(migration).toContain("dashboard_team_presets_creator_delete");
  });

  it("is re-runnable without creating duplicate policy names", () => {
    expect(migration.match(/drop policy if exists/g)?.length).toBe(10);
    expect(migration).toContain("alter table public.user_table_preferences enable row level security");
    expect(migration).toContain("alter table public.dashboard_layout_telemetry enable row level security");
    expect(migration).toContain("alter table public.dashboard_team_presets enable row level security");
  });
});
