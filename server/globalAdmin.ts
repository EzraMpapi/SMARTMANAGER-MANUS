import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { resolveVerifiedProfile } from "./aiApprovals";
import { ENV } from "./_core/env";

const PLATFORM_ADMIN_ROLES = new Set(["super administrator", "platform administrator"]);

const globalAdminActionInput = z.object({
  action: z.string().trim().min(1).max(120),
  targetType: z.string().trim().min(1).max(80),
  targetId: z.string().trim().max(200).optional(),
  reason: z.string().trim().min(1).max(1000),
  confirmationText: z.string().trim().min(1).max(200),
  details: z.record(z.string(), z.unknown()).default({}),
});

const globalAdminLifecycleInput = z.object({
  action: z.enum(["EXTEND_SUBSCRIPTION", "CANCEL_SUBSCRIPTION", "RESUME_SUBSCRIPTION", "CHANGE_PLAN", "ACTIVATE_USER", "DEACTIVATE_USER"]),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(1).max(1000),
  extensionDays: z.union([z.literal(7), z.literal(15), z.literal(30), z.literal(60), z.literal(90)]).optional(),
  plan: z.string().trim().min(1).max(120).optional(),
});

export type GlobalAdminActionInput = z.infer<typeof globalAdminActionInput>;
export type GlobalAdminLifecycleInput = z.infer<typeof globalAdminLifecycleInput>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function callUserRpc<T>(functionName: string, token: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Global Admin Supabase verification is not configured." });
  }
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: ENV.supabaseAnonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === "string" ? payload.message : "The platform-admin request was denied.";
    throw new TRPCError({
      code: response.status === 401 ? "UNAUTHORIZED" : response.status === 403 ? "FORBIDDEN" : "BAD_REQUEST",
      message,
    });
  }
  return payload as T;
}

async function requirePlatformAdmin(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  if (!PLATFORM_ADMIN_ROLES.has(profile.role.toLowerCase())) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Platform Administrator access is required." });
  }
  return { profile, token };
}

export async function getGlobalAdminSnapshot(req: CreateExpressContextOptions["req"]) {
  const { token } = await requirePlatformAdmin(req);
  return callUserRpc<Record<string, unknown>>("platform_admin_snapshot", token);
}

export async function getGlobalAdminExecutiveSnapshot(req: CreateExpressContextOptions["req"]) {
  const { token } = await requirePlatformAdmin(req);
  return callUserRpc<Record<string, unknown>>("platform_admin_executive_snapshot", token);
}

export async function recordGlobalAdminAction(req: CreateExpressContextOptions["req"], input: GlobalAdminActionInput) {
  const { token } = await requirePlatformAdmin(req);
  return callUserRpc<Record<string, unknown>>("platform_admin_record_action", token, {
    p_action: input.action,
    p_target_type: input.targetType,
    p_target_id: input.targetId || "",
    p_reason: input.reason,
    p_confirmation_text: input.confirmationText,
    p_details: input.details,
  });
}

export async function applyGlobalAdminLifecycleAction(req: CreateExpressContextOptions["req"], input: GlobalAdminLifecycleInput) {
  const { token } = await requirePlatformAdmin(req);
  if (input.action === "EXTEND_SUBSCRIPTION" && input.extensionDays === undefined) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "An extension period is required." });
  }
  if (input.action === "CHANGE_PLAN" && !input.plan) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A plan is required for plan changes." });
  }
  return callUserRpc<Record<string, unknown>>("platform_admin_apply_lifecycle_action", token, {
    p_action: input.action,
    p_target_id: input.targetId,
    p_reason: input.reason,
    p_extension_days: input.extensionDays ?? null,
    p_plan: input.plan ?? null,
  });
}

export { globalAdminActionInput, globalAdminLifecycleInput };
