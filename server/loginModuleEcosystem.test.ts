import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getLoginModulesForIndustry } from "../client/src/components/LoginModuleEcosystem.jsx";

const ecosystem = readFileSync(new URL("../client/src/components/LoginModuleEcosystem.jsx", import.meta.url), "utf8");
const authView = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("login module ecosystem", () => {
  it("uses a representative selection of real Smart Manager modules rather than invented features", () => {
    ["dashboard", "pos", "sales", "inventory", "finance", "crm", "hr", "reports", "ai"].forEach((moduleId) => expect(ecosystem).toContain(`id: \"${moduleId}\"`));
    expect(ecosystem).toContain("Point of Sale");
    expect(ecosystem).toContain("AI Assistant");
  });

  it("tailors the constellation to real industry modules and supplies Kiswahili tooltip labels", () => {
    expect(getLoginModulesForIndustry("retail").map((module) => module.id)).toContain("pos");
    expect(getLoginModulesForIndustry("manufacturing").map((module) => module.id)).toContain("manufacturing");
    expect(getLoginModulesForIndustry("healthcare").map((module) => module.id)).toContain("healthcare");
    expect(ecosystem).toContain("Dashibodi");
    expect(ecosystem).toContain("Msaidizi wa Akili Bandia");
  });

  it("renders decorative desktop and mobile compositions without changing authentication callbacks", () => {
    expect(authView).toContain('<LoginModuleEcosystem variant="desktop" industry={industry} />');
    expect(authView).toContain('<LoginModuleEcosystem variant="mobile" industry={industry} />');
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
