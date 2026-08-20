import { describe, expect, it } from "vitest";
import { ERP_SCHEMA_CONTRACTS, validatePayloadContract, validateSchemaContract, assertPayloadContract } from "./schemaDriftChecker";

describe("Server-Side Supabase Schema Contract Checker", () => {
  it("defines strict required and forbidden columns for core ERP tables", () => {
    expect(ERP_SCHEMA_CONTRACTS.finance_expenses.requiredColumns).toContain("vendor");
    expect(ERP_SCHEMA_CONTRACTS.finance_expenses.forbiddenColumns).toContain("cost_center");
    expect(ERP_SCHEMA_CONTRACTS.finance_expenses.forbiddenColumns).toContain("department");
    expect(ERP_SCHEMA_CONTRACTS.finance_expenses.forbiddenColumns).toContain("data");

    expect(ERP_SCHEMA_CONTRACTS.sales_invoices.requiredColumns).toContain("doc_number");
    expect(ERP_SCHEMA_CONTRACTS.inventory_items.requiredColumns).toContain("data");
    expect(ERP_SCHEMA_CONTRACTS.crm_leads.requiredColumns).toContain("data");
  });

  it("approves valid payloads containing only supported relational columns across all critical tables", () => {
    const validExpense = {
      company_id: "comp-1",
      vendor: "TANESCO",
      category: "Rent & Utilities",
      amount: "1",
      expense_date: "2026-08-20",
      status: "Paid",
      method: "Bank Transfer",
    };
    expect(validatePayloadContract("finance_expenses", validExpense).valid).toBe(true);

    const validInvoice = {
      company_id: "comp-1",
      status: "Draft",
      amount: "100",
      doc_number: "INV-001",
      customer: "Acme Corp",
      issue_date: "2026-08-20",
      due_date: "2026-09-20",
    };
    expect(validatePayloadContract("sales_invoices", validInvoice).valid).toBe(true);

    const validInventory = {
      company_id: "comp-1",
      name: "Widget",
      status: "Active",
      amount: "50",
      data: { sku: "WID-1" },
    };
    expect(validatePayloadContract("inventory_items", validInventory).valid).toBe(true);

    const validLead = {
      company_id: "comp-1",
      name: "Lead Corp",
      status: "New",
      data: { email: "lead@corp.com" },
    };
    expect(validatePayloadContract("crm_leads", validLead).valid).toBe(true);
  });

  it("rejects payloads containing forbidden drift columns like cost_center or department", () => {
    const driftedPayload = {
      company_id: "comp-1",
      vendor: "TANESCO",
      category: "Rent & Utilities",
      amount: "1",
      expense_date: "2026-08-20",
      status: "Paid",
      method: "Bank Transfer",
      cost_center: "HQ-MAIN",
      department: "Operations",
    };

    const result = validatePayloadContract("finance_expenses", driftedPayload);
    expect(result.valid).toBe(false);
    expect(result.presentForbidden).toContain("cost_center");
    expect(result.presentForbidden).toContain("department");
    expect(result.errorMessage).toContain("Forbidden/unsupported drift columns detected");
  });

  it("rejects payloads missing required relational columns", () => {
    const incompletePayload = {
      company_id: "comp-1",
      vendor: "TANESCO",
    };

    const result = validatePayloadContract("finance_expenses", incompletePayload);
    expect(result.valid).toBe(false);
    expect(result.missingRequired.length).toBeGreaterThan(0);
    expect(result.errorMessage).toContain("Missing required columns");
  });

  it("gracefully flags unknown table contracts and additive columns", () => {
    const unknownResult = validateSchemaContract("unknown_table_xyz", ["id"]);
    expect(unknownResult.valid).toBe(false);
    expect(unknownResult.errorMessage).toContain("Unknown table contract");

    const additiveResult = validateSchemaContract("finance_expenses", [
      "company_id",
      "vendor",
      "category",
      "amount",
      "expense_date",
      "status",
      "method",
      "new_future_column",
    ]);
    expect(additiveResult.valid).toBe(true);
    expect(additiveResult.unknownColumns).toContain("new_future_column");
    expect(additiveResult.errorMessage).toContain("Additive columns detected");
  });

  it("throws a runtime error when assertPayloadContract is invoked with a drifted payload", () => {
    expect(() =>
      assertPayloadContract("finance_expenses", {
        company_id: "comp-1",
        vendor: "TANESCO",
        category: "Rent",
        amount: "1",
        expense_date: "2026-08-20",
        status: "Paid",
        method: "Cash",
        cost_center: "BAD",
      }),
    ).toThrowError(/Forbidden\/unsupported drift columns detected/);
  });
});
