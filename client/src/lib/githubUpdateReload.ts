const VERSION_ENDPOINT = "/api/app-version";
const REVISION_STORAGE_KEY = "sm:github-revision";
const RELOAD_GUARD_KEY = "sm:github-reload-at";
const RELOAD_GUARD_WINDOW_MS = 10_000;
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
