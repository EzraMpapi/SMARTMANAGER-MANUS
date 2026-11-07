import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260823_047_rls_policy_helper_execute_grants.sql", import.meta.url),
  "utf8",
);

const policyHelpers = [
  "public.bank_is_privileged()",
  "public.billing_is_manager()",
  "public.fleet_is_manager()",
  "public.hr_current_employee_id()",
  "public.hr_is_privileged()",
  "public.hr_can_manage_employee(uuid)",
];

describe("RLS policy helper execution migration contract", () => {
  it("covers only the reviewed SECURITY DEFINER helpers with pinned search paths", () => {
    for (const signature of policyHelpers) {
      expect(migration).toContain(`ALTER FUNCTION ${signature}`);
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon;`);
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO authenticated;`);
    }
    expect(migration.match(/ALTER FUNCTION public\./g)).toHaveLength(policyHelpers.length);
    expect(migration.match(/GRANT EXECUTE ON FUNCTION public\./g)).toHaveLength(policyHelpers.length);
    expect(migration).toContain("SET search_path = pg_catalog, public, auth;");
  });

  it("does not grant helper execution to anonymous or public callers", () => {
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION [^;]+ TO (anon|PUBLIC)/i);
    expect(migration).not.toMatch(/GRANT EXECUTE ON ALL FUNCTIONS/i);
  });

  it("is transactional and does not alter helper bodies or table data", () => {
    expect(migration.trimStart().startsWith("--")).toBe(true);
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION");
    expect(migration).not.toMatch(/INSERT INTO|UPDATE public\.|DELETE FROM/i);
  });
});
