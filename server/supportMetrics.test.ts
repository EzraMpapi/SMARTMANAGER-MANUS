import { describe, expect, it } from "vitest";
import { calculateSupportMetrics } from "../client/src/lib/supportMetrics";

describe("confirmed support metrics", () => {
  it("calculates completed-ticket timing only from valid confirmed lifecycle timestamps", () => {
    const metrics = calculateSupportMetrics([
      { status: "Resolved", priority: "High", createdAt: "2026-08-17T08:00:00.000Z", resolvedAt: "2026-08-17T08:30:00.000Z" },
      { status: "Closed", priority: "Low", createdAt: "2026-08-17T09:00:00.000Z", closedAt: "2026-08-17T10:30:00.000Z" },
      { status: "Open", priority: "Urgent", createdAt: "2026-08-17T10:00:00.000Z" },
    ]);

    expect(metrics).toMatchObject({ totalCount: 3, openCount: 1, urgentCount: 1, resolutionRate: 67, completedWithTimingCount: 2, avgHandleMinutes: 60 });
  });

  it("does not invent an average when completed tickets lack usable lifecycle timestamps", () => {
    const metrics = calculateSupportMetrics([
      { status: "Resolved", priority: "Medium", createdAt: "invalid", resolvedAt: "2026-08-17T09:00:00.000Z" },
      { status: "Closed", priority: "Low", createdAt: "2026-08-17T10:00:00.000Z", closedAt: "2026-08-17T09:00:00.000Z" },
    ]);

    expect(metrics.completedWithTimingCount).toBe(0);
    expect(metrics.avgHandleMinutes).toBeNull();
  });
});
