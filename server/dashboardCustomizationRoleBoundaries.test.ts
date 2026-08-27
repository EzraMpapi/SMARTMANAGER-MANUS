import { describe, expect, it } from "vitest";
import { roleDefinitionFor } from "../client/src/BusinessSphereDashboardCore.jsx";
import { getNavigationGroups, getPresentationNavigationGroups } from "../client/src/navigation/enterpriseNavigation";

function navigationForRole(roleName: string, visibleModuleIds = roleDefinitionFor(roleName).allowedModules) {
  const role = roleDefinitionFor(roleName);
  return getNavigationGroups({
    visibleModuleIds,
    currentRoleId: role.id,
    canSeeSettings: role.writeAccess === "full",
  });
}

function groupIds(groups: ReturnType<typeof getNavigationGroups>) {
  return groups.map((group) => group.id);
}

describe("dashboard customization role boundaries", () => {
  it("keeps a Platform Administrator within the system-approved control-center navigation even if preferences request unrelated groups", () => {
    const platform = navigationForRole("Platform Administrator");
    const personalized = getPresentationNavigationGroups(platform, ["home", "finance", "specialized"], "dashboard");
    expect(groupIds(platform)).not.toContain("finance");
    expect(groupIds(platform)).not.toContain("specialized");
    expect(groupIds(personalized)).toEqual(["home"]);
    expect(roleDefinitionFor("Platform Administrator").allowedModules).not.toContain("finance");
  });

  it("lets an operational manager hide permitted menu sections without using customization to reveal an absent subscription module", () => {
    const subscriptionLimitedOwner = navigationForRole("Organization Owner", ["dashboard", "finance", "notifications"]);
    const personalized = getPresentationNavigationGroups(subscriptionLimitedOwner, ["home", "finance"], "dashboard");
    expect(groupIds(subscriptionLimitedOwner)).toEqual(["home", "finance", "analytics", "administration"]);
    expect(groupIds(personalized)).toEqual(["home", "finance"]);
    expect(subscriptionLimitedOwner.flatMap((group) => group.items.map((item) => item.id))).not.toContain("crm");
    expect(personalized.flatMap((group) => group.items.map((item) => item.id))).not.toContain("crm");
  });

  it("keeps an employee read-only and unable to surface finance or administrative settings through presentation preferences", () => {
    const employee = navigationForRole("Employee");
    const personalized = getPresentationNavigationGroups(employee, ["home", "finance", "administration"], "dashboard");
    expect(roleDefinitionFor("Employee").writeAccess).toBe("none");
    expect(groupIds(employee)).not.toContain("finance");
    expect(personalized.flatMap((group) => group.items.map((item) => item.id))).toEqual(["dashboard", "profile"]);
    expect(personalized.flatMap((group) => group.items.map((item) => item.id))).not.toContain("settings");
  });

  it("does not render the internal dashboard shell for an external client role, regardless of saved presentation choices", () => {
    const externalClient = roleDefinitionFor("External Client");
    expect(externalClient.category).toBe("External Portal");
    expect(externalClient.writeAccess).toBe("none");
    expect(externalClient.allowedModules).toEqual(["support"]);
    expect(externalClient.allowedModules).not.toContain("finance");
  });

  it("retains the active authorized group so changing personal presentation cannot leave a valid screen without navigation", () => {
    const employee = navigationForRole("Employee");
    const personalized = getPresentationNavigationGroups(employee, ["home"], "employee-portal");
    expect(groupIds(personalized)).toEqual(["home", "people"]);
    expect(personalized.find((group) => group.id === "people")?.items.map((item) => item.id)).toEqual(["employee-portal"]);
  });
});
