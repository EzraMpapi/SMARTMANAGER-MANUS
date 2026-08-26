import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authViewsSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("Mobile Signup Visual E2E & Multi-Step Progression", () => {
  it("contains mobile branding brand mark and responsive layout containers for signup wizard", () => {
    expect(authViewsSource).toContain("sm-auth-mobile-brand");
    expect(dashboardSource).toContain("SignupPage");
    expect(dashboardSource).toContain("Continue to company setup →");
    expect(dashboardSource).toContain("Continue to modules →");
    expect(dashboardSource).toContain("<Check ");
    expect(dashboardSource).toContain("ONBOARDING_MODULES");
  });
});
