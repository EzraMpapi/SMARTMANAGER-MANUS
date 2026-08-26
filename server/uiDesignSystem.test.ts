import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(repositoryRoot, "client/src/index.css"), "utf8");
const button = fs.readFileSync(path.join(repositoryRoot, "client/src/components/ui/button.tsx"), "utf8");
const enterpriseLayout = fs.readFileSync(path.join(repositoryRoot, "client/src/components/EnterpriseLayout.tsx"), "utf8");
const shell = fs.readFileSync(path.join(repositoryRoot, "client/src/BusinessSphereDashboard.jsx"), "utf8");
const designSystem = fs.readFileSync(path.join(repositoryRoot, "docs/smart-manager-design-system.md"), "utf8");
const transformationAudit = fs.readFileSync(path.join(repositoryRoot, "docs/smart-manager-ui-ux-transformation-audit-20260826.md"), "utf8");

describe("SMART MANAGER UI/UX transformation contract", () => {
  it("defines the canonical semantic design tokens and accessible focus contract", () => {
    for (const token of [
      "--sm-brand",
      "--sm-brand-strong",
      "--sm-emerald",
      "--sm-gold",
      "--sm-ink",
      "--sm-canvas",
      "--sm-surface",
      "--sm-success",
      "--sm-warning",
      "--sm-danger",
      "--sm-info",
      "--sm-focus",
      "--sm-control-min",
    ]) {
      expect(css, token).toContain(token);
    }
    expect(css).toContain(':where(button, a, input, select, textarea, [tabindex]:not([tabindex="-1"]))');
    expect(css).toContain("outline: 2px solid var(--sm-focus)");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("defines a complete semantic button variant and state foundation", () => {
    for (const variant of ["success", "warning", "tertiary", "icon"]) {
      expect(button, variant).toContain(`${variant}:`);
    }
    expect(button).toContain("active:scale-[0.98]");
    expect(button).toContain("aria-busy:cursor-wait");
    expect(button).toContain("disabled:cursor-not-allowed");
    expect(button).toContain("min-h-9");
  });

  it("uses shared page and control contracts in enterprise layout helpers", () => {
    expect(enterpriseLayout).toContain("sm-page-header");
    expect(enterpriseLayout).toContain("sm-panel");
    expect(enterpriseLayout).toContain("sm-control");
    expect(enterpriseLayout).toContain('role="tablist"');
    expect(enterpriseLayout).toContain('aria-selected={isActive}');
  });

  it("keeps the authenticated shell accessible and context-preserving", () => {
    expect(shell).toContain('aria-label="Open workspace settings"');
    expect(shell).toContain('aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}');
    expect(shell).toContain("aria-pressed={darkMode}");
    expect(shell).toContain('className="sm-page dashboard-main dashboard-mobile-content');
    expect(shell).toContain('aria-label="Operational workspaces"');
    expect(shell).toContain('aria-current={isActive ? "page" : undefined}');
    expect(shell).toContain('smart-manager:recent-searches');
    expect(shell).toContain('role="listbox"');
    expect(shell).toContain('aria-activedescendant');
    expect(shell).toContain('Recent searches');
  });

  it("documents the full mandate and its non-negotiable safety boundaries", () => {
    for (const heading of [
      "## Tokens",
      "## Typography",
      "## Spacing and layout",
      "## Component contracts",
      "## Responsive rules",
      "## Accessibility contract",
      "## Localization and Tanzania-first behavior",
    ]) {
      expect(designSystem, heading).toContain(heading);
    }
    expect(transformationAudit).toContain("## 1. Audit method and actual application surface");
    expect(transformationAudit).toContain("## 3. Mandate-to-repository gap matrix");
    expect(transformationAudit).toContain("## 5. Non-negotiable safety gates");
    expect(transformationAudit).toContain("duplicate table creation is prohibited");
  });
});
