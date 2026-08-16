import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("POS post-confirmation fallback", () => {
  it("uses tenant-scoped flat reads when the optional relationship expansion is unavailable", () => {
    expect(source).toContain("async function loadPosTransactionForDisplay(transactionId)");
    expect(source).toContain('sb("pos_transaction_items").select("*").run()');
    expect(source).toContain('sb("pos_returns").select("*").run()');
    expect(source).toContain("item?.data?.transaction_id === transactionId");
    expect(source).toContain("POS relationship expansion unavailable; using tenant-scoped flat detail fallback");
  });

  it("records a confirmed direct sale before optional refresh work so a detail-read failure cannot be treated as a failed sale", () => {
    const checkout = source.slice(source.indexOf("async function completeSale()"), source.indexOf("return (", source.indexOf("async function completeSale()")));
    expect(checkout).toContain('callRpc("record_pos_sync_event"');
    expect(checkout).toContain('p_status: "synced"');
    expect(checkout).toContain("p_transaction_id: confirmed.transaction_id");
    expect(checkout.indexOf('callRpc("record_pos_sync_event"')).toBeLessThan(checkout.indexOf("await Promise.all([inventory.reload"));
  });
});
