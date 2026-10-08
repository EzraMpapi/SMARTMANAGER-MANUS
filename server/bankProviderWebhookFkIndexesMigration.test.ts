import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260825_021_bank_provider_webhook_fk_indexes.sql", import.meta.url),
  "utf8",
);

const expectedIndexes = [
  "ix_bank_provider_transactions_instruction_company_fk",
  "ix_bank_provider_webhook_drain_approvals_approved_by_fk",
  "ix_bank_provider_webhook_drain_approvals_requested_by_fk",
  "ix_bank_provider_webhook_drain_runs_requested_by_fk",
  "ix_bank_provider_webhook_events_instruction_company_fk",
  "ix_bank_provider_webhook_events_run_company_fk",
  "ix_bank_provider_webhook_processing_company_event_fk",
  "ix_bank_provider_webhook_remediation_company_event_fk",
];

describe("bank-provider webhook FK index migration", () => {
  it("creates the eight verified foreign-key indexes idempotently", () => {
    expect((migration.match(/CREATE INDEX IF NOT EXISTS/g) ?? []).length).toBe(8);
    for (const indexName of expectedIndexes) {
      expect(migration).toContain(`CREATE INDEX IF NOT EXISTS "${indexName}"`);
    }
  });

  it("is additive and does not alter data, RLS, policies, grants, or constraints", () => {
    expect(migration).not.toMatch(/\b(DROP|DELETE|UPDATE|INSERT|ALTER TABLE|GRANT|REVOKE|CREATE POLICY)\b/i);
  });
});
