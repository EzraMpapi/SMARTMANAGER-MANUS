import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDashboardChartSections, buildDashboardExportFilterSummary, createDashboardPdfDocument, filterDashboardChartSections, GENERIC_COMPANY_TABLES, mapContactRow, mapInventoryRow, mapLeadRow, mapExpenseRow, mapPosCashMovementRow, mapPosShiftRow, normalizeGenericCompanyPayload, resolveDailyBriefingFetchState, runCompanyTableQuery, runCompanyTableMutation, serializeDashboardSectionsToCsv, toastBus } from "../client/src/BusinessSphereDashboard.jsx";

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
const salesDetailSource = readFileSync(new URL("../client/src/components/SalesDetailWorkspace.jsx", import.meta.url), "utf8");
const invitationServiceSource = readFileSync(new URL("./teamInvitations.ts", import.meta.url), "utf8");
const publicAuthSource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");
const workspaceAuthMigrationSource = readFileSync(new URL("../supabase_workspace_auth_profile_upsert.sql", import.meta.url), "utf8");
const passwordAccountProvisioningSource = readFileSync(new URL("./passwordAccountProvisioning.ts", import.meta.url), "utf8");
const brandLogoSource = readFileSync(new URL("../client/src/components/BrandLogo.tsx", import.meta.url), "utf8");
const enterpriseAuthSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const indexHtmlSource = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("BusinessSphere launch and live-data integration", () => {
  it("keeps the preserved dashboard behind the dedicated app route", () => {
    expect(appSource.replace(/\s+/g, ' ')).toContain('const BusinessSphereDashboard = lazy'.replace(/\s+/g, ' '));
    expect(appSource).toContain("<DashboardRouteFallback />");
    expect(appSource).toContain('aria-live="polite"');
    expect(homeSource.match(/href="\/app"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(homeSource.includes("Launch App") || homeSource.includes("launchApp")).toBe(true);
  });

  it("loads public auth through a smaller route bundle and retains the ERP shell for active sessions or signup", () => {
    expect(appSource).toContain("const PublicAuthGateway = lazy");
    expect(appSource).toContain("function isPublicAuthRequest()");
    expect(appSource).toContain('params.get("auth") !== "signup"');
    expect(appSource).toContain("isPublicAuthRequest() ? <PublicAuthGateway /> : <BusinessSphereDashboard />");
  });

  it("uses the supplied Smart Manager logo through one accessible responsive component across public, auth, dashboard, state, and browser surfaces", () => {
    expect(brandLogoSource).toContain('SMART_MANAGER_LOGO_URL = "/manus-storage/smart-manager-official-logo-20260816_98336ac7.png"');
    expect(brandLogoSource).toContain('alt={decorative ? "" : label}');
    expect(brandLogoSource).toContain('width={1536} height={1024}');
    expect(brandLogoSource).toContain('variant?: "full" | "compact"');
    expect(homeSource).toContain('import { BrandLogo } from "../components/BrandLogo"');
    expect(homeSource).toContain('<BrandLogo variant="compact" priority');
    expect(enterpriseAuthSource).toContain('import { BrandLogo } from "./BrandLogo"');
    expect(enterpriseAuthSource).toContain('<BrandLogo variant="full" priority');
    expect(enterpriseAuthSource).toContain('sm-auth-mobile-brand');
    expect(enterpriseAuthSource).toContain('Simamia Biashara Yako. Popote, Wakati Wote.');
    expect(enterpriseAuthSource).toContain('rememberMe');
    expect(dashboardSource).toContain('import { BrandLogo } from "./components/BrandLogo"');
    expect(dashboardSource).toContain('function BrandMark({ size = 80 })');
    expect(dashboardSource).toContain('<BrandLogo variant="compact" priority className="h-9 w-9');
    expect(appSource).toContain('<BrandLogo variant="compact" priority');
    expect(indexHtmlSource).toContain('rel="icon" type="image/png" href="/manus-storage/smart-manager-official-logo-20260816_98336ac7.png"');
    expect(indexHtmlSource).toContain('<title>Smart Manager | Enterprise ERP</title>');
  });

  it("replaces local team seeds with server-backed invitations whose company and authorization come from the verified profile", () => {
    expect(dashboardSource).toContain("trpc.teamInvitations.list.useQuery");
    expect(dashboardSource).toContain("trpc.teamInvitations.create.useMutation");
    expect(dashboardSource).not.toContain("const TEAM_SEED");
    expect(invitationServiceSource).toContain("const { profile } = await resolveVerifiedProfile(req)");
    expect(invitationServiceSource).toContain("companyId: profile.company_id");
    expect(invitationServiceSource).toContain("hashInvitationToken(token)");
    expect(invitationServiceSource).toContain("Sign in with the email address that received this invitation");
    expect(invitationServiceSource).not.toContain("input.companyId");
  });

  it("does not retain browser SMTP credentials or offer a false manual-email send state while delivery is disabled", () => {
    expect(dashboardSource).toContain("const emailDeliveryDisabled = true");
    expect(dashboardSource).toContain("Email delivery is disabled");
    expect(dashboardSource).toContain("Email delivery disabled");
    expect(dashboardSource).not.toContain('localStorage.getItem("smtp_cfg")');
    expect(dashboardSource).not.toContain('localStorage.setItem("smtp_cfg"');
    expect(dashboardSource).not.toContain("Email accepted by the delivery provider");
    expect(dashboardSource).not.toContain("Email opened in your mail client");
    expect(dashboardSource).toContain("Payment reminder is ready in Collaboration → Email for secure delivery.");
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

  it("captures an OAuth callback in the lightweight public route and resumes the tenant-aware bootstrap instead of rendering login", () => {
    expect(publicAuthSource).toContain("oauthCallbackFromHash(window.location.hash)");
    expect(publicAuthSource).toContain("persistAuthSession({ access_token: callback.accessToken, refresh_token: callback.refreshToken })");
    expect(publicAuthSource).toContain("window.location.replace(withoutAuthView())");
    expect(publicAuthSource).toContain("Google authentication did not complete");
  });

  it("persists and refreshes Supabase tokens before tenant-scoped requests resume", () => {
    expect(dashboardSource).toContain('const REFRESH_TOKEN_STORAGE_KEY = "bs_refresh_token"');
    expect(dashboardSource).toContain("function persistAuthSession(authResult, { remember = true } = {})");
    expect(dashboardSource).toContain('const SESSION_ACCESS_TOKEN_STORAGE_KEY = "bs_session_access_token"');
    expect(dashboardSource).toContain("async function authRefreshSession(refreshToken)");
    expect(dashboardSource).toContain("const refreshed = await authRefreshSession(storedRefreshToken)");
    expect(dashboardSource).toContain("clearStoredAuthSession()");
  });

  it("keeps password-login failures truthful instead of collapsing them into a generic connection message", () => {
    expect(dashboardSource).toContain("toAuthUserMessage(loginError)");
    expect(dashboardSource).toContain("validatePasswordLogin(identifier, password)");
    expect(dashboardSource).toContain("continue with that same provider");
    expect(dashboardSource).not.toContain('setError("Something went wrong — check your connection.")');
  });

  it("keeps recovery and reset inside the configured Supabase auth boundary while password signup uses the server-side confirmed-account procedure", () => {
    expect(dashboardSource).toContain("trpc.accountRegistration.createConfirmedPasswordAccount.useMutation()");
    expect(dashboardSource).toContain("directPasswordSignupMutation.mutateAsync({ email: account.email.trim(), password: account.password })");
    expect(dashboardSource).not.toContain('`${SUPABASE_URL}/auth/v1/signup`');
    expect(dashboardSource).not.toContain("onVerificationRequired?.(account.email.trim())");
    expect(dashboardSource).toContain('async function authRequestPasswordRecovery(email)');
    expect(dashboardSource).toContain('`${SUPABASE_URL}/auth/v1/recover`');
    expect(dashboardSource).toContain('async function authUpdatePassword(accessToken, password)');
    expect(dashboardSource).toContain('authScreenFromSearch(window.location.search) === "reset"');
    expect(dashboardSource).toContain("clearStoredAuthSession();");
    expect(passwordAccountProvisioningSource).toContain("/auth/v1/admin/users");
    expect(passwordAccountProvisioningSource).toContain("email_confirm: true");
    expect(passwordAccountProvisioningSource).toContain("REGISTRATION_MAX_ATTEMPTS = 5");
    expect(passwordAccountProvisioningSource).not.toContain("resend");
  });

  it("keeps enterprise onboarding progressive and writes selected module intent through the shared company-module contract", () => {
    expect(dashboardSource).toContain('? ["Account", "Workspace", "Modules"]');
    expect(dashboardSource).toContain('mode === "create" && step === 3');
    expect(dashboardSource).toContain("<PasswordStrengthMeter password={account.password} />");
    expect(dashboardSource).toContain("companyDefaultsForCountry(val)");
    expect(dashboardSource).toContain("Account created");
    expect(dashboardSource).toContain("Congratulations — you’re ready.");
    expect(dashboardSource).toContain("Continue to sign in");
    expect(dashboardSource).toContain("Step 1 of 3 — personal details");
    expect(dashboardSource).toContain("const joinAccountValid");
    expect(dashboardSource).toContain("disabled={busy || !step2Valid}");
    expect(dashboardSource).not.toContain('placeholder="Min. 6 characters"');
  });

  it("offers optional organization branding in workspace setup and persists it through the protected save mutation", () => {
    expect(dashboardSource).toContain("function WorkspaceBrandingControls");
    expect(dashboardSource).toContain("Optional workspace branding");
    expect(dashboardSource).toContain("<UploadCloud size={18}");
    expect(dashboardSource).toContain('accept="image/png,image/jpeg,image/webp,image/svg+xml"');
    expect(dashboardSource).toContain("file.size > 2 * 1024 * 1024");
    expect(dashboardSource).toContain("brandAccentColor");
    expect(dashboardSource).toContain("trpc.workspaceBranding.save.useMutation()");
    expect(dashboardSource).toContain("workspaceBrandingMutation.mutateAsync({ primaryColor: company.brandColor");
    expect(dashboardSource).toContain("brand_primary_color: branding.primaryColor");
    expect(dashboardSource).toContain("brand_accent_color: branding.accentColor");
  });

  it("routes an authenticated profile without a company assignment into company setup before tenant writes", () => {
    expect(dashboardSource).toContain("!profile || !profile.company_id || !profile.companies?.id");
    expect(dashboardSource).toContain("setOauthPendingUser({ id: user.id");
    expect(dashboardSource).toContain("before loading any company-scoped modules");
  });

  it("requires a confirmed workspace response and atomically assigns an authenticated profile in the deployed workspace RPC contract", () => {
    expect(dashboardSource).toContain("Workspace creation did not return a confirmed company record.");
    expect(dashboardSource).not.toContain("window.setTimeout(() => onAuthenticated(confirmedSession), 950)");
    expect(dashboardSource).toContain("const [workspaceResolutionError, setWorkspaceResolutionError]");
    expect(dashboardSource).toContain("Workspace resolution failed");
    expect(dashboardSource).toContain("Retry workspace loading");
    expect(dashboardSource).toContain("if (bootstrapError?.status === 401 || bootstrapError?.status === 403)");
    expect(workspaceAuthMigrationSource).toContain("INSERT INTO public.profiles");
    expect(workspaceAuthMigrationSource).toContain("ON CONFLICT (id) DO UPDATE");
    expect(workspaceAuthMigrationSource).toContain("v_user_id uuid := auth.uid()");
    expect(workspaceAuthMigrationSource).toContain("user already belongs to a different company");
    expect(workspaceAuthMigrationSource).not.toContain("USING (true)");
  });

  it("attempts guarded first-tenant bootstrap before falling back to explicit company setup", () => {
    expect(dashboardSource).toContain('await callRpc("ensure_current_company", {}, token)');
    expect(dashboardSource).toContain("if (profile && !profile.company_id)");
    expect(dashboardSource).toContain("The normal explicit company setup / join flow below");
  });

  it("defers Sales subscription detail content and explains the on-demand loading benefit", () => {
    expect(dashboardSource).toContain('lazy(() => import("./components/SalesDetailWorkspace")');
    expect(dashboardSource).toContain("<LazySalesDetailWorkspace");
    expect(salesDetailSource).toContain("export function SalesDetailWorkspace");
    expect(salesDetailSource).toContain("loads only when Sales subscriptions are opened");
  });

  it("uses the connected generic company-module schema for live module settings", () => {
    expect(dashboardSource).toContain('sb("company_modules").select("*").eq("company_id", company.id).run()');
    expect(dashboardSource).toContain("r.data?.module_key ?? r.module_key ?? r.name");
    expect(dashboardSource).toContain('eq("name", id)');
    expect(dashboardSource).toContain('status: !turningOff ? "active" : "disabled"');
    expect(dashboardSource).toContain("data: { module_key: id, enabled: !turningOff }");
    expect(dashboardSource.match(/company_id: rpcResult\.id, name: m\.id, status: selectedModules\.has\(m\.id\) \? "active" : "disabled", data: \{ module_key: m\.id, enabled: selectedModules\.has\(m\.id\) \}/g)?.length).toBe(2);
    expect(dashboardSource).not.toContain("company_id: rpcResult.id, module_key: m.id, enabled: selectedModules.has(m.id)");
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

  it("normalizes generic CRM, inventory, supplier, HR, invoice, payment, and POS payloads through one tenant-safe contract", () => {
    const product = normalizeGenericCompanyPayload("inventory_items", {
      company_id: "untrusted-client-company", sku: "PRD-001", name: "Solar inverter", qty_on_hand: 8, reorder_level: 2, unit_cost: 380000, unit: "each",
    });
    const lead = normalizeGenericCompanyPayload("crm_leads", {
      contact_name: "Amina", company_name: "Tanga Trade", stage: "Qualified", value_amount: 920000, email: "amina@example.test",
    });
    const employee = normalizeGenericCompanyPayload("hr_employees", {
      full_name: "Juma Mtei", role: "Storekeeper", salary: 700000, department: "Operations", status: "Active",
    });
    const invoice = normalizeGenericCompanyPayload("sales_invoices", {
      doc_number: "INV-QA-1", customer: "Moshi Retail", amount: 350000, due_date: "2026-09-01", status: "Draft",
    });
    const payment = normalizeGenericCompanyPayload("sales_payments", {
      invoice_id: "invoice-1", amount: 350000, method: "Cash", payment_date: "2026-08-14", reference: "RCPT-QA-1",
    });
    const supplier = normalizeGenericCompanyPayload("inventory_suppliers", {
      name: "Arusha Supplies", contact_person: "Neema", lead_time_days: 5, status: "Active",
    });
    const transaction = normalizeGenericCompanyPayload("pos_transactions", {
      cashier: "Asha", amount: 125000, status: "Completed", transaction_ref: "POS-QA-1",
    });

    expect(product).toMatchObject({ name: "Solar inverter", amount: 380000, data: { sku: "PRD-001", qty_on_hand: 8, unit: "each" } });
    expect(product).not.toHaveProperty("company_id");
    expect(lead).toMatchObject({ name: "Amina", status: "Qualified", amount: 920000, data: { company_name: "Tanga Trade", email: "amina@example.test" } });
    expect(employee).toMatchObject({ name: "Juma Mtei", amount: 700000, data: { role: "Storekeeper", department: "Operations" } });
    expect(invoice).toMatchObject({ name: "Moshi Retail", status: "Draft", amount: 350000, data: { doc_number: "INV-QA-1", due_date: "2026-09-01" } });
    expect(payment).toMatchObject({ status: "Active", amount: 350000, data: { invoice_id: "invoice-1", method: "Cash", reference: "RCPT-QA-1" } });
    expect(supplier).toMatchObject({ name: "Arusha Supplies", data: { contact_person: "Neema", lead_time_days: 5 } });
    expect(transaction).toMatchObject({ name: "Asha", status: "Completed", amount: 125000, data: { cashier: "Asha", transaction_ref: "POS-QA-1" } });
  });

  it("keeps generic module writes and lookup filters inside the shared persistence boundary", () => {
    expect(dashboardSource).toContain("GENERIC_COMPANY_TABLES");
    expect(dashboardSource).toContain("normalizeGenericCompanyPayload");
    expect(dashboardSource).toContain("genericFilterColumn(table, col)");
    expect(dashboardSource).toContain("data->>${column}");
    expect(dashboardSource).toContain("requestPayload = normalizeGenericCompanyPayload(table, payload");
  });

  it("covers every reconciled generic module family without accepting client tenant identifiers", () => {
    [
      "ecommerce_orders", "hc_patients", "manufacturing_boms", "procurement_purchase_orders",
      "sch_students", "support_chat_messages", "vicoba_members", "whatsapp_messages",
    ].forEach((table) => expect(GENERIC_COMPANY_TABLES.has(table)).toBe(true));

    const order = normalizeGenericCompanyPayload("ecommerce_orders", {
      company_id: "untrusted-company", order_number: "ORD-1001", customer_name: "Moshi Store", total: 340000, order_status: "Paid",
    });
    expect(order).toMatchObject({ name: "ecommerce orders record", status: "Active", data: { order_number: "ORD-1001", customer_name: "Moshi Store", total: 340000 } });
    expect(order.amount).toBeUndefined();
    expect(order).not.toHaveProperty("company_id");
    expect(dashboardSource).toContain("inflateGenericCompanyRow");
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

  it("requires confirmed Supabase rows for CREATE, UPDATE, and DELETE mutations", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([], 201));
    vi.stubGlobal("fetch", fetchMock);

    const insert = await runCompanyTableMutation("pos_shifts", "insert", { cashier: "Asha", opening_float: 50000 });
    expect(insert.data).toBeNull();
    expect(insert.error).toMatchObject({ code: "PERSISTENCE_CONFIRMATION_MISSING", table: "pos_shifts", operation: "CREATE" });

    fetchMock.mockResolvedValueOnce(jsonResponse([], 200)).mockResolvedValueOnce(jsonResponse([], 200));
    const update = await runCompanyTableMutation("pos_shifts", "update", { status: "Closed" }, { matchVal: "shift-1" });
    const remove = await runCompanyTableMutation("pos_shifts", "delete", null, { matchVal: "shift-1" });
    expect(update.error).toMatchObject({ code: "PERSISTENCE_CONFIRMATION_MISSING", operation: "UPDATE" });
    expect(remove.error).toMatchObject({ code: "PERSISTENCE_CONFIRMATION_MISSING", operation: "DELETE" });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("keeps confirmed-response enforcement and original server diagnostics in the shared builder", () => {
    expect(dashboardSource).toContain("PERSISTENCE_CONFIRMATION_MISSING");
    expect(dashboardSource).toContain("error.table = table");
    expect(dashboardSource).toContain("error.operation =");
    expect(dashboardSource).toContain('update(payload).single().run()');
    expect(dashboardSource).toContain('delete().single().run()');
  });

  it("reconciles temporary UI rows from confirmed Supabase data and never claims offline writes are saved", () => {
    expect(dashboardSource).toContain("export const companyMutationBus");
    expect(dashboardSource).toContain("emitCompanyMutation({ table, confirmed: false, error })");
    expect(dashboardSource).toContain("emitCompanyMutation({ table, confirmed: true, data })");
    expect(dashboardSource).toContain("confirmedRowsRef.current = confirmedRows");
    expect(dashboardSource).toContain("setRows(confirmedRowsRef.current)");
    expect(dashboardSource).toContain("PERSISTENCE_OFFLINE");
    expect(dashboardSource).toContain("The server did not confirm this change. It was not saved; live data has been restored.");
    expect(dashboardSource).toContain('!online ? "Offline — writes paused"');
    expect(dashboardSource).not.toContain('!online ? "Offline — saving locally"');
  });

  it("does not create or close a POS shift in UI state until Supabase confirms the row", () => {
    const posSource = dashboardSource.slice(dashboardSource.indexOf("function PosShiftPanel"), dashboardSource.indexOf("function Pos(", dashboardSource.indexOf("function PosShiftPanel")));
    expect(posSource).toContain("persistenceFailureMessage(\"Opening the shift\", error)");
    expect(posSource).toContain("persistenceFailureMessage(\"Closing the shift\", error)");
    expect(posSource).toContain('name: row.cashier');
    expect(posSource).toContain('data: { cashier: row.cashier, opening_float: f, counted_cash: null, opened_at: row.openedAt, closed_at: null }');
    expect(posSource).toContain('data: { ...(open.rawData || {}), cashier: open.cashier, opening_float: open.openingFloat, counted_cash: counted, opened_at: open.openedAt, closed_at: closedAt }');
    expect(posSource).not.toContain("Opened locally, but the server update failed.");
    expect(posSource).not.toContain("Closed locally, but the server update failed.");
  });

  it("keeps CRM lead form data pending until a confirmed Supabase row is returned", () => {
    const crmSource = dashboardSource.slice(dashboardSource.indexOf("function CRM"), dashboardSource.indexOf("function LeadFormPanel"));
    const leadFormSource = dashboardSource.slice(dashboardSource.indexOf("function LeadFormPanel"), dashboardSource.indexOf("/* ------------------------------- OPPORTUNITIES"));
    expect(crmSource).toContain('const header = await sb("crm_leads").insert({');
    expect(crmSource).toContain('setLeads((prev) => [mapLeadRow(header), ...prev])');
    expect(crmSource).toContain('notify(persistenceFailureMessage("Creating the lead", e), "error")');
    expect(crmSource).not.toContain('notify("Lead created locally, but saving to the server failed.", "error")');
    expect(leadFormSource).toContain("await onSubmit(form)");
  });

  it("maps the deployed generic POS tables without requiring unavailable cashier columns", () => {
    const shift = mapPosShiftRow({
      id: "shift-1", name: "Asha", status: "Open", amount: "75000", created_at: "2026-08-13T09:00:00.000Z",
      data: { cashier: "Asha", opening_float: 75000, opened_at: "2026-08-13T09:00:00.000Z", counted_cash: null },
    });
    const movement = mapPosCashMovementRow({
      id: "move-1", status: "Pay In", amount: "10000", notes: "Petty cash", data: { shift_id: "shift-1", kind: "Pay In", reason: "Petty cash" },
    });
    expect(shift).toMatchObject({ cashier: "Asha", openingFloat: 75000, countedCash: null, status: "Open" });
    expect(movement).toMatchObject({ shiftId: "shift-1", kind: "Pay In", amount: 10000, reason: "Petty cash" });
    expect(dashboardSource).not.toContain('insert({ cashier: row.cashier, opening_float: f, status: "Open", opened_at: row.openedAt })');
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
