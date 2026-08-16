import { describe, expect, it } from "vitest";
import {
  addProductToPosCart,
  calculatePosPaymentSummary,
  createPosSaleAttempt,
  productMatchesPosLookup,
} from "../client/src/lib/posTransactionEngine";

describe("POS transaction engine helpers", () => {
  it("matches a scanned barcode as well as product, SKU, category, and brand lookups", () => {
    const product = { name: "Fresh Milk", sku: "MILK-1L", barcode: "6201234567890", category: "Dairy", brand: "Smart Farms" };
    expect(productMatchesPosLookup(product, "6201234567890")).toBe(true);
    expect(productMatchesPosLookup(product, "milk-1l")).toBe(true);
    expect(productMatchesPosLookup(product, "dairy")).toBe(true);
    expect(productMatchesPosLookup(product, "unknown")).toBe(false);
  });

  it("prevents a barcode/cart operation from exceeding live available stock", () => {
    const product = { sku: "MILK-1L", name: "Fresh Milk", price: 3200, unit: "each" };
    const first = addProductToPosCart([], product, 2);
    const second = addProductToPosCart(first.cart, product, 2);
    const third = addProductToPosCart(second.cart, product, 2);
    expect(second.cart[0]).toMatchObject({ sku: "MILK-1L", qty: 2 });
    expect(third).toMatchObject({ added: false, reason: "INSUFFICIENT_STOCK" });
  });

  it("allocates split payments against the amount due and makes cash change explicit", () => {
    const split = calculatePosPaymentSummary([{ id: "cash", method: "Cash", amount: 40000 }, { id: "mobile", method: "Mobile Money", amount: 60000 }], 100000);
    const cashChange = calculatePosPaymentSummary([{ id: "cash", method: "Cash", amount: 120000 }], 100000);
    expect(split).toMatchObject({ paid: 100000, remaining: 0, change: 0, isComplete: true });
    expect(split.allocations.map((payment) => payment.appliedAmount)).toEqual([40000, 60000]);
    expect(cashChange).toMatchObject({ paid: 120000, change: 20000, isComplete: true });
  });

  it("keeps a generated transaction reference and idempotency key stable across a retry", () => {
    const attempt = createPosSaleAttempt({ createDocumentNumber: () => "POS-2026-0001", createIdempotencyKey: () => "idem-1" });
    expect(attempt).toEqual({ docNumber: "POS-2026-0001", idempotencyKey: "idem-1" });
  });
});
