import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const dashboard = readFileSync(resolve(root, "client/src/BusinessSphereDashboard.jsx"), "utf8");
const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const profileCenter = readFileSync(resolve(root, "client/src/components/ProfileIdentityCenter.jsx"), "utf8");
const vercelConfig = readFileSync(resolve(root, "vercel.json"), "utf8");
const activeProfileMenu = profileCenter.slice(profileCenter.lastIndexOf("function ProfileMenu("));

describe("dashboard shell interaction refinement", () => {
  it("keeps the workspace navigation as an accessible left operating rail without duplicate identity controls", () => {
    expect(dashboard).toContain('aria-label="Operational workspaces"');
    expect(dashboard).not.toContain('aria-label="Company workspace profile"');
    expect(dashboard).toContain('const sidebarHiddenFromAssistiveTech = !isDesktopNavigation && !sidebarOpen;');
    expect(dashboard).toContain('aria-hidden={sidebarHiddenFromAssistiveTech}');
    expect(dashboard).toContain('window.matchMedia("(min-width: 1024px)")');
    expect(dashboard).toContain('className={`dashboard-sidebar dashboard-shell-rail fixed z-40 inset-y-0 left-0');
    expect(dashboard).toContain('lg:top-0 lg:z-30 lg:sticky lg:translate-x-0');
    expect(dashboard).toContain('aria-current={isActive ? "page" : undefined}');
    expect(dashboard).toContain('dashboard-flat-navigation');
    expect(dashboard).toContain('dashboard-sidebar-brand');
    expect(dashboard).toContain('w-[min(86vw,320px)]');
    expect(dashboard).toContain('aria-label="Close navigation drawer"');
    expect(dashboard).toContain('pb-[env(safe-area-inset-bottom)]');
    expect(dashboard).toContain('overscroll-contain');
    expect(dashboard).toContain('sidebarLabelsVisible');
    expect(dashboard).not.toContain('dashboard-sidebar-tools');
    expect(dashboard).not.toContain('dashboard-sidebar-profile');
    expect(dashboard).toContain('items.filter((item) => !["notifications", "profile"].includes(item.id))');
    expect(dashboard).toContain('sidebarRef = useRef(null)');
    expect(dashboard).toContain('closeOnOutsidePointer');
    expect(dashboard).toContain('document.body.style.overflow = "hidden"');
    expect(dashboard).toContain('event.key === "Escape"');
    expect(dashboard).toContain('dashboard-sidebar-footer');
    expect(dashboard).toContain('dashboard-shell-header');
    expect(dashboard).toContain('aria-label="Workspace command bar"');
    expect(dashboard).toContain('will-change-[width,transform]');
    expect(dashboard).toContain('duration-[220ms]');
    expect(dashboard).toContain('motion-reduce:transition-none');
    expect(dashboard).toContain('smart_manager_dashboard_prefs');
    expect(dashboard).toContain('localStorage.setItem("smart-manager:sidebar-collapsed"');
  });

  it("keeps top-bar controls responsive instead of allowing them to crowd narrow screens", () => {
    expect(dashboard).toContain('aria-label="Open menu"');
    expect(dashboard).toContain('aria-label="Search everything"');
    expect(dashboard).toContain('aria-label={`Open workspace details for');
    expect(dashboard).toContain('aria-label="Workspace details"');
    expect(dashboard).toContain('workspaceMenuOpen');
    expect(dashboard).toContain('closeWorkspaceMenu');
    expect(dashboard).toContain('max-h-[min(70dvh,520px)]');
    expect(dashboard).toContain('overscroll-contain overflow-y-auto');
    expect(dashboard).toContain('subscriptionStateLabel(subscriptionAccess.access)');
    expect(dashboard).toContain('Active branch');
    expect(dashboard).toContain('Switch branch');
    expect(dashboard).toContain('smart-manager:active-branch:');
    expect(dashboard).toContain('smart-manager:active-branch-changed');
    expect(dashboard).toContain('role="menuitemradio"');
    expect(dashboard).toContain('switchWorkspaceBranch');
    expect(dashboard).toContain('event.key.toLowerCase() !== "b"');
    expect(dashboard).toContain('Ctrl+B');
    expect(dashboard).toContain('target?.isContentEditable');
    expect(dashboard).toContain('dashboard-topbar-context');
    expect(dashboard).toContain('function LiveDateTime()');
    expect(dashboard).toContain('NotificationCenter');
    expect(dashboard).toContain('onClick={toggleDarkMode}');
    expect(dashboard).toContain('aria-pressed={darkMode}');
    expect(dashboard).toContain('dashboard-topbar-search inline-flex h-9');
    expect(dashboard).toContain('border-0 bg-transparent');
    expect(dashboard).not.toContain('dashboard-topbar-profile');
    expect(dashboard).not.toContain('dashboard-topbar-customize');
    expect(dashboard).toContain('onOpenDashboardCustomization={() => setPreferencesDrawerOpen(true)}');
    const topbar = dashboard.slice(dashboard.indexOf('aria-label="Workspace command bar"'), dashboard.indexOf('{IS_CONFIGURED && active !== "billing"'));
    expect(topbar).not.toContain('Live workspace');
    expect(topbar).not.toContain('company?.name || "Smart Manager"');
    expect(topbar).toContain('Search modules, records, and actions');
    expect(topbar).not.toContain('>Create<');
    expect(topbar).not.toContain('Customize dashboard layout');
    expect(topbar).not.toContain('WorkspacePresenceBadge');
  });

  it("keeps grouped navigation role-safe and preserves the compact mobile navigation", () => {
    expect(dashboard).toContain('displayedNavigationGroups.map((group) => {');
    expect(dashboard).toContain('getPresentationNavigationGroups(navigationGroups, preferences.visibleNavigationGroupIds, active)');
    expect(dashboard).toContain('availableNavigationGroups={navigationGroups.map');
    expect(dashboard).toContain('item.locked');
    expect(dashboard).toContain('aria-label="Mobile workspace navigation"');
    expect(dashboard).toContain('aria-current={on ? "page" : undefined}');
    expect(dashboard).toContain('createPortal(');
    expect(dashboard).toContain('), document.body)');
  });

  it("keeps direct application navigation behind the protected route and SPA rewrite", () => {
    expect(app).toContain('<Route path="/app">');
    expect(app).toContain('<ProtectedSurface>');
    expect(vercelConfig).toContain('"source": "/(.*)"');
    expect(vercelConfig).toContain('"destination": "/index.html"');
  });

  it("uses a contained profile menu without a fixed page-covering overlay", () => {
    expect(activeProfileMenu).toContain('aria-haspopup="menu"');
    expect(activeProfileMenu).toContain('id="workspace-profile-menu"');
    expect(activeProfileMenu).toContain('window.addEventListener("pointerdown", closeWhenOutside)');
    expect(activeProfileMenu).toContain('window.addEventListener("keydown", closeOnEscape)');
    expect(activeProfileMenu).not.toContain('fixed inset-0');
    expect(activeProfileMenu).toContain('max-h-[min(58vh,360px)]');
  });
});
