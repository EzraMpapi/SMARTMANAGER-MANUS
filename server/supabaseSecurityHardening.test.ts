import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260823_046_security_hardening_search_paths_and_pin_rls.sql", import.meta.url),
  "utf8",
);

const expectedSearchPathFunctions = [
  "public.community_groups_touch_updated_at()",
  "public.money_agent_block_direct_mutation()",
  "public.property_touch()",
  "public.property_immutable_guard()",
];

describe("Supabase security hardening migration contract", () => {
  it("pins every advisor-flagged trigger function to a safe search path", () => {
    for (const functionSignature of expectedSearchPathFunctions) {
      expect(migration).toContain(`ALTER FUNCTION ${functionSignature}`);
      expect(migration).toContain("SET search_path = public, pg_temp;");
    }
  });

  it("keeps the PIN credential table RLS-enabled and denies direct authenticated access", () => {
    expect(migration).toContain("ALTER TABLE public.money_agent_pin_credentials ENABLE ROW LEVEL SECURITY;");
    expect(migration).toContain("DROP POLICY IF EXISTS money_agent_pin_credentials_no_direct_access");
    expect(migration).toContain("CREATE POLICY money_agent_pin_credentials_no_direct_access");
    expect(migration).toContain("ON public.money_agent_pin_credentials");
    expect(migration).toContain("FOR ALL");
    expect(migration).toContain("TO authenticated");
    expect(migration).toContain("USING (false)");
    expect(migration).toContain("WITH CHECK (false)");
  });

  it("does not broaden grants or replace protected workflow functions", () => {
    expect(migration).not.toContain("GRANT");
    expect(migration).not.toContain("REVOKE");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION");
    expect(migration).toContain("protected SECURITY DEFINER Money Agent workflows");
  });
});
