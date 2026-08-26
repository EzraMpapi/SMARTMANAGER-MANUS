import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const dashboard = readFileSync(resolve(root, "client/src/BusinessSphereDashboard.jsx"), "utf8");
const profileCenter = readFileSync(resolve(root, "client/src/components/ProfileIdentityCenter.jsx"), "utf8");
const activeProfileMenu = profileCenter.slice(profileCenter.lastIndexOf("function ProfileMenu("));

describe("dashboard shell interaction refinement", () => {
  it("keeps the desktop navigation as a stable left operating rail and the command bar visible", () => {
    expect(dashboard).toContain("dashboard-sidebar fixed z-50");
    expect(dashboard).toContain("lg:sticky lg:top-0");
    expect(dashboard).toContain('aria-label="Workspace command bar"');
    expect(dashboard).toContain("dashboard-topbar sticky top-0 z-20");
  });

  it("keeps top-bar controls responsive instead of allowing them to crowd narrow screens", () => {
    expect(dashboard).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(dashboard).toContain("dashboard-topbar-search hidden lg:flex");
    expect(dashboard).toContain("dashboard-topbar-alert hidden lg:flex");
    expect(dashboard).toContain('<span className="hidden xl:block"><WorkspacePresenceBadge');
    expect(dashboard).toContain("dashboard-topbar-context");
    expect(dashboard).toContain("dashboard-topbar-actions");
    expect(dashboard).toContain("dashboard-topbar-tour hidden shrink-0 xl:block");
    expect(dashboard).toContain("onClick={toggleDarkMode}");
  });

  it("keeps sidebar ordering explicit, role-safe, and persistent per device", () => {
    expect(dashboard).toContain('"smart-manager:sidebar-module-order"');
    expect(dashboard).toContain('sidebarModuleOrder === "alphabetical"');
    expect(dashboard).toContain('aria-label="Sidebar module order"');
    expect(dashboard).toContain('aria-pressed={sidebarModuleOrder === "priority"}');
    expect(dashboard).toContain('aria-pressed={sidebarModuleOrder === "alphabetical"}');
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
