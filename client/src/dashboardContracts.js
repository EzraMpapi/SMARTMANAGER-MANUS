/**
 * Shared contracts for the module-aware dashboard ecosystem.
 *
 * These helpers deliberately keep dashboard claims tied to the rows a module
 * actually exposes. They are presentation contracts only: they do not fetch,
 * mutate, or authorize data. Authorization and tenant isolation remain owned by
 * the existing server/session boundary.
 */

export const DASHBOARD_DATA_STATUS = Object.freeze({
  confirmed: Object.freeze({
    label: "Confirmed data",
    description: "Calculated from server-confirmed workspace records.",
    tone: "positive",
  }),
  demo: Object.freeze({
    label: "Demo data",
    description: "Illustrative records are shown for demonstration only.",
    tone: "neutral",
  }),
  insufficient: Object.freeze({
    label: "Insufficient confirmed data",
    description: "There is not enough confirmed data to calculate this view.",
    tone: "muted",
  }),
  unavailable: Object.freeze({
    label: "Not available",
    description: "This capability is not connected in the current workspace.",
    tone: "muted",
  }),
  warning: Object.freeze({
    label: "Needs review",
    description: "Confirmed records indicate an operational condition requiring attention.",
    tone: "warning",
  }),
});

export function asRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

export function dataStatusFor({ rows = [], hasSource = true, minimumRows = 1, warning = false } = {}) {
  const normalizedRows = asRows(rows);
  if (!hasSource) return "unavailable";
  if (warning && normalizedRows.length > 0) return "warning";
  if (normalizedRows.length < minimumRows) return "insufficient";
  return "confirmed";
}

export function buildDashboardMetric({
  id,
  label,
  value = null,
  unit = "",
  source,
  status = "confirmed",
  context = "",
  actionLabel = "Open records",
  onAction = null,
  trend = null,
  tone = "neutral",
} = {}) {
  const resolvedStatus = DASHBOARD_DATA_STATUS[status] ? status : "insufficient";
  return {
    id: String(id || label || "metric"),
    label: String(label || "Metric"),
    value,
    unit,
    source: source || DASHBOARD_DATA_STATUS[resolvedStatus].description,
    status: resolvedStatus,
    statusLabel: DASHBOARD_DATA_STATUS[resolvedStatus].label,
    context,
    actionLabel,
    onAction,
    trend,
    tone,
  };
}

export function buildActionItem({
  id,
  title,
  detail,
  severity = "info",
  source,
  actionLabel = "Review",
  onAction = null,
} = {}) {
  return {
    id: String(id || title || "action"),
    title: String(title || "Review item"),
    detail: String(detail || ""),
    severity,
    source: source || "Confirmed workspace records",
    actionLabel,
    onAction,
  };
}

export function buildDrilldownTarget(module, params = {}) {
  return {
    module: String(module || "dashboard"),
    params: { ...params },
  };
}

export function percentChange(current, previous) {
  const currentValue = Number(current);
  const previousValue = Number(previous);
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue === 0) return null;
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
}

export function trendFromPeriods(current, previous, { minimumAbsoluteChange = 0 } = {}) {
  const change = percentChange(current, previous);
  if (change === null || Math.abs(Number(current) - Number(previous)) < minimumAbsoluteChange) {
    return { direction: "neutral", change: null, label: "No comparable prior period" };
  }
  return {
    direction: change > 0 ? "up" : "down",
    change,
    label: `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs prior period`,
  };
}

export function dateWithinRange(value, startDate = "", endDate = "") {
  const date = String(value || "");
  if (!date) return false;
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
}

export function sourceNoteFor(status, source) {
  const meta = DASHBOARD_DATA_STATUS[status] || DASHBOARD_DATA_STATUS.insufficient;
  return source ? `${meta.label} · ${source}` : meta.label;
}
