import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ecosystem = readFileSync(new URL("../client/src/components/LoginModuleEcosystem.jsx", import.meta.url), "utf8");
const authView = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("login module ecosystem", () => {
  it("uses a representative selection of real Smart Manager modules rather than invented features", () => {
    ["dashboard", "pos", "sales", "inventory", "finance", "crm", "hr", "reports", "ai"].forEach((moduleId) => expect(ecosystem).toContain(`id: \"${moduleId}\"`));
    expect(ecosystem).toContain("Point of Sale");
    expect(ecosystem).toContain("AI Assistant");
  });

  it("renders decorative desktop and mobile compositions without changing authentication callbacks", () => {
    expect(authView).toContain('<LoginModuleEcosystem variant="desktop" />');
    expect(authView).toContain('<LoginModuleEcosystem variant="mobile" />');
    expect(ecosystem).toContain('aria-hidden="true"');
    expect(ecosystem).not.toContain("onClick");
  });

  it("uses CSS transform motion with a reduced-motion fallback instead of canvas or runtime animation loops", () => {
    expect(styles).toContain(".sm-auth-ecosystem");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain(".sm-auth-module");
    expect(ecosystem).not.toContain("requestAnimationFrame");
    expect(ecosystem).not.toContain("<canvas");
  });

  it("keeps the scene decorative for assistive technology and disables interaction motion when requested", () => {
    expect(ecosystem).toContain('aria-hidden="true"');
    expect(styles).toContain("pointer-events: none;");
    expect(styles).toContain("transition: none !important;");
  });
});
