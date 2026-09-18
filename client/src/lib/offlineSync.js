const OUTBOX_PREFIX = "smart-manager:offline-outbox:";
const CACHE_PREFIX = "smart-manager:offline-cache:";
const EVENT_NAME = "smart-manager:offline-sync-updated";
const MAX_QUEUE_ITEMS = 500;
const MAX_CACHE_ROWS = 1000;
const KEY_DB_NAME = "smart-manager-offline-keys";
const KEY_STORE_NAME = "keys";
const KEY_ID = "device-aes-gcm-v1";
export const OFFLINE_CONFLICT_STRATEGIES = Object.freeze(["server-wins", "client-wins", "manual"]);
export const OFFLINE_RETRY_POLICY = Object.freeze({ baseMs: 1000, maxMs: 5 * 60 * 1000, maxAttempts: 8 });

const memory = new Map();
let keyPromise = null;

function storage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function cryptoApi() {
  return globalThis.crypto?.subtle ? globalThis.crypto : null;
}

function emit(detail = {}) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

function encode(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decode(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function openKeyDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is unavailable."));
    const request = indexedDB.open(KEY_DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(KEY_STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open offline key storage."));
  });
}

async function loadDeviceKey() {
  const api = cryptoApi();
  if (!api || typeof indexedDB === "undefined") return null;
  const db = await openKeyDb();
  const existing = await new Promise((resolve, reject) => {
    const request = db.transaction(KEY_STORE_NAME, "readonly").objectStore(KEY_STORE_NAME).get(KEY_ID);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  if (existing) return existing;
  const key = await api.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await new Promise((resolve, reject) => {
    const request = db.transaction(KEY_STORE_NAME, "readwrite").objectStore(KEY_STORE_NAME).put(key, KEY_ID);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
  return key;
}

function deviceKey() {
  if (!keyPromise) keyPromise = loadDeviceKey().catch(() => null);
  return keyPromise;
}

async function encrypt(value) {
  const api = cryptoApi();
  const key = await deviceKey();
  if (!api || !key) return null;
  const iv = api.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await api.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { version: 1, algorithm: "AES-GCM-256", iv: encode(iv), ciphertext: encode(new Uint8Array(ciphertext)) };
}

async function decrypt(envelope) {
  const api = cryptoApi();
  const key = await deviceKey();
  if (!api || !key || !envelope?.ciphertext || !envelope?.iv) return null;
  try {
    const plaintext = await api.subtle.decrypt({ name: "AES-GCM", iv: decode(envelope.iv) }, key, decode(envelope.ciphertext));
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    return null;
  }
}

function readMemory(key, fallback) {
  return memory.has(key) ? memory.get(key) : fallback;
}

function persistEncrypted(key, value) {
  if (!storage()) return;
  void encrypt(value).then((envelope) => {
    if (!envelope) return;
    try { storage().setItem(key, JSON.stringify(envelope)); } catch { /* quota is best-effort */ }
  });
}

async function hydrateKey(key, fallback) {
  if (memory.has(key)) return memory.get(key);
  const raw = storage()?.getItem(key);
  if (!raw) { memory.set(key, fallback); return fallback; }
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { parsed = null; }
  const value = parsed?.version === 1 && parsed?.ciphertext ? await decrypt(parsed) : parsed;
  if (value == null) return fallback;
  memory.set(key, value);
  // Migrate any legacy plaintext entry immediately; plaintext is never written
  // by this module after hydration.
  if (!(parsed?.version === 1 && parsed?.ciphertext)) persistEncrypted(key, value);
  return value;
}

export async function hydrateOfflineStorage(scope) {
  const normalizedScope = offlineScope(scope);
  const keys = [
    `${OUTBOX_PREFIX}${normalizedScope}`,
    ...Array.from({ length: storage()?.length || 0 }, (_, index) => storage()?.key(index)).filter((key) => key?.startsWith(`${CACHE_PREFIX}${normalizedScope}:`)),
  ];
  await Promise.all(keys.map((key) => hydrateKey(key, key.startsWith(OUTBOX_PREFIX) ? [] : [])));
  emit({ scope: normalizedScope, hydrated: true, encrypted: Boolean(await deviceKey()) });
}

export function offlineScope(companyId = "current") {
  return String(companyId || "current").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
}

export function readOfflineQueue(scope) {
  return readMemory(`${OUTBOX_PREFIX}${offlineScope(scope)}`, []).filter((entry) => entry && entry.id && entry.table && entry.operation);
}

function writeOfflineQueue(scope, entries) {
  const key = `${OUTBOX_PREFIX}${offlineScope(scope)}`;
  const limited = entries.slice(-MAX_QUEUE_ITEMS);
  memory.set(key, limited);
  persistEncrypted(key, limited);
  emit({ scope: offlineScope(scope), queue: limited });
}

export function enqueueOfflineMutation({ scope, table, operation, payload, matchCol = "id", matchVal = null }) {
  const normalizedScope = offlineScope(scope);
  const entries = readOfflineQueue(normalizedScope);
  const now = new Date().toISOString();
  const baseRows = readOfflineTableCache(normalizedScope, table);
  const baseSnapshot = operation === "update" || operation === "delete"
    ? baseRows.find((row) => String(row?.[matchCol]) === String(matchVal)) || null
    : null;
  const entry = { id: globalThis.crypto?.randomUUID?.() || `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`, scope: normalizedScope, table, operation, payload: payload ?? null, matchCol, matchVal: matchVal ?? null, baseSnapshot, baseVersion: baseSnapshot?.updated_at || baseSnapshot?.updatedAt || null, conflictStrategy: "manual", status: "pending", attempts: 0, createdAt: now, updatedAt: now, lastError: null };
  writeOfflineQueue(normalizedScope, [...entries, entry]);
  return entry;
}

export function updateOfflineMutation(scope, id, patch) {
  const entries = readOfflineQueue(scope).map((entry) => entry.id === id ? { ...entry, ...patch, updatedAt: new Date().toISOString() } : entry);
  writeOfflineQueue(scope, entries);
  return entries.find((entry) => entry.id === id) || null;
}

export function removeOfflineMutation(scope, id) {
  writeOfflineQueue(scope, readOfflineQueue(scope).filter((entry) => entry.id !== id));
}

export function retryOfflineMutation(scope, id) {
  return updateOfflineMutation(scope, id, { status: "pending", attempts: 0, nextRetryAt: null, retryExhausted: false, lastError: null });
}

export function discardOfflineMutation(scope, id) {
  const entry = readOfflineQueue(scope).find((candidate) => candidate.id === id) || null;
  if (entry) {
    const rows = readOfflineTableCache(scope, entry.table);
    if (entry.operation === "insert") {
      const localId = entry.payload?.id || entry.payload?.__offlineId;
      writeOfflineTableCache(scope, entry.table, rows.filter((row) => String(row?.id || row?.__offlineId) !== String(localId)));
    } else if (entry.operation === "update" && entry.baseSnapshot) {
      writeOfflineTableCache(scope, entry.table, rows.map((row) => String(row?.[entry.matchCol]) === String(entry.matchVal) ? entry.baseSnapshot : row));
    } else if (entry.operation === "delete" && entry.baseSnapshot && !rows.some((row) => String(row?.[entry.matchCol]) === String(entry.matchVal))) {
      writeOfflineTableCache(scope, entry.table, [entry.baseSnapshot, ...rows]);
    }
  }
  removeOfflineMutation(scope, id);
  return entry;
}

export function readOfflineTableCache(scope, table) {
  const key = `${CACHE_PREFIX}${offlineScope(scope)}:${table}`;
  const value = readMemory(key, []);
  return Array.isArray(value) ? value : [];
}

export function writeOfflineTableCache(scope, table, rows) {
  if (!Array.isArray(rows)) return;
  const key = `${CACHE_PREFIX}${offlineScope(scope)}:${table}`;
  const limited = rows.slice(0, MAX_CACHE_ROWS);
  memory.set(key, limited);
  persistEncrypted(key, limited);
}

export function applyOfflineMutationToCache(scope, table, operation, payload, matchCol = "id", matchVal = null) {
  const rows = readOfflineTableCache(scope, table);
  if (operation === "insert") {
    const row = { ...(payload && typeof payload === "object" ? payload : {}), __offlinePending: true };
    writeOfflineTableCache(scope, table, [row, ...rows]);
    return row;
  }
  if (operation === "update") {
    writeOfflineTableCache(scope, table, rows.map((row) => String(row?.[matchCol]) === String(matchVal) ? { ...row, ...(payload || {}), __offlinePending: true } : row));
    return null;
  }
  if (operation === "delete") writeOfflineTableCache(scope, table, rows.filter((row) => String(row?.[matchCol]) !== String(matchVal)));
  return null;
}

export function clearOfflineScope(scope) {
  const normalizedScope = offlineScope(scope);
  const prefix = `${CACHE_PREFIX}${normalizedScope}:`;
  try {
    for (let index = storage()?.length - 1; index >= 0; index -= 1) {
      const key = storage()?.key(index);
      if (key?.startsWith(prefix) || key === `${OUTBOX_PREFIX}${normalizedScope}`) { storage()?.removeItem(key); memory.delete(key); }
    }
  } catch { /* best-effort cleanup */ }
  emit({ scope: normalizedScope });
}

export function offlineQueueSummary(scope) {
  const entries = readOfflineQueue(scope);
  return { entries, pending: entries.filter((entry) => entry.status === "pending").length, syncing: entries.filter((entry) => entry.status === "syncing").length, failed: entries.filter((entry) => entry.status === "failed").length, conflicts: entries.filter((entry) => entry.status === "conflict").length };
}

export function resolveOfflineConflict(scope, id, strategy, serverRow = null) {
  if (!OFFLINE_CONFLICT_STRATEGIES.includes(strategy)) throw new Error(`Unsupported offline conflict strategy: ${strategy}`);
  const entry = readOfflineQueue(scope).find((candidate) => candidate.id === id);
  if (!entry) return null;
  if (strategy === "server-wins") {
    removeOfflineMutation(scope, id);
    if (serverRow && entry.operation !== "insert") {
      const rows = readOfflineTableCache(scope, entry.table);
      writeOfflineTableCache(scope, entry.table, rows.map((row) => String(row?.[entry.matchCol]) === String(entry.matchVal) ? serverRow : row));
    }
    return { ...entry, status: "resolved", conflictStrategy: strategy, serverRow };
  }
  return updateOfflineMutation(scope, id, { status: "pending", conflictStrategy: strategy, conflict: null, serverRow: null });
}

export function offlineSyncEventName() { return EVENT_NAME; }

function isRetryableNetworkError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return error?.code === "PERSISTENCE_OFFLINE" || error?.name === "TypeError" || [408, 425, 429, 500, 502, 503, 504].includes(Number(error?.status)) || /failed to fetch|network|timeout|timed out|load failed|connection reset|temporarily unavailable/.test(message);
}

export function offlineRetryDelay(attempts = 1) {
  const exponent = Math.max(0, Math.min(Number(attempts || 1) - 1, 10));
  const exponential = Math.min(OFFLINE_RETRY_POLICY.maxMs, OFFLINE_RETRY_POLICY.baseMs * (2 ** exponent));
  const jitter = Math.floor(Math.random() * Math.min(500, Math.max(50, exponential * 0.2)));
  return Math.min(OFFLINE_RETRY_POLICY.maxMs, exponential + jitter);
}

export async function replayOfflineMutations(scope, executor, { force = false } = {}) {
  const normalizedScope = offlineScope(scope);
  const now = Date.now();
  const entries = readOfflineQueue(normalizedScope).filter((entry) => {
    if (!(entry.status === "pending" || entry.status === "failed")) return false;
    if (entry.retryExhausted) return false;
    if (force || !entry.nextRetryAt) return true;
    return Date.parse(entry.nextRetryAt) <= now;
  });
  const results = [];
  for (const entry of entries) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) break;
    updateOfflineMutation(normalizedScope, entry.id, { status: "syncing", attempts: Number(entry.attempts || 0) + 1, lastError: null });
    try {
      const result = await executor(entry);
      if (result?.error) throw result.error;
      removeOfflineMutation(normalizedScope, entry.id);
      results.push({ entry, status: "synced", result });
    } catch (error) {
      const message = String(error?.message || "Offline mutation could not be synchronized.");
      const conflict = error?.code === "OFFLINE_CONFLICT";
      const retryable = isRetryableNetworkError(error);
      const attempts = Number(entry.attempts || 0);
      const exhausted = retryable && attempts >= OFFLINE_RETRY_POLICY.maxAttempts;
      const nextRetryAt = retryable && !exhausted ? new Date(Date.now() + offlineRetryDelay(attempts)).toISOString() : null;
      updateOfflineMutation(normalizedScope, entry.id, { status: conflict ? "conflict" : "failed", lastError: message, nextRetryAt, retryExhausted: exhausted, conflict: conflict ? { serverRow: error.serverRow || null, detectedAt: new Date().toISOString() } : null });
      results.push({ entry, status: conflict ? "conflict" : "failed", error: message, serverRow: error.serverRow || null, retryable, nextRetryAt, retryExhausted: exhausted });
      if (error?.status === 401 || error?.status === 403) break;
    }
  }
  emit({ scope: normalizedScope, results });
  return results;
}
