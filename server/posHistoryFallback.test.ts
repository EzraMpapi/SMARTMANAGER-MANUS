import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const pos = source.slice(source.indexOf("function POS("), source.indexOf("function PosReconciliationDashboard"));

describe("POS history fallback", () => {
  it("loads transaction line items through a tenant-safe table hook when relationship expansion is unavailable", () => {
    expect(source).toContain('useCompanyTable("pos_transaction_items", []');
    expect(source).toContain("function mapPosTransactionItemRow");
    expect(pos).toContain("transactionItemsHook?.rows");
    expect(pos).toContain("item.transactionId === transaction.dbId");
    expect(pos).toContain("items: fallbackItems");
  });

  it("retains the primary relationship query while avoiding a false empty history when the server falls back", () => {
    expect(source).toContain('select: "*,pos_transaction_items(*),profiles(full_name),pos_returns(*,pos_return_items(*))"');
    expect(pos).toContain("if ((transaction.items || []).length > 0) return transaction");
  });
});
