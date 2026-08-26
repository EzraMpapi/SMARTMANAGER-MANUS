import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const supplyChain = source.slice(source.indexOf("function SupplyChain("), source.indexOf("function Shipments("));
const shipments = source.slice(source.indexOf("function Shipments("), source.indexOf("function ShipmentPanel("));
const panel = source.slice(source.indexOf("function ShipmentPanel("), source.indexOf("function ShipmentFormPanel("));
const form = source.slice(source.indexOf("function ShipmentFormPanel("), source.indexOf("function Fleet("));

describe("Supply Chain persistence boundaries", () => {
  it("confirms vehicle status mutations before changing visible fleet state", () => {
    const mutationAt = supplyChain.indexOf('runCompanyTableMutation("scm_vehicles", "update"');
    const stateAt = supplyChain.indexOf("vehicles.setRows((prev) => prev.map((v) => (v.reg === reg ? confirmed : v)));" );
    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(supplyChain).toContain("if (!reg || savingVehicleReg === reg) return false;");
    expect(supplyChain).toContain("Vehicle ${reg} was not updated.");
  });

  it("confirms shipment creation, transitions, and deletion before changing visible rows", () => {
    expect(shipments).toContain('runCompanyTableMutation("scm_shipments", "insert"');
    expect(shipments).toContain('runCompanyTableMutation("scm_shipments", "update"');
    expect(shipments).toContain('runCompanyTableMutation("scm_shipments", "delete"');
    expect(shipments).toContain("if (savingShipment) return;");
    expect(shipments).toContain("if (advancingShipmentId || deletingShipmentId) return false;");
    expect(shipments).toContain("if (deletingShipmentId || advancingShipmentId) return false;");
    expect(shipments).toContain("Shipment was not created.");
    expect(shipments).toContain("Shipment status was not changed.");
    expect(shipments).toContain("Shipment was not deleted.");
    expect(panel).toContain("disabled={advancing || deleting || vehicleSaving}");
    expect(panel).toContain("busy={deleting}");
    expect(form).toContain("disabled={saving}");
    expect(form).toContain('{saving ? "Creating…" : "Create Shipment"}');
  });
});

export {};
