import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import { canonicalVerifiedRole, resolveVerifiedProfile } from "./aiApprovals";

export const DASHBOARD_PREFERENCE_KEY = "dashboard";
export const DASHBOARD_PREFERENCES_SCHEMA_VERSION = 1;

export const DASHBOARD_WIDGET_IDS = ["revenue", "salesMix", "quickActions", "products", "cashFlow", "businessHealth", "activity", "actionCenter"] as const;
export const DASHBOARD_KPI_IDS = ["revenue", "expenses", "net-result", "orders", "receivables"] as const;
export const DASHBOARD_PERFORMANCE_WINDOWS = ["30d", "3m", "6m", "1y"] as const;
export const DASHBOARD_NAVIGATION_GROUP_IDS = ["home", "sales-crm", "operations", "finance", "people", "specialized", "analytics", "administration"] as const;

const dashboardWidgetId = z.enum(DASHBOARD_WIDGET_IDS);
const dashboardKpiId = z.enum(DASHBOARD_KPI_IDS);
const dashboardNavigationGroupId = z.enum(DASHBOARD_NAVIGATION_GROUP_IDS);

export const dashboardPreferencesInput = z.object({
  compactDensity: z.boolean(),
  showKpiBanner: z.boolean(),
  showActivityTimeline: z.boolean(),
  showPendingApprovals: z.boolean(),
  accentColor: z.enum(["gold", "emerald"]),
  currency: z.enum(["TZS", "USD"]),
  timezone: z.string().trim().min(1).max(100),
  fxRateOverride: z.number().finite().min(1).max(1_000_000),
  departmentBudgets: z.record(z.string().trim().min(1).max(80), z.number().finite().min(0).max(1_000_000_000_000)).refine((value) => Object.keys(value).length <= 50, "Too many department budgets supplied."),
  showRevenueOverview: z.boolean(),
  showSalesMix: z.boolean(),
  showQuickActions: z.boolean(),
  showTopProducts: z.boolean(),
  showCashFlow: z.boolean(),
  showBusinessHealth: z.boolean(),
  showActionCenter: z.boolean(),
  widgetOrder: z.array(dashboardWidgetId).min(1).max(DASHBOARD_WIDGET_IDS.length).refine((value) => new Set(value).size === value.length, "Dashboard panels must be unique."),
  kpiCardIds: z.array(dashboardKpiId).min(1).max(DASHBOARD_KPI_IDS.length).refine((value) => new Set(value).size === value.length, "Dashboard KPIs must be unique."),
  performanceWindow: z.enum(DASHBOARD_PERFORMANCE_WINDOWS),
  sidebarPresentation: z.enum(["expanded", "compact"]),
  navigationSort: z.enum(["priority", "alphabetical"]),
  visibleNavigationGroupIds: z.array(dashboardNavigationGroupId).min(1).max(DASHBOARD_NAVIGATION_GROUP_IDS.length).refine((value) => new Set(value).size === value.length, "Navigation groups must be unique.").refine((value) => value.includes("home"), "Home navigation must remain available."),
  showTopBarSearch: z.boolean(),
  showGuidedTour: z.boolean(),
  showConnectionStatus: z.boolean(),
  showTopBarDate: z.boolean(),
});

export type DashboardPreferences = z.infer<typeof dashboardPreferencesInput>;

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  compactDensity: false,
  showKpiBanner: true,
  showActivityTimeline: true,
  showPendingApprovals: true,
  accentColor: "gold",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  fxRateOverride: 2600,
  departmentBudgets: {
    Operations: 25000,
    Sales: 15000,
    Finance: 10000,
    Warehouse: 20000,
    Admin: 30000,
  },
  showRevenueOverview: true,
  showSalesMix: true,
  showQuickActions: true,
  showTopProducts: true,
  showCashFlow: true,
  showBusinessHealth: true,
  showActionCenter: true,
  widgetOrder: [...DASHBOARD_WIDGET_IDS],
  kpiCardIds: [...DASHBOARD_KPI_IDS],
  performanceWindow: "30d",
  sidebarPresentation: "expanded",
  navigationSort: "priority",
  visibleNavigationGroupIds: [...DASHBOARD_NAVIGATION_GROUP_IDS],
  showTopBarSearch: true,
  showGuidedTour: true,
  showConnectionStatus: true,
  showTopBarDate: true,
};

function normalizePreferences(value: unknown): DashboardPreferences {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const rawBudgets = candidate.departmentBudgets && typeof candidate.departmentBudgets === "object" && !Array.isArray(candidate.departmentBudgets) ? candidate.departmentBudgets as Record<string, unknown> : {};
  const departmentBudgets = Object.fromEntries(Object.entries(rawBudgets).slice(0, 50).map(([key, budget]) => [key.trim().slice(0, 80), Math.min(1_000_000_000_000, Math.max(0, Number(budget) || 0))]).filter(([key]) => Boolean(key)));
  const validWidgetIds = new Set<string>(DASHBOARD_WIDGET_IDS);
  const suppliedOrder = Array.isArray(candidate.widgetOrder) ? candidate.widgetOrder.filter((item): item is string => typeof item === "string" && validWidgetIds.has(item)) : [];
  const widgetOrder = Array.from(new Set([...suppliedOrder, ...DASHBOARD_WIDGET_IDS])).slice(0, DASHBOARD_WIDGET_IDS.length) as DashboardPreferences["widgetOrder"];
  const validKpiIds = new Set<string>(DASHBOARD_KPI_IDS);
  const suppliedKpiIds = Array.isArray(candidate.kpiCardIds) ? candidate.kpiCardIds.filter((item): item is string => typeof item === "string" && validKpiIds.has(item)) : [];
  const kpiCardIds = (suppliedKpiIds.length ? Array.from(new Set(suppliedKpiIds)) : [...DASHBOARD_KPI_IDS]) as DashboardPreferences["kpiCardIds"];
  const validNavigationGroupIds = new Set<string>(DASHBOARD_NAVIGATION_GROUP_IDS);
  const suppliedNavigationGroupIds = Array.isArray(candidate.visibleNavigationGroupIds) ? candidate.visibleNavigationGroupIds.filter((item): item is string => typeof item === "string" && validNavigationGroupIds.has(item)) : [];
  const requestedNavigationGroups = suppliedNavigationGroupIds.length ? new Set(suppliedNavigationGroupIds) : new Set(DASHBOARD_NAVIGATION_GROUP_IDS);
  requestedNavigationGroups.add("home");
  const visibleNavigationGroupIds = DASHBOARD_NAVIGATION_GROUP_IDS.filter((id) => requestedNavigationGroups.has(id)) as DashboardPreferences["visibleNavigationGroupIds"];
  return {
    compactDensity: candidate.compactDensity === true,
    showKpiBanner: candidate.showKpiBanner !== false,
    showActivityTimeline: candidate.showActivityTimeline !== false,
    showPendingApprovals: candidate.showPendingApprovals !== false,
    accentColor: candidate.accentColor === "emerald" ? "emerald" : "gold",
    currency: candidate.currency === "USD" ? "USD" : "TZS",
    timezone: typeof candidate.timezone === "string" && candidate.timezone.trim() ? candidate.timezone.trim().slice(0, 100) : DEFAULT_DASHBOARD_PREFERENCES.timezone,
    fxRateOverride: Math.min(1_000_000, Math.max(1, Number(candidate.fxRateOverride) || DEFAULT_DASHBOARD_PREFERENCES.fxRateOverride)),
    departmentBudgets: { ...DEFAULT_DASHBOARD_PREFERENCES.departmentBudgets, ...departmentBudgets },
    showRevenueOverview: candidate.showRevenueOverview !== false,
    showSalesMix: candidate.showSalesMix !== false,
    showQuickActions: candidate.showQuickActions !== false,
    showTopProducts: candidate.showTopProducts !== false,
    showCashFlow: candidate.showCashFlow !== false,
    showBusinessHealth: candidate.showBusinessHealth !== false,
    showActionCenter: candidate.showActionCenter !== false,
    widgetOrder,
    kpiCardIds,
    performanceWindow: DASHBOARD_PERFORMANCE_WINDOWS.includes(candidate.performanceWindow as typeof DASHBOARD_PERFORMANCE_WINDOWS[number]) ? candidate.performanceWindow as DashboardPreferences["performanceWindow"] : DEFAULT_DASHBOARD_PREFERENCES.performanceWindow,
    sidebarPresentation: candidate.sidebarPresentation === "compact" ? "compact" : "expanded",
    navigationSort: candidate.navigationSort === "alphabetical" ? "alphabetical" : "priority",
    visibleNavigationGroupIds,
    showTopBarSearch: candidate.showTopBarSearch !== false,
    showGuidedTour: candidate.showGuidedTour !== false,
    showConnectionStatus: candidate.showConnectionStatus !== false,
    showTopBarDate: candidate.showTopBarDate !== false,
  };
}

function authHeaders(token: string, prefer?: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Dashboard preference storage is not configured." });
  return { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", ...(prefer ? { Prefer: prefer } : {}) };
}

async function request(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, { ...init, headers: { ...authHeaders(token), ...(init.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your workspace session could not be verified." });
    if (response.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: "Dashboard preferences are not available for this workspace." });
    throw new TRPCError({ code: "BAD_REQUEST", message: "Dashboard preferences could not be saved. Refresh and try again." });
  }
  return body;
}

async function requestWithServiceKey(path: string, init: RequestInit = {}) {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) return null;
  const response = await fetch(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json", ...(init.headers || {}) },
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

async function getActiveTeamPreset(profile: { id: string; company_id: string; role: string }, token: string) {
  const presetsQuery = new URLSearchParams({ select: "id,target_type,target_value,value,schema_version,updated_at", company_id: `eq.${profile.company_id}`, is_active: "eq.true", order: "updated_at.desc", limit: "100" });
  const presets = await requestWithServiceKey(`dashboard_team_presets?${presetsQuery.toString()}`) as Array<{ id?: string; target_type?: string; target_value?: string; value?: unknown; schema_version?: number; updated_at?: string }> | null;
  if (!presets?.length) return { value: undefined, updatedAt: null as string | null, schemaVersion: DASHBOARD_PREFERENCES_SCHEMA_VERSION, sourceType: "built_in" as const, sourceId: null as string | null, targetType: null as string | null, targetValue: null as string | null };
  const employeesQuery = new URLSearchParams({ select: "department_id", company_id: `eq.${profile.company_id}`, profile_id: `eq.${profile.id}`, order: "created_at.desc", limit: "1" });
  const employees = await requestWithServiceKey(`hr_employees?${employeesQuery.toString()}`) as Array<{ department_id?: string | null }> | null;
  const departmentId = employees?.[0]?.department_id || null;
  const departmentPreset = departmentId ? presets.find((row) => row.target_type === "department" && row.target_value === departmentId) : undefined;
  const rolePreset = presets.find((row) => row.target_type === "role" && row.target_value === canonicalVerifiedRole(profile.role));
  const selected = departmentPreset || rolePreset;
  return { value: selected?.value, updatedAt: selected?.updated_at || null, schemaVersion: Number(selected?.schema_version) || DASHBOARD_PREFERENCES_SCHEMA_VERSION, sourceType: selected?.target_type === "department" ? "team_department" as const : selected?.target_type === "role" ? "team_role" as const : "built_in" as const, sourceId: selected?.id ? String(selected.id) : null, targetType: selected?.target_type ? String(selected.target_type) : null, targetValue: selected?.target_value ? String(selected.target_value) : null };
}

export async function getDashboardPreferences(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const query = new URLSearchParams({ select: "value,schema_version,updated_at", company_id: `eq.${profile.company_id}`, user_id: `eq.${profile.id}`, preference_key: `eq.${DASHBOARD_PREFERENCE_KEY}`, limit: "1" });
  const [rows, teamPreset] = await Promise.all([
    request(`user_table_preferences?${query.toString()}`, token) as Promise<Array<{ value?: unknown; schema_version?: number; updated_at?: string }>>,
    getActiveTeamPreset(profile, token),
  ]);
  const personal = rows[0];
  return {
    preferences: normalizePreferences({ ...(teamPreset.value && typeof teamPreset.value === "object" ? teamPreset.value : {}), ...(personal?.value && typeof personal.value === "object" ? personal.value : {}) }),
    schemaVersion: Number(personal?.schema_version) || teamPreset.schemaVersion || DASHBOARD_PREFERENCES_SCHEMA_VERSION,
    updatedAt: personal?.updated_at || teamPreset.updatedAt || null,
    appliedSource: personal ? { sourceType: "personal" as const, sourceId: null, targetType: null, targetValue: null } : { sourceType: teamPreset.sourceType, sourceId: teamPreset.sourceId, targetType: teamPreset.targetType, targetValue: teamPreset.targetValue },
  };
}

export async function resetDashboardPreferences(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const query = new URLSearchParams({ company_id: `eq.${profile.company_id}`, user_id: `eq.${profile.id}`, preference_key: `eq.${DASHBOARD_PREFERENCE_KEY}` });
  await request(`user_table_preferences?${query.toString()}`, token, { method: "DELETE" });
  return getDashboardPreferences(req);
}

export async function saveDashboardPreferences(req: CreateExpressContextOptions["req"], input: DashboardPreferences) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const preferences = dashboardPreferencesInput.parse(normalizePreferences(input));
  const rows = await request(`user_table_preferences?on_conflict=company_id,user_id,preference_key`, token, {
    method: "POST",
    headers: { ...authHeaders(token, "resolution=merge-duplicates,return=representation") },
    body: JSON.stringify({
      company_id: profile.company_id,
      user_id: profile.id,
      preference_key: DASHBOARD_PREFERENCE_KEY,
      schema_version: DASHBOARD_PREFERENCES_SCHEMA_VERSION,
      value: preferences,
      updated_at: new Date().toISOString(),
    }),
  }) as Array<{ updated_at?: string }>;
  return {
    preferences,
    schemaVersion: DASHBOARD_PREFERENCES_SCHEMA_VERSION,
    updatedAt: rows[0]?.updated_at || new Date().toISOString(),
  };
}
