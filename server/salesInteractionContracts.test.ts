import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const salesStart = dashboardSource.indexOf("function Sales(");
const salesEnd = dashboardSource.indexOf("/* ------------------------------- INVENTORY", salesStart);
const salesSource = dashboardSource.slice(salesStart, salesEnd);

describe("Sales interaction and persistence contracts", () => {
  it("keeps Sales documents out of live UI state until their header and line writes are confirmed", () => {
    expect(salesSource).toContain("requiresConfirmedPersistence()");
    expect(salesSource).toContain("if (!header?.id) throw buildConfirmedMutationError");
    expect(salesSource).toContain("await sb(itemsTable).insert(");
    expect(salesSource).toContain("await hooksByTab[tab].reload?.();");
    expect(salesSource).toContain("return false;");
    expect(salesSource).not.toContain("Document created locally, but saving to the server failed.");
  });

  it("retains Sales form data for retry and exposes a clear saving state instead of closing before confirmation", () => {
    expect(salesSource).toContain("const [submitting, setSubmitting] = useState(false);");
    expect(salesSource).toContain("const confirmed = await onSubmit({");
    expect(salesSource).toContain("if (confirmed) onClose();");
    expect(salesSource).toContain('{submitting ? "Saving…" : `Create ${meta.label}`}');
    expect(salesSource).toContain('{submitting ? "Saving…" : "Create Subscription"}');
  });

  it("wires Sales panel controls to supported print, conversion, payment, return, and lifecycle actions", () => {
    expect(salesSource).toContain("onPrint={printInvoice}");
    expect(salesSource).toContain("onClick={() => isInvoice ? onPrint?.(doc)");
    expect(salesSource).toContain("const converted = await runDocumentAction(() => onConvertToInvoice?.(doc))");
    expect(salesSource).toContain("const confirmed = await onRecordPayment(doc.id");
    expect(salesSource).toContain("No further action");
    expect(salesSource).not.toContain("<button className=\"flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium border border-slate-200 rounded-lg py-2.5 hover:bg-slate-50 transition-colors\">\n              <Printer");
  });

  it("shows authorization and offline denials as recoverable server outcomes without weakening persistence requirements", () => {
    expect(dashboardSource).toContain("was denied by your workspace permissions. The server did not save this change.");
    expect(dashboardSource).toContain("could not be sent because this browser is offline. No server change was made.");
    expect(dashboardSource).toContain("Details: ${detail}");
    expect(dashboardSource).toContain("PERSISTENCE_CONFIRMATION_MISSING");
  });

  it("uses the Sales Order order_date contract rather than sending the Invoice-only issue_date field", () => {
    expect(salesSource).toContain('...(tab === "orders" ? {\n            order_date: form.date,');
    expect(salesSource).not.toContain('issue_date: form.date,\n          ...(tab !== "orders"');
  });

  it("aliases document child relations so legacy parent columns cannot mask confirmed line, payment, or return records", () => {
    expect(salesSource).toContain('items:sales_order_items(*)');
    expect(salesSource).toContain('returns:sales_order_returns(*,items:sales_order_return_items(*))');
    expect(dashboardSource).toContain('items:sales_invoice_items(*),payments:sales_payments(*)');
    expect(dashboardSource).toContain('items:sales_quotation_items(*)');
    expect(dashboardSource).toContain("Array.isArray(items) ? items : []");
  });

  it("persists Sales Order state and form metadata before reloading its single confirmed representation", () => {
    expect(salesSource).toContain("status: draft.status,");
    expect(salesSource).toContain("quotation_reference: form.reference || null,");
    expect(salesSource).toContain("owner_name: form.owner || null,");
    expect(salesSource).not.toContain("hooksByTab[tab].setRows((prev) => [{ ...draft, dbId: header.id }, ...prev])");
    expect(dashboardSource).toContain("r.quotation_reference || (r.quotation_id ? \"linked\" : \"—\")");
    expect(dashboardSource).toContain("r.owner_name || r.owner_id || \"Unassigned\"");
  });
});
