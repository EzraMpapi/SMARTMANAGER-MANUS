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
  it("keeps the workspace navigation as an accessible left operating rail and exposes the command entry point", () => {
    expect(dashboard).toContain('aria-label="Operational workspaces"');
    expect(dashboard).toContain('aria-label="Open command palette"');
    expect(dashboard).toContain('const sidebarHiddenFromAssistiveTech = !isDesktopNavigation && !sidebarOpen;');
    expect(dashboard).toContain('aria-hidden={sidebarHiddenFromAssistiveTech}');
    expect(dashboard).toContain('window.matchMedia("(min-width: 1024px)")');
    expect(dashboard).toContain('className={`dashboard-sidebar fixed z-40 inset-y-0 left-0');
    expect(dashboard).toContain('${createMenuOpen ? "z-50" : "z-30"}');
    expect(dashboard).toContain('createMenuOpen && <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close create menu"');
    expect(dashboard).toContain('lg:top-0 lg:z-30 lg:sticky lg:translate-x-0');
    expect(dashboard).toContain('aria-current={isActive ? "page" : undefined}');
    expect(dashboard).toContain('dashboard-flat-navigation');
  });

  it("keeps top-bar controls responsive instead of allowing them to crowd narrow screens", () => {
    expect(dashboard).toContain('aria-label="Open menu"');
    expect(dashboard).toContain('aria-label="Open command palette"');
    expect(dashboard).toContain('aria-label="Open workspace settings"');
    expect(dashboard).toContain('onClick={toggleDarkMode}');
    expect(dashboard).toContain('aria-pressed={darkMode}');
    expect(dashboard).toContain("sm:hidden");
    expect(dashboard).toContain('max-w-[460px]');
    expect(dashboard).toContain('Search customers, products, invoices, orders...');
    expect(dashboard).toContain('dashboard-topbar-tour hidden');
    expect(dashboard).toContain('dashboard-topbar-customize');
    expect(dashboard).toContain('preferences.showGuidedTour &&');
    expect(dashboard).toContain('preferences.showTopBarSearch &&');
    expect(dashboard).toContain("inline-flex items-center gap-2 rounded-xl border border-emerald-200");
  });

  it("keeps flat role-safe navigation and preserves the compact mobile navigation", () => {
    expect(dashboard).toContain('const flatNavigationItems = useMemo(() => [');
    expect(dashboard).toContain('displayedNavigationGroups.flatMap((group) => group.items.map((item) => ({ ...item, groupOrder: group.order })))');
    expect(dashboard).toContain('const referenceOrderedNavigationItems = useMemo(() => {');
    expect(dashboard).toContain('referenceOrderedNavigationItems.map((item) => {');
    expect(dashboard).toContain('getPresentationNavigationGroups(navigationGroups, preferences.visibleNavigationGroupIds, active)');
    expect(dashboard).toContain('availableNavigationGroups={navigationGroups.map');
    expect(dashboard).toContain('item.locked');
    expect(dashboard).toContain('aria-label="Mobile workspace navigation"');
    expect(dashboard).toContain('aria-current={on ? "page" : undefined}');
    expect(dashboard).toContain('m.id === "dashboard" ? "Dashboard" : m.label.split(" ")[0]');
    expect(dashboard).toContain('aria-label="Open AI Command Center"');
    expect(dashboard).toContain('sm:hidden" aria-label="Open AI Command Center"');
    expect(dashboard).toContain('bottom-6 right-6 z-40 hidden h-14 w-14 min-h-14 min-w-14');
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
