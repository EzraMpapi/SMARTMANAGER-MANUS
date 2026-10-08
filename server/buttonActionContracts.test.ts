import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const additionalModules = fs.readFileSync(path.resolve(process.cwd(), "client/src/dashboardAdditionalModules.jsx"), "utf8");
const inventory = dashboard.slice(dashboard.indexOf("function Inventory("), dashboard.indexOf("function ItemPanel("));
const itemPanel = dashboard.slice(dashboard.indexOf("function ItemPanel("), dashboard.indexOf("function ItemFormPanel("));
const expensePanel = dashboard.slice(dashboard.indexOf("function ExpensePanel("), dashboard.indexOf("function ExpenseFormPanel("));
const pharmacy = dashboard.slice(dashboard.indexOf("function PharmacyManagementModule("), dashboard.indexOf("function Healthcare"));
const performance = dashboard.slice(dashboard.indexOf("function Performance("), dashboard.indexOf("function PerformanceFormPanel("));
const school = dashboard.slice(dashboard.indexOf("function SchoolManagementModule("), dashboard.indexOf("function Hospitality"));

describe("button action contracts", () => {
  it("persists inventory reorder requests through the existing procurement tables", () => {
    expect(inventory).toContain("async function raisePurchaseOrder(item)");
    expect(inventory).toContain('sb("procurement_purchase_orders").insert');
    expect(inventory).toContain('sb("purchase_order_items").insert');
    expect(inventory).toContain("onRaisePurchaseOrder={raisePurchaseOrder}");
    expect(inventory).toContain("Connect Supabase to persist it.");
  });

  it("prevents duplicate inventory reorder submissions and closes only after confirmation", () => {
    expect(itemPanel).toContain("const [purchaseOrderSaving, setPurchaseOrderSaving] = useState(false);");
    expect(itemPanel).toContain("const created = await onRaisePurchaseOrder(item);");
    expect(itemPanel).toContain("if (created) onClose();");
    expect(itemPanel).toContain("onClick={raisePurchaseOrder}");
    expect(itemPanel).toContain("disabled={saving || purchaseOrderSaving}");
  });

  it("makes the expense Receipt button perform a real printable export", () => {
    expect(expensePanel).toContain("function downloadReceipt()");
    expect(expensePanel).toContain('printReport("Expense Receipt"');
    expect(expensePanel).toContain("onClick={downloadReceipt}");
    expect(expensePanel).not.toContain('<button className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium border border-slate-200 rounded-lg py-2.5 hover:bg-slate-50 transition-colors">\n              <Download size={13} /> Receipt');
  });

  it("replaces the quota-only archive placeholder with a real manifest download", () => {
    expect(additionalModules).toContain("function downloadModuleManifest()");
    expect(additionalModules).toContain("application/json");
    expect(additionalModules).toContain("Download JSON Manifest");
    expect(additionalModules).not.toContain("Bulk wireframe export package queued for download upon quota reset.");
  });

  it("confirms Pharmacy drug and dispensing mutations with Supabase before changing local state", () => {
    expect(pharmacy).toContain('await sb("phm_drugs").insert(row).single().run()');
    expect(pharmacy).toContain('await sb("phm_dispense").insert(row).single().run()');
    expect(pharmacy).toContain('await sb("phm_stock").eq("id", currentStock.id).update({ qty: nextQty }).single().run()');
    expect(pharmacy).toContain("Drug could not be saved to Supabase. The catalog was not changed.");
    expect(pharmacy).toContain("Dispensing could not be saved to Supabase. Stock and dispensing records were not changed here.");
  });

  it("connects Add OKR to the existing HR performance table and reloadable JSON contract", () => {
    expect(performance).toContain('await sb("hr_performance_reviews").insert(row).single().run()');
    expect(performance).toContain('recordType: "okr"');
    expect(performance).toContain("OKR could not be saved to Supabase. No local OKR was created.");
    expect(performance).toContain("onClick={()=>setShowOkrForm((visible) => !visible)}");
    expect(dashboard).toContain("recordType: data.recordType || \"review\"");
  });

  it("connects Schedule Exam to the existing school exam table with required validation", () => {
    expect(school).toContain('await sb("sch_exams").insert(row).single().run()');
    expect(school).toContain("async function scheduleExam()");
    expect(school).toContain("Exam could not be saved to Supabase. The exam list was not changed.");
    expect(school).toContain("onClick={()=>setShowExam((visible) => !visible)}");
    expect(school).toContain("disabled={!examForm.name.trim() || !examForm.class.trim() || !examForm.subject.trim()}");
  });
});
