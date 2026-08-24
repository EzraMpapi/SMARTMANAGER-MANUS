import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260824_068_platform_admin_executive_dashboard.sql", "utf8");
const restrictivePolicy = readFileSync("supabase/migrations/20260824_069_platform_admin_dashboard_settings_direct_access_policy.sql", "utf8");

describe("platform administrator executive dashboard database contracts", () => {
  it("stores only platform configuration and protects it from direct anon/authenticated table access", () => {
    expect(migration).toContain("create table if not exists public.platform_admin_dashboard_settings");
    expect(migration).toContain("alter table public.platform_admin_dashboard_settings enable row level security");
    expect(migration).toContain("revoke all on table public.platform_admin_dashboard_settings from anon, authenticated");
    expect(restrictivePolicy).toContain("as restrictive");
    expect(restrictivePolicy).toContain("using (false)");
    expect(restrictivePolicy).toContain("with check (false)");
  });

  it("aggregates persisted platform records through a role-verified RPC without exposing direct settings access", () => {
    expect(migration).toContain("create or replace function public.platform_admin_executive_snapshot()");
    expect(migration).toContain("not public.billing_is_platform_admin()");
    expect(migration).toContain("revoke all on function public.platform_admin_executive_snapshot() from public, anon, authenticated");
    expect(migration).toContain("grant execute on function public.platform_admin_executive_snapshot() to authenticated");
    expect(migration).toContain("'failedPayments'");
    expect(migration).toContain("'criticalSupport'");
    expect(migration).toContain("'recentActions'");
  });
});
