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

export type GlobalAdminActionInput = z.infer<typeof globalAdminActionInput>;

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

export { globalAdminActionInput };
