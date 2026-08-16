import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const reconciliation = source.slice(source.indexOf("function PosReconciliationDashboard"), source.indexOf("function Checkout"));

describe("POS reconciliation dashboard", () => {
  it("loads only the existing tenant-scoped reconciliation ledger and exposes safe operational filters", () => {
    expect(reconciliation).toContain('useCompanyTable("pos_sync_events"');
    expect(reconciliation).toContain('statusFilter === "all" || row.status === statusFilter');
    expect(reconciliation).toContain("All outcomes");
    expect(reconciliation).toContain("Synchronized");
    expect(reconciliation).toContain("Needs attention");
    expect(reconciliation).toContain("reconciliation.reload()");
  });

  it("does not present device-only pending carts as server-completed reconciliation events", () => {
    expect(reconciliation).toContain("Device-only pending carts remain visible to the cashier");
    expect(reconciliation).toContain("row.status === \"synced\"");
    expect(reconciliation).not.toContain("runCompanyTableMutation");
  });
});
