import { describe, expect, it } from "vitest";
import { DASHBOARD_KPI_IDS, DASHBOARD_WIDGET_IDS, DEFAULT_DASHBOARD_PREFERENCES, dashboardPreferencesInput } from "./dashboardPreferences";

describe("dashboard preference layout contract", () => {
  it("accepts the full persisted dashboard-layout configuration", () => {
    const parsed = dashboardPreferencesInput.parse({
      ...DEFAULT_DASHBOARD_PREFERENCES,
      showRevenueOverview: false,
      widgetOrder: ["activity", "revenue", "salesMix", "quickActions", "products", "cashFlow", "businessHealth", "actionCenter"],
      kpiCardIds: ["revenue", "orders"],
      performanceWindow: "6m",
    });
    expect(parsed.showRevenueOverview).toBe(false);
    expect(parsed.widgetOrder[0]).toBe("activity");
    expect(parsed.kpiCardIds).toEqual(["revenue", "orders"]);
    expect(parsed.performanceWindow).toBe("6m");
  });

  it("rejects duplicated or empty widget and KPI configurations", () => {
    expect(() => dashboardPreferencesInput.parse({ ...DEFAULT_DASHBOARD_PREFERENCES, widgetOrder: ["revenue", "revenue"] })).toThrow();
    expect(() => dashboardPreferencesInput.parse({ ...DEFAULT_DASHBOARD_PREFERENCES, kpiCardIds: [] })).toThrow();
  });

  it("keeps the canonical preference catalog bounded to the visible dashboard", () => {
    expect(DASHBOARD_WIDGET_IDS).toEqual(["revenue", "salesMix", "quickActions", "products", "cashFlow", "businessHealth", "activity", "actionCenter"]);
    expect(DASHBOARD_KPI_IDS).toEqual(["revenue", "expenses", "net-result", "orders", "receivables"]);
  });
});
