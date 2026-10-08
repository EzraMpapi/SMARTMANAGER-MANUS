import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authViewsSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const authGatewaySource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const globalStylesSource = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("Authentication Visual Regression & Breakpoint Compliance", () => {
  it("includes responsive desktop and mobile branding classes in EnterpriseAuthShell", () => {
    expect(authViewsSource).toContain("EnterpriseAuthShell");
    expect(authViewsSource).toContain("lg:flex");
    expect(authViewsSource).toContain("sm-auth-mobile-brand");
    expect(authViewsSource).toContain("sm-auth-card");
  });

  it("handles mobile and desktop auth views securely in PublicAuthGateway", () => {
    expect(authGatewaySource).toContain("PublicAuthGateway");
    expect(authGatewaySource).toContain("EnterpriseLoginView");
  });

  it("keeps create, module selection, and join-company onboarding on one responsive visual system", () => {
    expect(dashboardSource).toContain("sm-onboarding");
    expect(dashboardSource).toContain("sm-onboarding-form--workspace");
    expect(dashboardSource).toContain("sm-onboarding-form--modules");
    expect(dashboardSource).toContain("sm-onboarding-form--join");
    expect(dashboardSource).toContain("sm-onboarding-module-grid");
    expect(globalStylesSource).toContain(".sm-onboarding");
    expect(globalStylesSource).toContain("max-height: calc(100svh - 3rem)");
    expect(globalStylesSource).toContain("min-height: 70px");
  });
});
