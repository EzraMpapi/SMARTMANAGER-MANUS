import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const pos = source.slice(source.indexOf("function POS("), source.indexOf("function Checkout"));
const reconciliation = source.slice(source.indexOf("function PosReconciliationDashboard"), source.indexOf("function Checkout"));

describe("POS operational tools UI integration", () => {
  it("exposes device-profile export/import only through the scoped browser-local profile path", () => {
    expect(pos).toContain("serializePosDeviceProfile(deviceProfile)");
    expect(pos).toContain("parsePosDeviceProfileImport(reader.result)");
    expect(pos).toContain("writePosDeviceProfile(window.localStorage, deviceScope");
    expect(pos).toContain("32 KB or smaller");
    expect(pos).toContain("Export counter profile");
    expect(pos).toContain("Import counter profile");
  });

  it("limits reconciliation export to manager-class roles and the currently filtered RLS-scoped outcomes", () => {
    expect(reconciliation).toContain('const canExport = ["Super Administrator", "Organization Owner", "CEO", "CFO", "Finance Manager", "HR Manager", "Sales Manager", "Procurement Officer", "Warehouse Manager", "Project Manager"].includes(canonicalRoleId(currentUser?.role));');
    expect(reconciliation).toContain("buildPosReconciliationCsv(rows)");
    expect(reconciliation).toContain("posReconciliationExportFilename()");
    expect(reconciliation).toContain("Export CSV");
    expect(reconciliation).toContain("tenant-scoped reconciliation outcome");
  });
});
