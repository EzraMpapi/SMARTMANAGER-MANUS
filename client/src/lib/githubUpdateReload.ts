const VERSION_ENDPOINT = "/api/app-version";
const REVISION_STORAGE_KEY = "sm:github-revision";
const RELOAD_GUARD_KEY = "sm:github-reload-at";
const RELOAD_GUARD_WINDOW_MS = 10_000;
const RUNTIME_RECOVERY_KEY = "sm:runtime-recovery-at";
const RUNTIME_RECOVERY_WINDOW_MS = 60_000;
const UPDATE_POLL_INTERVAL_MS = 60_000;

type AppVersionResponse = {
  githubRevision?: string | null;
};

type ReloadOptions = {
  beforeReload?: () => void | Promise<void>;
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

async function fetchGithubRevision(): Promise<string | null> {
  try {
    const response = await fetch(`${VERSION_ENDPOINT}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as AppVersionResponse;
    const revision = typeof payload.githubRevision === "string" ? payload.githubRevision.trim() : "";
    return revision || null;
  } catch {
    return null;
  }
}

function storedRevision() {
  if (!canUseBrowserStorage()) return null;
  try {
    return window.localStorage.getItem(REVISION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function rememberRevision(revision: string) {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(REVISION_STORAGE_KEY, revision);
  } catch {
    // Storage can be blocked by privacy settings; update checks remain best effort.
  }
}

function reloadOnce() {
  if (typeof window === "undefined") return false;
  try {
    const lastReload = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (Date.now() - lastReload < RELOAD_GUARD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Continue without the guard when session storage is unavailable.
  }
  window.location.reload();
  return true;
}

function likelyStaleRuntimeError(error: unknown) {
  const value = error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error || "");
  return /react-runtime|react-dom|Minified React error|ChunkLoadError|dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(value);
}

async function clearRuntimeCaches() {
  if (typeof window === "undefined") return;
  try {
    if ("caches" in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
    }
  } catch {
    // Cache access can be unavailable in private browsing; reload still helps.
  }
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // Service-worker access is best effort and must never mask the original error.
  }
}

/** Recover once from a stale React/chunk runtime without an infinite reload loop. */
export async function recoverFromRuntimeError(error: unknown) {
  if (typeof window === "undefined" || !likelyStaleRuntimeError(error)) return false;
  try {
    const lastRecovery = Number(window.sessionStorage.getItem(RUNTIME_RECOVERY_KEY) || 0);
    if (Date.now() - lastRecovery < RUNTIME_RECOVERY_WINDOW_MS) return false;
    window.sessionStorage.setItem(RUNTIME_RECOVERY_KEY, String(Date.now()));
  } catch {
    // If session storage is blocked, continue with a single best-effort recovery.
  }
  await clearRuntimeCaches();
  window.location.reload();
  return true;
}

/**
 * Reload only when the server reports a different GitHub commit revision.
 * A missing revision intentionally never triggers a reload.
 */
export async function reloadIfGithubUpdated(options: ReloadOptions = {}) {
  const revision = await fetchGithubRevision();
  if (!revision) return false;

  const previousRevision = storedRevision();
  rememberRevision(revision);
  if (!previousRevision || previousRevision === revision) return false;
  await options.beforeReload?.();
  return reloadOnce();
}

export function startGithubUpdateMonitor() {
  if (typeof window === "undefined" || typeof window.setInterval !== "function") return () => undefined;

  void reloadIfGithubUpdated();
  const intervalId = window.setInterval(() => {
    void reloadIfGithubUpdated();
  }, UPDATE_POLL_INTERVAL_MS);

  return () => window.clearInterval(intervalId);
}
