import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboardSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const stylesheet = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("Reference-directed dashboard shell contract", () => {
  it("retains the established responsive shell controls and module navigation", () => {
    expect(dashboardSource).toContain('aria-label="Workspace command bar"');
    expect(dashboardSource).toContain('aria-label="Operational workspaces"');
    expect(dashboardSource).toContain('aria-label="Mobile workspace navigation"');
    expect(dashboardSource).toContain("setSidebarCollapsed");
    expect(dashboardSource).toContain("sidebarHiddenFromAssistiveTech");
    expect(dashboardSource).toContain("getNavigationGroups");
    expect(dashboardSource).toContain("visibleModules.filter");
  });

  it("applies the dark operational rail treatment only through scoped dashboard selectors", () => {
    expect(stylesheet).toContain(".dashboard-sidebar {");
    expect(stylesheet).toContain("linear-gradient(180deg, #062a2d");
    expect(stylesheet).toContain('.dashboard-sidebar .dashboard-flat-navigation button[aria-current="page"]');
    expect(stylesheet).toContain(".dashboard-reference-layout");
    expect(stylesheet).toContain("@media (max-width: 1023px)");
  });

  it("does not reintroduce a client-side hardcoded company scope", () => {
    expect(dashboardSource).toContain("There is deliberately no ACTIVE_COMPANY_ID constant");
    expect(dashboardSource).not.toMatch(/const\s+ACTIVE_COMPANY_ID\s*=/);
  });
});

export {};
