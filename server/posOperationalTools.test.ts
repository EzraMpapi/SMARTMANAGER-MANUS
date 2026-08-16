import { describe, expect, it } from "vitest";
import { parsePosDeviceProfileImport, serializePosDeviceProfile } from "../client/src/lib/posDeviceProfiles";
import { buildPosReconciliationCsv, posReconciliationExportFilename } from "../client/src/lib/posReconciliationExport";

describe("POS operational tools", () => {
  it("exports only a versioned, normalized hardware configuration and restores it safely", () => {
    const serialized = serializePosDeviceProfile({ printerLabel: "Counter A", paperWidth: "58mm", autoPrint: true, copyCount: 2, scannerPrefix: "POS-", secret: "never-export" }, "2026-08-16T00:00:00.000Z");
    expect(serialized).toContain('"kind": "smart-manager-pos-device-profile"');
    expect(serialized).not.toContain("secret");
    expect(parsePosDeviceProfileImport(serialized)).toMatchObject({ printerLabel: "Counter A", paperWidth: "58mm", autoPrint: true, copyCount: 2, scannerPrefix: "POS-" });
  });

  it("rejects malformed and incompatible profile files rather than accepting arbitrary local configuration", () => {
    expect(() => parsePosDeviceProfileImport("not-json")).toThrow("not valid JSON");
    expect(() => parsePosDeviceProfileImport(JSON.stringify({ kind: "other", version: 1, profile: {} }))).toThrow("not a compatible");
  });

  it("exports only the filtered reconciliation fields and neutralizes spreadsheet formula injection", () => {
    const csv = buildPosReconciliationCsv([{ status: "needs_attention", idempotency_key: "=cmd()", transaction_id: "tx-1", created_at: "2026-08-16", updated_at: "2026-08-16", message: "Retry\nrequired" }]);
    expect(csv).toContain('"\'=cmd()"');
    expect(csv).toContain('"Retry required"');
    expect(csv).not.toContain("company_id");
    expect(posReconciliationExportFilename(new Date("2026-08-16T00:00:00.000Z"))).toBe("smart-manager-pos-reconciliation-2026-08-16.csv");
  });
});
