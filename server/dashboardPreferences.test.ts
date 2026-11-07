import { describe, expect, it } from "vitest";
import { DASHBOARD_KPI_IDS, DASHBOARD_NAVIGATION_GROUP_IDS, DASHBOARD_WIDGET_IDS, DASHBOARD_PREFERENCES_SCHEMA_VERSION, DEFAULT_DASHBOARD_PREFERENCES, dashboardPreferencesInput } from "./dashboardPreferences";

describe("dashboard preference layout contract", () => {
  it("uses the versioned dashboard preference payload contract", () => {
    expect(DASHBOARD_PREFERENCES_SCHEMA_VERSION).toBe(1);
    expect(DEFAULT_DASHBOARD_PREFERENCES).toHaveProperty("visibleNavigationGroupIds");
    expect(DEFAULT_DASHBOARD_PREFERENCES).toHaveProperty("widgetOrder");
  });

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
    expect(DASHBOARD_NAVIGATION_GROUP_IDS).toEqual(["home", "sales-crm", "operations", "finance", "people", "specialized", "analytics", "administration"]);
  });

  it("accepts presentation-only shell customization while retaining a safe home route", () => {
    const parsed = dashboardPreferencesInput.parse({
      ...DEFAULT_DASHBOARD_PREFERENCES,
      sidebarPresentation: "compact",
      navigationSort: "alphabetical",
      visibleNavigationGroupIds: ["home", "finance", "analytics"],
      showTopBarSearch: false,
      showGuidedTour: false,
      showConnectionStatus: false,
      showTopBarDate: false,
    });
    expect(parsed.sidebarPresentation).toBe("compact");
    expect(parsed.visibleNavigationGroupIds).toEqual(["home", "finance", "analytics"]);
    expect(parsed.showGuidedTour).toBe(false);
  });

  it("rejects navigation settings that could remove every safe home destination or inject unknown groups", () => {
    expect(() => dashboardPreferencesInput.parse({ ...DEFAULT_DASHBOARD_PREFERENCES, visibleNavigationGroupIds: ["finance"] })).toThrow();
    expect(() => dashboardPreferencesInput.parse({ ...DEFAULT_DASHBOARD_PREFERENCES, visibleNavigationGroupIds: ["home", "unrecognized-group"] })).toThrow();
  });
});
