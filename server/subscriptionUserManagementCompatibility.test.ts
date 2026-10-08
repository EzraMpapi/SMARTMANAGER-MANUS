import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260824_067_subscription_user_management_compatibility.sql",
);

describe("subscription user-management compatibility migration", () => {
  it("adds a generated UUID identifier to legacy composite-key membership tables without replacing their key", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain(
      "ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid()",
    );
    expect(sql).toContain("AND c.contype IN ('u', 'p')");
    expect(sql).not.toMatch(
      /ALTER TABLE public\.company_memberships\s+DROP CONSTRAINT/i,
    );
  });
});
