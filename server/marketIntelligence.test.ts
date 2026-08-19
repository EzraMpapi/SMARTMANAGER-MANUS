import { describe, expect, it } from "vitest";
import { normalizeBankRows, normalizeDseRows } from "./marketIntelligence";

describe("market intelligence response validation", () => {
  it("normalizes validated bank-rate records and rejects incomplete rows", () => {
    const rows = normalizeBankRows({ data: [
      { bank: "Example Bank", pair: "USD/TZS", buying: "2,600.10", selling: 2640.2, lendingRate: "15.4", timestamp: "2026-08-19T00:00:00.000Z" },
      { bank: "Incomplete Bank", buying: "" },
    ] }, "approved-bank-provider");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ bankName: "Example Bank", currencyPair: "USD/TZS", buyRate: 2600.1, sellRate: 2640.2, lendingRateAnnual: 15.4, status: "LIVE", source: "approved-bank-provider" });
  });

  it("normalizes DSE records and retains only finite validated prices", () => {
    const rows = normalizeDseRows({ results: [
      { ticker: "TEST", name: "Example Listed Company", ltp: "1250", change: "12.5", percentChange: "1.01", volume: "300" },
      { ticker: "BROKEN", ltp: "not-a-number" },
    ] }, "approved-dse-provider");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ symbol: "TEST", companyName: "Example Listed Company", priceTzs: 1250, changeTzs: 12.5, changePercent: 1.01, volume: 300, status: "LIVE", source: "approved-dse-provider" });
  });

  it("does not turn missing arrays into synthetic financial records", () => {
    expect(normalizeBankRows({ message: "not configured" }, "provider")).toEqual([]);
    expect(normalizeDseRows({ message: "not configured" }, "provider")).toEqual([]);
  });
});
