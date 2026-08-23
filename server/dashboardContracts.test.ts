import { describe, expect, it } from "vitest";
import {
  DASHBOARD_DATA_STATUS,
  asRows,
  buildActionItem,
  buildDashboardMetric,
  buildDrilldownTarget,
  dataStatusFor,
  percentChange,
  sourceNoteFor,
  trendFromPeriods,
} from "../client/src/dashboardContracts.js";

describe("dashboard data contracts", () => {
  it("normalizes shared table wrappers without treating objects as row arrays", () => {
    const rows = [{ id: "1" }];
    expect(asRows({ rows })).toEqual(rows);
    expect(asRows(rows)).toEqual(rows);
    expect(asRows({ data: rows })).toEqual([]);
    expect(asRows(null)).toEqual([]);
  });

  it("labels confirmed, insufficient, unavailable, and warning states truthfully", () => {
    expect(dataStatusFor({ rows: [{ id: "1" }] })).toBe("confirmed");
    expect(dataStatusFor({ rows: [] })).toBe("insufficient");
    expect(dataStatusFor({ rows: [{ id: "1" }], hasSource: false })).toBe("unavailable");
    expect(dataStatusFor({ rows: [{ id: "1" }], warning: true })).toBe("warning");
    expect(DASHBOARD_DATA_STATUS.insufficient.label).toBe("Insufficient confirmed data");
  });

  it("keeps metrics and action items source-aware and drill-down capable", () => {
    const action = () => undefined;
    const metric = buildDashboardMetric({ id: "revenue", label: "Revenue", value: 1250, source: "sales_invoices", onAction: action });
    const item = buildActionItem({ id: "overdue-1", title: "Overdue invoice", source: "sales_invoices", onAction: action });
    expect(metric).toMatchObject({ id: "revenue", status: "confirmed", source: "sales_invoices", onAction: action });
    expect(item).toMatchObject({ id: "overdue-1", severity: "info", source: "sales_invoices", onAction: action });
    expect(buildDrilldownTarget("finance", { tab: "receivables" })).toEqual({ module: "finance", params: { tab: "receivables" } });
    expect(sourceNoteFor("demo", "seed records")).toContain("Demo data");
  });

  it("calculates trends only when a comparable prior period exists", () => {
    expect(percentChange(115, 100)).toBe(15);
    expect(percentChange(100, 0)).toBeNull();
    expect(trendFromPeriods(115, 100)).toMatchObject({ direction: "up", change: 15 });
    expect(trendFromPeriods(100, 0)).toMatchObject({ direction: "neutral", change: null });
  });
});
