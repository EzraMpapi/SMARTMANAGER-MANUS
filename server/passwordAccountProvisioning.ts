import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

type PasswordAccountInput = { email: string; password: string };

const registrationWindows = new Map<string, { startedAt: number; count: number }>();
const REGISTRATION_WINDOW_MS = 10 * 60_000;
const REGISTRATION_MAX_ATTEMPTS = 5;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hasEnterprisePassword(value: string) {
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

export function resetPasswordAccountProvisioningRateLimit() {
  registrationWindows.clear();
}

/**
 * Creates a confirmed password account through the server-only Supabase admin
 * boundary, then obtains a normal user session for tenant-scoped onboarding.
 * No transactional-email provider is involved in this flow.
 */
export async function provisionConfirmedPasswordAccount(input: PasswordAccountInput, requesterId: string) {
  const email = normalizeEmail(input.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid work email address." });
  }
  if (!hasEnterprisePassword(input.password)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Use a password with at least 8 characters, uppercase, lowercase, number, and special character." });
  }
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey || !ENV.supabaseSecretKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Account creation is not configured. Please contact an administrator." });
  }

  enforceRegistrationRateLimit(requesterId || "unknown");

  let createResponse: Response;
  try {
    createResponse = await fetch(`${ENV.supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: ENV.supabaseSecretKey,
        authorization: `Bearer ${ENV.supabaseSecretKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password: input.password, email_confirm: true }),
    });
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The account service could not be reached. Please try again." });
  }
  const created = await readJson(createResponse);
  if (!createResponse.ok) {
    if (createResponse.status === 400 || createResponse.status === 422) {
      throw new TRPCError({ code: "CONFLICT", message: "This account could not be created. Sign in instead or use password recovery if you already have an account." });
    }
    if (createResponse.status === 401 || createResponse.status === 403) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Account creation is temporarily unavailable. Please contact an administrator." });
    }
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The account service could not create this account. Please try again." });
  }

  let sessionResponse: Response;
  try {
    sessionResponse = await fetch(`${ENV.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ENV.supabaseAnonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password: input.password }),
    });
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Your account was created, but sign-in could not start. Please sign in manually." });
  }
  const session = await readJson(sessionResponse);
  if (!sessionResponse.ok || typeof session.access_token !== "string" || typeof session.refresh_token !== "string") {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Your account was created, but sign-in could not start. Please sign in manually." });
  }

  const user = session.user as { id?: unknown; email?: unknown } | undefined;
  const createdUser = created as { id?: unknown; email?: unknown };
  if (typeof user?.id !== "string" || typeof user?.email !== "string") {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Your account was created, but the authentication response was incomplete. Please sign in manually." });
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: { id: user.id || createdUser.id, email: user.email || createdUser.email || email },
  };
}
