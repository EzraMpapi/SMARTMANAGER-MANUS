import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";

const TABLE = "user_theme_presets";
export const themePresetMode = z.enum(["light", "dark", "auto"]);
export const themePresetIdInput = z.object({ id: z.string().uuid() });
export const themePresetInput = z.object({
  name: z.string().trim().min(2).max(80),
  mode: themePresetMode,
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  isShared: z.boolean().default(false),
}).strict();
export const updateThemePresetInput = themePresetInput.extend(themePresetIdInput.shape);
export type ThemePresetInput = z.infer<typeof themePresetInput>;

function headers(token: string, prefer?: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cloud theme presets are not configured." });
  return { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", ...(prefer ? { Prefer: prefer } : {}) };
}

async function request(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${ENV.supabaseUrl!.replace(/\/$/, "")}/rest/v1/${path}`, { ...init, headers: { ...headers(token), ...(init.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your workspace session could not be verified." });
    if (response.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: "Cloud theme presets are not available for this profile." });
    throw new TRPCError({ code: "BAD_REQUEST", message: "The cloud theme preset operation could not be completed." });
  }
  return body;
}

function scopedPath(profileId: string, companyId: string, suffix = "") {
  const owner = `profile_id.eq.${encodeURIComponent(profileId)}`;
  const shared = `and(company_id.eq.${encodeURIComponent(companyId)},is_shared.eq.true)`;
  return `${TABLE}?or=(${owner},${shared})${suffix}`;
}

export async function listThemePresets(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const query = "select=id,name,mode,accent_color,is_shared,created_at,updated_at&order=updated_at.desc&limit=100";
  return await request(scopedPath(profile.id, profile.company_id, `&${query}`), token) as Array<Record<string, unknown>>;
}

export async function createThemePreset(req: CreateExpressContextOptions["req"], input: ThemePresetInput) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const parsed = themePresetInput.parse(input);
  const rows = await request(TABLE, token, {
    method: "POST",
    headers: { ...headers(token, "return=representation") },
    body: JSON.stringify({ profile_id: profile.id, company_id: profile.company_id, name: parsed.name, mode: parsed.mode, accent_color: parsed.accentColor.toUpperCase(), is_shared: parsed.isShared }),
  }) as Array<Record<string, unknown>>;
  return rows[0] || null;
}

export async function updateThemePreset(req: CreateExpressContextOptions["req"], input: z.infer<typeof updateThemePresetInput>) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const parsed = updateThemePresetInput.parse(input);
  const rows = await request(`${TABLE}?profile_id=eq.${encodeURIComponent(profile.id)}&id=eq.${encodeURIComponent(parsed.id)}`, token, {
    method: "PATCH",
    headers: { ...headers(token, "return=representation") },
    body: JSON.stringify({ name: parsed.name, mode: parsed.mode, accent_color: parsed.accentColor.toUpperCase(), is_shared: parsed.isShared, updated_at: new Date().toISOString() }),
  }) as Array<Record<string, unknown>>;
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "That theme preset was not found for this profile." });
  return rows[0];
}

export async function deleteThemePreset(req: CreateExpressContextOptions["req"], input: z.infer<typeof themePresetIdInput>) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const parsed = themePresetIdInput.parse(input);
  await request(`${TABLE}?profile_id=eq.${encodeURIComponent(profile.id)}&id=eq.${encodeURIComponent(parsed.id)}`, token, { method: "DELETE", headers: { ...headers(token, "return=minimal") } });
  return { deleted: true, id: parsed.id };
}
