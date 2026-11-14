import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { COOKIE_NAME } from "@shared/const";
import { fetchWithSupabaseAuthRecovery, getSupabaseAuthClient } from "./supabaseAuthClient";
import type { AppRouter } from "../../../server/routers";

let activeGuardedCompanyId = "";

export function setGuardedPersistenceCompanyId(companyId: string | null | undefined) {
  activeGuardedCompanyId = companyId || "";
}

export function getGuardedPersistenceCompanyId() {
  return activeGuardedCompanyId;
}

const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

async function guardedHeaders() {
  const headers: Record<string, string> = {};
  const client = getSupabaseAuthClient(supabaseConfig);
  try {
    const supabaseToken = client ? (await client.auth.getSession()).data.session?.access_token : null;
    if (supabaseToken) {
      headers.Authorization = `Bearer ${supabaseToken}`;
      headers["x-supabase-authorization"] = `Bearer ${supabaseToken}`;
      return headers;
    }
  } catch {
    // Browser storage may be unavailable in restricted contexts.
  }
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const prefix = `${COOKIE_NAME}=`;
    const token = raw?.split(";").find((entry) => entry.trim().startsWith(prefix))?.trim().slice(prefix.length);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Browser storage may be unavailable in restricted contexts.
  }
  return headers;
}

export const guardedPersistenceClient = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({
    url: "/api/trpc",
    transformer: superjson,
    headers: guardedHeaders,
    async fetch(input, init) {
      return fetchWithSupabaseAuthRecovery(input, { ...(init ?? {}), credentials: "include" }, supabaseConfig);
    },
  })],
});
