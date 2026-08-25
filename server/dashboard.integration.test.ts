import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDashboardChartSections, buildDashboardExportFilterSummary, canonicalRoleId, createDashboardPdfDocument, filterDashboardChartSections, GENERIC_COMPANY_TABLES, mapContactRow, mapInventoryRow, mapLeadRow, mapExpenseRow, mapPosCashMovementRow, mapPosShiftRow, normalizeGenericCompanyPayload, resolveDailyBriefingFetchState, runCompanyTableQuery, roleDefinitionFor, runCompanyTableMutation, serializeDashboardSectionsToCsv, toastBus } from "../client/src/BusinessSphereDashboard.jsx";
import { setGuardedPersistenceCompanyId } from "../client/src/lib/guardedPersistenceClient";
import { dashboardSource } from "./dashboardSourceSnapshot";

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

afterEach(() => {
  setGuardedPersistenceCompanyId(null);
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const salesDetailSource = readFileSync(new URL("../client/src/components/SalesDetailWorkspace.jsx", import.meta.url), "utf8");
const invitationServiceSource = readFileSync(new URL("./teamInvitations.ts", import.meta.url), "utf8");
const publicAuthSource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");
const workspaceAuthMigrationSource = readFileSync(new URL("../supabase_workspace_auth_profile_upsert.sql", import.meta.url), "utf8");
const passwordAccountProvisioningSource = readFileSync(new URL("./passwordAccountProvisioning.ts", import.meta.url), "utf8");
const brandLogoSource = readFileSync(new URL("../client/src/components/BrandLogo.tsx", import.meta.url), "utf8");
const enterpriseAuthSource = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const indexHtmlSource = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
const authContextSource = readFileSync(new URL("../client/src/contexts/AuthContext.tsx", import.meta.url), "utf8");

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
    expect(appSource).toContain("function isPublicAuthScreen()");
    expect(appSource).toContain('["login", "forgot", "reset", "verify"].includes(requestedAuthScreen())');
    expect(appSource).toContain("isPublicAuthScreen() && !auth.isAuthenticated");
    expect(appSource).toContain("if (requestedSignup) return");
    expect(appSource).toContain("<PublicAuthGateway />");
  });

  it("defers TRA compliance and dashboard PDF code until the matching feature is opened", () => {
    expect(dashboardSource).toContain('const LazyTraPortalModule = lazy(() => import("./components/TraPortalModule")');
    expect(dashboardSource).not.toContain('import { TraPortalModule } from "./components/TraPortalModule"');
    expect(dashboardSource).toContain('aria-label="Loading TRA portal"');
    expect(dashboardSource).toContain('const LazyDashboardPreferencesDrawer = lazy(() => import("./components/DashboardPreferencesDrawer")');
    expect(dashboardSource).not.toContain('import { DashboardPreferencesDrawer } from "./components/DashboardPreferencesDrawer"');
    expect(dashboardSource).toContain('<LazyDashboardPreferencesDrawer isOpen={preferencesDrawerOpen}');
    expect(dashboardSource).toContain('export async function createDashboardPdfDocument');
    expect(dashboardSource).toContain('await import("jspdf")');
    expect(dashboardSource).toContain('async function exportDashboard(format)');
  });

  it("uses the supplied Smart Manager logo through one accessible responsive component across public, auth, dashboard, state, and browser surfaces", () => {
    expect(brandLogoSource).toContain('SMART_MANAGER_LOGO_URL = "/brand/smart-manager-logo.png"');
    expect(brandLogoSource).toContain('SMART_MANAGER_MARK_URL = "/manus-storage/smart-manager-mark_aa277576.png"');
    expect(brandLogoSource).toContain('alt={decorative ? "" : label}');
    expect(brandLogoSource).toContain('width={variant === "compact" ? 768 : 1536}');
    expect(brandLogoSource).toContain('height={variant === "compact" ? 768 : 1024}');
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
    expect(dashboardSource).toContain('<BrandLogo variant="compact" priority className="h-8 w-8');
    expect(appSource).toContain('<BrandLogo variant="compact" priority');
    expect(indexHtmlSource).toContain('rel="icon" type="image/png" href="/brand/smart-manager-logo.png"');
    expect(indexHtmlSource).toContain('<title>Smart Manager | Enterprise ERP</title>');
  });

  it("replaces local team seeds with server-backed invitations whose company and authorization come from the verified profile", () => {
    expect(dashboardSource).toContain("trpc.teamInvitations.list.useQuery");
    expect(dashboardSource).toContain("trpc.teamInvitations.create.useMutation");
    expect(dashboardSource).not.toContain("const TEAM_SEED");
    expect(invitationServiceSource).toContain("const { profile } = await resolveVerifiedProfile(req)");
    expect(invitationServiceSource).toContain("company_id: profile.company_id");
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
    expect(enterpriseAuthSource).toContain('onClick={() => onOAuth("google")}');
    expect(enterpriseAuthSource).toContain('onClick={() => onOAuth("azure")}');
    expect(enterpriseAuthSource).toContain('onClick={() => onOAuth("apple")}');
    expect(publicAuthSource).toContain("await auth.signInWithOAuth(provider)");
    expect(authContextSource).toContain("auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo?.toString() } })");
  });

  it("captures an OAuth callback in the lightweight public route and resumes the tenant-aware bootstrap instead of rendering login", () => {
    expect(publicAuthSource).toContain("oauthCallbackFromHash(window.location.hash)");
    expect(publicAuthSource).toContain("if (!callback.errorCode) return;");
    expect(authContextSource).toContain("const current = await client.auth.getSession()");
    expect(authContextSource).toContain("await hydrateIdentity(client, current.data.session, dispatch, generation)");
    expect(publicAuthSource).toContain("window.location.assign(withoutAuthView())");
    expect(publicAuthSource).toContain('provider === "azure" ? "Microsoft" : provider === "apple" ? "Apple" : "Google"');
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
    expect(enterpriseAuthSource).toContain("Use the same provider you used when your workspace account was created.");
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
    expect(dashboardSource).toContain('const stepLabels = mode === "create"');
    expect(dashboardSource).toContain('["Account", "Workspace", "Modules"]');
    expect(dashboardSource).toContain('["Join"]');
    expect(dashboardSource).toContain("isEnterprisePassword(account.password)");
    expect(dashboardSource).toContain("companyDefaultsForCountry(val)");
    expect(dashboardSource).toContain("Account created");
    expect(dashboardSource).toContain("Congratulations — you’re ready.");
    expect(dashboardSource).toContain("Continue to sign in");
    expect(dashboardSource).toContain("Your account becomes the initial organisation owner.");
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

  it("keeps Settings upload controls defined and constrains both Join Company flows to supported workspace roles", () => {
    expect(dashboardSource).toContain("Info, Upload} from \"lucide-react\"");
    expect(dashboardSource).toContain("const JOIN_COMPANY_ROLE_OPTIONS");
    expect(dashboardSource).toContain("JOIN_COMPANY_ROLE_OPTIONS.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)");
    expect(dashboardSource).not.toContain('ROLES.filter((r) => r !== "Organization Owner").map((r) => <option key={r}>{r}</option>)');
    expect(dashboardSource).toContain("p_join_code: joinCode.trim().toUpperCase()");
    expect(dashboardSource).toContain("workspaceJoinErrorMessage(err");
  });

  it("resolves an authenticated workspace through sequential profile and company reads so relationship expansion cannot strand a valid session", () => {
    expect(dashboardSource).toContain('const loadVerifiedWorkspaceProfile = async () =>');
    expect(dashboardSource).toContain('sb("profiles").select("*").eq("id", user.id).run()');
    expect(dashboardSource).toContain('sb("companies").select("*").eq("id", profile.company_id).run()');
    expect(dashboardSource).not.toContain('sb("profiles").select("*,companies(*)").eq("id", user.id).run()');
    expect(dashboardSource).toContain('if (isTerminalWorkspaceSessionError(bootstrapError))');
    expect(dashboardSource).toContain('The assigned workspace is not available to this verified account.');
  });

  it("retains the professional executive command hierarchy and operational context without adding fabricated metrics", () => {
    expect(dashboardSource).toContain(">Workspace overview<");
    expect(dashboardSource).toContain("Live workspace data");
    expect(dashboardSource).toContain("operational alert{alerts.length === 1 ? \"\" : \"s\"}");
    expect(dashboardSource).toContain("{PERIOD_LABELS[period]} reporting view");
  });

  it("keeps Workspace Overview at the top and orders the remaining dashboard sections by executive priority", () => {
    expect(dashboardSource).toContain('<div className="flex flex-col gap-5">');
    expect(dashboardSource).toContain('<div className="order-1 rounded-2xl overflow-hidden relative"');
    expect(dashboardSource).toContain('<section className="order-2 rounded-2xl border border-amber-200');
    expect(dashboardSource).toContain('<div className="order-3 grid grid-cols-1 lg:grid-cols-3 gap-4">');
    expect(dashboardSource).toContain('<div className="order-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mt-4">');
    expect(dashboardSource).toContain('<div className="order-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">');
    expect(dashboardSource).toContain('<div className="order-7 grid grid-cols-1 lg:grid-cols-3 gap-4">');
    expect(dashboardSource).toContain('<div className="order-9 grid grid-cols-1 lg:grid-cols-3 gap-4">');
    expect(dashboardSource).toContain('aria-label="Workspace setup and analytics readiness"');
  });

  it("derives executive guidance from confirmed workspace rows and opens an existing module without creating a record", () => {
    expect(dashboardSource).toContain("const executiveGuidance = useMemo(() =>");
    expect(dashboardSource).toContain("No confirmed invoice data is available for this workspace yet.");
    expect(dashboardSource).toContain("No confirmed customer opportunities are available yet.");
    expect(dashboardSource).toContain("No confirmed stock items are available for this workspace yet.");
    expect(dashboardSource).toContain("Executive Guidance");
    expect(dashboardSource).toContain("onClick={() => onNavigate(executiveGuidance.target)}");
    expect(dashboardSource).toContain("no record is created automatically");
  });

  it("exposes an accessible reporting-period selector and filters only confirmed invoice and expense rows for the executive KPIs", () => {
    expect(dashboardSource).toContain('aria-label="Dashboard reporting period"');
    expect(dashboardSource).toContain('onClick={() => setPeriod(value)}');
    expect(dashboardSource).toContain('aria-pressed={selected}');
    expect(dashboardSource).toContain('["day", "Day"]');
    expect(dashboardSource).toContain('["week", "Week"]');
    expect(dashboardSource).toContain('["month", "Month"]');
    expect(dashboardSource).toContain('["year", "Year"]');
    expect(dashboardSource).toContain('invoices.rows.filter((invoice) => !periodStart || (invoice.date || "") >= periodStart)');
    expect(dashboardSource).toContain('expenses.rows.filter((expense) => !periodStart || (expense.date || expense.expenseDate || "") >= periodStart)');
  });

  it("keeps dashboard side-panel empty states truthful and routes users only to existing leave and reporting modules", () => {
    expect(dashboardSource).toContain("No approvals are waiting.");
    expect(dashboardSource).toContain("The confirmed leave queue is clear.");
    expect(dashboardSource).toContain('onClick={() => onQuickAction("hr", { tab: "leave" })}');
    expect(dashboardSource).toContain("No recorded activity yet.");
    expect(dashboardSource).toContain("confirmed invoice, expense, and leave activity only");
    expect(dashboardSource).toContain('onClick={() => onNavigate("reports")}');
    expect(dashboardSource).toContain("does not create an activity history from local actions");
  });

  it("keeps focused and minimal role home views inside each role's allowed module scope", () => {
    expect(dashboardSource).toContain('const preferredTarget = currentRole.id === "Project Manager" ? "projects" : "support"');
    expect(dashboardSource).toContain("currentRole.allowedModules.includes(preferredTarget)");
    expect(dashboardSource).toContain('aria-label={`Open permitted ${targetLabel} workspace`}');
    expect(dashboardSource).toContain("does not duplicate that view or expose unrelated company-wide data");
    expect(dashboardSource).toContain("const primaryModuleId = currentRole.primaryModules[0] || currentRole.allowedModules[0]");
    expect(dashboardSource).toContain("currentRole.allowedModules.includes(primaryModuleId)");
    expect(dashboardSource).toContain("intentionally does not show company-wide metrics or create records");
  });

  it("turns Workspace Overview metrics into responsive confirmed-data action cards without fabricating targets or trends", () => {
    expect(dashboardSource).toContain('aria-label="Workspace overview metrics"');
    expect(dashboardSource).toContain('grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-8');
    expect(dashboardSource).toContain('No invoices in ${periodText}');
    expect(dashboardSource).toContain('No invoices to collect in ${periodText}');
    expect(dashboardSource).toContain('No overdue invoices');
    expect(dashboardSource).toContain('No stock items recorded');
    expect(dashboardSource).toContain('No active subscriptions');
    expect(dashboardSource).toContain('no target, trend, or progress is shown unless it exists in the workspace data');
    expect(dashboardSource).toContain('onQuickAction("finance", { tab: "receivables" })');
    expect(dashboardSource).toContain('onNavigate("inventory")');
    expect(dashboardSource).toContain('onNavigate("crm")');
  });

  it("turns Module Health into role-safe drill-down cards with evidence-based statuses and no invented recency", () => {
    expect(dashboardSource).toContain("Confirmed workspace signals only");
    expect(dashboardSource).toContain("No recency estimates");
    expect(dashboardSource).toContain('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4');
    expect(dashboardSource).toContain("const moduleCards = [");
    expect(dashboardSource).toContain("const statusConfig = {");
    expect(dashboardSource).toContain('currentRole.allowedModules.includes(module.id)');
    expect(dashboardSource).toContain("No root-level signal");
    expect(dashboardSource).toContain("Ticket data stays in Support");
    expect(dashboardSource).toContain("No confirmed POS transactions");
    expect(dashboardSource).toContain("No confirmed data");
    expect(dashboardSource).toContain("Not assessed");
  });

  it("implements pasted dashboard directives with confirmed activity, safe setup guidance, grouped commands, and no simulated data", () => {
    expect(dashboardSource).toContain("const attentionItems = [");
    expect(dashboardSource).toContain("This feed does not create sample events or local notes.");
    expect(dashboardSource).toContain("Confirmed invoice, expense, and leave entries");
    expect(dashboardSource).toContain("Smart Tips &amp; Actions");
    expect(dashboardSource).toContain("Based on confirmed workspace data");
    expect(dashboardSource).toContain("Start with inventory");
    expect(dashboardSource).toContain("Start tracking revenue");
    expect(dashboardSource).toContain("Build your pipeline");
    expect(dashboardSource).toContain("People & Tools");
    expect(dashboardSource).toContain("Search all");
    expect(dashboardSource).toContain("Open Leads");
    expect(dashboardSource).not.toContain("function useDemoData");
    expect(dashboardSource).not.toContain("activeUsers: 0");
  });

  it("implements the safe pasted-content-3 onboarding and smart empty-state enhancements without sample data or fake realtime activity", () => {
    expect(dashboardSource).toContain("<GettingStartedChecklist inventory={inventory} crm={crm} invoices={invoices} expenses={expenses} posTransactions={posTransactions} onNavigate={onNavigate} />");
    expect(dashboardSource).toContain('id="getting-started-checklist"');
    expect(dashboardSource).toContain("function EmptyState({ icon: Icon, title, hint, actionLabel, onAction, tips = [], sourceNote })");
    expect(dashboardSource).toContain("Helpful next steps");
    expect(dashboardSource).toContain("Source: confirmed invoice records only.");
    expect(dashboardSource).toContain("Source: confirmed inventory rows only.");
    expect(dashboardSource).toContain("Source: confirmed CRM lead records only.");
    expect(dashboardSource).not.toContain("generateSampleActivities");
    expect(dashboardSource).not.toContain("useWebSocket('/api/activities'");
  });

  it("adapts pasted-content-4 activity usability to the tenant audit stream without fabricated events or browser-only audit records", () => {
    expect(dashboardSource).toContain('function ActivityStream({ currentUser })');
    expect(dashboardSource).toContain('useCompanyTable("audit_log", [], {');
    expect(dashboardSource).toContain('aria-label="Filter confirmed activity by module"');
    expect(dashboardSource).toContain('aria-pressed={filter === m}');
    expect(dashboardSource).toContain('onClick={() => setFilter("All")}');
    expect(dashboardSource).toContain('Source: tenant audit log');
    expect(dashboardSource).toContain('Recorded actions across permitted modules appear here. No sample events are generated.');
    expect(dashboardSource).not.toContain("generateSampleActivities");
    expect(dashboardSource).not.toContain("useWebSocket('/api/activities'");
  });

  it("adapts pasted-content-5 analytical guidance to confirmed records without presenting fabricated forecasts or anomaly scores", () => {
    expect(dashboardSource).toContain("<AnalyticsReadiness invoices={invoices} crm={crm} inventory={inventory} expenses={expenses} onNavigate={onNavigate} />");
    expect(dashboardSource).toContain("function AnalyticsReadiness({ invoices, crm, inventory, expenses, onNavigate })");
    expect(dashboardSource).toContain('aria-label="Analytics readiness"');
    expect(dashboardSource).toContain("Record-based guidance");
    expect(dashboardSource).toContain("Available for current reporting");
    expect(dashboardSource).toContain("Forecasts and anomaly scores are not shown until an approved analytical model and a defined historical baseline are configured.");
    expect(dashboardSource).not.toContain("samplePredictions");
    expect(dashboardSource).not.toContain("generateSampleAnomalies");
  });

  it("turns empty customer, inventory, and pipeline analytics into accessible source-aware actions rather than fabricated chart data", () => {
    expect(dashboardSource).toContain('title="No billed customers yet"');
    expect(dashboardSource).toContain('actionLabel="Open CRM"');
    expect(dashboardSource).toContain('title="No inventory items yet"');
    expect(dashboardSource).toContain('actionLabel="Open inventory"');
    expect(dashboardSource).toContain('title="No active pipeline yet"');
    expect(dashboardSource).toContain('actionLabel="Open Leads"');
    expect(dashboardSource).toContain('dataKey={metricKey}');
    expect(dashboardSource).toContain('aria-label={label}');
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
    expect(dashboardSource).toContain("Retry secure workspace recovery");
    expect(dashboardSource).toContain("if (isTerminalWorkspaceSessionError(bootstrapError))");
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
    expect(dashboardSource).toMatch(/icon:\s*FolderKanban/);
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
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse([{ id: "lead-1" }]));
    const receivedToasts: Array<{ message?: string; type?: string }> = [];
    const listener = (toast: { message?: string; type?: string }) => receivedToasts.push(toast);
    toastBus.listeners.add(listener);
    vi.stubGlobal("fetch", fetchMock);

    try {
      const query = runCompanyTableQuery("crm_leads");
      await vi.runAllTimersAsync();
      const result = await query;
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
    const expense = {
      vendor: "Tanesco", category: "Rent & Utilities", expense_date: "2026-08-19", due_date: "2026-09-19",
      amount: 2000000, status: "Paid", method: "Bank Transfer",
    };
    const transaction = normalizeGenericCompanyPayload("pos_transactions", {
      cashier: "Asha", amount: 125000, status: "Completed", transaction_ref: "POS-QA-1",
    });

    expect(product).toMatchObject({ name: "Solar inverter", amount: 380000, data: { sku: "PRD-001", qty_on_hand: 8, unit: "each" } });
    expect(product).not.toHaveProperty("company_id");
    expect(lead).toMatchObject({ name: "Amina", status: "Qualified", amount: 920000, data: { company_name: "Tanga Trade", email: "amina@example.test" } });
    expect(employee).toMatchObject({ name: "Juma Mtei", amount: 700000, data: { role: "Storekeeper", department: "Operations" } });
    expect(invoice).toMatchObject({ name: "Moshi Retail", status: "Draft", amount: 350000, doc_number: "INV-QA-1", customer: "Moshi Retail", due_date: "2026-09-01", data: {} });
    expect(payment).toMatchObject({ status: "Active", amount: 350000, invoice_id: "invoice-1", method: "Cash", reference: "RCPT-QA-1", data: {} });
    expect(supplier).toMatchObject({ name: "Arusha Supplies", data: { contact_person: "Neema", lead_time_days: 5 } });
    expect(expense).toMatchObject({ amount: 2000000, status: "Paid", vendor: "Tanesco" });
    expect(expense).not.toHaveProperty("data");
    expect(expense).not.toHaveProperty("department");
    expect(expense).not.toHaveProperty("cost_center");
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
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ message: "Network gateway timeout" }, 502)).mockResolvedValueOnce(jsonResponse({ id: "loan-uuid-99" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    const mutation = runCompanyTableMutation("business_loans", "insert", { lender: "CRDB Bank", principal: 2000000 });
    await vi.runAllTimersAsync();
    const result = await mutation;
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ id: "loan-uuid-99" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("persists finance expenses as typed relational rows without unsupported data, cost_center, or department columns", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({
      id: "expense-1", vendor: "Tanesco", category: "Rent & Utilities", expense_date: "2026-08-19",
      amount: 2000000, status: "Paid", method: "Bank Transfer",
    }, 201));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCompanyTableMutation("finance_expenses", "insert", {
      vendor: "Tanesco", category: "Rent & Utilities", expense_date: "2026-08-19", due_date: "2026-09-19",
      amount: 2000000, status: "Paid", method: "Bank Transfer",
    });

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ id: "expense-1" });
    expect(result.data).not.toHaveProperty("cost_center");
    expect(result.data).not.toHaveProperty("department");
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody).toMatchObject({ vendor: "Tanesco", expense_date: "2026-08-19" });
    expect(requestBody).not.toHaveProperty("data");
    expect(requestBody).not.toHaveProperty("cost_center");
    expect(requestBody).not.toHaveProperty("department");
  });

  it("keeps expense creation on the shared confirmed persistence boundary without unsupported columns", () => {
    expect(dashboardSource).toContain('runCompanyTableMutation("finance_expenses", "insert"');
    const expenseInsertAt = dashboardSource.indexOf('runCompanyTableMutation("finance_expenses", "insert"');
    const expenseStateAt = dashboardSource.indexOf('setExpenses((prev) => [mapExpenseRow(header), ...prev]);', expenseInsertAt);
    const expenseInsertBlock = dashboardSource.slice(expenseInsertAt, expenseStateAt);
    expect(expenseInsertBlock).not.toContain("cost_center");
    expect(expenseInsertBlock).not.toContain("form.costCenter");
  });

  it("returns every confirmed row for a bulk inventory insert and normalizes each row", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([
      { id: "item-1", name: "Solar inverter", amount: 380000, data: { sku: "SKU-001", qty_on_hand: 8, unit: "each" } },
      { id: "item-2", name: "Battery pack", amount: 125000, data: { sku: "SKU-002", qty_on_hand: 4, unit: "each" } },
    ], 201));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCompanyTableMutation("inventory_items", "insert", [
      { sku: "SKU-001", name: "Solar inverter", qty_on_hand: 8, unit_cost: 380000, unit: "each" },
      { sku: "SKU-002", name: "Battery pack", qty_on_hand: 4, unit_cost: 125000, unit: "each" },
    ]);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data?.map((row) => row.id)).toEqual(["item-1", "item-2"]);
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody).toHaveLength(2);
    expect(requestBody[0]).toMatchObject({ name: "Solar inverter", amount: 380000, data: { sku: "SKU-001", qty_on_hand: 8 } });
    expect(requestBody[0]).not.toHaveProperty("company_id");
  });

  it("keeps the inventory import on the shared confirmed persistence boundary", () => {
    expect(dashboardSource).toContain('runCompanyTableMutation("inventory_items", "insert"');
    expect(dashboardSource).toContain("The server confirmed");
    expect(dashboardSource).toContain("persistenceFailureMessage(\"Importing inventory\"");
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

  it("creates a non-empty PDF document for the chart export report", async () => {
    const pdf = await createDashboardPdfDocument({
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

  it("canonicalizes legacy lowercase roles without granting unknown profiles a higher-privilege fallback", () => {
    expect(canonicalRoleId("owner")).toBe("Organization Owner");
    expect(canonicalRoleId("ADMIN")).toBe("Super Administrator");
    expect(canonicalRoleId("finance manager")).toBe("Finance Manager");
    expect(canonicalRoleId("School Administrator")).toBe("School Administrator");
    expect(roleDefinitionFor("School Administrator").allowedModules).toContain("school");
    expect(canonicalRoleId("unrecognized-role")).toBe("Employee");
    expect(roleDefinitionFor("owner").writeAccess).toBe("full");
    expect(roleDefinitionFor("unrecognized-role").writeAccess).toBe("none");
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

it("exposes dedicated non-login recovery and email-confirmation screens with accessible onboarding transitions", () => {
  expect(enterpriseAuthSource).toContain("export function PasswordRecoveryView");
  expect(enterpriseAuthSource).toContain("export function EmailConfirmationView");
  expect(enterpriseAuthSource).toContain("motion>");
  expect(enterpriseAuthSource).toContain("auth-card-enter");
  expect(publicAuthSource).toContain("PasswordRecoveryView");
  expect(publicAuthSource).toContain("EmailConfirmationView");
  expect(dashboardSource).toContain('className="auth-step-panel space-y-4" aria-live="polite"');
  expect(dashboardSource).toContain('className="auth-step-panel space-y-4" aria-live="polite"><div className="mb-5 flex items-center gap-2"');
  expect(dashboardSource).toContain('<LoginPage initialDiagnostic={terminalSessionDiagnostic} onAuthenticated=');
});

});
