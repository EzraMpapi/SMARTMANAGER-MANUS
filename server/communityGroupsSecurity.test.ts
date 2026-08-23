import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hardening = readFileSync(new URL("../supabase/migrations/20260823_036_community_groups_security_hardening.sql", import.meta.url), "utf8");
const insertGuard = readFileSync(new URL("../supabase/migrations/20260823_042_community_groups_relationship_guard_insert_fix_v2.sql", import.meta.url), "utf8");
const base = readFileSync(new URL("../supabase/migrations/20260823_035_community_groups_module.sql", import.meta.url), "utf8");
const tables = [
  "community_groups", "community_group_members", "community_group_committees", "community_group_committee_members",
  "community_group_meetings", "community_group_attendance", "community_group_contributions", "community_group_savings",
  "community_group_welfare_claims", "community_group_loans", "community_group_loan_guarantors", "community_group_loan_repayments",
  "community_group_loan_penalties", "community_group_announcements", "community_group_messages", "community_group_projects",
  "community_group_fundraising", "community_group_budgets", "community_group_expenses", "community_group_assets", "community_group_income",
  "community_group_votes", "community_group_vote_options", "community_group_vote_ballots", "community_group_approvals",
  "community_group_documents", "community_group_events", "community_group_notifications", "community_group_audit_log",
];

describe("Community Groups security hardening contract", () => {
  it("defines database-side role helpers and revokes helper execution from public and anonymous callers", () => {
    expect(hardening).toContain("community_groups_is_privileged");
    expect(hardening).toContain("community_groups_can_operate");
    expect(hardening).toContain("community_groups_can_approve");
    expect(hardening).toContain("community_groups_can_disburse");
    expect(hardening).toContain("REVOKE EXECUTE ON FUNCTION public.community_groups_is_privileged() FROM PUBLIC, anon");
  });

  it("does not retain the baseline tenant-only FOR ALL write policy", () => {
    expect(base).toContain("FOR ALL TO authenticated USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id())");
    expect(hardening).not.toContain("FOR ALL TO authenticated");
    expect(hardening).toContain("FOR INSERT TO authenticated");
    expect(hardening).toContain("FOR UPDATE TO authenticated");
    expect(hardening).toContain("FOR DELETE TO authenticated");
  });

  it("installs relationship guards for every Community Groups table", () => {
    expect(hardening).toContain("community_groups_assert_relationships");
    expect(hardening).toContain("Community Groups records must reference a group in the same tenant.");
    expect(hardening).toContain("Committee and member must belong to the same group.");
    expect(hardening).toContain("Ballot member must belong to the same group as the vote.");
    expect(hardening).toContain("Notification member must belong to its notification group.");
    for (const table of tables) expect(hardening).toContain(`'${table}'`);
  });

  it("uses the incoming transaction group during BEFORE INSERT without weakening tenant validation", () => {
    expect(insertGuard).toContain("auth.uid() IS NULL OR NEW.company_id IS DISTINCT FROM c");
    expect(insertGuard).toContain("group_a := NEW.group_id;");
    expect(insertGuard).not.toContain("group_a := public.community_groups_parent_group(TG_TABLE_NAME, NEW.id, c);");
  });

  it("makes audit history append-only and normalizes the actor server-side", () => {
    expect(hardening).toContain("Community Groups audit history is immutable.");
    expect(hardening).toContain("NEW.actor_id := auth.uid();");
    expect(hardening).toContain("t || '_append'");
    expect(hardening).not.toContain("community_group_audit_log FOR UPDATE");
    expect(hardening).not.toContain("community_group_audit_log FOR DELETE");
  });

  it("guards approval, KYC, disbursement, and sensitive state transitions in triggers", () => {
    expect(hardening).toContain("Community Groups approval permission required.");
    expect(hardening).toContain("Community Groups disbursement permission required.");
    expect(hardening).toContain("Community Groups welfare approval permission required.");
    expect(hardening).toContain("Community Groups expense approval permission required.");
    expect(hardening).toContain("Community Groups KYC verification permission required.");
  });
});
