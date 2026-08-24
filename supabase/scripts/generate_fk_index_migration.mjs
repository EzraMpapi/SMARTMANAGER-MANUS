#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DEFAULT_AUDIT = "/tmp/supabase-complete-constraint-fk-audit.json";
export const DEFAULT_ADVISOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fk-index-advisor-current-20260823.txt");
export const DEFAULT_OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../generated");
export const HOT_TABLES = new Set(["workforce_role_permissions", "workforce_permissions"]);
export const TRANSACTION_PREFIXES = new Set(["pos", "fin", "money", "workforce", "restaurant", "hospitality", "fleet", "community", "bank", "sales", "billing"]);

export function parsePgArray(value) {
  if (Array.isArray(value)) return value.map(String);
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("{") || !raw.endsWith("}")) return raw ? [raw] : [];
  return raw.slice(1, -1).split(",").map((part) => part.trim().replace(/^"|"$/g, "")).filter(Boolean);
}

export function quoteIdent(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

export function sanitizeIdentifier(value) {
  const cleaned = String(value).toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "fk";
  return /^[a-z_]/.test(cleaned) ? cleaned : `fk_${cleaned}`;
}

export function deterministicIndexName(sourceTable, columns, constraintName) {
  const base = sanitizeIdentifier(`ix_${sourceTable}_${columns.join("_")}_fk`);
  if (base.length <= 63) return base;
  const digest = crypto.createHash("sha1").update(`${sourceTable}|${columns.join(",")}|${constraintName}`).digest("hex").slice(0, 10);
  return `${base.slice(0, 63 - 11)}_${digest}`;
}

export function advisorKey(row) {
  return `${row.source_table}|${row.constraint_name}`;
}

export function modulePrefix(table) {
  return String(table).split("_")[0];
}

export function classifyRow(row, { populatedThreshold = 100 } = {}) {
  const estimatedRows = Math.max(0, Number(row.estimatedRows ?? row.estimated_rows) || 0);
  const advisor = Boolean(row.advisorConfirmed ?? row.advisor_confirmed);
  const sourceTable = row.sourceTable ?? row.source_table;
  const prefix = modulePrefix(sourceTable);
  if (estimatedRows >= populatedThreshold || HOT_TABLES.has(sourceTable)) return "P0_POPULATED_OR_HOT";
  if (advisor && estimatedRows > 0 && TRANSACTION_PREFIXES.has(prefix)) return "P1_ADVISOR_TRANSACTION";
  return "P2_REVIEW_BACKLOG";
}

export function normalizeAudit(audit, advisorKeys, options = {}) {
  const rows = (audit.uncoveredRelationships ?? []).filter((row) => !row.has_valid_nonpartial_leading_index).map((row) => {
    const sourceColumns = parsePgArray(row.source_columns);
    const normalized = {
      sourceSchema: row.source_schema || "public",
      sourceTable: row.source_table,
      constraintName: row.constraint_name,
      targetSchema: row.target_schema || "public",
      targetTable: row.target_table,
      targetColumns: parsePgArray(row.target_columns),
      sourceColumns,
      constraintDefinition: row.constraint_definition || "",
      estimatedRows: Math.max(0, Number(row.estimated_rows) || 0),
      hasValidNonpartialLeadingIndex: Boolean(row.has_valid_nonpartial_leading_index),
      companyLeadingFk: Boolean(row.company_leading_fk),
      tenantLeadingFk: row.tenant_leading_fk ?? null,
      advisorConfirmed: advisorKeys.has(`${row.source_table}|${row.constraint_name}`),
    };
    normalized.tier = classifyRow(normalized, options);
    normalized.indexName = deterministicIndexName(normalized.sourceTable, normalized.sourceColumns, normalized.constraintName);
    normalized.createSql = `CREATE INDEX IF NOT EXISTS ${quoteIdent(normalized.indexName)} ON ${quoteIdent(normalized.sourceSchema)}.${quoteIdent(normalized.sourceTable)} (${normalized.sourceColumns.map(quoteIdent).join(", ")});`;
    normalized.concurrentSql = normalized.createSql.replace(/^CREATE INDEX IF NOT EXISTS/, "CREATE INDEX CONCURRENTLY IF NOT EXISTS");
    return normalized;
  }).sort((a, b) => b.estimatedRows - a.estimatedRows || a.sourceTable.localeCompare(b.sourceTable) || a.constraintName.localeCompare(b.constraintName));
  return rows;
}

export function buildMigrationSql(rows, audit) {
  const selected = rows.filter((row) => row.tier === "P0_POPULATED_OR_HOT");
  const header = [
    "-- REVIEW-ONLY GENERATED ARTIFACT: not applied automatically.",
    `-- Snapshot: ${audit.generatedAt}`,
    `-- Catalog: ${audit.foreignKeyCount} foreign keys; ${audit.uncoveredForeignKeyCount} uncovered; ${audit.coveredForeignKeyCount} covered.`,
    `-- This migration contains only the bounded P0 populated/hot subset (${selected.length} indexes), not all uncovered relationships.`,
    "-- Safety: no DROP INDEX, no foreign-key/RLS/grant changes, no CONCURRENTLY inside this transaction-managed migration.",
    "-- Re-run the generator after a fresh catalog audit and review EXPLAIN/lock impact before applying.",
    "",
    "BEGIN;",
    "",
  ];
  for (const row of selected) {
    header.push(`-- ${row.sourceTable}.${row.sourceColumns.join(", ")} <- ${row.targetTable}.${row.targetColumns.join(", ")} | rows=${row.estimatedRows} | advisor=${row.advisorConfirmed}`);
    header.push(row.createSql);
    header.push("");
  }
  header.push("COMMIT;", "");
  return header.join("\n");
}

export function buildConcurrentSql(rows, audit) {
  const selected = rows.filter((row) => row.tier === "P0_POPULATED_OR_HOT" || row.tier === "P1_ADVISOR_TRANSACTION");
  const lines = [
    "-- REVIEW-ONLY EXTERNAL PLAN: not a Supabase transaction migration and not applied automatically.",
    `-- Snapshot: ${audit.generatedAt}`,
    `-- Selected bounded review set: ${selected.length} P0/P1 indexes; P2 backlog is intentionally excluded from executable SQL.`,
    "-- Run each statement separately during an approved maintenance workflow; CREATE INDEX CONCURRENTLY cannot run inside a transaction-managed migration.",
    "-- Preflight each candidate against pg_indexes/pg_stat_user_indexes and confirm lock, storage, and query-plan impact.",
    "",
  ];
  for (const row of selected) {
    lines.push(`-- ${row.tier} ${row.sourceTable}.${row.sourceColumns.join(", ")} | rows=${row.estimatedRows} | advisor=${row.advisorConfirmed}`);
    lines.push(`${row.concurrentSql}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function buildManifest(rows, audit, advisorCount) {
  const counts = Object.fromEntries([...new Set(rows.map((row) => row.tier))].sort().map((tier) => [tier, rows.filter((row) => row.tier === tier).length]));
  return {
    generatedAt: new Date().toISOString(),
    auditSnapshot: audit.generatedAt,
    auditCounts: {
      foreignKeys: audit.foreignKeyCount,
      uncovered: audit.uncoveredForeignKeyCount,
      covered: audit.coveredForeignKeyCount,
      sourceTables: audit.foreignKeyTableCount,
      companyLeadingUncovered: audit.companyLeadingForeignKeyCount,
      tenantLeadingUncovered: audit.tenantLeadingForeignKeyCount,
      compositeUncovered: audit.compositeForeignKeyCount,
    },
    advisorSnapshot: { allowlistEntries: advisorCount, note: "Current Supabase performance-advisor snapshot; it is a prioritization cross-check, not a substitute for the catalog audit." },
    tierCounts: counts,
    rows,
  };
}

export function buildMarkdown(manifest) {
  const { auditCounts, advisorSnapshot, tierCounts, rows } = manifest;
  const lines = [
    "# Supabase Foreign-Key Index Optimization Plan",
    "",
    "> Review-only artifact. No Supabase DDL was executed by this generator.",
    "",
    `The latest read-only catalog snapshot contains **${auditCounts.foreignKeys} validated foreign keys**. Of these, **${auditCounts.uncovered}** lack a valid non-partial leading-column index and **${auditCounts.covered}** have valid leading-column coverage. The audit also reports ${auditCounts.companyLeadingUncovered} company-leading, ${auditCounts.tenantLeadingUncovered} tenant-leading, and ${auditCounts.compositeUncovered} composite uncovered relationships.`,
    "",
    `The current Supabase performance-advisor snapshot contains ${advisorSnapshot.allowlistEntries} unindexed-FK notices. The older repository allowlist contained 622 entries; that historical count is retained only for comparison. The current plan is driven by the catalog artifact, while the advisor flag is used only for prioritization.`,
    "",
    "## Priority policy",
    "",
    `| Tier | Count | Treatment |`,
    `|---|---:|---|`,
    `| P0_POPULATED_OR_HOT | ${tierCounts.P0_POPULATED_OR_HOT ?? 0} | Included in the bounded, non-concurrent migration-safe SQL. Current evidence is the five populated workforce relationships (469/140 estimated rows). |`,
    `| P1_ADVISOR_TRANSACTION | ${tierCounts.P1_ADVISOR_TRANSACTION ?? 0} | Included only in the separate external CONCURRENTLY review plan. Requires approval and operational preflight. |`,
    `| P2_REVIEW_BACKLOG | ${tierCounts.P2_REVIEW_BACKLOG ?? 0} | Manifest-only backlog. No executable SQL is emitted for this tier. |`,
    "",
    "The generator intentionally does not emit an all-640 executable batch. It creates no drops, does not modify constraints or RLS, and treats `CREATE INDEX CONCURRENTLY` as external operational SQL rather than transaction-managed migration SQL.",
    "",
    "## Highest-priority candidates",
    "",
    "| Tier | Source table | Columns | Estimated rows | Advisor | Index name |",
    "|---|---|---|---:|---|---|",
  ];
  for (const row of rows.filter((row) => row.tier !== "P2_REVIEW_BACKLOG").slice(0, 30)) lines.push(`| ${row.tier} | ${row.sourceTable} | ${row.sourceColumns.join(", ")} | ${row.estimatedRows} | ${row.advisorConfirmed ? "yes" : "no"} | \`${row.indexName}\` |`);
  lines.push("", "## Review sequence", "", "1. Re-run the read-only catalog audit immediately before approval so row estimates and existing-index coverage are current.", "2. Review the generated P0 migration and the external P1 concurrent plan with the database owner, including storage and lock budget.", "3. Validate representative query plans with `EXPLAIN (ANALYZE, BUFFERS)` and inspect index usage after deployment.", "4. Apply only an approved batch; do not use this artifact as authorization to run DDL.", "");
  return lines.join("\n");
}

export function generate({ auditPath = DEFAULT_AUDIT, advisorPath = DEFAULT_ADVISOR, outDir = DEFAULT_OUT_DIR, populatedThreshold = 100 } = {}) {
  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
  const advisorKeys = new Set(fs.readFileSync(advisorPath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  const rows = normalizeAudit(audit, advisorKeys, { populatedThreshold });
  const manifest = buildManifest(rows, audit, advisorKeys.size);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "fk-index-plan.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "fk-index-plan.md"), buildMarkdown(manifest));
  fs.writeFileSync(path.join(outDir, "fk-index-optimization-p0.sql"), buildMigrationSql(rows, audit));
  fs.writeFileSync(path.join(outDir, "fk-index-optimization-p0-p1-concurrent.sql"), buildConcurrentSql(rows, audit));
  return { outDir, total: rows.length, tierCounts: manifest.tierCounts, p0: rows.filter((row) => row.tier === "P0_POPULATED_OR_HOT").length, p1: rows.filter((row) => row.tier === "P1_ADVISOR_TRANSACTION").length, p2: rows.filter((row) => row.tier === "P2_REVIEW_BACKLOG").length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = new Map();
  for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
  const result = generate({ auditPath: args.get("--audit") || DEFAULT_AUDIT, advisorPath: args.get("--advisor") || DEFAULT_ADVISOR, outDir: args.get("--out-dir") || DEFAULT_OUT_DIR, populatedThreshold: Number(args.get("--populated-threshold") || 100) });
  console.log(JSON.stringify(result, null, 2));
}
