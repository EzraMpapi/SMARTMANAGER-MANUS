import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { COOKIE_NAME } from "@shared/const";
import type { AppRouter } from "../../../server/routers";

let activeGuardedCompanyId = "";

export function setGuardedPersistenceCompanyId(companyId: string | null | undefined) {
  activeGuardedCompanyId = companyId || "";
}

export function getGuardedPersistenceCompanyId() {
  return activeGuardedCompanyId;
}

function guardedHeaders() {
  const headers: Record<string, string> = {};
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const prefix = `${COOKIE_NAME}=`;
    const token = raw?.split(";").find((entry) => entry.trim().startsWith(prefix))?.trim().slice(prefix.length);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Browser storage may be unavailable in restricted contexts.
  }
  try {
    const supabaseToken = localStorage.getItem("bs_access_token") || sessionStorage.getItem("bs_session_access_token");
    if (supabaseToken) {
      headers["x-supabase-authorization"] = `Bearer ${supabaseToken}`;
      if (!headers.Authorization) headers.Authorization = `Bearer ${supabaseToken}`;
    }
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
    fetch(input, init) {
      return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
    },
  })],
});
