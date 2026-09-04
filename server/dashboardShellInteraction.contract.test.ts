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
    expect(dashboard).toContain('aria-hidden={!isDesktopNavigation && !sidebarOpen}');
    expect(dashboard).toContain('window.matchMedia("(min-width: 1024px)")');
    expect(dashboard).toContain('className={`dashboard-sidebar dashboard-shell-rail fixed z-40 inset-y-0 left-0');
    expect(dashboard).toContain('lg:top-0 lg:z-30 lg:sticky lg:translate-x-0');
    expect(dashboard).toContain('aria-current={isActive ? "page" : undefined}');
    expect(dashboard).toContain('dashboard-flat-navigation');
    expect(dashboard).toContain('dashboard-sidebar-brand');
    expect(dashboard).toContain('dashboard-sidebar-tools');
    expect(dashboard).toContain('dashboard-sidebar-footer');
    expect(dashboard).toContain('dashboard-shell-header');
    expect(dashboard).toContain('createMenuOpen ? "z-50" : "z-30"');
    expect(dashboard).toContain('const [createMenuMounted, setCreateMenuMounted] = useState(false);');
    expect(dashboard).toContain('create-menu-panel');
    expect(dashboard).toContain('create-menu-backdrop');
    expect(dashboard).toContain('motion-reduce:transition-none');
  });

  it("keeps top-bar controls responsive instead of allowing them to crowd narrow screens", () => {
    expect(dashboard).toContain('aria-label="Open menu"');
    expect(dashboard).toContain('aria-label="Search everything"');
    expect(dashboard).toContain('aria-label="Open workspace settings"');
    expect(dashboard).toContain('onClick={toggleDarkMode}');
    expect(dashboard).toContain('aria-pressed={darkMode}');
    expect(dashboard).toContain("sm:hidden");
    expect(dashboard).toContain('dashboard-topbar-search hidden xl:flex min-w-[178px]');
    expect(dashboard).toContain('dashboard-topbar-tour hidden shrink-0 lg:block');
    expect(dashboard).toContain('dashboard-topbar-customize');
    expect(dashboard).toContain('preferences.showGuidedTour &&');
    expect(dashboard).toContain('preferences.showTopBarSearch &&');
    expect(dashboard).toContain('dashboard-topbar-status hidden items-center gap-1.5 rounded-full');
    expect(dashboard).toContain('inline-flex items-center gap-1.5 rounded-2xl bg-slate-950');
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
