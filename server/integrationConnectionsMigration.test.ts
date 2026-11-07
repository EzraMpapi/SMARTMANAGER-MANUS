import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260826_004_integration_connections_lookup.sql"), "utf8");
const executableSql = migration.split("\n").filter((line) => !line.trimStart().startsWith("--")).join("\n");

describe("Integration Hub lookup migration", () => {
  it("adds only an idempotent tenant/name lookup index", () => {
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS integration_connections_company_name_idx");
    expect(migration).toContain("ON public.integration_connections (company_id, name)");
    expect(executableSql).not.toMatch(/\bCREATE\s+TABLE\b/i);
    expect(executableSql).not.toMatch(/\bALTER\s+TABLE\b/i);
    expect(executableSql).not.toMatch(/\bUPDATE\b|\bDELETE\b|\bDROP\b|\bTRUNCATE\b/i);
    expect(executableSql).not.toMatch(/CREATE\s+POLICY|GRANT\s|REVOKE\s/i);
  });
});
