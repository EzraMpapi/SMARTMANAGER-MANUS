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
    expect(dashboard).toContain("aria-label=\"Search everything\"");
    expect(dashboard).toContain("onClick={() => setPaletteOpen(true)}");
    expect(dashboard).toContain("aria-label=\"Operational workspaces\"");
    expect(dashboard).toContain("visibleModules.filter((m) =>");
    expect(dashboard).toContain("onClick={() => go(m.id)}");
  });

  it("keeps the command-header hierarchy without replacing existing controls", () => {
    expect(dashboard).toContain('aria-label="Workspace command bar"');
    expect(dashboard).toContain("dashboard-topbar");
    expect(dashboard).toContain("dashboard-topbar-context");
    expect(dashboard).toContain("dashboard-topbar-search");
    expect(dashboard).toContain("dashboard-topbar-actions");
    expect(dashboard).toContain("SMART MANAGER");
    expect(dashboard).toContain("ERP SYSTEM");
    expect(dashboard).toContain("aria-label={`Open alerts");
    expect(dashboard).toContain("onClick={toggleDarkMode}");
    expect(dashboard).not.toContain("dashboard-topbar-profile");
    expect(dashboard).toContain("dashboard-sidebar-profile");
    expect(dashboard).toContain("<NotificationCenter");
    expect(dashboard).toContain("<PremiumProfileMenu");
  });

  it("separates the desktop header context from its action rail and preserves 40px mobile targets", () => {
    expect(dashboardCss).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(dashboardCss).toContain(".dashboard-topbar-right-rail");
    expect(dashboardCss).toContain(".dashboard-topbar-workspace");
    expect(dashboardCss).toContain(".dashboard-topbar-presence,");
    expect(dashboardCss).toContain("min-height: 2.5rem;");
    expect(dashboardCss).toContain(".dashboard-topbar-ai-shortcut {");
  });

  it("keeps the notification overlay bounded and keyboard-safe without widening data access", () => {
    expect(dashboard).toContain("const [open, setOpen] = useState(false);");
    expect(dashboard).toContain("onClick={() => setOpen((o) => !o)}");
    expect(dashboard).toContain('aria-label={"Notifications" + (alerts.length ? " (" + alerts.length + " alerts)" : "") }'.replace(" }", "}"));
    expect(dashboard).toContain('className="fixed inset-0 z-30"');
    expect(dashboard).toContain("onClick={() => setOpen(false)}");
    expect(dashboard).toContain("const alerts = useBusinessAlerts");
  });

  it("renders desktop navigation as a flat, reference-ordered, role-aware workspace list", () => {
    expect(dashboard).toContain("const flatNavigationItems = useMemo(() => [");
    expect(dashboard).toContain("Number(Boolean(right.isPrimary)) - Number(Boolean(left.isPrimary))");
    expect(dashboard).toContain('sidebarModuleOrder === "alphabetical"');
    expect(dashboard).toContain("dashboard-flat-navigation");
    expect(dashboard).toContain("const navigationGroups = getNavigationGroups({");
    expect(dashboard).toContain("const displayedNavigationGroups = useMemo(() => getPresentationNavigationGroups(");
    expect(dashboard).toContain("const displayedNavigationGroups = useMemo(() => getPresentationNavigationGroups(");
    expect(dashboard).toContain("displayedNavigationGroups.map((group) => {");
    expect(dashboard).toContain("const flatNavigationItems = useMemo(() => [");
    expect(dashboard).toContain("item.locked");
  });

  it("retains subscription status, alerts, and the independent mobile navigation path", () => {
    expect(dashboard).toContain("subscriptionAccess.ready");
    expect(dashboard).toContain("criticalAlerts.length > 0");
    expect(dashboard).toContain('className="dashboard-mobile-nav lg:hidden fixed bottom-0');
    expect(dashboard).toContain("<SubscriptionAccessBoundary");
  });
});
