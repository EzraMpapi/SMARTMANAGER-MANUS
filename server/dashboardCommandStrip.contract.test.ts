import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const dashboardCss = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");

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

  it("keeps the reference-matched command-header hierarchy without replacing existing controls", () => {
    expect(dashboard).toContain("dashboard-reference-topbar");
    expect(dashboard).toContain("dashboard-topbar-primary-search");
    expect(dashboard).toContain("dashboard-topbar-right-rail");
    expect(dashboard).toContain("dashboard-topbar-workspace");
    expect(dashboard).toContain("dashboard-topbar-presence");
    expect(dashboard).toContain("dashboard-topbar-notification-slot");
    expect(dashboard).toContain("dashboard-topbar-alert");
    expect(dashboard).toContain("dashboard-topbar-profile-slot");
    expect(dashboard).toContain("dashboard-topbar-create");
    expect(dashboard).toContain("<NotificationCenter");
    expect(dashboard).toContain("<PremiumProfileMenu");
    expect(dashboard.indexOf("dashboard-topbar-primary-search")).toBeLessThan(
      dashboard.indexOf("dashboard-topbar-actions"),
    );
  });

  it("preserves a centered desktop search and 40px mobile command targets", () => {
    expect(dashboardCss).toContain("grid-template-columns: minmax(10rem, .5fr) minmax(18rem, 28.75rem) minmax(18rem, 1.5fr);");
    expect(dashboardCss).toContain(".dashboard-topbar-right-rail");
    expect(dashboardCss).toContain(".dashboard-topbar-workspace");
    expect(dashboardCss).toContain(".dashboard-topbar-presence,");
    expect(dashboardCss).toContain("min-height: 2.5rem;");
    expect(dashboardCss).toContain(".dashboard-topbar-ai-shortcut {");
  });

  it("keeps notification and command overlays keyboard-operable without widening data access", () => {
    expect(dashboard).toContain("const closeOnEscape = (event) => {");
    expect(dashboard).toContain('if (event.key !== "Escape") return;');
    expect(dashboard).toContain("aria-expanded={open}");
    expect(dashboard).toContain('aria-controls={open ? "notification-center-panel" : undefined}');
    expect(dashboard).toContain('id="notification-center-panel"');
    expect(dashboard).toContain('role="region"');
    expect(dashboard).toContain('if (e.key === "Escape") { e.preventDefault(); onClose(); return; }');
    expect(dashboard).toContain("modules.some((m) => m.id === a.module)");
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
