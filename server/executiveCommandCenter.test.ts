import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ExecutiveCommandCenter.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("executive command center contracts", () => {
  it("covers the requested executive KPI areas without fabricating unavailable values", () => {
    for (const label of [
      "Total revenue", "Net sales", "Gross profit", "Net profit", "Operating expenses",
      "Outstanding receivables", "Outstanding payables", "Cash position", "Inventory value",
      "Low-stock items", "Active customers", "Employees", "Orders", "Pending approvals",
      "Sales target", "Target achievement", "Profit margin",
    ]) expect(workspace).toContain(label);
    expect(workspace).toContain("Insufficient confirmed data");
    expect(workspace).toContain("No confirmed workspace target configured");
    expect(workspace).toContain("No confirmed cash-balance source exposed to the executive dashboard");
  });

  it("provides explainable health, actionable alerts, source notes, and drill-down navigation", () => {
    for (const label of ["Business health", "Financial health", "Sales health", "Inventory health", "Customer health", "Operational health", "Security & integrations", "Action center"]) {
      expect(workspace).toContain(label);
    }
    for (const source of ["sales_invoices", "finance_expenses", "inventory_items", "hr_leave_requests"]) expect(workspace).toContain(source);
    for (const module of ["onNavigate(\"sales\")", "onNavigate(\"finance\")", "onNavigate(\"inventory\")", "onNavigate(\"hr\")", "onNavigate(\"reports\")"]) expect(workspace).toContain(module);
    expect(dashboard).toContain("<ExecutiveCommandCenter");
  });
});
