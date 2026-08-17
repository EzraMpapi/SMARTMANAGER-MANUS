const COMPLETED_SUPPORT_STATUSES = new Set(["Resolved", "Closed"]);

function parseTimestamp(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function calculateSupportMetrics(tickets) {
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const completed = safeTickets.filter((ticket) => COMPLETED_SUPPORT_STATUSES.has(ticket?.status));
  const completedWithTiming = completed
    .map((ticket) => {
      const startedAt = parseTimestamp(ticket?.createdAt || ticket?.createdDate);
      const finishedAt = parseTimestamp(ticket?.resolvedAt || ticket?.closedAt);
      if (startedAt === null || finishedAt === null || finishedAt < startedAt) return null;
      return finishedAt - startedAt;
    })
    .filter((duration) => duration !== null);
  const totalHandleMinutes = completedWithTiming.reduce((total, duration) => total + duration, 0) / 60_000;

  return {
    totalCount: safeTickets.length,
    openCount: safeTickets.filter((ticket) => ticket?.status === "Open").length,
    urgentCount: safeTickets.filter((ticket) => !COMPLETED_SUPPORT_STATUSES.has(ticket?.status) && ticket?.priority === "Urgent").length,
    resolutionRate: safeTickets.length ? Math.round((completed.length / safeTickets.length) * 100) : null,
    completedWithTimingCount: completedWithTiming.length,
    avgHandleMinutes: completedWithTiming.length ? Math.round(totalHandleMinutes / completedWithTiming.length) : null,
  };
}
