const CSV_HEADERS = ["Outcome", "Request key", "Server transaction", "Created", "Updated", "Detail"];

export function escapePosCsvCell(value) {
  const text = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
  const formulaSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

export function buildPosReconciliationCsv(rows = []) {
  const lines = [CSV_HEADERS, ...rows.map((row) => [
    row.status === "synced" ? "Synchronized" : "Needs attention",
    row.idempotency_key || "",
    row.transaction_id || "",
    row.created_at || "",
    row.updated_at || "",
    row.message || "",
  ])];
  return lines.map((line) => line.map(escapePosCsvCell).join(",")).join("\r\n");
}

export function posReconciliationExportFilename(date = new Date()) {
  return `smart-manager-pos-reconciliation-${date.toISOString().slice(0, 10)}.csv`;
}
