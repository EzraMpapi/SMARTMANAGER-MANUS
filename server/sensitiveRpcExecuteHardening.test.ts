import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260823_049_sensitive_rpc_execute_hardening.sql", import.meta.url),
  "utf8",
);

const authenticatedOnlyFunctions = [
  "public.get_current_profile_identity()",
  "public.update_current_profile_identity(jsonb)",
  "public.set_current_profile_avatar(text, text)",
  "public.list_my_companies()",
  "public.list_workspace_members()",
  "public.switch_current_company(uuid)",
  "public.remove_workspace_member(uuid)",
  "public.update_workspace_member_role(uuid, text)",
];

const unexposedCalculationFunctions = [
  "public.money_agent_fee(uuid, text, numeric)",
  "public.money_agent_commission(uuid, text, numeric)",
];

describe("sensitive RPC execute hardening migration contract", () => {
  it("pins and restricts all reviewed sensitive functions", () => {
    for (const signature of [...authenticatedOnlyFunctions, ...unexposedCalculationFunctions]) {
      expect(migration).toContain(`ALTER FUNCTION ${signature}`);
      expect(migration).toContain(`SET search_path = pg_catalog, public, auth;`);
    }

    for (const signature of authenticatedOnlyFunctions) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon;`);
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO authenticated;`);
    }

    for (const signature of unexposedCalculationFunctions) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated;`);
    }

    expect(migration.match(/ALTER FUNCTION public\./g)).toHaveLength(10);
    expect(migration.match(/SET search_path = pg_catalog, public, auth;/g)).toHaveLength(10);
    expect(migration.match(/GRANT EXECUTE ON FUNCTION public\./g)).toHaveLength(8);
  });

  it("does not broaden access or alter intentionally public booking RPCs", () => {
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION [^;]+ TO (anon|PUBLIC)/i);
    expect(migration).not.toMatch(/GRANT EXECUTE ON ALL FUNCTIONS/i);
    for (const publicFunction of ["get_booking", "cancel_booking", "hold_seats", "extend_hold", "release_hold", "seat_availability"]) {
      expect(migration).not.toContain(`FUNCTION public.${publicFunction}`);
    }
  });

  it("is transactional and changes no function bodies or table data", () => {
    expect(migration.trimStart().startsWith("--")).toBe(true);
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION");
    expect(migration).not.toMatch(/INSERT INTO|UPDATE public\.|DELETE FROM/i);
  });
});
