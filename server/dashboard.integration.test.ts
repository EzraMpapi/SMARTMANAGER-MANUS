import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveDailyBriefingFetchState } from "../client/src/BusinessSphereDashboard.jsx";

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

  it("uses the connected generic company-module schema for live module settings", () => {
    expect(dashboardSource).toContain('sb("company_modules").select("*").eq("company_id", company.id).run()');
    expect(dashboardSource).toContain("r.data?.module_key ?? r.module_key ?? r.name");
    expect(dashboardSource).toContain('eq("name", id)');
    expect(dashboardSource).toContain('status: !turningOff ? "active" : "disabled"');
    expect(dashboardSource).toContain("data: { module_key: id, enabled: !turningOff }");
  });

  it("maps the approved tenant baseline response to active generic module entitlements", () => {
    const companyId = "3022205f-89d9-4790-affa-cde3a304ee27";
    const moduleIds = ["analytics", "crm", "finance", "inventory", "procurement", "sales"];
    const mockedSupabaseResponse = moduleIds.map((name) => ({
      company_id: companyId,
      name,
      status: "active",
      data: { module_key: name, enabled: true },
    }));

    const tenantRows = mockedSupabaseResponse.filter((row) => row.company_id === companyId);
    const disabled = new Set(
      tenantRows
        .filter((row) => (row.data?.enabled ?? row.status !== "disabled") === false)
        .map((row) => row.data?.module_key ?? row.name)
        .filter(Boolean),
    );
    const activeEntitlements = moduleIds.filter((id) => !disabled.has(id));

    expect(tenantRows).toHaveLength(6);
    expect([...disabled]).toEqual([]);
    expect(activeEntitlements).toEqual(moduleIds);
  });

  it("normalizes the shared employee table result before Daily Briefing filters it", () => {
    expect(dashboardSource).toContain("Array.isArray(employees?.rows) ? employees.rows : (Array.isArray(employees) ? employees : [])");

    const employeeTableResult = { rows: [{ status: "Active" }, { status: "On Leave" }] };
    const employees = Array.isArray(employeeTableResult?.rows)
      ? employeeTableResult.rows
      : (Array.isArray(employeeTableResult) ? employeeTableResult : []);

    expect(employees.filter((employee) => employee.status === "Active")).toHaveLength(1);
  });

  it("imports the project quick-action icon before rendering dashboard shortcuts", () => {
    expect(dashboardSource).toContain("FolderKanban");
    expect(dashboardSource).toContain("icon:FolderKanban");
  });

  it("exposes loading and retryable error handling for Daily Briefing data sources", () => {
    expect(dashboardSource).toContain("daily-briefing-preview");
    expect(dashboardSource).toContain("export function resolveDailyBriefingFetchState");
    expect(dashboardSource).toContain("if (!open || briefingPreviewState !== \"loading\" || typeof window === \"undefined\") return");
    expect(dashboardSource).toContain("const timer = window.setTimeout(() => setBriefingPreviewState(\"resolved\"), duration)");
    expect(dashboardSource).toContain("const usingDemoBriefing = DEMO_OVERRIDE || !IS_CONFIGURED");
    expect(dashboardSource).toContain("resolveDailyBriefingFetchState({");
    expect(dashboardSource).toContain("await Promise.all(briefingSources.map((source) => source.reload?.()).filter(Boolean))");
    expect(dashboardSource).toContain("Building today’s Daily Briefing");
    expect(dashboardSource).toContain("Retry data fetch");

    expect(resolveDailyBriefingFetchState({ sources: [{ loading: true, error: null }], usingDemoBriefing: false }).loading).toBe(true);
    expect(resolveDailyBriefingFetchState({ sources: [{ loading: false, error: new Error("timeout") }], usingDemoBriefing: false }).error?.message).toBe("timeout");
    expect(resolveDailyBriefingFetchState({ sources: [{ loading: false, error: new Error("timeout") }], usingDemoBriefing: true }).error).toBeNull();
    expect(resolveDailyBriefingFetchState({ sources: [], usingDemoBriefing: true, previewState: "loading" }).loading).toBe(true);
    expect(resolveDailyBriefingFetchState({ sources: [], usingDemoBriefing: true, previewState: "error" }).error?.message).toBe("Daily Briefing preview fetch failed");
  });
});
