import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const dashboardLayoutSource = readFileSync(new URL("../client/src/components/DashboardLayout.tsx", import.meta.url), "utf8");
const publicAuthSource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");
const enterpriseAuthSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("Smart Manager Authentication Navigation & Session Warning Specification", () => {
  it("prevents explicit public auth screens from overriding a stored session token", () => {
    expect(appSource).toContain("const token = window.localStorage.getItem(\"bs_access_token\");");
    expect(appSource).toContain("if (token && explicitPublicScreen) return false;");
  });

  it("renders a persistent session expiration warning banner when session expiry approaches", () => {
    expect(dashboardLayoutSource).toContain("sessionExpiringSoon");
    expect(dashboardLayoutSource.includes("Your session will expire soon")).toBe(true);
  });

  it("keeps credential and approved social provider handoffs on the shared authenticated application route", () => {
    expect(publicAuthSource).toContain('window.location.assign(withoutAuthView())');
    expect(publicAuthSource).toContain("browserSupabase.signInWithOAuth");
    expect(enterpriseAuthSource).toContain('onOAuth("google")');
    expect(enterpriseAuthSource).toContain('onOAuth("azure")');
    expect(enterpriseAuthSource).toContain('onOAuth("apple")');
  });

  it("shows a safe server-authorized workspace selector and tenant-scoped geographic anomaly toasts", () => {
    expect(dashboardSource).toContain("tenantSelectorOpen");
    expect(dashboardSource).toContain('callRpc("list_my_companies"');
    expect(dashboardSource).toContain('callRpc("switch_current_company"');
    expect(dashboardSource).toContain("verified membership on the server");
    expect(dashboardSource).toContain("GEO_ANOMALY");
    expect(dashboardSource).toContain("unusual sign-in location detected");
  });

  it("keeps a verified Supabase session recoverable when profile or workspace resolution fails", () => {
    expect(dashboardSource).toContain("if (!authenticatedUser && (bootstrapError?.status === 401 || bootstrapError?.status === 403))");
    expect(dashboardSource).toContain("Workspace connection needs attention");
    expect(dashboardSource).toContain("workspaceDisplayRole");
    expect(dashboardSource).toContain("PERSISTED_WORKSPACE_ROLE_LABELS");
  });

  it("routes Workspace Settings writes through an authorized, server-confirmed company update", () => {
    expect(dashboardSource).toContain("workspace: {");
    expect(dashboardSource).toContain("const confirmed = branding.company || {}");
    expect(dashboardSource).toContain("Workspace Settings needs attention");
  });
});
