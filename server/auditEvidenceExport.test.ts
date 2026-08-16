import { describe, expect, it } from "vitest";
import { buildAuditEvidenceCsv } from "../client/src/lib/auditEvidenceExport";

describe("audit evidence export", () => {
  it("escapes cells and prevents spreadsheet formula execution", () => {
    const csv = buildAuditEvidenceCsv([{ timestamp: "2026-08-16T00:00:00Z", module: "Security", action: "=SUM(1,1)", actor: "Admin", details: "line one\nline two" }]);
    expect(csv).toContain("'=SUM(1,1)");
    expect(csv).toContain("line one line two");
  });
});
