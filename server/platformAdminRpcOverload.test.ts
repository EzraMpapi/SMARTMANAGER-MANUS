import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260915_001_resolve_platform_admin_control_action_overload.sql"),
  "utf8",
);

describe("platform admin control RPC overload repair", () => {
  it("renames only the eleven-argument tenant variant", () => {
    expect(migration).toContain("ALTER FUNCTION public.platform_admin_control_action(");
    expect(migration).toContain("integer,\n  text\n) RENAME TO platform_admin_tenant_control_action;");
    expect(migration).toContain("ten-argument callers unambiguous");
  });

  it("keeps the repair as DDL without recreating either function body", () => {
    expect(migration).not.toMatch(/CREATE(?: OR REPLACE)? FUNCTION/i);
    expect(migration).toContain("COMMENT ON FUNCTION public.platform_admin_tenant_control_action");
  });
});
