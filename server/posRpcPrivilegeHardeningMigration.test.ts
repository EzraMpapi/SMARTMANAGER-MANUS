import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260816_008_harden_pos_rpc_privileges.sql", import.meta.url), "utf8");

describe("POS RPC privilege hardening migration", () => {
  it("explicitly removes anonymous and public execution from every POS RPC signature", () => {
    expect(migration).toContain("FROM PUBLIC, anon");
    expect(migration).toContain("complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric)");
    expect(migration).toContain("complete_pos_sale(text, text, jsonb, jsonb, numeric, numeric, numeric, uuid, text)");
    expect(migration).toContain("complete_pos_return(text, uuid, jsonb, text, numeric)");
    expect(migration).toContain("record_pos_sync_event(text, text, uuid, text)");
  });

  it("retains POS RPC execution only for authenticated callers", () => {
    const grants = migration.match(/GRANT EXECUTE[^;]+;/g) || [];
    expect(grants).toHaveLength(4);
    expect(grants.every((grant) => grant.endsWith("TO authenticated;"))).toBe(true);
  });
});
