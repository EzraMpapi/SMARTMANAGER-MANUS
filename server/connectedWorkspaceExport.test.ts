import { describe, expect, it } from "vitest";
import { buildConnectedWorkspaceCsv, connectedWorkspaceExportFilename } from "../client/src/lib/connectedWorkspaceExport";

describe("connected workspace CSV export", () => {
  it("exports selected-date summary and confirmed records with safe CSV cells", () => {
    const csv = buildConnectedWorkspaceCsv({
      date: "2026-10-08",
      revenue: 1200,
      expensesTotal: 250,
      net: 950,
      invoices: [{ id: "INV-1", date: "2026-10-08", status: "Paid", customer: "=Formula", amountPaid: 1200 }],
      expenses: [{ id: "EXP-1", date: "2026-10-08", category: "Fuel", amount: 250 }],
      leads: [],
    });

    expect(csv).toContain('"Total revenue","1200"');
    expect(csv).toContain('"Total expenses","250"');
    expect(csv).toContain('"Sales","INV-1","Paid","\'=Formula","1200"');
    expect(csv).toContain('"Finance","EXP-1"');
    expect(csv).not.toContain("2026-10-07");
  });

  it("creates a date-specific filename", () => {
    expect(connectedWorkspaceExportFilename("2026-10-08")).toBe("smart-manager-workspace-records-2026-10-08.csv");
  });
});
