import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("../client/src/components/ProfileIdentityCenter.jsx", import.meta.url), "utf8");
const stylesheet = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("topbar workspace identity", () => {
  it("keeps workspace identity in the user profile instead of the topbar", () => {
    expect(dashboardSource).not.toContain('aria-label="Open workspace details"');
    expect(dashboardSource).not.toContain("workspaceMenuOpen");
    expect(dashboardSource).toContain('aria-label="Smart Manager Enterprise Suite"');
    expect(dashboardSource).toContain(">SMART <span className=\"text-emerald-700\">MANAGER</span></span>");
    expect(dashboardSource).not.toContain("dashboard-topbar-workspace");
    expect(profileSource).toContain('aria-label="Workspace identity details"');
    expect(profileSource).toContain(">Workspace</p>");
    expect(profileSource).toContain(">Access role</p>");
    expect(stylesheet).toContain(".dashboard-topbar-brand > span:first-child");
    expect(stylesheet).toContain("rgb(255 255 255 / .82)");
  });
});
