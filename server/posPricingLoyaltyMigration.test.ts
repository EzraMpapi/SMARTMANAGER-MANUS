import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260824_056_pos_pricing_loyalty.sql", import.meta.url),
  "utf8",
);

describe("POS pricing and loyalty migration", () => {
  it("creates the normalized pricing, sale-evidence, and loyalty tables additively", () => {
    for (const table of [
      "pos_tax_rules",
      "pos_discount_rules",
      "pos_promotions",
      "pos_promotion_items",
      "pos_sale_adjustments",
      "pos_sale_tax_lines",
      "pos_loyalty_programs",
      "pos_loyalty_members",
      "pos_loyalty_ledger",
      "pos_loyalty_rewards",
      "pos_loyalty_redemptions",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
    expect(migration).not.toMatch(/\bDROP TABLE\b/i);
    expect(migration).not.toContain("DISABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("public.current_company_id()");
  });

  it("enforces approval and effective-window controls for active configuration", () => {
    expect(migration).toContain("approval_request_id uuid");
    expect(migration).toContain("pos_tax_rules_active_approval_check");
    expect(migration).toContain("pos_discount_rules_active_approval_check");
    expect(migration).toContain("pos_promotions_active_approval_check");
    expect(migration).toContain("pos_loyalty_programs_active_approval_check");
    expect(migration).toContain("pos_loyalty_rewards_active_approval_check");
    expect(migration).toContain("effective_to >= effective_from");
    expect(migration).toContain("FOREIGN KEY (company_id, approval_request_id)");
  });

  it("bounds taxes, discounts, promotions, and tender-facing adjustments", () => {
    expect(migration).toContain("rate_bps integer NOT NULL CHECK (rate_bps BETWEEN 0 AND 10000)");
    expect(migration).toContain("discount_type = 'Percentage' AND value <= 100");
    expect(migration).toContain("benefit_type IN ('Percentage Off', 'Flat Off', 'Fixed Reward Price', 'Free Item', 'Points Multiplier')");
    expect(migration).toContain("pos_sale_adjustments_one_rule_check");
    expect(migration).toContain("status text NOT NULL DEFAULT 'Pending Approval'");
    expect(migration).toContain("pos_sale_adjustments_approval_check");
    expect(migration).toContain("pos_sale_tax_lines_unique");
  });

  it("keeps loyalty balances ledger-based, retry-safe, and approval-aware", () => {
    expect(migration).toContain("points_balance numeric(20,4) NOT NULL DEFAULT 0");
    expect(migration).toContain("points_balance_after numeric(20,4) NOT NULL");
    expect(migration).toContain("UNIQUE (company_id, idempotency_key)");
    expect(migration).toContain("pos_loyalty_redemptions_approval_check");
    expect(migration).toContain("pos_loyalty_redemptions_applied_evidence_check");
    expect(migration).toContain("pos_loyalty_redemptions_reversed_evidence_check");
    expect(migration).toContain("FOREIGN KEY (company_id, member_id)");
    expect(migration).toContain("FOREIGN KEY (company_id, reward_id)");
  });

  it("enforces tenant scope for inventory and CRM references and read policies", () => {
    expect(migration).toContain("POS pricing item does not belong to this workspace.");
    expect(migration).toContain("POS promotion item does not belong to this workspace.");
    expect(migration).toContain("POS loyalty customer does not belong to this workspace.");
    expect(migration).toContain("FOREACH t IN ARRAY ARRAY[");
    expect(migration).toContain("company_id = public.current_company_id() AND public.fin_can_view()");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.pos_pricing_scope_assert() FROM PUBLIC");
  });
});
