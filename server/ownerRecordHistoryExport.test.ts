import { describe, expect, it } from "vitest";
import { buildOwnerRecordHistoryCsv, buildOwnerRecordHistoryPrintHtml, ownerRecordHistoryExportFilename } from "../client/src/lib/ownerRecordHistoryExport";

describe("owner record history export", () => {
  const rows = [{
    created_at: "2026-11-09T10:00:00.000Z",
    operation: "DELETE",
    table_name: "customers",
    record_id: "customer-1",
    actor_name: "Owner",
    actor_role: "organization owner",
    changed_fields: ["status", "name"],
    old_data: { name: "A < B", status: "active" },
    new_data: null,
  }];

  it("exports all audit columns and neutralizes spreadsheet formulas", () => {
    const csv = buildOwnerRecordHistoryCsv([{ ...rows[0], actor_name: "=HYPERLINK(\"https://bad\")" }]);
    expect(csv).toContain('"Timestamp","Operation","Table","Record ID","Actor","Actor Role","Changed Fields","Previous Snapshot","New Snapshot"');
    expect(csv).toContain("'=HYPERLINK(\"\"https://bad\"\")");
    expect(csv).toContain("customers");
    expect(csv).toContain("status | name");
    expect(csv).toContain("A < B");
  });

  it("creates a print-ready PDF source document without raw HTML injection", () => {
    const html = buildOwnerRecordHistoryPrintHtml(rows, new Date("2026-11-09T10:00:00.000Z"));
    expect(html).toContain("Smart Manager — Owner Record History");
    expect(html).toContain("window.print()");
    expect(html).toContain("&lt; B");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("Deleted records remain represented");
  });

  it("uses a stable date-based CSV filename", () => {
    expect(ownerRecordHistoryExportFilename(new Date("2026-11-09T10:00:00.000Z"))).toBe("smart-manager-owner-record-history-2026-11-09.csv");
  });
});
