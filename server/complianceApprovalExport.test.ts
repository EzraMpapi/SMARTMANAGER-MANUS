import { describe, expect, it } from "vitest";
import { buildComplianceApprovalCsv } from "../client/src/lib/complianceApprovalExport";

describe("compliance approval export", () => {
  it("includes role-change approval history and formula-protects untrusted values", () => {
    const csv = buildComplianceApprovalCsv(
      [{ createdAt: "2026-08-16T12:00:00.000Z", module: "Security", action: "Role change submitted for approval", actorName: "Requester", details: "=SUM(1,1)" }],
      [{ id: "approval-1", name: "Role change: Finance Manager → CEO", status: "Approved", createdAt: "2026-08-16T13:00:00.000Z", notes: "@review", data: { currentRole: "Finance Manager", requestedRole: "CEO", requestedBy: { name: "Requester", role: "Finance Manager" }, decision: { status: "Approved", note: "+independent review", decidedBy: { name: "Administrator", role: "CEO" } } } }],
    );

    expect(csv).toContain("\"Role-change approval\"");
    expect(csv).toContain("\"approval-1\"");
    expect(csv).toContain("\"'=SUM(1,1)\"");
    expect(csv).toContain("approved by Administrator · CEO; note: +independent review");
  });
});
