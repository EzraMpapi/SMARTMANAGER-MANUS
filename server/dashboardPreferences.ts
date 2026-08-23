import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";

export const DASHBOARD_PREFERENCE_KEY = "dashboard";

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
};

function normalizePreferences(value: unknown): DashboardPreferences {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const rawBudgets = candidate.departmentBudgets && typeof candidate.departmentBudgets === "object" && !Array.isArray(candidate.departmentBudgets) ? candidate.departmentBudgets as Record<string, unknown> : {};
  const departmentBudgets = Object.fromEntries(Object.entries(rawBudgets).slice(0, 50).map(([key, budget]) => [key.trim().slice(0, 80), Math.min(1_000_000_000_000, Math.max(0, Number(budget) || 0))]).filter(([key]) => Boolean(key)));
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

export async function getDashboardPreferences(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const query = new URLSearchParams({ select: "value,updated_at", company_id: `eq.${profile.company_id}`, user_id: `eq.${profile.id}`, preference_key: `eq.${DASHBOARD_PREFERENCE_KEY}`, limit: "1" });
  const rows = await request(`user_table_preferences?${query.toString()}`, token) as Array<{ value?: unknown; updated_at?: string }>;
  return { preferences: normalizePreferences(rows[0]?.value), updatedAt: rows[0]?.updated_at || null };
}

export async function saveDashboardPreferences(req: CreateExpressContextOptions["req"], input: DashboardPreferences) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const preferences = dashboardPreferencesInput.parse(normalizePreferences(input));
  const rows = await request(`user_table_preferences?on_conflict=company_id,user_id,preference_key`, token, {
    method: "POST",
    headers: { ...authHeaders(token, "resolution=merge-duplicates,return=representation") },
    body: JSON.stringify({ company_id: profile.company_id, user_id: profile.id, preference_key: DASHBOARD_PREFERENCE_KEY, value: preferences, updated_at: new Date().toISOString() }),
  }) as Array<{ updated_at?: string }>;
  return { preferences, updatedAt: rows[0]?.updated_at || new Date().toISOString() };
}
