import { describe, expect, it } from "vitest";
import { normalizePreferences, type DashboardPreferences } from "../client/src/contexts/DashboardPreferencesContext";
import { importDashboardLayout, parseDashboardLayout, serializeDashboardLayout } from "../client/src/lib/dashboardLayoutTransfer";

const baseline = normalizePreferences({
  showTopBarSearch: false,
  visibleNavigationGroupIds: ["home", "finance", "analytics"],
});

describe("dashboard layout transfer", () => {
  it("round-trips presentation preferences without identity or tenant fields", () => {
    const raw = serializeDashboardLayout(baseline);
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    expect(parsed.format).toBe("smart-manager-dashboard-layout");
    expect(parsed.version).toBe(1);
    expect(parsed).not.toHaveProperty("companyId");
    expect(parsed).not.toHaveProperty("userId");
    expect((parsed.preferences as DashboardPreferences).showTopBarSearch).toBe(false);
    expect(parseDashboardLayout(raw).showTopBarSearch).toBe(false);
  });

  it("filters imported groups to the receiving user’s authorized groups and retains home", () => {
    const raw = serializeDashboardLayout(baseline);
    const imported = importDashboardLayout(raw, baseline, ["home", "operations"]);

    expect(imported.visibleNavigationGroupIds).toEqual(["home"]);
    expect(imported.showTopBarSearch).toBe(false);
  });

  it("rejects malformed, unsupported, and oversized transfer files", () => {
    expect(() => parseDashboardLayout("not-json")).toThrow("not valid JSON");
    expect(() => parseDashboardLayout(JSON.stringify({ format: "other", version: 1, preferences: {} }))).toThrow("not a supported");
    expect(() => parseDashboardLayout("{".padEnd(256_001, "x"))).toThrow("empty or too large");
  });
});
