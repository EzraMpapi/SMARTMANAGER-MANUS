type AuditRecord = {
  createdAt: Date | string;
  module?: string | null;
  action?: string | null;
  actorName?: string | null;
  actorOpenId?: string | null;
  details?: string | null;
};

type RoleApproval = {
  id?: string;
  name?: string;
  status?: string;
  notes?: string;
  createdAt?: string | null;
  data?: unknown;
};

function safeCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function personLabel(value: unknown, fallback = "System") {
  const person = object(value);
  const name = typeof person.name === "string" ? person.name : "";
  const role = typeof person.role === "string" ? person.role : "";
  return [name || fallback, role].filter(Boolean).join(" · ");
}

function approvalDetails(approval: RoleApproval) {
  const data = object(approval.data);
  const decision = object(data.decision);
  const currentRole = typeof data.currentRole === "string" ? data.currentRole : "";
  const requestedRole = typeof data.requestedRole === "string" ? data.requestedRole : "";
  const requestedBy = personLabel(data.requestedBy, "Verified requester");
  const decidedBy = decision.status ? personLabel(decision.decidedBy, "Verified administrator") : "";
  const note = typeof decision.note === "string" ? decision.note : approval.notes || "";
  return [
    currentRole || requestedRole ? `${currentRole || "Unspecified"} → ${requestedRole || "Unspecified"}` : "Role change request",
    `requested by ${requestedBy}`,
    decidedBy ? `${String(decision.status).toLowerCase()} by ${decidedBy}` : "awaiting an independent administrator decision",
    note ? `note: ${note}` : "",
  ].filter(Boolean).join("; ");
}

export function buildComplianceApprovalCsv(logs: AuditRecord[], approvals: RoleApproval[]) {
  const headers = ["Record type", "Timestamp", "Module", "Action", "Status / severity", "Actor", "Target", "Details", "Record ID"];
  const auditRows = logs.map((log) => [
    "Audit event",
    new Date(log.createdAt).toISOString(),
    log.module || "System",
    log.action || "Audit event",
    String(log.action || "").includes("DELETE") || String(log.action || "").includes("EXCEED") || String(log.action || "").includes("ROLE") ? "HIGH" : "INFO",
    log.actorName || log.actorOpenId || "System",
    "",
    log.details || "",
    "",
  ]);
  const approvalRows = approvals.map((approval) => {
    const data = object(approval.data);
    return [
      "Role-change approval",
      approval.createdAt ? new Date(approval.createdAt).toISOString() : "",
      "Security",
      approval.name || "Role change approval",
      approval.status || "Pending Review",
      personLabel(data.requestedBy, "Verified requester"),
      typeof data.requestedRole === "string" ? data.requestedRole : "",
      approvalDetails(approval),
      approval.id || "",
    ];
  });
  return [headers, ...auditRows, ...approvalRows].map((row) => row.map(safeCell).join(",")).join("\r\n");
}
