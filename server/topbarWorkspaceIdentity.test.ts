import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const topbarWorkspaceButton = dashboardSource.slice(
  dashboardSource.indexOf('aria-label="Open workspace details"'),
  dashboardSource.indexOf("{workspaceMenuOpen && ("),
);

describe("topbar workspace identity", () => {
  it("uses a neutral workspace label instead of exposing the company name", () => {
    expect(topbarWorkspaceButton).toContain('aria-label="Open workspace details"');
    expect(topbarWorkspaceButton).toContain(">Workspace</span>");
    expect(topbarWorkspaceButton).not.toContain("{company?.name || \"BusinessSphere\"}");
  });
});
