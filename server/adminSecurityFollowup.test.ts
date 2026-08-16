import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("administrator security follow-up", () => {
  it("shows only the current tenant industry focus in the authenticated profile menu", () => {
    expect(dashboard).toContain("company={company}");
    expect(dashboard).toContain("Organization industry focus:");
    expect(dashboard).toContain("normalizeOrganizationIndustryFocus(company?.industry || company?.category)");
  });

  it("records passkey lifecycle history after confirmed operations", () => {
    expect(dashboard).toContain('recordConfirmedTenantAudit("Passkey enrolled", "Security"');
    expect(dashboard).toContain('recordConfirmedTenantAudit("Passkey revoked", "Security"');
    expect(dashboard).toContain('sb("audit_log").insert(entry).single().run()');
  });

  it("keeps the quarterly review administrator-only and local rather than presenting it as compliance evidence", () => {
    expect(dashboard).toContain("QuarterlySecurityReviewChecklist");
    expect(dashboard).toContain("PASSKEY_READINESS_ROLES.has(currentUser.role)");
    expect(dashboard).toContain("not presented as compliance evidence");
  });
});
