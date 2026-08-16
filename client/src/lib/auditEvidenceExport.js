function safeCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function buildAuditEvidenceCsv(entries) {
  const header = ["Timestamp", "Module", "Action", "Actor", "Details"];
  const rows = entries.map((entry) => [entry.timestamp, entry.module || "System", entry.action, entry.actor || "System", entry.details || ""]);
  return [header, ...rows].map((row) => row.map(safeCell).join(",")).join("\r\n");
}

export function auditEvidenceExportFilename(now = new Date()) {
  return `smart-manager-audit-evidence-${now.toISOString().slice(0, 10)}.csv`;
}
