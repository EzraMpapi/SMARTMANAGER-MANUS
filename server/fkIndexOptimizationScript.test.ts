import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = readFileSync(resolve(process.cwd(), "supabase/scripts/optimize_unindexed_foreign_keys.sh"), "utf8");
const advisorTargets = readFileSync(resolve(process.cwd(), "supabase/scripts/fk-index-advisor-targets-20260823.txt"), "utf8")
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

describe("FK index optimization automation", () => {
  it("is plan-only by default and requires an explicit apply gate", () => {
    expect(script).toContain('MODE="plan"');
    expect(script).toContain('if [[ "$MODE" == "apply" && "${CONFIRM_FK_INDEX_DDL:-}" != "YES" ]]');
    expect(script).toContain("No production DDL was executed.");
    expect(script).not.toContain("apply_migration");
    expect(script).not.toContain("DROP INDEX");
  });

  it("uses concurrent, idempotent index creation outside an explicit transaction", () => {
    expect(script).toContain("CREATE INDEX CONCURRENTLY IF NOT EXISTS");
    expect(script).not.toContain("BEGIN;");
    expect(script).not.toContain("COMMIT;");
    expect(script).toMatch(/one CREATE INDEX CONCURRENTLY\s+statement at a time/);
  });

  it("uses the corrected zero-based pg_index indkey slice", () => {
    expect(script).toContain("i.indkey[0:cardinality(fk.conkey) - 1]::int[] = fk.conkey::int[]");
    expect(script).not.toContain("i.indkey[1:cardinality");
  });

  it("restricts automation to valid, non-partial leading-column coverage", () => {
    for (const predicate of [
      "i.indisvalid",
      "i.indpred IS NULL",
      "i.indnkeyatts >= cardinality(fk.conkey)",
      "ns.nspname = 'public'",
      "c.contype = 'f'",
    ]) expect(script).toContain(predicate);
  });

  it("has a deterministic, unique advisor allowlist from the refreshed baseline", () => {
    expect(advisorTargets).toHaveLength(622);
    expect(new Set(advisorTargets).size).toBe(advisorTargets.length);
    expect(advisorTargets.every((entry) => /^[a-z0-9_]+\|[a-z0-9_]+$/.test(entry))).toBe(true);
    expect(advisorTargets).toContain("workforce_role_permissions|workforce_role_permissions_company_id_approval_request_id_fkey");
    expect(advisorTargets).toContain("workforce_permissions|workforce_permissions_created_by_fkey");
  });

  it("requires a reviewed batch budget and reports deferred low-volume candidates", () => {
    expect(script).toContain('MAX_INDEXES=25');
    expect(script).toContain('MIN_ROWS=100');
    expect(script).toContain("--max-indexes");
    expect(script).toContain("--include-empty");
    expect(script).toContain("-- deferred:");
    expect(script).toContain("name_conflict");
    expect(script).toContain("-- skipped: generated index name already exists");
    expect(script).toContain("Refusing bulk apply");
  });
});
