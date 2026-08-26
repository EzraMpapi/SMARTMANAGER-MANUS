import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const commandCenter = readFileSync(resolve(root, "client/src/components/ExecutiveCommandCenter.jsx"), "utf8");
const dashboard = readFileSync(resolve(root, "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("reference-aligned dashboard contracts", () => {
  it("keeps the supplied enterprise composition in the default role-aware command center", () => {
    for (const label of [
      "Total revenue",
      "Total expenses",
      "Net operating result",
      "Outstanding invoices",
      "Revenue overview",
      "Sales mix",
      "Quick actions",
      "Top products",
      "Cash flow overview",
      "Business health",
      "Recent activity",
      "Action center",
    ]) expect(commandCenter).toContain(label);
    expect(commandCenter).toContain("Customize dashboard");
    expect(commandCenter).toContain("Select dashboard performance period");
    expect(commandCenter).toContain("grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5");
    expect(commandCenter).toContain("sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4");
  });

  it("uses only confirmed tenant-scoped source rows for reference metrics and charts", () => {
    for (const table of ["sales_invoices", "finance_expenses", "inventory_items", "crm_leads", "hr_leave_requests", "pos_transactions", "manufacturing_work_orders"]) expect(dashboard).toContain(`useCompanyTable("${table}"`);
    for (const visibleSource of ["sales_invoices", "finance_expenses", "inventory_items", "hr_leave_requests", "pos_transactions"]) expect(commandCenter).toContain(visibleSource);
    expect(commandCenter).toContain("isInPerformanceWindow(row, performanceBounds.start, performanceBounds.end)");
    expect(commandCenter).toContain("no COGS is inferred");
    expect(commandCenter).toContain("not a bank-balance statement");
    expect(commandCenter).toContain("Source:");
    expect(commandCenter).not.toContain("localStorage");
    expect(commandCenter).not.toContain("Math.random");
  });

  it("carries the existing role and action boundaries into the reference layout", () => {
    expect(dashboard).toContain("recentActivity={recentActivity}");
    expect(dashboard).toContain("onQuickAction={onQuickAction}");
    expect(dashboard).toContain("allowedModules={currentRole.allowedModules}");
    expect(dashboard).toContain("writeAccess={currentRole.writeAccess}");
    expect(commandCenter).toContain("const canWrite = writeAccess !== \"none\"");
    expect(commandCenter).toContain("const canOpen = (moduleId)");
    expect(commandCenter).toContain("onQuickAction?.");
    for (const action of ["Record payment", "Approve leave", "AI assistant"]) expect(commandCenter).toContain(action);
  });

  it("retains authenticated company-scoped browser reads and relationship-backed nested sources", () => {
    expect(dashboard).toContain("function useCompanyTable");
    expect(dashboard).toContain("headers: await authHeaders()");
    expect(dashboard).toContain('select: "*,items:sales_invoice_items(*),payments:sales_payments(*)"');
    expect(dashboard).toContain('select: "*,hr_employees(full_name)"');
    expect(dashboard).toContain("company_id");
  });
});
