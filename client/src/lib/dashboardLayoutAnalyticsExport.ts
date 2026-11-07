export interface DashboardLayoutAnalyticsExportData {
  range: string;
  eventType?: string | null;
  adoptionEvents: number;
  trackedEvents: number;
  topSources: Array<{ label: string; sourceType: string; adoptionEvents: number }>;
  topLayouts: Array<{ signature: string; sourceType: string; adoptionEvents: number }>;
  activityByDay: Array<{ date: string; adoptionEvents: number }>;
  eventBreakdown: Array<{ eventType: string; count: number }>;
}

function safeCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function buildDashboardLayoutAnalyticsCsv(data: DashboardLayoutAnalyticsExportData, exportedAt = new Date()) {
  const rows: unknown[][] = [
    ["Smart Manager dashboard layout analytics"],
    ["Exported at (UTC)", exportedAt.toISOString()],
    ["Range", data.range],
    ["Event type filter", data.eventType || "All event types"],
    ["Privacy boundary", "Aggregate adoption events only; no user identifiers, business records, or preference payloads"],
    [],
    ["Summary"],
    ["Adoption events", data.adoptionEvents],
    ["Tracked events", data.trackedEvents],
    [],
    ["Most applied sources"],
    ["Source", "Source type", "Adoption events"],
    ...data.topSources.map((row) => [row.label, row.sourceType, row.adoptionEvents]),
    [],
    ["Layout signatures"],
    ["Opaque signature", "Source type", "Adoption events"],
    ...data.topLayouts.map((row) => [row.signature, row.sourceType, row.adoptionEvents]),
    [],
    ["Daily activity (UTC)"],
    ["Date", "Adoption events"],
    ...data.activityByDay.map((row) => [row.date, row.adoptionEvents]),
    [],
    ["Event breakdown"],
    ["Event type", "Count"],
    ...data.eventBreakdown.map((row) => [row.eventType, row.count]),
  ];
  return rows.map((row) => row.map(safeCell).join(",")).join("\r\n");
}

export function dashboardLayoutAnalyticsExportFilename(now = new Date(), eventType?: string | null) {
  const suffix = eventType ? `-${eventType.replace(/[^a-z0-9_-]+/gi, "-")}` : "";
  return `smart-manager-dashboard-layout-analytics${suffix}-${now.toISOString().slice(0, 10)}.csv`;
}
