const QUEUE_PREFIX = "smart_manager:pos:pending:v1";

export function posPendingQueueKey({ companyId, userId }) {
  return `${QUEUE_PREFIX}:${String(companyId || "workspace")}:${String(userId || "session")}`;
}

export function readPendingPosSales(storage, scope) {
  try {
    const parsed = JSON.parse(storage?.getItem(posPendingQueueKey(scope)) || "[]");
    return Array.isArray(parsed) ? parsed.filter((record) => record && record.idempotencyKey && record.docNumber && Array.isArray(record.items)) : [];
  } catch (_error) {
    return [];
  }
}

export function writePendingPosSales(storage, scope, records) {
  const safeRecords = Array.isArray(records) ? records : [];
  try {
    storage?.setItem(posPendingQueueKey(scope), JSON.stringify(safeRecords));
  } catch (_error) {
    // The checkout remains usable; the UI will make clear that the sale could
    // not be retained for retry when device storage is unavailable.
  }
  return safeRecords;
}

export function createPendingPosSale({ attempt, items, payments, subtotal, tax, total, customerId, customerName, queuedAt = new Date().toISOString() }) {
  return {
    idempotencyKey: attempt.idempotencyKey,
    docNumber: attempt.docNumber,
    items,
    payments: payments.map((payment) => ({ method: payment.method, amount: Number(payment.amount) || 0 })),
    subtotal,
    tax,
    total,
    customerId: customerId || null,
    customerName: customerName || "Guest",
    status: "pending",
    attempts: 0,
    queuedAt,
    lastError: null,
  };
}

export function isRetryablePosTransportError(error) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || "").toLowerCase();
  return status === 0 || [408, 429, 502, 503, 504].includes(status) || /failed to fetch|network|offline|timeout|gateway/.test(message);
}

export function updatePendingPosSale(records, idempotencyKey, patch) {
  return (Array.isArray(records) ? records : []).map((record) => record.idempotencyKey === idempotencyKey ? { ...record, ...patch } : record);
}
