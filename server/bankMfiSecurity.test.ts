import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260823_015_bank_mfi_core.sql", import.meta.url), "utf8");
const hardening = readFileSync(new URL("../supabase/migrations/20260823_016_bank_mfi_security_hardening.sql", import.meta.url), "utf8");
const helperHardening = readFileSync(new URL("../supabase/migrations/20260823_017_bank_mfi_internal_helper_hardening.sql", import.meta.url), "utf8");
const creditRepair = readFileSync(new URL("../supabase/migrations/20260823_018_bank_mfi_credit_ledger_repair.sql", import.meta.url), "utf8");
const disbursementBinding = readFileSync(new URL("../supabase/migrations/20260823_019_bank_mfi_disbursement_account.sql", import.meta.url), "utf8");
const workflowCompletion = readFileSync(new URL("../supabase/migrations/20260823_020_bank_mfi_workflow_completion.sql", import.meta.url), "utf8");
const service = readFileSync(new URL("./bankMfiOperations.ts", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../client/src/components/BankMfiWorkspace.jsx", import.meta.url), "utf8");

describe("Bank & MFI security and persistence contracts", () => {
  it("keeps new records tenant-owned and protected by RLS", () => {
    expect(migration).toContain("company_id uuid NOT NULL DEFAULT public.current_company_id()");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("company_id = public.current_company_id()");
    expect(migration).toContain("bank_has_role");
  });

  it("uses server-verified profiles and does not trust browser actor or company fields", () => {
    expect(service).toContain("resolveVerifiedProfile(req)");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("public.current_company_id()");
    expect(migration).toContain("FOR UPDATE");
  });

  it("enforces idempotency and a deferred balanced-journal constraint", () => {
    expect(migration).toContain("UNIQUE(company_id, idempotency_key)");
    expect(migration).toContain("bank_assert_balanced_journal");
    expect(migration).toContain("DEFERRABLE INITIALLY DEFERRED");
    expect(migration).toContain("v_debit <> v_credit");
  });

  it("does not introduce seeds, random business metrics, local persistence, or fake provider settlement", () => {
    expect(workspace).not.toMatch(/SEED|Math\.random|localStorage|sessionStorage/);
    expect(workspace).toContain("Insufficient confirmed data");
    expect(workspace).toContain("External payment settlement remains pending");
  });

  it("hardens privileged RPCs and keeps critical workflows auditable", () => {
    expect(hardening).toContain("REVOKE EXECUTE ON FUNCTION public.bank_post_transaction(jsonb) FROM PUBLIC, anon");
    expect(helperHardening).toContain("REVOKE EXECUTE ON FUNCTION public.bank_has_role(text[]) FROM authenticated, anon, PUBLIC");
    expect(creditRepair).toContain("bank_score_loan_application");
    expect(creditRepair).toContain("Loan disbursement");
    expect(creditRepair).toContain("Repayment exceeds the confirmed outstanding loan components");
    expect(disbursementBinding).toContain("disbursement_account_id");
    expect(workflowCompletion).toContain("bank_add_guarantor");
    expect(workflowCompletion).toContain("bank_add_collateral");
    expect(workflowCompletion).toContain("bank_customer_statement");
    expect(workflowCompletion).toContain("bank_run_standing_orders");
  });

  it("covers Tanzania defaults and configurable compliance fields", () => {
    expect(migration).toContain("Africa/Dar_es_Salaam");
    expect(migration).toContain("DEFAULT 'TZS'");
    expect(migration).toContain("national_id");
    expect(migration).toContain("pep_status");
    expect(migration).toContain("source_of_funds");
    expect(migration).toContain("bank_aml_alerts");
  });
});
