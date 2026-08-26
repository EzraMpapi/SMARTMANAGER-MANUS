export const RESUME_LOCATION_VERSION = 1;
export const RESUME_LOCATION_STORAGE_PREFIX = "smart_manager_resume_location_v1";

export type ResumeLocation = {
  version: typeof RESUME_LOCATION_VERSION;
  userId: string;
  companyId: string;
  pathname: string;
  search: string;
  hash: string;
  moduleId: string;
  savedAt: number;
};

export type ResumeRestoreContext = {
  userId?: string | null;
  companyId?: string | null;
  allowedModuleIds: readonly string[];
  safeModuleIds?: readonly string[];
};

const SAFE_PATHNAMES = new Set(["/app"]);
const SENSITIVE_KEY_PATTERN = /(password|passcode|secret|token|refresh|access[_-]?token|api[_-]?key|private[_-]?key|payment|card|cvv|cvc|authorization|cookie)/i;

function getStorage(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getResumeLocationKey(userId: string, companyId: string): string {
  const safeUserId = encodeURIComponent(userId.trim());
  const safeCompanyId = encodeURIComponent(companyId.trim());
  return `${RESUME_LOCATION_STORAGE_PREFIX}:${safeUserId}:${safeCompanyId}`;
}

export function sanitizeResumeLocation(input: Partial<ResumeLocation> | null | undefined, context: ResumeRestoreContext): ResumeLocation | null {
  if (context.userId && input?.userId && input.userId !== context.userId) return null;
  if (context.companyId && input?.companyId && input.companyId !== context.companyId) return null;
  const userId = String(input?.userId || context.userId || "").trim();
  const companyId = String(input?.companyId || context.companyId || "").trim();
  const pathname = String(input?.pathname || "/app").trim();
  const moduleId = String(input?.moduleId || "dashboard").trim();
  const allowed = new Set(context.allowedModuleIds);
  const safe = new Set(context.safeModuleIds || []);

  if (!userId || !companyId || !SAFE_PATHNAMES.has(pathname)) return null;
  if (!allowed.has(moduleId) && !safe.has(moduleId)) return null;

  const search = String(input?.search || "");
  const hash = String(input?.hash || "");
  const normalizedSearch = search.startsWith("?") ? search : search ? `?${search}` : "";
  const normalizedHash = hash.startsWith("#") ? hash : hash ? `#${hash}` : "";
  const safeHash = SENSITIVE_KEY_PATTERN.test(normalizedHash) || /access_token|refresh_token/i.test(normalizedHash) ? "" : normalizedHash;
  const url = new URL(`${pathname}${normalizedSearch}${safeHash}`, "https://smart-manager.invalid");

  // Never persist an auth route or a credential-bearing parameter. Module state
  // belongs in URL-safe query parameters, not in session credentials.
  for (const key of Array.from(url.searchParams.keys())) {
    if (SENSITIVE_KEY_PATTERN.test(key)) url.searchParams.delete(key);
  }
  if (url.searchParams.get("auth")) url.searchParams.delete("auth");

  return {
    version: RESUME_LOCATION_VERSION,
    userId,
    companyId,
    pathname,
    search: url.search,
    hash: url.hash,
    moduleId,
    savedAt: Number.isFinite(Number(input?.savedAt)) ? Number(input?.savedAt) : Date.now(),
  };
}

export function readResumeLocation(storage: Storage | null | undefined, context: ResumeRestoreContext): ResumeLocation | null {
  const activeStorage = getStorage(storage);
  if (!activeStorage || !context.userId || !context.companyId) return null;
  try {
    const raw = activeStorage.getItem(getResumeLocationKey(context.userId, context.companyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== RESUME_LOCATION_VERSION) return null;
    if (parsed.userId !== context.userId || parsed.companyId !== context.companyId) return null;
    return sanitizeResumeLocation(parsed, context);
  } catch {
    return null;
  }
}

export function writeResumeLocation(storage: Storage | null | undefined, location: Partial<ResumeLocation>, context: ResumeRestoreContext): ResumeLocation | null {
  const activeStorage = getStorage(storage);
  const normalized = sanitizeResumeLocation(location, context);
  if (!activeStorage || !normalized) return null;
  try {
    activeStorage.setItem(getResumeLocationKey(normalized.userId, normalized.companyId), JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

export function clearResumeLocation(storage: Storage | null | undefined, userId: string, companyId: string): void {
  const activeStorage = getStorage(storage);
  if (!activeStorage || !userId || !companyId) return;
  try {
    activeStorage.removeItem(getResumeLocationKey(userId, companyId));
  } catch {
    // Persistence is optional and must never block logout.
  }
}

export function getModuleFromUrl(search: string | undefined, allowedModuleIds: readonly string[], safeModuleIds: readonly string[] = []): string | null {
  const params = new URLSearchParams(search || "");
  const moduleId = params.get("module");
  if (!moduleId) return null;
  const permitted = new Set([...allowedModuleIds, ...safeModuleIds]);
  return permitted.has(moduleId) ? moduleId : null;
}

export function buildResumeUrl(location: Pick<ResumeLocation, "pathname" | "search" | "hash"> & { moduleId?: string }): string {
  const url = new URL(`${location.pathname}${location.search || ""}${location.hash || ""}`, "https://smart-manager.invalid");
  for (const key of Array.from(url.searchParams.keys())) {
    if (SENSITIVE_KEY_PATTERN.test(key) || key === "auth" || key === "invite") url.searchParams.delete(key);
  }
  if (location.moduleId) url.searchParams.set("module", location.moduleId);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function isSensitivePersistenceKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function readSafeDraft<T>(storage: Storage | null | undefined, key: string): T | null {
  if (isSensitivePersistenceKey(key)) return null;
  const activeStorage = getStorage(storage);
  if (!activeStorage) return null;
  try {
    const raw = activeStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function writeSafeDraft<T extends Record<string, unknown>>(storage: Storage | null | undefined, key: string, value: T): boolean {
  if (isSensitivePersistenceKey(key)) return false;
  const activeStorage = getStorage(storage);
  if (!activeStorage) return false;
  try {
    const sanitized = Object.fromEntries(Object.entries(value).filter(([field]) => !isSensitivePersistenceKey(field)));
    activeStorage.setItem(key, JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}
