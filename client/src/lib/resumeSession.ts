export const RESUME_LOCATION_VERSION = 1;
export const RESUME_LOCATION_STORAGE_PREFIX = "smart_manager_resume_location_v1";
export const SAFE_DRAFT_STORAGE_PREFIX = "smart_manager_safe_draft_v1";
export const RESUME_LOCATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;

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
const SENSITIVE_KEY_PATTERN = /(password|passcode|secret|token|refresh|access[_-]?token|id[_-]?token|api[_-]?key|private[_-]?key|payment|card|cvv|cvc|authorization|cookie|session)/i;
const SENSITIVE_CALLBACK_KEY_PATTERN = /^(auth|invite|code|state|nonce|sso|saml|redirect_uri|redirect|error|error_description|error_uri)$/i;

function getStorage(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_CALLBACK_KEY_PATTERN.test(key);
}

function sanitizeSearch(search: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const key of Array.from(params.keys())) {
    if (isSensitiveKey(key)) params.delete(key);
  }
  return params.toString() ? `?${params.toString()}` : "";
}

function sanitizeHash(hash: string): string {
  if (!hash) return "";
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!normalizedHash) return "";

  // Preserve ordinary route fragments such as #details. Treat key/value-like
  // fragments as callback state and remove only sensitive parameters from them.
  if (!normalizedHash.includes("=") && !normalizedHash.includes("&")) {
    return isSensitiveKey(normalizedHash) ? "" : `#${normalizedHash}`;
  }
  const params = new URLSearchParams(normalizedHash);
  for (const key of Array.from(params.keys())) {
    if (isSensitiveKey(key)) params.delete(key);
  }
  return params.toString() ? `#${params.toString()}` : "";
}

export function getResumeLocationKey(userId: string, companyId: string): string {
  const safeUserId = encodeURIComponent(userId.trim());
  const safeCompanyId = encodeURIComponent(companyId.trim());
  return `${RESUME_LOCATION_STORAGE_PREFIX}:${safeUserId}:${safeCompanyId}`;
}

export function isResumeLocationFresh(savedAt: number, now = Date.now()): boolean {
  return Number.isFinite(savedAt)
    && savedAt > 0
    && savedAt <= now + MAX_FUTURE_CLOCK_SKEW_MS
    && now - savedAt <= RESUME_LOCATION_TTL_MS;
}

export function sanitizeResumeLocation(input: Partial<ResumeLocation> | null | undefined, context: ResumeRestoreContext): ResumeLocation | null {
  try {
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
    const url = new URL(`${pathname}${search.startsWith("?") ? search : search ? `?${search}` : ""}`, "https://smart-manager.invalid");
    const savedAt = Number(input?.savedAt);

    return {
      version: RESUME_LOCATION_VERSION,
      userId,
      companyId,
      pathname,
      search: sanitizeSearch(url.search),
      hash: sanitizeHash(hash),
      moduleId,
      savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function readResumeLocation(storage: Storage | null | undefined, context: ResumeRestoreContext): ResumeLocation | null {
  const activeStorage = getStorage(storage);
  if (!activeStorage || !context.userId || !context.companyId) return null;
  const key = getResumeLocationKey(context.userId, context.companyId);
  try {
    const raw = activeStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== RESUME_LOCATION_VERSION) return null;
    if (parsed.userId !== context.userId || parsed.companyId !== context.companyId) return null;
    const normalized = sanitizeResumeLocation(parsed, context);
    if (!normalized || !isResumeLocationFresh(normalized.savedAt)) {
      activeStorage.removeItem(key);
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

export function writeResumeLocation(storage: Storage | null | undefined, location: Partial<ResumeLocation>, context: ResumeRestoreContext): ResumeLocation | null {
  const activeStorage = getStorage(storage);
  if (!activeStorage) return null;
  try {
    const sanitized = sanitizeResumeLocation(location, context);
    if (!sanitized) return null;
    const normalized = { ...sanitized, savedAt: Date.now() };
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
  try {
    const url = new URL(`${location.pathname}${location.search || ""}`, "https://smart-manager.invalid");
    url.search = sanitizeSearch(url.search);
    if (location.moduleId) url.searchParams.set("module", location.moduleId);
    const safeHash = sanitizeHash(location.hash || "");
    return `${url.pathname}${url.search}${safeHash}`;
  } catch {
    return "/app";
  }
}

export function isSensitivePersistenceKey(key: string): boolean {
  return isSensitiveKey(key);
}

export function getSafeDraftKey(userId: string, companyId: string, draftName: string): string {
  if (!userId.trim() || !companyId.trim() || !draftName.trim() || isSensitiveKey(draftName)) {
    throw new Error("Safe draft keys require non-sensitive user, company, and draft identifiers");
  }
  return `${SAFE_DRAFT_STORAGE_PREFIX}:${encodeURIComponent(userId.trim())}:${encodeURIComponent(companyId.trim())}:${encodeURIComponent(draftName.trim())}`;
}

function isScopedSafeDraftKey(key: string): boolean {
  return key.startsWith(`${SAFE_DRAFT_STORAGE_PREFIX}:`) && key.split(":").length === 4;
}

function sanitizeDraftValue(value: unknown, fieldName = ""): unknown {
  if (isSensitiveKey(fieldName)) return undefined;
  if (Array.isArray(value)) return value.map((item) => sanitizeDraftValue(item)).filter((item) => item !== undefined);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([field]) => !isSensitiveKey(field))
      .map(([field, nestedValue]) => [field, sanitizeDraftValue(nestedValue, field)] as const)
      .filter(([, nestedValue]) => nestedValue !== undefined);
    return Object.fromEntries(entries);
  }
  if (typeof value === "string" && value.startsWith("data:")) return undefined;
  return value;
}

export function readSafeDraft<T>(storage: Storage | null | undefined, key: string): T | null {
  if (!isScopedSafeDraftKey(key)) return null;
  const activeStorage = getStorage(storage);
  if (!activeStorage) return null;
  try {
    const raw = activeStorage.getItem(key);
    return raw ? sanitizeDraftValue(JSON.parse(raw)) as T : null;
  } catch {
    return null;
  }
}

export function writeSafeDraft<T extends Record<string, unknown>>(storage: Storage | null | undefined, key: string, value: T): boolean {
  if (!isScopedSafeDraftKey(key)) return false;
  const activeStorage = getStorage(storage);
  if (!activeStorage) return false;
  try {
    const sanitized = sanitizeDraftValue(value);
    if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) return false;
    activeStorage.setItem(key, JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

export function readScopedSafeDraft<T>(storage: Storage | null | undefined, userId: string, companyId: string, draftName: string): T | null {
  try {
    return readSafeDraft<T>(storage, getSafeDraftKey(userId, companyId, draftName));
  } catch {
    return null;
  }
}

export function writeScopedSafeDraft<T extends Record<string, unknown>>(storage: Storage | null | undefined, userId: string, companyId: string, draftName: string, value: T): boolean {
  try {
    return writeSafeDraft(storage, getSafeDraftKey(userId, companyId, draftName), value);
  } catch {
    return false;
  }
}
