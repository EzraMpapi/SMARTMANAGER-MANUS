import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("share actions", () => {
  const dashboard = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

  it("offers the device share sheet after invoice creation", () => {
    expect(dashboard).toContain("function shareInvoice()");
    expect(dashboard).toContain('title: `Invoice ${inv.id}`');
    expect(dashboard).toContain('label: "Share invoice"');
    expect(dashboard).toContain("Choose WhatsApp, Email, or another app");
  });

  it("offers the device share sheet for payment receipts", () => {
    expect(dashboard).toContain("function shareReceipt()");
    expect(dashboard).toContain('label: "Share"');
    expect(dashboard).toContain("navigator.share");
  });

  it("offers native sharing for inventory reports", () => {
    expect(dashboard).toContain("async function shareInventoryReport()");
    expect(dashboard).toContain('title: "Inventory Stock Report"');
    expect(dashboard).toContain('<Share2 size={12}/> Share');
  });

  it("offers native sharing for client purchase orders", () => {
    expect(dashboard).toContain("async function sharePurchaseOrder()");
    expect(dashboard).toContain('title: `Purchase Order ${order.id}`');
    expect(dashboard).toContain("Share purchase order");
  });

  it("keeps direct WhatsApp and email links as explicit fallbacks", () => {
    expect(dashboard).toContain("https://wa.me/");
    expect(dashboard).toContain("mailto:");
  });
});
