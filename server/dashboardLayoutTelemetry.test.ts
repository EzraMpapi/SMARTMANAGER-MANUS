import { describe, expect, it } from "vitest";
import { aggregateDashboardLayoutEvents, assertDashboardAnalyticsRole, createLayoutSignature } from "./dashboardLayoutTelemetry";

 describe("dashboard layout telemetry", () => {
  it("counts only adoption events and resolves team preset names", () => {
    const result = aggregateDashboardLayoutEvents([
      { event_type: "preset_applied", source_type: "team_role", source_id: "preset-1", layout_signature: "layout-abc12345", occurred_at: "2026-08-27T08:00:00.000Z" },
      { event_type: "layout_applied", source_type: "personal", source_id: null, layout_signature: "layout-personal", occurred_at: "2026-08-27T09:00:00.000Z" },
      { event_type: "preset_pushed", source_type: "team_role", source_id: "preset-1", layout_signature: null, occurred_at: "2026-08-27T10:00:00.000Z" },
    ], [{ id: "preset-1", name: "Finance leads", target_type: "role", target_value: "Finance Manager" }]);
    expect(result.trackedEvents).toBe(3);
    expect(result.adoptionEvents).toBe(2);
    expect(result.topSources[0]).toMatchObject({ label: "Finance leads", sourceType: "team_role", adoptionEvents: 1 });
    expect(result.eventBreakdown.find((row) => row.eventType === "preset_pushed")?.count).toBe(1);
    expect(result.activityByDay).toEqual([{ date: "2026-08-27", adoptionEvents: 2 }]);
    expect(result.note).toContain("No preference payloads or user identifiers");
  });

  it("rejects non-administrator roles at the analytics boundary", () => {
    expect(() => assertDashboardAnalyticsRole("Employee")).toThrowError(/Only an organization administrator/);
    expect(() => assertDashboardAnalyticsRole("Organization Owner")).not.toThrow();
    expect(() => assertDashboardAnalyticsRole("CEO")).not.toThrow();
  });

  it("creates a stable non-sensitive layout signature", () => {
    expect(createLayoutSignature({ compactDensity: true, widgetOrder: ["revenue"] })).toBe(createLayoutSignature({ compactDensity: true, widgetOrder: ["revenue"] }));
    expect(createLayoutSignature({ compactDensity: true })).not.toBe(createLayoutSignature({ compactDensity: false }));
  });
});
