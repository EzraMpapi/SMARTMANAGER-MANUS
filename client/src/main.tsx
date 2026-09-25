import { COOKIE_NAME } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { trpc } from "./lib/trpc";
import { fetchWithSupabaseAuthRecovery, getSupabaseAuthClient } from "./lib/supabaseAuthClient";
import { readStoredAccessToken } from "./lib/authSessionStorage";
import { loadPublicSupabaseConfig } from "./lib/publicSupabaseConfig";
import "./index.css";

// Recover from stale chunks after a new deployment: reload once to fetch fresh assets.
const CHUNK_RELOAD_KEY = "sm:chunk-reload-at";
function reloadForStaleChunk() {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {}
  window.location.reload();
  return true;
}
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForStaleChunk()) event.preventDefault();
});
window.addEventListener("unhandledrejection", (event) => {
  const msg = String((event.reason as Error)?.message ?? event.reason ?? "");
  if (/dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(msg)) {
    if (reloadForStaleChunk()) event.preventDefault();
  }
});

const queryClient = new QueryClient();
const publicConfigPromise = loadPublicSupabaseConfig();

function hasStoredSupabaseSession() {
  try {
    return Boolean(readStoredAccessToken());
  } catch {
    return false;
  }
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const headers: Record<string, string> = {};
        try {
          const config = await publicConfigPromise;
          const client = getSupabaseAuthClient(config);
          const supabaseToken = client ? (await client.auth.getSession()).data.session?.access_token : null;
          if (supabaseToken) {
            // The live user JWT is the sole Authorization credential for the
            // modern app. The dedicated header is retained for explicit
            // server-side Supabase precedence and legacy fallback compatibility.
            headers.Authorization = `Bearer ${supabaseToken}`;
            headers["x-supabase-authorization"] = `Bearer ${supabaseToken}`;
            return headers;
          }
        } catch {
          // Provider initialization or browser storage may still be in progress.
        }
        try {
          if (hasStoredSupabaseSession()) {
            const storedSupabaseToken = readStoredAccessToken();
            if (storedSupabaseToken) {
              headers.Authorization = `Bearer ${storedSupabaseToken}`;
              headers["x-supabase-authorization"] = `Bearer ${storedSupabaseToken}`;
              return headers;
            }
          }

          const raw = sessionStorage.getItem("manus-cookie");
          const prefix = `${COOKIE_NAME}=`;
          const pair = raw?.split(";").find(s => s.trim().startsWith(prefix));
          const token = pair?.trim().slice(prefix.length);
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          // Browser storage unavailable
        }
        return headers;
      },
      async fetch(input, init) {
        const config = await publicConfigPromise;
        return fetchWithSupabaseAuthRecovery(input, {
          ...(init ?? {}),
          credentials: "include",
        }, config);
      },
    }),
  ],
});

if (import.meta.env.MODE !== "development" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.warn("[PWA] Offline fallback registration unavailable", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

if (import.meta.env.MODE !== "development" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // The network fallback remains available even when a worker cannot register.
    });
  }, { once: true });
}
