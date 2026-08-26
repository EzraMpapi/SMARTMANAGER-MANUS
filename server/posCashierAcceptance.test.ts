import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const shifts = source.slice(source.indexOf("function PosShiftPanel"), source.indexOf("function POS"));
const checkout = source.slice(source.indexOf("function Checkout"), source.indexOf("function ReceiptPanel"));
const receipt = source.slice(source.indexOf("function ReceiptPanel"), source.indexOf("function RegisterHistory"));

describe("POS cashier acceptance contract", () => {
  it("requires a server-confirmed opening float and captures cash movements for the active shift", () => {
    expect(shifts).toContain('useCompanyTable("pos_shifts"');
    expect(shifts).toContain('useCompanyTable("pos_cash_movements"');
    expect(shifts).toContain('sb("pos_shifts").insert');
    expect(shifts).toContain('sb("pos_cash_movements").insert');
    expect(shifts).toContain("One drawer, one shift");
  });

  it("requires a drawer count before closing and makes the reconciliation variance visible in a Z-report", () => {
    expect(shifts).toContain("Count the drawer first");
    expect(shifts).toContain('status: "Closed"');
    expect(shifts).toContain("Expected in Drawer");
    expect(shifts).toContain("VARIANCE");
    expect(shifts).toContain("Z-Report printed");
  });

  it("supports product search, scanner input, stock-safe cart updates, held carts, payments, tax, and confirmed sale completion", () => {
    expect(checkout).toContain("productMatchesPosLookup");
    expect(checkout).toContain("normalizeScannerInput(query, deviceProfile)");
    expect(checkout).toContain("addProductToPosCart");
    expect(checkout).toContain('status: "Held"');
    expect(checkout).toContain("calculatePosPaymentSummary");
    expect(receipt).toContain("Cash change");
    expect(checkout).toContain("VAT");
    expect(checkout).toContain('callRpc("complete_pos_sale"');
  });

  it("provides return confirmation, reconciliation outcomes, receipt output, and device preferences without unsafe hardware access", () => {
    expect(source).toContain('callRpc("complete_pos_return"');
    expect(source).toContain('useCompanyTable("pos_sync_events"');
    expect(receipt).toContain("Print Receipt");
    expect(receipt).toContain("deviceProfile?.paperWidth");
    expect(receipt).toContain("autoPrint");
    expect(source).toContain("Counter device profile");
    expect(source).toContain("keyboard-wedge devices");
    expect(source).not.toContain("navigator.serial.requestPort");
  });

  it("renders a printer-profile-aware receipt from confirmed transaction values without hard-coded tax, unsafe markup, or fake verification artifacts", () => {
    expect(receipt).toContain('const configuredWidth = deviceProfile?.paperWidth || company?.receiptWidth || "80mm"');
    expect(receipt).toContain('const receiptTax = Number.isFinite(Number(receipt.tax)) ? Number(receipt.tax) : Math.round(receiptSubtotal * TAX_RATE)');
    expect(receipt).toContain('const issuedAtIso = issuedAt && !Number.isNaN(new Date(issuedAt).getTime()) ? new Date(issuedAt).toISOString() : null');
    expect(receipt).toContain('const escapeHtml = (value) => String(value ?? "").replace');
    expect(receipt).toContain("Issued (ISO 8601)");
    expect(receipt).toContain("Verification is by the receipt number and payment reference shown above.");
    expect(receipt).toContain("@page { size:");
    expect(receipt).not.toContain("VAT (18%)");
    expect(receipt).not.toContain("qrcode");
  });
});
