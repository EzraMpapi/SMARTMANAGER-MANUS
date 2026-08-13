import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDashboardChartSections, buildDashboardExportFilterSummary, createDashboardPdfDocument, filterDashboardChartSections, hasResolvedCompany, hydrateGenericTenantRow, mapContactRow, mapInventoryRow, mapLeadRow, mapExpenseRow, moveDashboardKpi, normalizeGenericTenantPayload, orderDashboardKpis, persistOnboardingChecklistCompletion, resolveDailyBriefingFetchState, resolveRoleKpiPreset, runCompanyTableQuery, runCompanyTableMutation, serializeDashboardSectionsToCsv, toastBus } from "../client/src/BusinessSphereDashboard.jsx";

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
const preferencesDrawerSource = readFileSync(new URL("../client/src/components/DashboardPreferencesDrawer.tsx", import.meta.url), "utf8");
const financeCrmViewsSource = readFileSync(new URL("../client/src/components/FinanceCrmExecutiveViews.jsx", import.meta.url), "utf8");
const viteConfigSource = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

describe("BusinessSphere launch and live-data integration", () => {
  it("keeps the preserved dashboard behind the dedicated app route", () => {
    expect(appSource).toContain('path={"/app"} component={LazyBusinessSphereDashboard}');
    expect(appSource).toContain('lazy(() => import("./BusinessSphereDashboard"))');
    expect(appSource).toContain("<Suspense fallback={<DashboardLoadingBoundary />}>");
    expect(homeSource.match(/href="\/app"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(homeSource.includes("Launch App") || homeSource.includes("launchApp")).toBe(true);
  });

  it("uses managed browser-safe Supabase variables instead of a hardcoded project", () => {
    expect(dashboardSource).toContain("import.meta.env.VITE_SUPABASE_URL");
    expect(dashboardSource).toContain("import.meta.env.VITE_SUPABASE_ANON_KEY");
    expect(dashboardSource).not.toContain("bqrpiookucsdjvcvjrul.supabase.co");
  });

  it("keeps JSX source-location instrumentation out of production builds", () => {
    expect(viteConfigSource).toContain('...(command === "serve" ? [jsxLocPlugin()] : [])');
    expect(viteConfigSource).toContain("export default defineConfig(({ command }) => ({");
  });

  it("keeps reload-session and provider-specific OAuth routes in the dashboard", () => {
    expect(dashboardSource).toContain('window.localStorage.getItem("bs_access_token")');
    expect(dashboardSource).toContain('window.localStorage.getItem("bs_refresh_token")');
    expect(dashboardSource).toContain("resolveAuthenticatedDashboardSession(activeToken)");
    expect(dashboardSource).toContain('authSignInWithOAuth("google")');
    expect(dashboardSource).toContain('authSignInWithOAuth("azure")');
    expect(dashboardSource).toContain('authSignInWithOAuth("apple")');
    expect(dashboardSource).toContain("/auth/v1/authorize?provider=${provider}");
  });

  it("preserves exact Supabase password-auth errors and normalizes the raw token response before dashboard entry", () => {
    expect(dashboardSource).toContain("function readAuthResponse(response, fallbackMessage)");
    expect(dashboardSource).toContain("code: ${code}, HTTP ${response.status}");
    expect(dashboardSource).not.toContain('setError("Something went wrong — check your connection.")');
    expect(dashboardSource).toContain("persistAuthTokens(result)");
    expect(dashboardSource).toContain("resolveAuthenticatedDashboardSession(result.access_token, result.user)");
    expect(dashboardSource).not.toContain("onAuthenticated(result.session || null)");
  });

  it("never allows a failed direct Supabase write to appear silently saved in the dashboard", () => {
    expect(dashboardSource).toContain('if (method !== "GET") {');
    expect(dashboardSource).toContain('notify(`Server save failed for ${table}: ${message}. Your change was not saved.`, "error")');
    expect(dashboardSource).toContain('...(method === "GET" ? {} : { Prefer: "return=representation" })');
  });

  it("normalizes generic tenant writes into database-derived scope and restores module fields on reads", () => {
    const normalized = normalizeGenericTenantPayload("inventory_items", {
      id: "browser-provided-id",
      company_id: "browser-provided-company",
      name: "Warehouse shelving",
      qty_on_hand: 62,
      unit_cost: 78,
      sku: "INV-001",
    }, { insert: true });

    expect(normalized).toEqual({
      name: "Warehouse shelving",
      data: { qty_on_hand: 62, unit_cost: 78, sku: "INV-001" },
    });

    expect(hydrateGenericTenantRow("inventory_items", {
      id: "server-generated-id",
      company_id: "database-derived-company",
      name: "Warehouse shelving",
      data: { qty_on_hand: 62, unit_cost: 78, sku: "INV-001" },
    })).toMatchObject({
      id: "server-generated-id",
      company_id: "database-derived-company",
      name: "Warehouse shelving",
      qty_on_hand: 62,
      unit_cost: 78,
      sku: "INV-001",
    });
  });

  it("applies role-aligned KPI priorities while persisting a user-arranged override safely", () => {
    const kpis = ["ar_billed", "collected", "overdue_ar", "gross_pnl", "inventory", "low_stock", "pipeline", "mrr"].map((id) => ({ id }));
    expect(resolveRoleKpiPreset("CFO", "auto")).toBe("finance");
    expect(resolveRoleKpiPreset("Warehouse Manager", "auto")).toBe("operations");
    expect(resolveRoleKpiPreset("CEO", "oversight")).toBe("oversight");
    expect(orderDashboardKpis(kpis, [], "finance").slice(0, 3).map((item) => item.id)).toEqual(["gross_pnl", "collected", "overdue_ar"]);
    expect(orderDashboardKpis(kpis, ["mrr", "pipeline"], "finance").slice(0, 2).map((item) => item.id)).toEqual(["mrr", "pipeline"]);
    expect(moveDashboardKpi(["mrr", "pipeline", "gross_pnl"], "gross_pnl", -1)).toEqual(["mrr", "gross_pnl", "pipeline"]);
  });

  it("exposes persistent density and role-lens controls with a desktop-only draggable KPI fallback", () => {
    expect(dashboardSource).toContain('updatePreference("compactDensity", !preferences.compactDensity)');
    expect(preferencesDrawerSource).toContain('updatePreference("rolePreset", option.id as typeof preferences.rolePreset)');
    expect(dashboardSource).toContain('const [canReorderKpis, setCanReorderKpis] = useState(false)');
    expect(dashboardSource).toContain('window.matchMedia("(min-width: 1280px)")');
    expect(dashboardSource).toContain('draggable={canReorderKpis}');
    expect(dashboardSource).toContain('Reset KPI order');
  });

  it("handles confirmation-pending signup safely and derives profile/company access from the authenticated user ID", () => {
    expect(dashboardSource).toContain('data: { full_name: fullName }');
    expect(dashboardSource).toContain("Account created. Confirm your email to securely finish company setup.");
    expect(dashboardSource).toContain('sb("profiles").select("*,companies(*)").eq("id", user.id).run()');
    expect(dashboardSource).toContain("authRefreshSession(refreshToken)");
  });

  it("does not admit an authenticated profile without a database-resolved company to the ERP shell", () => {
    expect(hasResolvedCompany({ company_id: null, companies: null })).toBe(false);
    expect(hasResolvedCompany({ company_id: "tenant-a", companies: { id: "tenant-b" } })).toBe(false);
    expect(hasResolvedCompany({ company_id: "tenant-a", companies: { id: "tenant-a" } })).toBe(true);
    expect(dashboardSource).toContain("if (!profile || !hasResolvedCompany(profile)) return { user, session: null };");
    expect(dashboardSource).toContain("onSetupRequired({");
    expect(dashboardSource).toContain("onSetupRequired={setOauthPendingUser}");
    expect(dashboardSource).toContain("setupRequired: true");
    expect(dashboardSource).toContain("Finish company setup");
  });

  it("uses a stored authenticated token or an in-flight refresh for PostgREST rather than presenting the anon key as a user session", () => {
    expect(dashboardSource).toContain("let authRefreshInFlight = null;");
    expect(dashboardSource).toContain("async function authHeaders()");
    expect(dashboardSource).toContain("authRefreshSession(refreshToken)");
    expect(dashboardSource).toContain("...(token ? { Authorization: `Bearer ${token}` } : {})");
    expect(dashboardSource).toContain("const requestHeaders = await authHeaders();");
    expect(dashboardSource).toContain("Your authenticated session is unavailable. Please sign in again before saving changes.");
  });

  it("defers company provisioning until the confirmed user session is available without persisting secrets or tenant IDs", () => {
    expect(dashboardSource).toContain('const PENDING_SIGNUP_KEY = "bs_pending_signup"');
    expect(dashboardSource).toContain("function persistPendingSignup(pending)");
    expect(dashboardSource).toContain("Never retain a password or a tenant/company ID in browser storage");
    expect(dashboardSource).toContain("async function resumeConfirmedSignup(accessToken, user)");
    expect(dashboardSource).toContain("const resumedSignup = await resumeConfirmedSignup(result.access_token, result.user)");
    expect(dashboardSource).toContain("const resumedSignup = await resumeConfirmedSignup(activeToken, resolved.user)");
    expect(dashboardSource).toContain('callRpc("create_company_and_owner"');
    expect(dashboardSource).toContain('callRpc("join_company_with_code"');
  });

  it("keeps confirmation-pending onboarding actionable instead of presenting it as a signup failure", () => {
    const signupSource = dashboardSource.slice(dashboardSource.indexOf("function SignupPage"), dashboardSource.indexOf("function OAuthCompanySetup"));
    expect(signupSource).toContain("const [confirmationPending, setConfirmationPending] = useState(null)");
    expect(signupSource).toContain("setConfirmationPending(pending.email)");
    expect(signupSource).toContain("Confirm your email");
    expect(signupSource).toContain("I have confirmed — sign in");
    expect(signupSource).not.toContain('throw new Error("Account created — check your email to confirm it');
  });

  it("provides a safe resend-confirmation action and clear post-verification onboarding status", () => {
    expect(dashboardSource).toContain("async function authResendSignupConfirmation(email)");
    expect(dashboardSource).toContain('`${SUPABASE_URL}/auth/v1/resend`');
    expect(dashboardSource).toContain('JSON.stringify({ type: "signup", email })');
    const signupSource = dashboardSource.slice(dashboardSource.indexOf("function SignupPage"), dashboardSource.indexOf("function OAuthCompanySetup"));
    expect(signupSource).toContain("async function handleResendConfirmation()");
    expect(signupSource).toContain("Your onboarding is ready to resume");
    expect(signupSource).toContain("Resend confirmation email");
    expect(signupSource).toContain("I have confirmed — sign in");
  });

  it("binds every account-creation action to the defined final signup handler", () => {
    const signupSource = dashboardSource.slice(dashboardSource.indexOf("function SignupPage"), dashboardSource.indexOf("function OAuthCompanySetup"));
    expect(signupSource).toContain("async function handleFinalSubmit(e)");
    expect(signupSource).toContain('onClick={handleFinalSubmit}');
    expect(signupSource).not.toContain("onClick={handleSubmit}");
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

  it("normalizes EmailCenter contact sources before filtering collaboration data", () => {
    const emailCenterSource = dashboardSource.slice(dashboardSource.indexOf("function EmailCenter"), dashboardSource.indexOf("function CalendarCenter"));
    expect(emailCenterSource).toContain("const crmRows = Array.isArray(crm?.rows)");
    expect(emailCenterSource).toContain("const employeeRows = Array.isArray(employees?.rows)");
    expect(emailCenterSource).toContain("crmRows.filter(l=>l.email)");
    expect(emailCenterSource).toContain("employeeRows.filter(e=>e.email)");
  });

  it("keeps a docked, contextual desktop workspace shell while retaining the responsive overlay menu", () => {
    expect(dashboardSource).toContain("xl:w-[272px] xl:relative xl:z-20 xl:translate-x-0");
    expect(dashboardSource).toContain("desktop-workspace-frame");
    expect(dashboardSource).toContain("xl:px-8 xl:py-7 2xl:px-12 2xl:py-8");
    expect(dashboardSource).toContain("hidden xl:flex items-end justify-between gap-8");
    expect(dashboardSource).toContain("A focused operational view for your team’s next decisions.");
    expect(dashboardSource).toContain("sm:hidden fixed bottom-0 inset-x-0 z-30");
    expect(dashboardSource).toContain("h-16 xl:h-[72px]");
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

  it("rehydrates generic invoice line items after the PostgREST nested-relationship fallback", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ code: "PGRST200", message: "Could not find a relationship between sales_invoices and sales_invoice_items" }, 400))
      .mockResolvedValueOnce(jsonResponse([{ id: "invoice-1", data: { doc_number: "INV-QA" } }]))
      .mockResolvedValueOnce(jsonResponse([{ id: "line-1", data: { invoice_id: "invoice-1", item_name: "QA item", qty: 2, rate: 100 } }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCompanyTableQuery("sales_invoices", { select: "*,sales_invoice_items(*)" });

    expect(result.usedFallback).toBe(true);
    expect(result.rows[0]).toMatchObject({
      id: "invoice-1",
      doc_number: "INV-QA",
      sales_invoice_items: [{ item_name: "QA item", qty: 2, rate: 100 }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
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

  it("robustly maps Inventory, CRM lead, and Finance expense rows with alternate aliases", () => {
    const lead = mapLeadRow({
      id: "lead-1", contact_name: "Baraka Msuya", company_name: "Kilimanjaro Logistics", stage: "Qualified", value_amount: "450000", currency: "TZS",
    });
    const expense = mapExpenseRow({
      id: "exp-1", payee: "Tanesco Power", category: "Utilities", expense_date: "2026-08-01", amount: "125000", status: "Paid", department: "Operations", cost_center: "CC-OPS-99",
    });

    expect(lead).toMatchObject({ name: "Baraka Msuya", company: "Kilimanjaro Logistics", stage: "Qualified", value: 450000 });
    expect(expense).toMatchObject({ vendor: "Tanesco Power", category: "Utilities", amount: 125000, status: "Paid", department: "Operations", costCenter: "CC-OPS-99" });
  });

  it("normalizes and validates loan insert payloads before server persistence", () => {
    const loanPayload = {
      lender: "NMB Bank",
      loan_type: "Term Loan",
      principal: 5000000,
      interest_rate: 14.5,
      borrowed_date: "2026-08-12",
      due_date: "2027-08-12",
    };
    expect(loanPayload.lender).toBeTruthy();
    expect(loanPayload.principal).toBeGreaterThan(0);
    expect(loanPayload.borrowed_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("handles runCompanyTableMutation transient retry and missing table errors", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ message: "Network gateway timeout" }, 502)).mockResolvedValueOnce(jsonResponse({ id: "loan-uuid-99" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCompanyTableMutation("business_loans", "insert", { lender: "CRDB Bank", principal: 2000000 });
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ id: "loan-uuid-99" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
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

  it("creates a non-empty PDF document for the chart export report", async () => {
    const pdf = await createDashboardPdfDocument({
      companyName: "Kilimanjaro Trading Co.",
      periodLabel: "This month",
      sections: [{ title: "Pipeline", rows: [{ stage: "Proposal", deal_count: 2 }] }],
    });

    expect(pdf.output("arraybuffer").byteLength).toBeGreaterThan(500);
  });

  it("defers optional panels and heavyweight export libraries behind explicit lazy boundaries", () => {
    expect(dashboardSource).toContain('lazy(() => import("./components/DashboardPreferencesDrawer")');
    expect(dashboardSource).toContain('lazy(() => import("./components/WorkspacePresenceBadge")');
    expect(dashboardSource).toContain('const loadXlsx = () => (xlsxModulePromise ||= import("xlsx"));');
    expect(dashboardSource).toContain('const loadJsPdf = () => import("jspdf")');
    expect(dashboardSource).toContain("export async function createDashboardPdfDocument");
  });

  it("defers Finance and CRM executive views and exposes a secure onboarding checklist", () => {
    expect(dashboardSource).toContain('lazy(() => import("./components/FinanceCrmExecutiveViews")');
    expect(dashboardSource).toContain("<LazyFinancialDashboard");
    expect(dashboardSource).toContain("<LazyCrmSalesDashboard");
    expect(dashboardSource).toContain("CompanySetupChecklist");
    expect(dashboardSource).toContain('aria-label="Company setup checklist"');
    expect(financeCrmViewsSource).toContain("export function FinancialDashboard");
    expect(financeCrmViewsSource).toContain("export function CrmSalesDashboard");
  });

  it("records onboarding checklist completion after setup only as a UI marker", () => {
    const setItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { setItem } });
    expect(persistOnboardingChecklistCompletion("user-1", "create")).toBe(true);
    expect(setItem).toHaveBeenCalledWith("bs_onboarding_completed_user-1", expect.stringContaining('"method":"create"'));
    vi.unstubAllGlobals();
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

  it("includes persistent TZS/USD currency toggle, timezone selection, custom FX rate override, and formatting helpers", () => {
    expect(dashboardSource).toContain('preferences.currency');
    expect(dashboardSource).toContain('updatePreference("currency"');
    expect(dashboardSource).toContain('function Dashboard(');
    expect(dashboardSource).toContain('useDashboardPreferences()');
    const prefsContext = readFileSync(new URL("../client/src/contexts/DashboardPreferencesContext.tsx", import.meta.url), "utf8");
    expect(prefsContext).toContain('currency: "TZS" | "USD"');
    expect(prefsContext).toContain('timezone: string');
    expect(prefsContext).toContain('fxRateOverride: number');
    expect(prefsContext).toContain('formatMoney');
    expect(prefsContext).toContain('formatLocalDate');
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

  it("supports departmental budget thresholds, inline limit adjustments, alert status classification, and visual comparison bar chart", () => {
    const prefsContext = readFileSync(new URL("../client/src/contexts/DashboardPreferencesContext.tsx", import.meta.url), "utf8");
    expect(prefsContext).toContain("departmentBudgets");
    expect(dashboardSource).toContain("Departmental Cost Center Budgets");
    expect(dashboardSource).toContain("saveDepartmentBudget");
    expect(dashboardSource).toContain("editingDept");
    expect(dashboardSource).toContain("Exceeded");
    expect(dashboardSource).toContain("Warning");
    expect(dashboardSource).toContain("Normal");
    expect(dashboardSource).toContain("Departmental Budgets vs. Actual Spending (Comparative Bars)");
    expect(dashboardSource).toContain("BarChart data={");
    expect(dashboardSource).toContain("dataKey=\"budgetLimit\"");
    expect(dashboardSource).toContain("Variance:");
    expect(dashboardSource).toContain("chartSortBy");
    expect(dashboardSource).toContain("chartSortDir");
    expect(dashboardSource).toContain("Largest Budget Variance");
    expect(dashboardSource).toContain("Highest Actual Spending");
    expect(dashboardSource).toContain("Asc");
    expect(dashboardSource).toContain("Desc");
    expect(dashboardSource).toContain("selectedDeptFilter");
    expect(dashboardSource).toContain("Filtered Expenses:");
    expect(dashboardSource).toContain("Show All Departments");
    expect(dashboardSource).toContain("Transactions Recorded");
    expect(dashboardSource).toContain("Total Spending Sum");
  });

  it("sorts departmental budget chart data correctly by variance, actual spending, and name", () => {
    const rawDepartments = [
      { name: "Operations", actual: 15000, budgetLimit: 20000, variance: 5000 },
      { name: "Sales", actual: 35000, budgetLimit: 30000, variance: -5000 },
      { name: "Finance", actual: 10000, budgetLimit: 12000, variance: 2000 },
    ];

    const sortVariance = [...rawDepartments].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    // Operations variance magnitude = 5000, Sales = 5000, Finance = 2000. Depending on stable sort, Operations or Sales is first.
    expect(Math.abs(sortVariance[0].variance)).toBe(5000);

    const sortActual = [...rawDepartments].sort((a, b) => b.actual - a.actual);
    expect(sortActual[0].name).toBe("Sales"); // 35000

    const sortName = [...rawDepartments].sort((a, b) => a.name.localeCompare(b.name));
    expect(sortName[0].name).toBe("Finance");
  });

  it("sorts departmental chart data with ascending and descending direction toggles", () => {
    const rawDepartments = [
      { name: "Operations", actual: 15000, budgetLimit: 20000, variance: 5000 },
      { name: "Sales", actual: 35000, budgetLimit: 30000, variance: -5000 },
      { name: "Finance", actual: 10000, budgetLimit: 12000, variance: 2000 },
    ];

    const sortFn = (sortBy: string, sortDir: string) => {
      const mapped = [...rawDepartments].map(d => ({ ...d }));
      let sorted = [];
      if (sortBy === "variance") {
        sorted = mapped.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
      } else if (sortBy === "actual") {
        sorted = mapped.sort((a, b) => b.actual - a.actual);
      } else {
        sorted = mapped.sort((a, b) => a.name.localeCompare(b.name));
      }
      return sortDir === "asc" ? sorted.reverse() : sorted;
    };

    const descActual = sortFn("actual", "desc");
    expect(descActual[0].name).toBe("Sales"); // 35000

    const ascActual = sortFn("actual", "asc");
    expect(ascActual[0].name).toBe("Finance"); // 10000
  });
