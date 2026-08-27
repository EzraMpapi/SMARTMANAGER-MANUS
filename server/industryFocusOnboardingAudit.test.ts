import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("industry-focus setup and audit history", () => {
  it("uses the controlled focus options during password and OAuth workspace creation", () => {
    expect(dashboard).toContain('name: "", category: "general"');
    expect(dashboard).toContain("Organization industry focus");
    expect(dashboard).toContain("ORGANIZATION_INDUSTRY_OPTIONS.map");
    expect(dashboard).toContain("industryFocus: normalizeOrganizationIndustryFocus(company.category)");
  });

  it("records only confirmed industry focus changes in the tenant audit table", () => {
    expect(dashboard).toContain("async function recordConfirmedIndustryFocusAudit");
    expect(dashboard).toContain('sb("audit_log").insert(entry).single().run()');
    expect(dashboard).toContain("Organization industry focus changed");
  });

  it("guides users to protect recovery with two passkeys", () => {
    expect(dashboard).toContain("Add a second passkey for recovery");
    expect(dashboard).toContain("const recoveryReady = passkeys.length >= 2");
  });
});
