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
    expect(overviewSource).toContain("The dashboard does not invent business metrics.");
    expect(overviewSource).not.toContain("Simulated");
  });

  it("uses real workspace signals and keeps the decorative KPI treatment navigation-safe", () => {
    expect(overviewSource).toContain("const workspaceSignals = [");
    expect(overviewSource).toContain("Revenue signal");
    expect(overviewSource).toContain("Pipeline signal");
    expect(overviewSource).toContain("Review queue");
    expect(overviewSource).toContain("attentionItems?.length || 0");
    expect(overviewSource).toContain("tone.edge");
    expect(overviewSource).toContain("View details");
  });

  it("shares a responsive widget-card system without replacing live data or established actions", () => {
    expect(overviewSource).toContain("function WidgetHeader");
    expect(overviewSource).toContain("const widgetTones = {");
    expect(overviewSource).toContain("<WidgetHeader eyebrow=\"Financial movement\"");
    expect(overviewSource).toContain("<WidgetHeader eyebrow=\"Attention queue\"");
    expect(overviewSource).toContain("<WidgetHeader eyebrow=\"Momentum\"");
    expect(overviewSource).toContain("<WidgetHeader eyebrow=\"Team & next steps\"");
    expect(overviewSource).toContain("performanceTrend.some");
    expect(overviewSource).toContain("PERFORMANCE_RANGES");
    expect(overviewSource).toContain("attentionItems?.length");
    expect(overviewSource).toContain("onQuickAction(\"hr\", { tab: \"leave\" })");
  });
});

export {};
