import { describe, expect, it } from "vitest";
import { findNavigationItem, getNavigationGroups, getQuickCreateActions } from "./enterpriseNavigation";

describe("enterprise navigation", () => {
  const allModuleIds = [
    "dashboard", "crm", "sales", "inventory", "procurement", "finance", "reports", "hr",
    "manufacturing", "scm", "marketing", "ecommerce", "pos", "documents", "projects", "support",
    "analytics", "notifications", "activity", "integrations", "workflows", "collaboration", "tra_portal",
    "ai", "microfinance", "money-agent", "property-management", "vicoba", "community", "healthcare",
    "school", "pharmacy", "hotel", "fleet", "banking", "restaurant", "employee-portal", "presentation", "global-admin",
  ];

  it("returns only authorized items grouped by business category", () => {
    const groups = getNavigationGroups({ visibleModuleIds: ["dashboard", "finance", "reports"], currentRoleId: "Finance Manager" });
    expect(groups.map((group) => group.id)).toEqual(["home", "finance", "administration"]);
    expect(groups.find((group) => group.id === "finance")?.items.map((item) => item.id)).toEqual(["finance", "reports"]);
    expect(groups.find((group) => group.id === "finance")?.items.find((item) => item.id === "finance")?.isPrimary).toBe(true);
  });

  it("keeps profile available as a shell destination without exposing settings as an operational module", () => {
    const groups = getNavigationGroups({ visibleModuleIds: ["dashboard"], currentRoleId: "Employee", canSeeSettings: false });
    expect(findNavigationItem("profile")?.groupId).toBe("administration");
    expect(groups.flatMap((group) => group.items.map((item) => item.id))).toContain("profile");
    expect(groups.flatMap((group) => group.items.map((item) => item.id))).not.toContain("settings");
  });

  it("does not offer create actions when the role cannot write", () => {
    expect(getQuickCreateActions({ visibleModuleIds: allModuleIds, canCreate: false })).toEqual([]);
  });

  it("offers only actions whose parent module is visible", () => {
    const actions = getQuickCreateActions({ visibleModuleIds: ["sales", "inventory"], canCreate: true });
    expect(actions.map((action) => action.module)).toEqual(["sales", "inventory"]);
  });
});
