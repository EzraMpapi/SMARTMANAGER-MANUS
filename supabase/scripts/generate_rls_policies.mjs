#!/usr/bin/env node

/**
 * Generate a reviewable RLS migration for tables that have RLS enabled but no
 * policies. The generated policies are intentionally deny-by-default for
 * anon/authenticated roles; Supabase service_role continues to bypass RLS.
 *
 * This script does not connect to Supabase or apply DDL. The table list must
 * come from a fresh pg_policies/catalog audit before generation.
 */

const tables = [
  "bank_provider_webhook_account_controls",
  "bank_provider_webhook_drain_approvals",
  "bank_provider_webhook_drain_runs",
  "bank_provider_webhook_remediation",
  "dashboard_layout_telemetry",
  "dashboard_team_presets",
  "platform_admin_actions",
  "schema_drift_monitors",
  "schema_drift_runs",
  "subscription_trial_expiry_notices",
  "users",
  "website_feedback_submissions",
];

const quote = (value) => `"${value.replaceAll('"', '""')}` + '"';
const policyName = (table) => `${table}_deny_unclassified_clients`;

const lines = [
  "-- GENERATED REVIEW PLAN: deny-by-default policies for RLS-enabled tables with no policies.",
  "-- Generated from the Supabase catalog audit on 2026-09-07.",
  "-- Review each table's intended access before applying this migration.",
  "-- service_role is not included and continues to bypass RLS.",
  "",
  "begin;",
];

for (const table of tables) {
  lines.push(
    `create policy ${quote(policyName(table))}`,
    `  on public.${quote(table)}`,
    "  as restrictive",
    "  for all",
    "  to anon, authenticated",
    "  using (false)",
    "  with check (false);",
    "",
  );
}

lines.push(
  "commit;",
  "",
  "-- Manual review candidates before replacing deny policies:",
  "-- * website_feedback_submissions: decide whether anonymous feedback inserts are required.",
  "-- * dashboard_layout_telemetry: decide whether authenticated tenant-scoped inserts are required.",
  "-- * dashboard_team_presets: decide whether authenticated tenant/member policies are required.",
  "-- * subscription_trial_expiry_notices: decide whether authenticated owner policies are required.",
  "-- * users and platform/schema/webhook tables: normally service-role or admin-only.",
);

process.stdout.write(lines.join("\n"));
process.stdout.write("\n");
console.error(`Generated deny-by-default policies for ${tables.length} tables.`);
console.error("No database connection was made and no DDL was applied.");
console.error("Review the SQL and replace table-specific policies where application access is intended.");
