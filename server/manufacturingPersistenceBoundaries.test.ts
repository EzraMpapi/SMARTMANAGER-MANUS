import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const workOrders = source.slice(source.indexOf("function WorkOrders("), source.indexOf("function WorkOrderPanel("));
const panel = source.slice(source.indexOf("function WorkOrderPanel("), source.indexOf("function WorkOrderFormPanel("));
const form = source.slice(source.indexOf("function WorkOrderFormPanel("), source.indexOf("/* ------------------------------ MACHINES"));

describe("Manufacturing persistence boundaries", () => {
  it("uses confirmed server rows before showing configured work-order creates, lifecycle updates, and deletions", () => {
    const createAt = workOrders.indexOf('const header = await sb("manufacturing_work_orders").insert');
    const createStateAt = workOrders.indexOf("setWorkOrders((prev) => [confirmed, ...prev]);");
    const inventoryUpdateAt = workOrders.indexOf('const savedItem = await sb("inventory_items").eq("sku", c.sku).update');
    const orderStatusAt = workOrders.indexOf('const savedOrder = await sb("manufacturing_work_orders").eq("id", order.dbId ?? order.id).update');
    const lifecycleStateAt = workOrders.indexOf("setWorkOrders((prev) => prev.map((existing) => (existing.id === id ? confirmed : existing)));");
    const deleteAt = workOrders.indexOf('await sb("manufacturing_work_orders").eq("id", order.dbId).delete().single().run();');
    const deleteStateAt = workOrders.indexOf("setWorkOrders((prev) => prev.filter((workOrder) => workOrder.id !== id));");

    expect(createStateAt).toBeGreaterThan(createAt);
    expect(orderStatusAt).toBeGreaterThan(inventoryUpdateAt);
    expect(lifecycleStateAt).toBeGreaterThan(orderStatusAt);
    expect(deleteStateAt).toBeGreaterThan(deleteAt);
    expect(workOrders).not.toContain("Work order created locally, but saving to the server failed.");
    expect(workOrders).not.toContain("Materials deducted locally, but the server update failed.");
  });

  it("preserves work-order and stock context on failed writes while preventing duplicate actions", () => {
    expect(workOrders).toContain("The screen has not changed; reconcile this order and its stock before retrying");
    expect(workOrders).toContain('if (created) setShowForm(false);');
    expect(panel).toContain("const [saving, setSaving] = useState(false);");
    expect(panel).toContain("await onAdvance(order.id, nextStatus);");
    expect(panel).toContain("const deleted = await onDelete(order.id);");
    expect(panel).toContain("if (deleted) onClose();");
    expect(form).toContain("const [submitting, setSubmitting] = useState(false);");
    expect(form).toContain("if (!valid || submitting) return;");
    expect(form).toContain("disabled={submitting}");
    expect(form).toContain('{submitting ? "Saving…" : "Create Work Order"}');
  });
});
