import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20261116_001_rls_internal_tables_deny_by_default.sql",
  ),
  "utf8",
);

const protectedTables = [
  "bank_provider_webhook_account_controls",
  "bank_provider_webhook_drain_approvals",
  "bank_provider_webhook_drain_runs",
  "bank_provider_webhook_remediation",
  "platform_admin_actions",
  "schema_drift_monitors",
  "schema_drift_runs",
  "users",
];

describe("internal-table RLS migration", () => {
  it("enables RLS and denies direct client roles for every protected relation", () => {
    expect(migration).toContain("alter table public.%I enable row level security");
    expect(migration).toContain("as restrictive for all to anon, authenticated using (false) with check (false)");

    for (const table of protectedTables) {
      expect(migration).toContain(`'${table}'`);
    }
  });

  it("is idempotent and preserves trusted backend access", () => {
    expect(migration).toContain("if not exists (");
    expect(migration).toContain("policy_name constant text := 'rls_internal_tables_deny_client_access_v1'");
    expect(migration).toContain("service_role continues to bypass RLS");
    expect(migration).not.toContain("alter table auth.");
  });
});
