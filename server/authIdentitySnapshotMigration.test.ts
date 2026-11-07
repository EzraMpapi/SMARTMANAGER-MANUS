import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(process.cwd(), "supabase/migrations/20260824_061_auth_identity_snapshot.sql");
const migration = readFileSync(migrationPath, "utf8");

describe("auth identity snapshot migration contract", () => {
  it("is additive and exposes one authenticated-only security-definer RPC", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.auth_identity_snapshot()");
    expect(migration).toContain("RETURNS jsonb");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, auth, pg_temp");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.auth_identity_snapshot() FROM PUBLIC;");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.auth_identity_snapshot() FROM anon;");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.auth_identity_snapshot() TO authenticated;");
    expect(migration).not.toMatch(/ALTER TABLE|DROP TABLE|TRUNCATE|DELETE FROM|UPDATE public\./i);
  });

  it("requires the verified profile, tenant context, membership, and workspace", () => {
    expect(migration).toContain("IF v_user_id IS NULL THEN");
    expect(migration).toContain("reason', 'PROFILE_MISSING'");
    expect(migration).toContain("reason', 'PROFILE_INACTIVE'");
    expect(migration).toContain("reason', 'TENANT_CONTEXT_MISMATCH'");
    expect(migration).toContain("reason', 'MEMBERSHIP_MISSING'");
    expect(migration).toContain("reason', 'WORKSPACE_MISSING'");
    expect(migration).toContain("m.user_id = v_user_id");
    expect(migration).toContain("w.company_id = v_profile_company_id");
  });

  it("uses approved active workforce assignments and explicit Deny precedence", () => {
    expect(migration).toContain("mr.status = 'Active'");
    expect(migration).toContain("mr.effective_from <= now()");
    expect(migration).toContain("rp.effect = 'Allow'");
    expect(migration).toContain("rp.effect = 'Deny'");
    expect(migration).toContain("ma.effect = 'Allow'");
    expect(migration).toContain("ma.effect = 'Deny'");
    expect(migration).toContain("-- legacy profile/membership role remains display-only here");
    expect(migration).toContain("AND NOT EXISTS");
  });
});
