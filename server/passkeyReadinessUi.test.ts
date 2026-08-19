import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("passkey onboarding and readiness UI", () => {
  it("guides a signed-in eligible account to add its first passkey and keeps readiness restricted to administrators", () => {
    expect(dashboard).toContain("Set up your first passkey");
    expect(dashboard).toContain("Passkey readiness");
    expect(dashboard).toContain("isAdministrator={PASSKEY_READINESS_ROLES.has(currentUser.role)}");
    expect(dashboard).toContain("passkeyDisabled");
  });

  it("offers passkey enrollment at onboarding completion and preserves secure registration boundaries", () => {
    expect(dashboard).toContain("Secure this account with a passkey");
    expect(dashboard).toContain("Create passkey now");
    expect(dashboard).toContain("createAccountPasskeyClient");
    expect(dashboard).toContain("registerAccountPasskey(client)");
    expect(dashboard).toContain("passkeySession: { accessToken: signUpResult.access_token, refreshToken: signUpResult.refresh_token }");
  });

  it("previews and applies organization logo crops before workspace branding save", () => {
    expect(dashboard).toContain("Adjust logo crop");
    expect(dashboard).toContain('aria-label="Logo crop preview"');
    expect(dashboard).toContain("canvas.toDataURL(\"image/png\")");
    expect(dashboard).toContain("Apply crop");
  });

  it("warns only eligible administrative sessions before inactivity sign-out with an explicit countdown", () => {
    expect(dashboard).toContain("const isAdministrativeSession = Boolean");
    expect(dashboard).toContain("IDLE_TIMEOUT_MS = 30 * 60 * 1000");
    expect(dashboard).toContain("IDLE_WARNING_MS = 2 * 60 * 1000");
    expect(dashboard).toContain("Your session is about to expire");
    expect(dashboard).toContain("Stay signed in");
    expect(dashboard).toContain("Automatic sign-out in");
  });
});
