import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("dashboard operational command strip", () => {
  it("derives the active command context only from the already-filtered visible module set", () => {
    expect(dashboard).toContain("const activeModule = visibleModules.find((module) => module.id === active);");
    expect(dashboard).toContain("const ActiveModuleIcon = activeModule?.icon || Building2;");
    expect(dashboard).toContain("const activeModuleLabel = activeModule?.label");
  });

  it("keeps command search and operational workspace navigation bound to existing callbacks", () => {
    expect(dashboard).toContain("aria-label=\"Open command palette\"");
    expect(dashboard).toContain("onClick={() => setPaletteOpen(true)}");
    expect(dashboard).toContain("aria-label=\"Operational workspaces\"");
    expect(dashboard).toContain("visibleModules.filter((m) =>");
    expect(dashboard).toContain("onClick={() => go(m.id)}");
  });

  it("keeps the command-header search centered and operational controls grouped without replacing their menus", () => {
    expect(dashboard).toContain("dashboard-topbar-primary-search");
    expect(dashboard).toContain("dashboard-topbar-utility-group");
    expect(dashboard).toContain("dashboard-topbar-notification-slot");
    expect(dashboard).toContain("dashboard-topbar-profile-slot");
    expect(dashboard).toContain("dashboard-topbar-create");
    expect(dashboard).toContain("<NotificationCenter");
    expect(dashboard).toContain("<PremiumProfileMenu");
    expect(dashboard.indexOf("dashboard-topbar-primary-search")).toBeLessThan(
      dashboard.indexOf("dashboard-topbar-actions"),
    );
  });

  it("renders desktop navigation as a flat, reference-ordered, role-aware workspace list", () => {
    expect(dashboard).toContain("const flatNavigationItems = useMemo(() => [");
    expect(dashboard).toContain("Number(Boolean(right.isPrimary)) - Number(Boolean(left.isPrimary))");
    expect(dashboard).toContain('sidebarModuleOrder === "alphabetical"');
    expect(dashboard).toContain("dashboard-flat-navigation");
    expect(dashboard).toContain("const navigationGroups = getNavigationGroups({");
    expect(dashboard).toContain("const displayedNavigationGroups = useMemo(() => getPresentationNavigationGroups(");
    expect(dashboard).toContain("const referenceOrderedNavigationItems = useMemo(() => {");
    expect(dashboard).toContain("referenceOrderedNavigationItems.map((item) => {");
    expect(dashboard).toContain("const referenceOrder = [\"dashboard\", \"sales\", \"pos\"");
    expect(dashboard).toContain("item.locked");
  });

  it("retains subscription status, alerts, and the independent mobile navigation path", () => {
    expect(dashboard).toContain("subscriptionAccess.ready");
    expect(dashboard).toContain("criticalAlerts.length > 0");
    expect(dashboard).toContain('className="dashboard-mobile-nav lg:hidden fixed bottom-0');
    expect(dashboard).toContain("<SubscriptionAccessBoundary");
  });
});
