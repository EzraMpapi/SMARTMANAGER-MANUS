function safeCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function jsonCell(value) {
  return value == null ? "" : JSON.stringify(value);
}

export function buildOwnerRecordHistoryCsv(rows = []) {
  const header = [
    "Timestamp", "Operation", "Table", "Record ID", "Actor", "Actor Role",
    "Changed Fields", "Previous Snapshot", "New Snapshot",
  ];
  const body = rows.map((row) => [
    row.created_at || "",
    row.operation || "",
    row.table_name || "",
    row.record_id || "",
    row.actor_name || "System",
    row.actor_role || "",
    Array.isArray(row.changed_fields) ? row.changed_fields.join(" | ") : "",
    jsonCell(row.old_data),
    jsonCell(row.new_data),
  ]);
  return [header, ...body].map((line) => line.map(safeCell).join(",")).join("\r\n");
}

export function ownerRecordHistoryExportFilename(now = new Date()) {
  return `smart-manager-owner-record-history-${now.toISOString().slice(0, 10)}.csv`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildOwnerRecordHistoryPrintHtml(rows = [], generatedAt = new Date()) {
  const tableRows = rows.map((row) => {
    const changed = Array.isArray(row.changed_fields) ? row.changed_fields.join(", ") : "";
    const oldSnapshot = row.old_data == null ? "" : JSON.stringify(row.old_data, null, 2);
    const newSnapshot = row.new_data == null ? "" : JSON.stringify(row.new_data, null, 2);
    return `<tr>
      <td>${escapeHtml(row.created_at ? new Date(row.created_at).toLocaleString() : "—")}</td>
      <td><strong>${escapeHtml(row.operation)}</strong></td>
      <td>${escapeHtml(row.table_name)}<br><small>${escapeHtml(row.record_id || "")}</small></td>
      <td>${escapeHtml(row.actor_name || "System")}<br><small>${escapeHtml(row.actor_role || "")}</small></td>
      <td>${escapeHtml(changed)}</td>
      <td><pre>${escapeHtml(oldSnapshot)}</pre></td>
      <td><pre>${escapeHtml(newSnapshot)}</pre></td>
    </tr>`;
  }).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Smart Manager Owner Record History</title><style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: Arial, sans-serif; color: #172033; font-size: 9px; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    .meta { color: #64748b; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th { background: #0f5132; color: white; text-align: left; }
    th, td { border: 1px solid #dbe4ea; padding: 5px; vertical-align: top; word-break: break-word; }
    th:nth-child(1) { width: 12%; } th:nth-child(2) { width: 7%; } th:nth-child(3) { width: 14%; }
    th:nth-child(4) { width: 13%; } th:nth-child(5) { width: 12%; } th:nth-child(6), th:nth-child(7) { width: 21%; }
    pre { white-space: pre-wrap; max-height: 120px; overflow: hidden; margin: 0; font: 7px/1.3 monospace; }
    small { color: #64748b; }
    footer { margin-top: 12px; color: #64748b; }
  </style></head><body>
    <h1>Smart Manager — Owner Record History</h1>
    <div class="meta">Immutable tenant-scoped history · ${rows.length} retained event(s) · Generated ${escapeHtml(generatedAt.toLocaleString())}</div>
    <table><thead><tr><th>Timestamp</th><th>Operation</th><th>Table / Record</th><th>Actor</th><th>Changed fields</th><th>Previous snapshot</th><th>New snapshot</th></tr></thead><tbody>${tableRows || '<tr><td colspan="7">No matching history records.</td></tr>'}</tbody></table>
    <footer>Owner/auditor export. Deleted records remain represented by their retained previous snapshot.</footer>
    <script>window.onload = function () { window.print(); };</script>
  </body></html>`;
}
