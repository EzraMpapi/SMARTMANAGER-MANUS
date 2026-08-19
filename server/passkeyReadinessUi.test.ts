import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const authViews = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const workspaceSettings = readFileSync(new URL("./workspaceSettings.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const notificationService = readFileSync(new URL("./passkeyRegistrationNotification.ts", import.meta.url), "utf8");

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
    expect(dashboard).toContain("passkeyNotificationMutation.mutateAsync");
  });

  it("previews and applies organization logo crops before workspace branding save", () => {
    expect(dashboard).toContain("Adjust logo crop");
    expect(dashboard).toContain('aria-label="Logo crop preview"');
    expect(dashboard).toContain("canvas.toDataURL(\"image/png\")");
    expect(dashboard).toContain("Apply crop");
  });

  it("exposes a bounded tenant timeout slider and uses the persisted value at the app root", () => {
    expect(dashboard).toContain("Tenant security & auth branding");
    expect(dashboard).toContain('aria-label="Tenant-wide administrative inactivity timeout in minutes"');
    expect(dashboard).toContain("tenantSettingsQuery");
    expect(dashboard).toContain("tenantIdleTimeoutMinutes * 60 * 1000");
    expect(workspaceSettings).toContain("MIN_IDLE_TIMEOUT_MINUTES = 5");
    expect(workspaceSettings).toContain("MAX_IDLE_TIMEOUT_MINUTES = 120");
    expect(router).toContain("idleTimeoutMinutes: z.number().int().min(5).max(120).optional()");
  });

  it("supports tenant-scoped login and onboarding background images with storage-backed persistence", () => {
    expect(dashboard).toContain("loginBackground");
    expect(dashboard).toContain("onboardingBackground");
    expect(dashboard).toContain("writeAuthBranding(confirmedDraft)");
    expect(authViews).toContain("readAuthBranding");
    expect(authViews).toContain("authSurface = \"login\"");
    expect(workspaceSettings).toContain("auth-login-background");
    expect(workspaceSettings).toContain("auth-onboarding-background");
  });

  it("dispatches the administrator passkey email through a protected server boundary", () => {
    expect(router).toContain("passkeySecurity: router");
    expect(router).toContain("notifyRegistered");
    expect(notificationService).toContain("resolveVerifiedProfile");
    expect(notificationService).toContain("RESEND_API_KEY");
    expect(notificationService).toContain("administrator.passkey.registered");
    expect(notificationService).toContain("delivery-not-configured");
  });

  it("warns only eligible administrative sessions before inactivity sign-out with an explicit countdown", () => {
    expect(dashboard).toContain("const isAdministrativeSession = Boolean");
    expect(dashboard).toContain("const IDLE_TIMEOUT_MS = tenantIdleTimeoutMinutes * 60 * 1000");
    expect(dashboard).toContain("IDLE_WARNING_MS");
    expect(dashboard).toContain("Your session is about to expire");
    expect(dashboard).toContain("Stay signed in");
    expect(dashboard).toContain("Automatic sign-out in");
  });
});
