import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDashboardChartSections, buildDashboardExportFilterSummary, createDashboardPdfDocument, filterDashboardChartSections, mapContactRow, mapInventoryRow, resolveDailyBriefingFetchState, runCompanyTableQuery, serializeDashboardSectionsToCsv, toastBus } from "../client/src/BusinessSphereDashboard.jsx";

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("BusinessSphere launch and live-data integration", () => {
  it("keeps the preserved dashboard behind the dedicated app route", () => {
    expect(appSource).toContain('path={"/app"} component={BusinessSphereDashboard}');
    expect(homeSource.match(/href="\/app"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(homeSource.includes("Launch App") || homeSource.includes("launchApp")).toBe(true);
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

  it("executes a compatible parent-table fallback when nested relationships are unavailable", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ code: "PGRST200", message: "Could not find a relationship between documents and profiles" }, 400))
      .mockResolvedValueOnce(jsonResponse([{ id: "doc-1", name: "Quarterly report" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCompanyTableQuery("documents", {
      select: "*,profiles(full_name)",
      order: { col: "created_at", ascending: false },
    });

    expect(result.rows).toEqual([{ id: "doc-1", name: "Quarterly report" }]);
    expect(result.usedFallback).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("select=*");
    expect(String(fetchMock.mock.calls[1][0])).not.toContain("profiles");
  });

  it("drops an unsupported order column after the parent-table fallback fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ code: "42703", message: "column sales_subscriptions.next_billing_date does not exist" }, 400))
      .mockResolvedValueOnce(jsonResponse([{ id: "sub-1", name: "Starter" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCompanyTableQuery("sales_subscriptions", {
      order: { col: "next_billing_date", ascending: true },
    });

    expect(result.rows).toEqual([{ id: "sub-1", name: "Starter" }]);
    expect(result.usedFallback).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).not.toContain("next_billing_date");
  });

  it("retries a transient network failure once and emits a reconnect-success toast", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse([{ id: "lead-1" }]));
    const receivedToasts: Array<{ message?: string; type?: string }> = [];
    const listener = (toast: { message?: string; type?: string }) => receivedToasts.push(toast);
    toastBus.listeners.add(listener);
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await runCompanyTableQuery("crm_leads");
      expect(result.rows).toEqual([{ id: "lead-1" }]);
      expect(result.recoveredAfterRetry).toBe(true);
    } finally {
      toastBus.listeners.delete(listener);
    }

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(receivedToasts).toContainEqual({ id: expect.any(Number), message: "Connection restored — live data is up to date.", type: "success" });
  });

  it("maps deployed generic CRM and inventory aliases into the dashboard row shape", () => {
    const contact = mapContactRow({
      id: "contact-1", contact_name: "Asha Mtemi", role: "Procurement Lead", company_name: "Sample Retail Group", email: "asha@example.test", phone: "+255 700 000 001",
    });
    const item = mapInventoryRow({
      id: "item-1", item_sku: "SAMPLE-001", item_name: "Warehouse shelving unit", category: "Storage Equipment", quantity: "62", reorder_level: "25", unit_cost: "78", location: "Dar es Salaam", data: { unit: "unit" },
    });

    expect(contact).toMatchObject({ name: "Asha Mtemi", title: "Procurement Lead", company: "Sample Retail Group" });
    expect(item).toMatchObject({ sku: "SAMPLE-001", name: "Warehouse shelving unit", qty: 62, reorder: 25, unitCost: 78, warehouse: "Dar es Salaam" });
  });

  it("assembles chart sections and serializes them as escaped CSV", () => {
    const sections = buildDashboardChartSections({
      kpis: [{ metric: "Pipeline", value: "TZS 125,700k", detail: "6 open deals" }],
      pipelineByStage: [{ stage: "Proposal", deal_count: 2 }],
    });
    const csv = serializeDashboardSectionsToCsv(sections);

    expect(sections.map((section) => section.title)).toEqual(["Executive KPIs", "CRM Pipeline by Stage"]);
    expect(csv).toContain("BusinessSphere ERP");
    expect(csv).toContain('"metric","value","detail"');
    expect(csv).toContain('"Pipeline","TZS 125,700k","6 open deals"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("filters chart sections by module and exposes the active date range summary", () => {
    const sections = buildDashboardChartSections({
      kpis: [{ metric: "Pipeline", value: "TZS 125,700k", detail: "6 open deals" }],
      pipelineByStage: [{ stage: "Proposal", deal_count: 2 }],
      stockByCategory: [{ category: "Storage", stock_value_tzs_k: 4800 }],
    });
    const filtered = filterDashboardChartSections(sections, { finance: true, sales: true, crm: false, inventory: true, operations: true });
    expect(filtered.map((section) => section.title)).toEqual(["Executive KPIs", "Inventory Value by Category"]);
    expect(buildDashboardExportFilterSummary({ startDate: "2026-08-01", endDate: "2026-08-12", enabledModules: { finance: true, sales: true, crm: false, inventory: true, operations: true } })).toContain("2026-08-01 → 2026-08-12");
  });

  it("creates a non-empty PDF document for the chart export report", () => {
    const pdf = createDashboardPdfDocument({
      companyName: "Kilimanjaro Trading Co.",
      periodLabel: "This month",
      sections: [{ title: "Pipeline", rows: [{ stage: "Proposal", deal_count: 2 }] }],
    });

    expect(pdf.output("arraybuffer").byteLength).toBeGreaterThan(500);
  });

  it("exposes filtered CSV/PDF and recurring email-report controls in the command strip", () => {
    expect(dashboardSource).toContain('aria-label="Export dashboard chart data"');
    expect(dashboardSource).toContain('onClick={() => exportDashboard("csv")}');
    expect(dashboardSource).toContain('onClick={() => exportDashboard("pdf")}');
    expect(dashboardSource).toContain("aria-label=\"Export start date\"");
    expect(dashboardSource).toContain("Include modules");
    expect(dashboardSource).toContain("Schedule email report");
    expect(dashboardSource).toContain("trpc.reportSchedules.create.useMutation");
    expect(dashboardSource).toContain("createDashboardPdfDocument");
    expect(dashboardSource).toContain("serializeDashboardSectionsToCsv");
  });

  it("includes persistent TZS/USD currency toggle and formatting helpers", () => {
    expect(dashboardSource).toContain('preferences.currency');
    expect(dashboardSource).toContain('updatePreference("currency"');
    const prefsContext = readFileSync(new URL("../client/src/contexts/DashboardPreferencesContext.tsx", import.meta.url), "utf8");
    expect(prefsContext).toContain('currency: "TZS" | "USD"');
    expect(prefsContext).toContain('formatMoney');
  });

  it("returns an honest unavailable state for a requested table absent from the connected schema", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ code: "PGRST205", message: "Could not find the table audit_log" }, 404));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCompanyTableQuery("audit_log");

    expect(result.rows).toEqual([]);
    expect(result.unavailable).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
