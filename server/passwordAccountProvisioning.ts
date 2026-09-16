import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

type PasswordAccountInput = { email: string; password: string };

const registrationWindows = new Map<string, { startedAt: number; count: number }>();
const REGISTRATION_WINDOW_MS = 10 * 60_000;
const REGISTRATION_MAX_ATTEMPTS = 5;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function hasEnterprisePassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function enforceRegistrationRateLimit(requesterId: string) {
  const now = Date.now();
  const previous = registrationWindows.get(requesterId);
  const current = !previous || now - previous.startedAt >= REGISTRATION_WINDOW_MS ? { startedAt: now, count: 0 } : previous;
  current.count += 1;
  registrationWindows.set(requesterId, current);
  if (current.count > REGISTRATION_MAX_ATTEMPTS) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many account-creation attempts. Please wait a few minutes before trying again." });
  }
}

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>;
}

function responseText(payload: Record<string, unknown>) {
  return [payload.message, payload.msg, payload.error, payload.error_description, payload.code]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

export function resetPasswordAccountProvisioningRateLimit() {
  registrationWindows.clear();
}

/**
 * Starts Supabase's normal email-confirmed signup flow. This endpoint uses only
 * the publishable key and deliberately never calls a privileged admin endpoint
 * or marks the address as verified. Workspace creation happens later, after the user
 * confirms the email and returns with a valid authenticated session.
 */
export async function provisionPasswordAccount(input: PasswordAccountInput, requesterId: string) {
  const email = normalizeEmail(input.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid work email address." });
  }
  if (!hasEnterprisePassword(input.password)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Use a password with at least 8 characters, uppercase, lowercase, number, and special character." });
  }
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Account creation is not configured. Please contact an administrator." });
  }

  enforceRegistrationRateLimit(requesterId || "unknown");

  let response: Response;
  try {
    response = await fetch(`${ENV.supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: ENV.supabaseAnonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password: input.password }),
    });
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The account service could not be reached. Please try again." });
  }

  const payload = await readJson(response);
  if (!response.ok) {
    const detail = responseText(payload);
    if (response.status === 400 || response.status === 422) {
      throw new TRPCError({ code: "CONFLICT", message: detail || "This account could not be created. Sign in instead or use password recovery if you already have an account." });
    }
    if (response.status === 401 || response.status === 403) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Account creation is temporarily unavailable. Please contact an administrator." });
    }
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The account service could not create this account. Please try again." });
  }

  const user = payload.user as { id?: unknown; email?: unknown } | undefined;
  if (typeof user?.id !== "string") {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Account creation returned an incomplete response. Please try again." });
  }

  const hasSession = typeof payload.access_token === "string" && typeof payload.refresh_token === "string";
  return {
    access_token: hasSession ? payload.access_token : null,
    refresh_token: hasSession ? payload.refresh_token : null,
    user: { id: user.id, email: typeof user.email === "string" ? user.email : email },
    requires_email_confirmation: !hasSession,
  };
}

// Compatibility export for callers that have not yet renamed their import.
export const provisionConfirmedPasswordAccount = provisionPasswordAccount;
