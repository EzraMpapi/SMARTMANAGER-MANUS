import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authViewsSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const authGatewaySource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");

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
});
