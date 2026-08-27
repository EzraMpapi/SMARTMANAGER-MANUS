import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { canonicalVerifiedRole, resolveVerifiedProfile } from "./aiApprovals";
import { ENV } from "./_core/env";

const MANAGE_ANALYTICS_ROLES = new Set(["Organization Owner", "CEO", "Super Administrator", "System Administrator"]);
const EVENT_TYPES = ["layout_applied", "preset_applied", "personal_reset", "preset_created", "preset_pushed"] as const;
const SOURCE_TYPES = ["personal", "team_role", "team_department", "built_in"] as const;

export const dashboardLayoutTelemetryEventInput = z.object({
  eventType: z.enum(EVENT_TYPES),
  sourceType: z.enum(SOURCE_TYPES),
  sourceId: z.string().uuid().nullable().optional(),
  layoutSignature: z.string().regex(/^[a-z0-9_-]{8,64}$/).nullable().optional(),
  targetType: z.enum(["role", "department"]).nullable().optional(),
  targetValue: z.string().trim().min(1).max(120).nullable().optional(),
});

export const dashboardLayoutAnalyticsInput = z.object({
  range: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
});

type EventInput = z.infer<typeof dashboardLayoutTelemetryEventInput>;
export type DashboardTelemetryProfile = { id: string; company_id: string; role: string };

export function assertDashboardAnalyticsRole(role: string) {
  if (!MANAGE_ANALYTICS_ROLES.has(canonicalVerifiedRole(role))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only an organization administrator can view dashboard layout analytics." });
  }
}

function serviceHeaders() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) return null;
  return { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
}

async function serviceRequest(path: string, init: RequestInit = {}) {
  const headers = serviceHeaders();
  if (!headers) return null;
  const response = await fetch(`${ENV.supabaseUrl!.replace(/\/$/, "")}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

export function createLayoutSignature(value: unknown) {
  const json = JSON.stringify(value) || "";
  let hash = 2166136261;
  for (let index = 0; index < json.length; index += 1) hash = Math.imul(hash ^ json.charCodeAt(index), 16777619);
  return `layout-${(hash >>> 0).toString(36).padStart(8, "0")}`;
}

export async function recordDashboardLayoutTelemetryForProfile(profile: DashboardTelemetryProfile, input: EventInput) {
  const parsed = dashboardLayoutTelemetryEventInput.parse(input);
  const body = {
    company_id: profile.company_id,
    event_type: parsed.eventType,
    source_type: parsed.sourceType,
    source_id: parsed.sourceId || null,
    layout_signature: parsed.layoutSignature || null,
    actor_role: canonicalVerifiedRole(profile.role),
    target_type: parsed.targetType || null,
    target_value: parsed.targetValue || null,
    occurred_at: new Date().toISOString(),
  };
  await serviceRequest("dashboard_layout_telemetry", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) });
  return { recorded: true };
}

export async function recordDashboardLayoutTelemetry(req: CreateExpressContextOptions["req"], input: EventInput) {
  const { profile } = await resolveVerifiedProfile(req);
  return recordDashboardLayoutTelemetryForProfile(profile, input);
}

export function aggregateDashboardLayoutEvents(rows: Array<Record<string, unknown>>, presets: Array<Record<string, unknown>>) {
  const presetById = new Map(presets.map((preset) => [String(preset.id), preset]));
  const sourceCounts = new Map<string, { label: string; sourceType: string; adoptionEvents: number }>();
  const layoutCounts = new Map<string, { signature: string; sourceType: string; adoptionEvents: number }>();
  const dayCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.event_type !== "layout_applied" && row.event_type !== "preset_applied") continue;
    const sourceId = row.source_id ? String(row.source_id) : "";
    const preset = sourceId ? presetById.get(sourceId) : undefined;
    const sourceType = String(row.source_type || "built_in");
    const label = preset ? String(preset.name) : sourceType === "personal" ? "Personal layout" : sourceType === "built_in" ? "Built-in default" : "Unnamed team preset";
    const sourceKey = `${sourceType}:${sourceId || label}`;
    const source = sourceCounts.get(sourceKey) || { label, sourceType, adoptionEvents: 0 };
    source.adoptionEvents += 1;
    sourceCounts.set(sourceKey, source);
    const signature = String(row.layout_signature || "unavailable");
    const layout = layoutCounts.get(signature) || { signature, sourceType, adoptionEvents: 0 };
    layout.adoptionEvents += 1;
    layoutCounts.set(signature, layout);
    const occurredAt = new Date(String(row.occurred_at || "")).getTime();
    if (Number.isFinite(occurredAt)) { const date = new Date(occurredAt).toISOString().slice(0, 10); dayCounts.set(date, (dayCounts.get(date) || 0) + 1); }
  }
  return { adoptionEvents: Array.from(sourceCounts.values()).reduce((sum, row) => sum + row.adoptionEvents, 0), trackedEvents: rows.length, note: "Counts represent privacy-safe adoption events, not unique-user counts. No preference payloads or user identifiers are stored.", topSources: Array.from(sourceCounts.values()).sort((a, b) => b.adoptionEvents - a.adoptionEvents).slice(0, 10), topLayouts: Array.from(layoutCounts.values()).sort((a, b) => b.adoptionEvents - a.adoptionEvents).slice(0, 10), activityByDay: Array.from(dayCounts.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, count]) => ({ date, adoptionEvents: count })), eventBreakdown: EVENT_TYPES.map((eventType) => ({ eventType, count: rows.filter((row) => row.event_type === eventType).length })) };
}

export async function getDashboardLayoutAnalytics(req: CreateExpressContextOptions["req"], input: z.infer<typeof dashboardLayoutAnalyticsInput>) {
  const { profile } = await resolveVerifiedProfile(req);
  assertDashboardAnalyticsRole(profile.role);
  const parsed = dashboardLayoutAnalyticsInput.parse(input);
  const cutoff = parsed.range === "all" ? null : new Date(Date.now() - Number(parsed.range.replace("d", "")) * 86_400_000).toISOString();
  const query = new URLSearchParams({ select: "event_type,source_type,source_id,layout_signature,target_type,target_value,occurred_at", company_id: `eq.${profile.company_id}`, order: "occurred_at.desc", limit: "5000" });
  if (cutoff) query.set("occurred_at", `gte.${cutoff}`);
  const [events, presets] = await Promise.all([
    serviceRequest(`dashboard_layout_telemetry?${query.toString()}`) as Promise<Array<Record<string, unknown>> | null>,
    serviceRequest(`dashboard_team_presets?${new URLSearchParams({ select: "id,name,target_type,target_value", company_id: `eq.${profile.company_id}`, limit: "100" }).toString()}`) as Promise<Array<Record<string, unknown>> | null>,
  ]);
  const rows = events || [];
  return { range: parsed.range, ...aggregateDashboardLayoutEvents(rows, presets || []) };
}
