import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("Finance General Ledger contracts", () => {
  it("renders its running-balance chart from the memoized ledger collection instead of an undefined entries variable", () => {
    const ledgerSource = dashboardSource.slice(
      dashboardSource.indexOf("function GeneralLedger"),
      dashboardSource.indexOf("// A real, standard chart of accounts")
    );

    expect(ledgerSource).toContain("const ledger = useMemo(() => buildLedger(invoices, expenses, posTransactions)");
    expect(ledgerSource).toContain("{ledger.length > 0 && (");
    expect(ledgerSource).toContain("data={ledger.slice(-30).map");
    expect(ledgerSource).not.toContain("entries.length");
    expect(ledgerSource).not.toContain("data={entries.slice");
  });
});
