import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("../client/src/components/ProfileIdentityCenter.jsx", import.meta.url), "utf8");

describe("topbar workspace identity", () => {
  it("keeps workspace identity in the user profile instead of the topbar", () => {
    expect(dashboardSource).not.toContain('aria-label="Open workspace details"');
    expect(dashboardSource).not.toContain("workspaceMenuOpen");
    expect(profileSource).toContain('aria-label="Workspace identity details"');
    expect(profileSource).toContain(">Workspace</p>");
    expect(profileSource).toContain(">Access role</p>");
  });
});
