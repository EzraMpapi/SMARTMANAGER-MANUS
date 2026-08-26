import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const purchaseOrders = source.slice(source.indexOf("function PurchaseOrders("), source.indexOf("function PurchaseOrderPanel("));
const panel = source.slice(source.indexOf("function PurchaseOrderPanel("), source.indexOf("function PurchaseOrderFormPanel("));
const form = source.slice(source.indexOf("function PurchaseOrderFormPanel("), source.indexOf("/* ---------------------------------- APPROVALS"));

describe("Procurement persistence boundaries", () => {
  it("shows configured purchase-order and receipt state only after confirmed server responses", () => {
    const headerInsertAt = purchaseOrders.indexOf('const header = await sb("procurement_purchase_orders").insert');
    const orderStateAt = purchaseOrders.indexOf("setRows((prev) => [confirmed, ...prev]);");
    const inventoryUpdateAt = purchaseOrders.indexOf('const savedItem = await sb("inventory_items").eq("sku", it.sku).update');
    const receivedStateAt = purchaseOrders.indexOf("inventory.setRows((prev) => prev.map((item) => inventoryUpdates.find");
    const cancelUpdateAt = purchaseOrders.indexOf('const saved = await sb("procurement_purchase_orders").eq("id", o.dbId).update');
    const cancelStateAt = purchaseOrders.indexOf("setRows((prev) => prev.map((existing) => (existing.id === id ? confirmed : existing)));");

    expect(orderStateAt).toBeGreaterThan(headerInsertAt);
    expect(receivedStateAt).toBeGreaterThan(inventoryUpdateAt);
    expect(cancelStateAt).toBeGreaterThan(cancelUpdateAt);
    expect(purchaseOrders).not.toContain("PO created locally, but saving to the server failed.");
    expect(purchaseOrders).not.toContain("Received locally, but the server update failed.");
  });

  it("preserves draft and panel context on failed writes while preventing duplicate submissions", () => {
    expect(purchaseOrders).toContain("The screen has not changed; reconcile this PO and stock before retrying");
    expect(purchaseOrders).toContain('if (created) setShowForm(false);');
    expect(panel).toContain("const [saving, setSaving] = useState(false);");
    expect(panel).toContain("await onReceive();");
    expect(panel).toContain("await onCancel();");
    expect(panel).toContain('{saving ? "Saving…" : "Mark Received"}');
    expect(form).toContain("const [submitting, setSubmitting] = useState(false);");
    expect(form).toContain("if (!valid || submitting) return;");
    expect(form).toContain("disabled={!valid || submitting}");
    expect(form).toContain('{submitting ? "Saving…" : "Create PO"}');
  });
});
