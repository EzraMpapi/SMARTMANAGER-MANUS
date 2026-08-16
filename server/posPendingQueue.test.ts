import { describe, expect, it } from "vitest";
import {
  createPendingPosSale,
  isRetryablePosTransportError,
  posPendingQueueKey,
  readPendingPosSales,
  updatePendingPosSale,
  writePendingPosSales,
} from "../client/src/lib/posPendingQueue";

describe("POS pending queue", () => {
  it("scopes browser queue records to the active workspace and authenticated user", () => {
    expect(posPendingQueueKey({ companyId: "company-a", userId: "user-a" })).not.toBe(posPendingQueueKey({ companyId: "company-b", userId: "user-a" }));
    expect(posPendingQueueKey({ companyId: "company-a", userId: "user-a" })).not.toBe(posPendingQueueKey({ companyId: "company-a", userId: "user-b" }));
  });

  it("retains only a clearly pending, idempotent sale request without any provider secret", () => {
    const queued = createPendingPosSale({ attempt: { docNumber: "POS-1", idempotencyKey: "idem-1" }, items: [{ sku: "MILK", qty: 1, price: 3000 }], payments: [{ method: "Mobile Money", amount: 3540, token: "never-persisted" }], subtotal: 3000, tax: 540, total: 3540, customerId: null, customerName: "Guest" });
    expect(queued).toMatchObject({ status: "pending", docNumber: "POS-1", idempotencyKey: "idem-1", attempts: 0 });
    expect(queued.payments[0]).toEqual({ method: "Mobile Money", amount: 3540 });
    expect(JSON.stringify(queued)).not.toContain("never-persisted");
  });

  it("retries transport failures but not an RLS or business-rule rejection", () => {
    expect(isRetryablePosTransportError({ status: 0, message: "Failed to fetch" })).toBe(true);
    expect(isRetryablePosTransportError({ status: 503, message: "Gateway timeout" })).toBe(true);
    expect(isRetryablePosTransportError({ status: 42501, message: "not authorized" })).toBe(false);
    expect(isRetryablePosTransportError({ status: 400, message: "Insufficient stock" })).toBe(false);
  });

  it("persists and updates only valid pending records", () => {
    const values = new Map();
    const storage = { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value) };
    const scope = { companyId: "company-a", userId: "user-a" };
    const record = createPendingPosSale({ attempt: { docNumber: "POS-1", idempotencyKey: "idem-1" }, items: [], payments: [], subtotal: 0, tax: 0, total: 0 });
    writePendingPosSales(storage, scope, [record]);
    const pending = readPendingPosSales(storage, scope);
    expect(updatePendingPosSale(pending, "idem-1", { status: "needs_attention", attempts: 2 })[0]).toMatchObject({ status: "needs_attention", attempts: 2 });
  });
});
