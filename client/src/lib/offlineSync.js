const OUTBOX_PREFIX = "smart-manager:offline-outbox:";
const CACHE_PREFIX = "smart-manager:offline-cache:";
const EVENT_NAME = "smart-manager:offline-sync-updated";
const MAX_QUEUE_ITEMS = 500;
const MAX_CACHE_ROWS = 1000;

function storage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function safeRead(key, fallback) {
  try {
    const value = storage()?.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    storage()?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function offlineScope(companyId = "current") {
  return String(companyId || "current").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
}

function emit(detail = {}) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function readOfflineQueue(scope) {
  return safeRead(`${OUTBOX_PREFIX}${offlineScope(scope)}`, []).filter((entry) => entry && entry.id && entry.table && entry.operation);
}

function writeOfflineQueue(scope, entries) {
  safeWrite(`${OUTBOX_PREFIX}${offlineScope(scope)}`, entries.slice(-MAX_QUEUE_ITEMS));
  emit({ scope: offlineScope(scope), queue: entries });
}

export function enqueueOfflineMutation({ scope, table, operation, payload, matchCol = "id", matchVal = null }) {
  const normalizedScope = offlineScope(scope);
  const entries = readOfflineQueue(normalizedScope);
  const now = new Date().toISOString();
  const entry = {
    id: globalThis.crypto?.randomUUID?.() || `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    scope: normalizedScope,
    table,
    operation,
    payload: payload ?? null,
    matchCol,
    matchVal: matchVal ?? null,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    lastError: null,
  };
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

export function readOfflineTableCache(scope, table) {
  const value = safeRead(`${CACHE_PREFIX}${offlineScope(scope)}:${table}`, null);
  return Array.isArray(value) ? value : [];
}

export function writeOfflineTableCache(scope, table, rows) {
  if (!Array.isArray(rows)) return;
  safeWrite(`${CACHE_PREFIX}${offlineScope(scope)}:${table}`, rows.slice(0, MAX_CACHE_ROWS));
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
  if (operation === "delete") {
    writeOfflineTableCache(scope, table, rows.filter((row) => String(row?.[matchCol]) !== String(matchVal)));
  }
  return null;
}

export function clearOfflineScope(scope) {
  const prefix = `${CACHE_PREFIX}${offlineScope(scope)}:`;
  try {
    for (let index = storage()?.length - 1; index >= 0; index -= 1) {
      const key = storage()?.key(index);
      if (key?.startsWith(prefix)) storage()?.removeItem(key);
    }
    storage()?.removeItem(`${OUTBOX_PREFIX}${offlineScope(scope)}`);
  } catch { /* best-effort cleanup */ }
  emit({ scope: offlineScope(scope) });
}

export function offlineQueueSummary(scope) {
  const entries = readOfflineQueue(scope);
  return {
    entries,
    pending: entries.filter((entry) => entry.status === "pending").length,
    syncing: entries.filter((entry) => entry.status === "syncing").length,
    failed: entries.filter((entry) => entry.status === "failed").length,
  };
}

export function offlineSyncEventName() {
  return EVENT_NAME;
}

export async function replayOfflineMutations(scope, executor) {
  const normalizedScope = offlineScope(scope);
  const entries = readOfflineQueue(normalizedScope).filter((entry) => entry.status === "pending" || entry.status === "failed");
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
      updateOfflineMutation(normalizedScope, entry.id, { status: "failed", lastError: message });
      results.push({ entry, status: "failed", error: message });
      if (error?.status === 401 || error?.status === 403) break;
    }
  }
  emit({ scope: normalizedScope, results });
  return results;
}
