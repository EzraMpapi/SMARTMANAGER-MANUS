import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const dashboard = readFileSync(resolve(root, "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const profileCenter = readFileSync(resolve(root, "client/src/components/ProfileIdentityCenter.jsx"), "utf8");
const activeProfileMenu = profileCenter.slice(profileCenter.lastIndexOf("function ProfileMenu("));

describe("dashboard shell interaction refinement", () => {
  it("keeps the workspace navigation as an accessible left operating rail and exposes the command entry point", () => {
    expect(dashboard).toContain('aria-label="Operational workspaces"');
    expect(dashboard).toContain('aria-label="Open command palette"');
    expect(dashboard).toContain('aria-hidden={!sidebarOpen}');
    expect(dashboard).toContain('className={`dashboard-sidebar fixed z-50 inset-y-0 left-0');
    expect(dashboard).toContain('aria-current={isActive ? "page" : undefined}');
    expect(dashboard).toContain('dashboard-flat-navigation');
  });

  it("keeps top-bar controls responsive instead of allowing them to crowd narrow screens", () => {
    expect(dashboard).toContain('aria-label="Open menu"');
    expect(dashboard).toContain('aria-label="Search everything"');
    expect(dashboard).toContain('aria-label="Open workspace settings"');
    expect(dashboard).toContain('onClick={toggleDarkMode}');
    expect(dashboard).toContain('aria-pressed={darkMode}');
    expect(dashboard).toContain("sm:hidden");
    expect(dashboard).toContain("xl:inline-flex");
  });

  it("keeps flat navigation role-safe and preserves the compact mobile navigation", () => {
    expect(dashboard).toContain('flatNavigationItems.map((item) => {');
    expect(dashboard).toContain('item.locked');
    expect(dashboard).toContain('aria-label="Mobile workspace navigation"');
    expect(dashboard).toContain('aria-current={on ? "page" : undefined}');
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
