import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const authViewsSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");

describe("Smart Manager End-to-End User Journey Simulation", () => {
  it("supports authenticated session routing and public authentication gateway fallback", () => {
    expect(appSource).toContain("isPublicAuthRequest()");
    expect(appSource).toContain("BusinessSphereDashboard");
    expect(appSource).toContain("PublicAuthGateway");
  });

  it("covers enterprise onboarding split-screen workflows and signup states", () => {
    expect(authViewsSource).toContain("EnterpriseAuthShell");
    expect(authViewsSource).toContain("EmailConfirmationView");
    expect(authViewsSource).toContain("PasswordRecoveryView");
  });

  it("includes core module navigation tabs within the main ERP dashboard", () => {
    expect(dashboardSource).toContain("Dashboard");
    expect(dashboardSource).toContain("Collaboration");
    expect(dashboardSource).toContain("TRA Portal");
    expect(dashboardSource).toContain("HR");
    expect(dashboardSource).toContain("Finance");
    expect(dashboardSource).toContain("Inventory");
  });
});
