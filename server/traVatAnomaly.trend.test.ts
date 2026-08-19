import { describe, expect, it } from "vitest";
import { buildVatTrendPoints } from "./traVatAnomaly";

describe("monthly VAT trend aggregation", () => {
  it("returns a complete zero-filled period series when no records exist", () => {
    const points = buildVatTrendPoints("2026-06", 4);

    expect(points.map((point) => point.period)).toEqual(["2026-03", "2026-04", "2026-05", "2026-06"]);
    expect(points.every((point) => point.vat === 0 && point.anomalyEvents === 0 && point.serverConfirmedRate === null)).toBe(true);
  });

  it("combines receipt totals and persisted anomaly events without fabricating missing months", () => {
    const points = buildVatTrendPoints(
      "2026-06",
      4,
      [
        { period: "2026-04", vat: "180000.50", verifiedReceipts: 8, failedReceipts: 1, totalReceipts: 10 },
        { period: "2026-06", vat: "250000", verifiedReceipts: 5, failedReceipts: 0, totalReceipts: 5 },
      ],
      [
        { period: "2026-04", anomalyEvents: 2, triggeredAnomalies: 1, suppressedAnomalies: 1 },
      ],
    );

    expect(points[1]).toMatchObject({
      period: "2026-04",
      vat: 180000.5,
      verifiedReceipts: 8,
      failedReceipts: 1,
      totalReceipts: 10,
      serverConfirmedRate: 80,
      anomalyEvents: 2,
      triggeredAnomalies: 1,
      suppressedAnomalies: 1,
    });
    expect(points[0].vat).toBe(0);
    expect(points[3].serverConfirmedRate).toBe(100);
  });

  it("clamps the requested chart window to a safe 3-to-24 month range", () => {
    expect(buildVatTrendPoints("2026-06", 1)).toHaveLength(3);
    expect(buildVatTrendPoints("2026-06", 40)).toHaveLength(24);
  });
});
