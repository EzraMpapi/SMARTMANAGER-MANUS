import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/FinanceCommandCenters.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");

describe("finance and reporting command-center contracts", () => {
  it("covers Finance command-center controls without inferring unsupported balances", () => {
    for (const text of ["Finance command center", "Revenue collected", "Receivables", "Operating expenses", "Net cash movement", "Expense concentration", "Control exceptions", "Finance readiness", "Gross margin", "Cash forecast", "Payables"]) expect(workspace).toContain(text);
    expect(workspace).toContain("Insufficient confirmed COGS data");
    expect(workspace).toContain("Insufficient confirmed forecast assumptions");
  });

  it("covers report coverage and governance", () => {
    for (const text of ["Reporting command center", "Report coverage, freshness, and governance", "Reportable invoices", "Valuation rows", "Scheduled reports", "Latest source date", "Export actions", "Tax filing", "Freshness"]) expect(workspace).toContain(text);
    for (const source of ["sales_invoices", "inventory_items", "finance_expenses", "pos_transactions"]) expect(workspace).toContain(source);
  });

  it("covers integration capability health and keeps all centers wired", () => {
    for (const text of ["Integration health", "Functional capabilities", "Backend-dependent", "Sync lag", "API failures", "Integration readiness"]) expect(workspace).toContain(text);
    for (const route of [
      '{active === "finance" && <Finance',
      '{active === "reports" && <Reports',
      '{active === "integrations" && (',
      "<Integrations invoices={invoices}",
    ]) expect(dashboard).toContain(route);
    expect(workspace).toContain("No confirmed sync telemetry source is exposed");
  });
});
