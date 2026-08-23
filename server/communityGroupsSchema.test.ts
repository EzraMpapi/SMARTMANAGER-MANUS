import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260823_035_community_groups_module.sql", import.meta.url), "utf8");
const timestampMigration = readFileSync(new URL("../supabase/migrations/20260823_037_community_groups_schema_contract.sql", import.meta.url), "utf8");
const requiredTables = [
  "community_groups", "community_group_members", "community_group_committees", "community_group_committee_members",
  "community_group_meetings", "community_group_attendance", "community_group_contributions", "community_group_savings",
  "community_group_welfare_claims", "community_group_loans", "community_group_loan_guarantors", "community_group_loan_repayments",
  "community_group_loan_penalties", "community_group_projects", "community_group_fundraising", "community_group_budgets",
  "community_group_expenses", "community_group_assets", "community_group_income", "community_group_votes", "community_group_vote_options",
  "community_group_vote_ballots", "community_group_approvals", "community_group_documents", "community_group_events",
  "community_group_notifications", "community_group_audit_log",
];

describe("Community Groups schema contract", () => {
  it("declares every required domain table", () => {
    for (const table of requiredTables) expect(migration).toContain(`public.${table}`);
  });

  it("keeps all domain rows tenant-scoped and RLS-enabled", () => {
    expect(migration).toContain("DEFAULT public.current_company_id()");
    expect(migration).toContain("ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("company_id = public.current_company_id()");
  });

  it("includes Tanzania payment references and a dedicated audit trail", () => {
    expect(migration).toContain("currency text NOT NULL DEFAULT 'TZS'");
    expect(migration).toContain("mobile_money_provider");
    expect(migration).toContain("payment_reference");
    expect(migration).toContain("community_group_audit_log");
  });

  it("backfills the verifier-required timestamps for legacy Community Groups tables", () => {
    for (const table of [
      "community_group_approvals", "community_group_attendance", "community_group_audit_log", "community_group_budgets",
      "community_group_committee_members", "community_group_documents", "community_group_events", "community_group_fundraising",
      "community_group_income", "community_group_loan_guarantors", "community_group_loan_penalties", "community_group_loan_repayments",
      "community_group_messages", "community_group_notifications", "community_group_savings", "community_group_vote_options",
    ]) expect(timestampMigration).toContain(`ALTER TABLE public.${table}`);
    expect(timestampMigration).toContain("ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()");
    expect(timestampMigration).toContain("community_groups_touch_updated_at()");
  });
});
