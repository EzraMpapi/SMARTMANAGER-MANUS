import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("BusinessSphere launch and live-data integration", () => {
  it("keeps the preserved dashboard behind the dedicated app route", () => {
    expect(appSource).toContain('path={"/app"} component={BusinessSphereDashboard}');
    expect(homeSource.match(/href="\/app"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(homeSource).toContain("Launch App");
  });

  it("uses managed browser-safe Supabase variables instead of a hardcoded project", () => {
    expect(dashboardSource).toContain("import.meta.env.VITE_SUPABASE_URL");
    expect(dashboardSource).toContain("import.meta.env.VITE_SUPABASE_ANON_KEY");
    expect(dashboardSource).not.toContain("bqrpiookucsdjvcvjrul.supabase.co");
  });

  it("keeps reload-session and provider-specific OAuth routes in the dashboard", () => {
    expect(dashboardSource).toContain('window.localStorage.getItem("bs_access_token")');
    expect(dashboardSource).toContain("authGetUser(token)");
    expect(dashboardSource).toContain('authSignInWithOAuth("google")');
    expect(dashboardSource).toContain('authSignInWithOAuth("azure")');
    expect(dashboardSource).toContain('authSignInWithOAuth("apple")');
    expect(dashboardSource).toContain("/auth/v1/authorize?provider=${provider}");
  });
});
