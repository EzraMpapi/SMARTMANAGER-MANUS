import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboardSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const overviewSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/EnterpriseDashboardOverview.jsx"), "utf8");

describe("Enterprise dashboard overview contract", () => {
  it("renders the new overview only through the established executive role view", () => {
    expect(dashboardSource).toContain('import { EnterpriseDashboardOverview } from "./components/EnterpriseDashboardOverview"');
    expect(dashboardSource).toContain('if (roleView === "executive")');
    expect(dashboardSource).toContain("<EnterpriseDashboardOverview");
    expect(dashboardSource).toContain("financials={financials}");
    expect(dashboardSource).toContain("revenueExpenseTrend={revenueExpenseTrend}");
    expect(dashboardSource).toContain("onNavigate={onNavigate}");
    expect(dashboardSource).toContain("onQuickAction={onQuickAction}");
    expect(dashboardSource).toContain("allowedModules={currentRole.allowedModules}");
    expect(dashboardSource).toContain("writeAccess={currentRole.writeAccess}");
  });

  it("derives visible metrics from supplied workspace rows and retains explicit non-fabrication states", () => {
    expect(overviewSource).toContain("const invoiceRows = invoices?.rows || []");
    expect(overviewSource).toContain("const expenseRows = expenses?.rows || []");
    expect(overviewSource).toContain("const inventoryRows = inventory?.rows || []");
    expect(overviewSource).toContain("const crmRows = crm?.rows || []");
    expect(overviewSource).toContain("Some live workspace information is unavailable");
    expect(overviewSource).toContain("The dashboard does not invent business metrics");
    expect(overviewSource).not.toContain("Simulated");
  });

  it("uses a reference-directed KPI treatment while keeping every card navigation-safe", () => {
    expect(overviewSource).toContain("Connected workspace view");
    expect(overviewSource).toContain("const metrics = [");
    expect(overviewSource).toContain("Total revenue");
    expect(overviewSource).toContain("Total sales");
    expect(overviewSource).toContain("Receivables");
    expect(overviewSource).toContain("Revenue & Sales Performance");
    expect(overviewSource).toContain("Inventory health");
    expect(overviewSource).toContain("const openAction = (moduleId, params) => onQuickAction?.(moduleId, params)");
    expect(overviewSource).toContain('openAction("finance", { tab: "receivables" })');
  });

  it("shares a responsive analytic-panel system without replacing live data or established actions", () => {
    expect(overviewSource).toContain("function PanelHeader");
    expect(overviewSource).toContain("<DonutPanel title=\"Sales by category\"");
    expect(overviewSource).toContain("<DonutPanel title=\"Sales by channel\"");
    expect(overviewSource).toContain("<PanelHeader title=\"Alerts\"");
    expect(overviewSource).toContain("<PanelHeader title=\"Quick actions\"");
    expect(overviewSource).toContain("performanceTrend.some");
    expect(overviewSource).toContain("PERFORMANCE_RANGES");
    expect(overviewSource).toContain("attentionItems?.length");
    expect(overviewSource).toContain("allowedModules = []");
  });
});

export {};
