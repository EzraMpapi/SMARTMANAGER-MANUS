import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import { canonicalVerifiedRole, resolveVerifiedProfile } from "./aiApprovals";
import { dashboardPreferencesInput, type DashboardPreferences } from "./dashboardPreferences";
import { createLayoutSignature, recordDashboardLayoutTelemetryForProfile } from "./dashboardLayoutTelemetry";

const MANAGE_TEAM_PRESET_ROLES = new Set(["Organization Owner", "CEO", "Super Administrator", "System Administrator"]);
const PRESET_TABLE = "dashboard_team_presets";
const TARGET_ROLES = ["Super Administrator", "Organization Owner", "CEO", "CFO", "COO", "HR Manager", "Sales Manager", "Procurement Officer", "Warehouse Manager", "Project Manager", "Customer Support Agent", "Support Manager", "Support Agent", "Clinic Administrator", "Doctor", "Nurse", "Laboratory Technician", "Pharmacist", "Receptionist", "Billing Officer", "School Administrator", "Employee", "Auditor", "External Client", "Supplier", "Finance Manager", "Cashier", "Pharmacy Manager", "Pharmacy Technician", "Inventory Manager", "Support Administrator"] as const;

const targetRole = z.enum(TARGET_ROLES);
export const dashboardTeamPresetInput = z.object({
  name: z.string().trim().min(2).max(80),
  targetType: z.enum(["role", "department"]),
  targetValue: z.string().trim().min(1).max(120),
  preferences: dashboardPreferencesInput,
});
export const dashboardTeamPresetIdInput = z.object({ id: z.string().uuid() });
export type DashboardTeamPresetInput = z.infer<typeof dashboardTeamPresetInput>;

function headers(token: string, prefer?: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Team dashboard presets are not configured." });
  return { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", ...(prefer ? { Prefer: prefer } : {}) };
}

async function request(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${ENV.supabaseUrl!.replace(/\/$/, "")}/rest/v1/${path}`, { ...init, headers: { ...headers(token), ...(init.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your workspace session could not be verified." });
    if (response.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: "Team dashboard presets are not available for this workspace." });
    throw new TRPCError({ code: "BAD_REQUEST", message: "The team dashboard preset operation could not be completed." });
  }
  return body;
}

function requirePresetManager(role: string) {
  const canonical = canonicalVerifiedRole(role);
  if (!MANAGE_TEAM_PRESET_ROLES.has(canonical)) throw new TRPCError({ code: "FORBIDDEN", message: "Only an organization administrator can manage team dashboard presets." });
}

function scopedPath(profile: { company_id: string }, suffix = "") {
  return `${PRESET_TABLE}?company_id=eq.${encodeURIComponent(profile.company_id)}${suffix}`;
}

export async function listDashboardTeamPresets(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requirePresetManager(profile.role);
  const query = "select=id,name,target_type,target_value,value,schema_version,is_active,pushed_at,created_at,updated_at&order=updated_at.desc&limit=100";
  return await request(scopedPath(profile, `&${query}`), token) as Array<Record<string, unknown>>;
}

export async function createDashboardTeamPreset(req: CreateExpressContextOptions["req"], input: DashboardTeamPresetInput) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requirePresetManager(profile.role);
  const parsed = dashboardTeamPresetInput.parse(input);
  const targetValue = parsed.targetType === "role" ? targetRole.parse(canonicalVerifiedRole(parsed.targetValue)) : parsed.targetValue;
  const rows = await request(PRESET_TABLE, token, {
    method: "POST",
    headers: { ...headers(token, "return=representation") },
    body: JSON.stringify({ company_id: profile.company_id, created_by: profile.id, name: parsed.name, target_type: parsed.targetType, target_value: targetValue, value: parsed.preferences, schema_version: 1, is_active: false }),
  }) as Array<Record<string, unknown>>;
  const created = rows[0];
  await recordDashboardLayoutTelemetryForProfile(profile, { eventType: "preset_created", sourceType: parsed.targetType === "department" ? "team_department" : "team_role", sourceId: created?.id ? String(created.id) : null, layoutSignature: createLayoutSignature(parsed.preferences), targetType: parsed.targetType, targetValue });
  return created;
}

export async function activateDashboardTeamPreset(req: CreateExpressContextOptions["req"], input: z.infer<typeof dashboardTeamPresetIdInput>) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requirePresetManager(profile.role);
  const parsed = dashboardTeamPresetIdInput.parse(input);
  const existing = await request(scopedPath(profile, `&id=eq.${encodeURIComponent(parsed.id)}&select=id,target_type,target_value,value&limit=1`), token) as Array<Record<string, unknown>>;
  if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "That team dashboard preset was not found in this workspace." });
  const rows = await request(scopedPath(profile, `&id=eq.${encodeURIComponent(parsed.id)}`), token, {
    method: "PATCH",
    headers: { ...headers(token, "return=representation") },
    body: JSON.stringify({ is_active: true, pushed_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  }) as Array<Record<string, unknown>>;
  const activated = rows[0];
  const preset = existing[0];
  await recordDashboardLayoutTelemetryForProfile(profile, { eventType: "preset_pushed", sourceType: preset?.target_type === "department" ? "team_department" : "team_role", sourceId: parsed.id, layoutSignature: createLayoutSignature(preset?.value), targetType: preset?.target_type === "role" || preset?.target_type === "department" ? preset.target_type : null, targetValue: preset?.target_value ? String(preset.target_value) : null });
  return activated;
}

export async function deleteDashboardTeamPreset(req: CreateExpressContextOptions["req"], input: z.infer<typeof dashboardTeamPresetIdInput>) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requirePresetManager(profile.role);
  const parsed = dashboardTeamPresetIdInput.parse(input);
  await request(scopedPath(profile, `&id=eq.${encodeURIComponent(parsed.id)}`), token, { method: "DELETE", headers: { ...headers(token, "return=minimal") } });
  return { deleted: true, id: parsed.id };
}

export function dashboardTeamPresetDefaultsForRole(role: string, departmentId: string | null, rows: Array<Record<string, unknown>>) {
  const canonicalRole = canonicalVerifiedRole(role);
  const active = rows.filter((row) => row.is_active === true && row.value && typeof row.value === "object" && !Array.isArray(row.value));
  const match = active.find((row) => row.target_type === "department" && departmentId && String(row.target_value) === departmentId)
    || active.find((row) => row.target_type === "role" && String(row.target_value) === canonicalRole);
  return match?.value as Partial<DashboardPreferences> | undefined;
}
