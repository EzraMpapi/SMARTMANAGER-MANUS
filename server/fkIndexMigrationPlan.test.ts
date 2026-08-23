import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { buildConcurrentSql, buildMigrationSql, deterministicIndexName, normalizeAudit, parsePgArray } from "../supabase/scripts/generate_fk_index_migration.mjs";

describe("foreign-key index migration plan generator", () => {
  it("parses PostgreSQL arrays and keeps composite column order", () => {
    expect(parsePgArray("{company_id,approval_request_id}")).toEqual(["company_id", "approval_request_id"]);
    expect(parsePgArray(["a", "b"])).toEqual(["a", "b"]);
  });

  it("creates deterministic PostgreSQL-safe index names within 63 characters", () => {
    const name = deterministicIndexName("a_very_long_source_table_name_that_needs_sanitizing", ["a_really_long_column_name", "another_really_long_column_name"], "constraint");
    expect(name).toMatch(/^[a-z_][a-z0-9_]*$/);
    expect(name.length).toBeLessThanOrEqual(63);
    expect(deterministicIndexName("orders", ["company_id"], "orders_company_id_fkey")).toBe(deterministicIndexName("orders", ["company_id"], "orders_company_id_fkey"));
  });

  it("skips an existing valid non-partial leading-column index defensively", () => {
    const audit = { uncoveredRelationships: [
      { source_schema: "public", source_table: "covered_table", constraint_name: "covered_fkey", source_columns: "{parent_id}", target_schema: "public", target_table: "parents", target_columns: "{id}", estimated_rows: 900, has_valid_nonpartial_leading_index: true },
      { source_schema: "public", source_table: "missing_table", constraint_name: "missing_fkey", source_columns: "{parent_id}", target_schema: "public", target_table: "parents", target_columns: "{id}", estimated_rows: 900, has_valid_nonpartial_leading_index: false },
    ] };
    const rows = normalizeAudit(audit, new Set());
    expect(rows.map((row) => row.sourceTable)).toEqual(["missing_table"]);
  });

  it("prioritizes populated rows and separates migration-safe from concurrent SQL", () => {
    const audit = { generatedAt: "test", foreignKeyCount: 3, uncoveredForeignKeyCount: 3, coveredForeignKeyCount: 0, foreignKeyTableCount: 2, companyLeadingForeignKeyCount: 0, tenantLeadingForeignKeyCount: 0, compositeForeignKeyCount: 0, uncoveredRelationships: [
      { source_schema: "public", source_table: "workforce_permissions", constraint_name: "created_by_fkey", source_columns: "{created_by}", target_schema: "public", target_table: "profiles", target_columns: "{id}", estimated_rows: 140, has_valid_nonpartial_leading_index: false },
      { source_schema: "public", source_table: "hospitality_audit_log", constraint_name: "company_id_fkey", source_columns: "{company_id}", target_schema: "public", target_table: "companies", target_columns: "{id}", estimated_rows: 3, has_valid_nonpartial_leading_index: false },
      { source_schema: "public", source_table: "empty_backlog", constraint_name: "parent_id_fkey", source_columns: "{parent_id}", target_schema: "public", target_table: "parents", target_columns: "{id}", estimated_rows: 0, has_valid_nonpartial_leading_index: false },
    ] };
    const rows = normalizeAudit(audit, new Set(["hospitality_audit_log|company_id_fkey"]));
    expect(rows.map((row) => row.tier)).toEqual(["P0_POPULATED_OR_HOT", "P1_ADVISOR_TRANSACTION", "P2_REVIEW_BACKLOG"]);
    const migration = buildMigrationSql(rows, audit);
    const concurrent = buildConcurrentSql(rows, audit);
    expect(migration).toContain("BEGIN;");
    expect(migration).not.toContain("CREATE INDEX CONCURRENTLY");
    expect(migration).toContain("workforce_permissions");
    expect(migration).not.toContain("empty_backlog");
    expect(concurrent).toContain("CREATE INDEX CONCURRENTLY IF NOT EXISTS");
    expect(concurrent).toContain("hospitality_audit_log");
    expect(concurrent).not.toContain("empty_backlog");
    expect(`${migration}\n${concurrent}`).not.toMatch(/(?:^|\n)\s*(?:DROP|drop)\s+INDEX\b/m);
  });

  it("does not turn the current 640-gap catalog into an all-640 executable batch", () => {
    const manifest = JSON.parse(fs.readFileSync("supabase/generated/fk-index-optimization/fk-index-plan.json", "utf8"));
    expect(manifest.rows).toHaveLength(640);
    expect(manifest.tierCounts.P0_POPULATED_OR_HOT).toBe(5);
    expect(manifest.tierCounts.P1_ADVISOR_TRANSACTION).toBe(1);
    expect(manifest.tierCounts.P2_REVIEW_BACKLOG).toBe(634);
    const p0Sql = fs.readFileSync("supabase/generated/fk-index-optimization/fk-index-optimization-p0.sql", "utf8");
    expect((p0Sql.match(/CREATE INDEX IF NOT EXISTS/g) ?? []).length).toBe(5);
    expect(p0Sql).not.toContain("CREATE INDEX CONCURRENTLY");
  });
});
