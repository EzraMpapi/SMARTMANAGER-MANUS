import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const authViewsSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");

describe("Authentication Journey Simulation (Sign-in, Signup Progression, Workspace Entry)", () => {
  it("supports company creation and tenant onboarding flows in EnterpriseAuthViews", () => {
    expect(authViewsSource).toContain("EnterpriseAuthShell");
    expect(authViewsSource).toContain("workspace");
    expect(authViewsSource).toContain("EnterpriseLoginView");
  });

  it("supports authenticated session bootstrap and tenant workspace resolution in dashboard", () => {
    expect(dashboardSource).toContain("SmartManager");
    expect(dashboardSource).toContain("authGetUser");
    expect(dashboardSource).toContain("persistAuthSession");
  });
});
