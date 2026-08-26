import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ExecutiveCommandCenter.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("executive command center contracts", () => {
  it("covers the reference-aligned executive KPI areas without fabricating unavailable values", () => {
    for (const label of [
      "Total revenue", "Total expenses", "Net operating result", "Orders & sales", "Outstanding invoices",
    ]) expect(workspace).toContain(label);
    expect(workspace).toContain("Insufficient confirmed data");
    expect(workspace).toContain("Not a gross-profit calculation");
    expect(workspace).toContain("not a bank-balance statement");
  });

  it("provides explainable health, actionable alerts, source notes, and drill-down navigation", () => {
    for (const label of ["Business health", "Financial momentum", "Receivables", "Inventory readiness", "Operational queue", "Action center"]) {
      expect(workspace).toContain(label);
    }
    for (const source of ["sales_invoices", "finance_expenses", "inventory_items", "hr_leave_requests"]) expect(workspace).toContain(source);
    for (const module of ["onNavigate(\"sales\")", "onNavigate(\"finance\")", "onNavigate(\"inventory\")", "onNavigate(\"hr\")", "onNavigate(\"reports\")"]) expect(workspace).toContain(module);
    expect(dashboard).toContain('{active === "dashboard" && (');
    expect(dashboard).toContain("<Dashboard");
  });
});
