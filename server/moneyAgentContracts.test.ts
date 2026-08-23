import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");
const migration = read("supabase/migrations/20260823_001_money_agent_core.sql");
const snapshotFixMigration = read("supabase/migrations/20260823_041_fix_money_agent_snapshot_reconciliation_created_at.sql");
const operations = read("server/moneyAgentOperations.ts");
const router = read("server/routers.ts");
const dashboard = read("client/src/BusinessSphereDashboard.jsx");
const workspace = read("client/src/components/MoneyAgentWorkspace.jsx");

const tables = [
  "money_agent_branches", "money_agent_agents", "money_agent_customers", "money_agent_wallets",
  "money_agent_services", "money_agent_fee_rules", "money_agent_commission_rules", "money_agent_limits",
  "money_agent_transactions", "money_agent_ledger_entries", "money_agent_approvals", "money_agent_settlements",
  "money_agent_reconciliations", "money_agent_alerts", "money_agent_audit_events", "money_agent_pin_credentials", "money_agent_receipts", "money_agent_notifications", "money_agent_risk_events", "money_agent_daily_summaries",
];

describe("Money Agent contracts", () => {
  it("creates the dedicated tenant-scoped Money Agent persistence family", () => {
    tables.forEach((table) => expect(migration).toContain(`public.${table}`));
    expect(migration).toContain("company_id uuid NOT NULL REFERENCES public.companies(id)");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("public.current_company_id()");
  });

  it("keeps TZS amounts integer-like and applies Tanzania defaults", () => {
    expect(migration).toContain("numeric(18,0)");
    expect(migration).toContain("currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS')");
    expect(migration).toContain("Africa/Dar_es_Salaam");
    expect(operations).toContain("Use a valid Tanzania mobile number.");
  });

  it("enforces an explicit state machine, idempotency, limits, and velocity protection", () => {
    expect(migration).toContain("UNIQUE(company_id, idempotency_key)");
    expect(migration).toContain("Awaiting Authorization");
    expect(migration).toContain("Pending Provider");
    expect(migration).toContain("This transaction exceeds the configured single-transaction limit.");
    expect(migration).toContain("Velocity protection paused this transaction.");
    expect(operations).toContain("idempotencyKey: uuid");
  });

  it("protects ledger and audit history from direct mutation and requires balanced postings", () => {
    expect(migration).toContain("money_agent_block_direct_mutation");
    expect(migration).toContain("Money Agent financial history is immutable");
    expect(migration).toContain("debit_total<>credit_total");
    expect(migration).toContain("money_agent_ledger_post");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.money_agent_ledger_post");
  });

  it("keeps financial actions behind authenticated role-aware security-definer procedures", () => {
    ["money_agent_has_role", "money_agent_can_view", "money_agent_can_operate", "money_agent_can_manage", "money_agent_can_approve", "money_agent_require"].forEach((marker) => expect(migration).toContain(marker));
    expect(migration).toContain("money_agent_require('operate')");
    expect(migration).toContain("money_agent_require('approve')");
    expect(migration).toContain("The transaction maker cannot approve their own transaction.");
    expect(operations).toContain("resolveVerifiedProfile");
    expect(operations).toContain("x-supabase-authorization");
    expect(operations).toContain("authorization: `Bearer ${token}`");
    expect(workspace).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(workspace).not.toContain("HARAKAPAY_API_KEY");
    expect(operations).toContain("SET_AGENT_PIN");
    expect(migration).toContain("crypt(p_payload->>'pin',gen_salt('bf'))");
    expect(migration).toContain("money_agent_pin_credentials");
  });

  it("does not fabricate external provider completion", () => {
    expect(migration).toContain("UPDATE public.money_agent_transactions SET status='Pending Provider'");
    expect(migration).toContain("providerConfigured',false");
    expect(workspace).toContain("No external provider call is made by this form.");
    expect(workspace).toContain("External mobile-money, bank, bill, airtime, and data services remain pending");
  });

  it("keeps reconciliation snapshot rows ordered by a selected createdAt alias", () => {
    expect(snapshotFixMigration).toContain("r.created_at AS \"createdAt\"");
    expect(snapshotFixMigration).toContain("ORDER BY x.\"createdAt\" DESC");
    expect(snapshotFixMigration).toContain("CREATE OR REPLACE FUNCTION public.money_agent_snapshot");
  });

  it("registers protected tRPC snapshot, customer snapshot, and action procedures", () => {
    expect(router).toContain('moneyAgent: router({');
    expect(router).toContain("getMoneyAgentSnapshot");
    expect(router).toContain("getMoneyAgentCustomerSnapshot");
    expect(router).toContain("customerSnapshot");
    expect(router).toContain("runMoneyAgentAction");
    expect(router).toContain(".input(moneyAgentActionInput)");
    expect(router).toContain(".input(moneyAgentListInput)");
    ["SET_AGENT_PIN", "VERIFY_AGENT_KYC", "VERIFY_CUSTOMER_KYC"].forEach((action) => expect(operations).toContain(action));
  });

  it("isolates the customer portal and protects identity links", () => {
    expect(migration).toContain("profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL");
    expect(migration).toContain("money_agent_customer_snapshot");
    expect(migration).toContain("money_agent_can_customer_portal");
    expect(migration).toContain("profile_id=auth.uid()");
    expect(migration).toContain("The selected customer profile is not active in this workspace.");
    expect(operations).toContain("profileId: uuid.nullable().optional().default(null)");
    expect(workspace).toContain("customerSnapshot.useQuery");
    expect(workspace).toContain("Customer-only access");
    expect(dashboard).toContain('id: "Customer"');
  });

  it("records operational evidence and prevents maker self-rejection or self-reversal", () => {
    expect(migration).toContain("INSERT INTO public.money_agent_daily_summaries");
    expect(migration).toContain("INSERT INTO public.money_agent_receipts");
    expect(migration).toContain("INSERT INTO public.money_agent_notifications");
    expect(migration).toContain("agentPerformance");
    expect(migration).toContain("branchPerformance");
    expect(migration).toContain("customerActivity");
    expect(migration).toContain("The transaction maker cannot reject their own transaction.");
    expect(migration).toContain("The transaction maker cannot reverse or refund their own transaction.");
    expect(migration).toContain("'COMMISSION_EXPENSE','Debit'");
    expect(migration).toContain("'AGENT_FLOAT:'||v_wallet.owner_id,'entryType','Credit','amount',v_tx.amount+v_tx.fee");
    expect(migration).toContain("'AGENT_CASH:'||v_other_wallet.owner_id,'entryType','Debit','amount',v_tx.amount");
  });

  it("exposes the real workspace only through the dashboard module catalog and role gates", () => {
    expect(dashboard).toContain('"money-agent"');
    expect(dashboard).toContain('id: "Money Agent"');
    expect(dashboard).toContain('id: "Money Agent Manager"');
    expect(dashboard).toContain('id: "Branch Manager"');
    expect(dashboard).toContain("LazyMoneyAgentWorkspace");
    expect(workspace).toContain("Available float");
    expect(workspace).toContain("Cash balance");
    expect(workspace).toContain("Maker-checker approvals");
    expect(workspace).toContain("Settlement and reconciliation");
    expect(workspace).toContain("Audit trail and reports");
    expect(workspace).toContain("Set secure agent PIN");
    expect(workspace).toContain("Provider codes are references only");
    expect(migration).toContain("money_agent_receipts");
    expect(migration).toContain("money_agent_notifications");
    expect(migration).toContain("money_agent_risk_events");
    expect(migration).toContain("money_agent_daily_summaries");
  });
});
