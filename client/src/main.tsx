import { COOKIE_NAME } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import { trpc } from "./lib/trpc";
import { getSupabaseAuthClient } from "./lib/supabaseAuthClient";
import { loadPublicSupabaseConfig } from "./lib/publicSupabaseConfig";
import { isUnauthenticatedTrpcFailure } from "./lib/trpcAuthRecovery";
import "./index.css";

const queryClient = new QueryClient();
const publicConfigPromise = loadPublicSupabaseConfig();

const redirectToLoginIfUnauthorized = async (error: unknown) => {
  if (!(error instanceof TRPCClientError) || typeof window === "undefined") return;
  if (!isUnauthenticatedTrpcFailure(error)) return;

  try {
    const config = await publicConfigPromise;
    const client = getSupabaseAuthClient(config);
    const session = client ? (await client.auth.getSession()).data.session : null;
    if (session) {
      window.dispatchEvent(new CustomEvent("smart-manager:auth-session-expired", {
        detail: { diagnosticCode: "SM-AUTH-401" },
      }));
      return;
    }
  } catch {
    // Fall through to the standard login entry point when session state cannot be read.
  }
  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    void redirectToLoginIfUnauthorized(event.query.state.error);
    console.error("[API Query Error]", event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    void redirectToLoginIfUnauthorized(event.mutation.state.error);
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const headers: Record<string, string> = {};
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // sessionStorage unavailable
        }
        try {
          const config = await publicConfigPromise;
          const client = getSupabaseAuthClient(config);
          const supabaseToken = client ? (await client.auth.getSession()).data.session?.access_token : null;
          if (supabaseToken) {
            headers["x-supabase-authorization"] = `Bearer ${supabaseToken}`;
            if (!headers.Authorization) headers.Authorization = `Bearer ${supabaseToken}`;
          }
        } catch {
          // Provider initialization or browser storage may still be in progress.
        }
        return headers;
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
