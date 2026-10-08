import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260824_064_platform_admin_initial_provisioning.sql"),
  "utf8",
);

describe("initial Platform Administrator provisioning contract", () => {
  it("aligns the constrained profile role values with the existing platform guard", () => {
    expect(migration).toContain("'platform administrator'::text");
    expect(migration).toContain("DROP CONSTRAINT IF EXISTS profiles_role_check");
    expect(migration).toContain("ADD CONSTRAINT profiles_role_check CHECK");
  });

  it("uses a narrow, service-role-only and auditable provisioning path", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.provision_initial_platform_administrator");
    expect(migration).toContain("PERFORM set_config('app.businesssphere_tenant_assignment', 'on', true)");
    expect(migration).toContain("PLATFORM_ADMIN_PROVISIONED");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.provision_initial_platform_administrator(uuid, text) TO service_role");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.provision_initial_platform_administrator(uuid, text) FROM PUBLIC, anon, authenticated");
  });

  it("does not create, persist, or handle account credentials", () => {
    expect(migration).not.toMatch(/password|auth\.users|CREATE TABLE/i);
    expect(migration).toContain("AND is_active = true");
    expect(migration).toContain("IN ('owner', 'admin')");
  });
});
