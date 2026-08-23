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

  it("covers the Procurement Officer spend and replenishment widget", () => {
    for (const text of ["Procurement spend and replenishment widget", "Procurement pulse", "Supplier spend and replenishment signals", "Live source snapshot", "Supplier & stock spend", "Replenishment pressure", "pending or scheduled", "At-risk value", "Open replenishment queue", "not a forecast or purchase-order commitment"]) expect(workspace).toContain(text);
    for (const source of ["finance_expenses", "inventory_items", "inventory_suppliers"]) expect(workspace).toContain(source);
  });

  it("covers the dedicated Warehouse Manager control tower", () => {
    for (const text of ["Warehouse Manager command center", "Warehouse operations control tower", "Stock, work orders, and operational throughput", "Warehouse workload", "Warehouse action queue", "Supplier and POS coverage", "Open work orders", "Completed POS sales"]) expect(workspace).toContain(text);
    for (const source of ["manufacturing_work_orders", "inventory_items", "inventory_suppliers", "pos_transactions"]) expect(workspace).toContain(source);
  });

  it("covers Supply Chain and POS control towers", () => {
    for (const text of ["Supply chain control tower", "Deliveries, fleet readiness, and exceptions", "Shipment status", "Logistics exceptions", "POS command center", "Counter throughput and payment mix", "Payment mix", "Stock linkage"]) expect(workspace).toContain(text);
    for (const source of ["scm_shipments", "scm_vehicles", "pos_transactions", "pos_transaction_items"]) expect(workspace).toContain(source);
  });

  it("keeps operations roles routed to distinct command centers", () => {
    expect(dashboard).toContain('const isProcurementOfficer = currentRole.id === "Procurement Officer"');
    expect(dashboard).toContain('<ProcurementCommandCenter inventory={inventory} suppliers={suppliers} expenses={expenses} onNavigate={onNavigate} />');
    expect(dashboard).toContain('<WarehouseCommandCenter inventory={inventory} suppliers={suppliers} workOrders={workOrders} posTransactions={posTransactions} onNavigate={onNavigate} />');
  });

  it("keeps all four centers wired through existing module routes", () => {
    for (const route of [
      '{active === "inventory" && <Inventory',
      '{active === "procurement" && <Procurement',
      '{active === "scm" && <SupplyChain',
      '{active === "pos" && <POS',
    ]) expect(dashboard).toContain(route);
    expect(workspace).toContain("Insufficient confirmed data");
  });
});
