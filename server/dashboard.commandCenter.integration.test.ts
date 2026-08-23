import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("dashboard command-center integration", () => {
  it("mounts the executive command center from tenant-scoped workspace hooks", () => {
    expect(dashboardSource).toContain('<ExecutiveCommandCenter');
    expect(dashboardSource).toContain('invoices={invoices}');
    expect(dashboardSource).toContain('expenses={expenses}');
    expect(dashboardSource).toContain('inventory={inventory}');
    expect(dashboardSource).toContain('workOrders={workOrders}');
    expect(dashboardSource).toContain('currency={company.currency || "TZS"}');
  });

  it("exposes confirmed-data business signals with supporting source hooks", () => {
    expect(dashboardSource).toContain('<AiBusinessSignals');
    expect(dashboardSource).toContain('suppliers={suppliers}');
    expect(dashboardSource).toContain('quotations={quotations}');
    expect(dashboardSource).toContain('scheduledWorkflows={scheduledWorkflows}');
  });

  it("uses role-specific command centers for finance, HR, sales, procurement, and warehouse operations", () => {
    expect(dashboardSource).toContain('<FinanceCommandCenter');
    expect(dashboardSource).toContain('<HrCommandCenter');
    expect(dashboardSource).toContain('<SalesCommandCenter');
    expect(dashboardSource).toContain('<ProcurementCommandCenter');
    expect(dashboardSource).toContain('<WarehouseCommandCenter');
  });

  it("passes real supplier, quotation, and scheduled-workflow hooks into the dashboard", () => {
    expect(dashboardSource).toContain('suppliers={suppliers} quotations={quotations} scheduledWorkflows={scheduledWorkflows} currentUser={currentUser}');
  });
});
