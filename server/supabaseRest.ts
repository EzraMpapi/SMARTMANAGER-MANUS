import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

type RestOptions = {
  sessionToken?: string;
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: Record<string, unknown>;
};

function buildUrl(table: string, query: RestOptions["query"] = {}) {
  const url = new URL(`${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
}

function headers(sessionToken?: string) {
  const token = sessionToken || ENV.supabaseSecretKey;
  const apiKey = ENV.supabaseAnonKey || ENV.supabaseSecretKey;
  if (!ENV.supabaseUrl || !apiKey || !token) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase server persistence is not configured." });
  }
  return {
    accept: "application/json",
    apikey: apiKey,
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

async function request<T>(table: string, options: RestOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(table, options.query), {
    method: options.method || "GET",
    headers: headers(options.sessionToken),
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || body?.hint || `Supabase ${table} request failed (${response.status}).`;
    throw new TRPCError({ code: response.status === 401 ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR", message });
  }
  return body as T;
}

export function selectSupabaseRows<T>(table: string, query: Record<string, string | number | undefined>, sessionToken?: string) {
  return request<T[]>(table, { query, sessionToken });
}

export function insertSupabaseRow<T>(table: string, body: Record<string, unknown>, sessionToken?: string) {
  return request<T[]>(table, { method: "POST", query: { select: "*" }, body, sessionToken });
}
