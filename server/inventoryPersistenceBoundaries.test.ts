import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const inventory = source.slice(source.indexOf("function Inventory("), source.indexOf("function ItemPanel("));
const itemPanel = source.slice(source.indexOf("function ItemPanel("), source.indexOf("function ItemFormPanel("));
const itemForm = source.slice(source.indexOf("function ItemFormPanel("), source.indexOf("/* -------------------------------- WAREHOUSES"));

describe("Inventory persistence boundaries", () => {
  it("uses returned server rows before showing configured creates, imports, stock changes, or deletions", () => {
    const importInsertAt = inventory.indexOf('const savedRows = await sb("inventory_items").insert');
    const importStateAt = inventory.indexOf("setItems((prev) => [...confirmed, ...prev]);");
    const itemInsertAt = inventory.indexOf('const saved = await sb("inventory_items").insert({');
    const itemStateAt = inventory.indexOf("setItems((prev) => [confirmed, ...prev]);");
    const stockUpdateAt = inventory.indexOf('const saved = await sb("inventory_items").eq("sku", sku).update');
    const stockStateAt = inventory.indexOf("setItems((prev) => prev.map((it) => (it.sku === sku ? confirmed : it)));");
    const itemDeleteAt = inventory.indexOf('await sb("inventory_items").eq("sku", sku).delete().single().run();');
    const deleteStateAt = inventory.indexOf("setItems((prev) => prev.filter((it) => it.sku !== sku));");

    expect(importStateAt).toBeGreaterThan(importInsertAt);
    expect(itemStateAt).toBeGreaterThan(itemInsertAt);
    expect(stockStateAt).toBeGreaterThan(stockUpdateAt);
    expect(deleteStateAt).toBeGreaterThan(itemDeleteAt);
    expect(inventory).not.toContain("Item created locally, but saving to the server failed.");
    expect(inventory).not.toContain("Some rows saved locally but failed to reach the server.");
  });

  it("keeps failed stock actions and item-entry context available for retry while preventing duplicate submissions", () => {
    expect(inventory).toContain("The quantity has not changed here.");
    expect(inventory).toContain('if (created) setShowForm(false);');
    expect(itemPanel).toContain("const [saving, setSaving] = useState(false);");
    expect(itemPanel).toContain("const adjusted = await onAdjust(item.sku, n);");
    expect(itemPanel).toContain("if (adjusted) {");
    expect(itemPanel).toContain("const deleted = await onDelete(item.sku);");
    expect(itemPanel).toContain("if (deleted) onClose();");
    expect(itemForm).toContain("const [submitting, setSubmitting] = useState(false);");
    expect(itemForm).toContain("if (!valid || submitting) return;");
    expect(itemForm).toContain("disabled={submitting}");
    expect(itemForm).toContain('{submitting ? "Saving…" : "Create Item"}');
  });
});
