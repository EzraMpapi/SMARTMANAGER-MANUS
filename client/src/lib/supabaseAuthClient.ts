import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import type { PublicSupabaseConfig } from "./publicSupabaseConfig";

let client: SupabaseClient | null = null;
let clientKey = "";
let refreshInFlight: Promise<{ data: { session: Session | null }; error: any }> | null = null;

export function getSupabaseAuthClient(config: PublicSupabaseConfig) {
  if (!config.url || !config.anonKey) return null;
  const nextKey = `${config.url}|${config.anonKey}`;
  if (!client || clientKey !== nextKey) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: "smart-manager-auth",
      },
    });
    clientKey = nextKey;
    refreshInFlight = null;
  }
  return client;
}

/**
 * Refreshes the active Supabase session exactly once at a time. All callers
 * share the same promise, preventing dashboard, tRPC, and visibility handlers
 * from rotating the same refresh token concurrently.
 */
export function refreshSupabaseSession(authClient: SupabaseClient) {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = authClient.auth.refreshSession().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export function isDefinitiveSupabaseAuthFailure(error: unknown) {
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown } | null;
  const status = Number(candidate?.status);
  const code = String(candidate?.code || "").toLowerCase();
  const message = String(candidate?.message || "").toLowerCase();
  return [400, 401, 403].includes(status)
    || code.includes("invalid_refresh")
    || code.includes("refresh_token_not_found")
    || code.includes("session_not_found")
    || message.includes("invalid refresh token")
    || message.includes("refresh token not found")
    || message.includes("refresh token is invalid");
}

export function authDiagnosticCode(error: unknown) {
  return isDefinitiveSupabaseAuthFailure(error)
    ? "SM-AUTH-401-REFRESH-TOKEN-INVALID"
    : "SM-AUTH-401-NETWORK";
}

/**
 * Performs one request, and only when it returns HTTP 401 attempts one
 * single-flight Supabase refresh followed by exactly one replay. A failed
 * network refresh leaves the current local session intact. A definitive
 * refresh-token failure clears only the local Supabase session and emits a
 * redacted diagnostic event; no token or credential is included.
 */
export async function fetchWithSupabaseAuthRecovery(
  input: RequestInfo | URL,
  init: RequestInit = {},
  config: PublicSupabaseConfig,
) {
  const firstResponse = await globalThis.fetch(input, init);
  if (firstResponse.status !== 401) return firstResponse;

  const authClient = getSupabaseAuthClient(config);
  if (!authClient) return firstResponse;
  const current = await authClient.auth.getSession();
  if (current.error || !current.data.session) return firstResponse;

  const refreshed = await refreshSupabaseSession(authClient);
  if (refreshed.error || !refreshed.data.session) {
    if (isDefinitiveSupabaseAuthFailure(refreshed.error)) {
      try { await authClient.auth.signOut({ scope: "local" }); } catch { /* local auth state is still authoritative */ }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("smart-manager:auth-session-expired", {
          detail: { diagnosticCode: authDiagnosticCode(refreshed.error) },
        }));
      }
    }
    return firstResponse;
  }

  const headers = new Headers(init.headers || {});
  const accessToken = refreshed.data.session.access_token;
  headers.set("x-supabase-authorization", `Bearer ${accessToken}`);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return globalThis.fetch(input, { ...init, headers });
}

export function resetSupabaseAuthClient() {
  client = null;
  clientKey = "";
  refreshInFlight = null;
}
