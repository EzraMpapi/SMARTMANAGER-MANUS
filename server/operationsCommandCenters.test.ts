import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/OperationsCommandCenters.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("operations command-center contracts", () => {
  it("covers Inventory and Procurement control towers", () => {
    for (const text of ["Inventory control tower", "Stock readiness and replenishment risk", "Stock distribution", "Replenishment queue", "Procurement control tower", "Supplier coverage and purchasing readiness", "Open purchase orders", "Supplier spend", "Pending approvals"]) expect(workspace).toContain(text);
    for (const source of ["inventory_items", "inventory_suppliers", "finance_expenses"]) expect(workspace).toContain(source);
  });

  it("covers Supply Chain and POS control towers", () => {
    for (const text of ["Supply chain control tower", "Deliveries, fleet readiness, and exceptions", "Shipment status", "Logistics exceptions", "POS command center", "Counter throughput and payment mix", "Payment mix", "Stock linkage"]) expect(workspace).toContain(text);
    for (const source of ["scm_shipments", "scm_vehicles", "pos_transactions", "pos_transaction_items"]) expect(workspace).toContain(source);
  });

  it("keeps all four centers wired through existing module routes", () => {
    for (const tag of ["<InventoryCommandCenter", "<ProcurementCommandCenter", "<SupplyChainCommandCenter", "<PosCommandCenter"]) expect(dashboard).toContain(tag);
    expect(workspace).toContain("Insufficient confirmed data");
  });
});
