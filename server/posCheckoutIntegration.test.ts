import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const checkout = source.slice(source.indexOf("function Checkout"), source.indexOf("function ReceiptPanel"));
const registerHistory = source.slice(source.indexOf("function RegisterHistory"), source.indexOf("function POSReports"));

describe("POS checkout confirmed persistence integration", () => {
  it("uses the authenticated atomic completion RPC with a retry-stable idempotency key", () => {
    expect(checkout).toContain('callRpc("complete_pos_sale"');
    expect(checkout).toContain("p_idempotency_key: attempt.idempotencyKey");
    expect(checkout).toContain("const attempt = saleAttempt || createPosSaleAttempt");
    expect(checkout).toContain("confirmed.idempotent_replay");
  });

  it("does not update the cart, transaction list, or inventory as a false local success", () => {
    expect(checkout).not.toContain('notify("Sale completed locally, but saving to the server failed.", "error")');
    expect(checkout).not.toContain("inventory.setRows((prev)");
    expect(checkout).not.toContain("transactions.setRows((prev) => [draft");
    expect(checkout).toContain("notify(persistenceFailureMessage(\"Completing the sale\", error), \"error\")");
    expect(checkout).toContain("await Promise.all([inventory.reload?.(), transactions.reload?.()].filter(Boolean))");
  });

  it("supports barcode-first lookup, stock-safe cart additions, and explicit split-payment states", () => {
    expect(checkout).toContain("productMatchesPosLookup(p, query)");
    expect(checkout).toContain("onKeyDown={handleScan}");
    expect(checkout).toContain("addProductToPosCart(previous, item, stock)");
    expect(checkout).toContain("calculatePosPaymentSummary(payments, total)");
    expect(checkout).toContain("Split payment");
    expect(checkout).toContain("Payment is incomplete");
  });

  it("persists held carts without stock deduction and excludes them from completed-sale metrics", () => {
    expect(checkout).toContain('runCompanyTableMutation("pos_transactions", "insert"');
    expect(checkout).toContain('status: "Held"');
    expect(checkout).toContain("Inventory has not been deducted");
    expect(checkout).toContain("function resumeHeldSale(order)");
    expect(checkout).toContain('status: "Converted"');
    expect(source).toContain('transactions.rows.filter((t) => t.status === "Completed" && t.date === todayStr)');
    expect(source).toContain('const completedRows = rows.filter((transaction) => transaction.status === "Completed")');
  });

  it("confirms a return through the atomic RPC before refreshing transaction and inventory state", () => {
    expect(registerHistory).toContain('callRpc("complete_pos_return"');
    expect(registerHistory).toContain("p_idempotency_key: idempotencyKey");
    expect(registerHistory).toContain("await Promise.all([inventory.reload?.(), transactions.reload?.()].filter(Boolean))");
    expect(registerHistory).not.toContain("inventory.setRows((prev)");
    expect(registerHistory).not.toContain('notify("Return processed locally, but saving to the server failed.", "error")');
  });

  it("allows guest checkout while blocking customer credit until an existing workspace contact is selected", () => {
    expect(checkout).toContain('const [customerId, setCustomerId] = useState("guest")');
    expect(checkout).toContain("Guest sale");
    expect(checkout).toContain("usesCustomerCredit && !selectedCustomer");
    expect(checkout).toContain("Customer Credit requires an existing customer selected from this workspace.");
    expect(checkout).toContain("p_customer_id: selectedCustomer?.dbId || null");
  });

  it("queues retryable transport failures as pending and only finalizes after the existing idempotent server boundary confirms", () => {
    expect(checkout).toContain("isRetryablePosTransportError(error)");
    expect(checkout).toContain("queueCurrentSale(attempt, error)");
    expect(checkout).toContain("Sale ${record.docNumber} is pending sync. It is not yet completed");
    expect(checkout).toContain('window.addEventListener("online", handleOnline)');
    expect(checkout).toContain("Pending sync");
    expect(checkout).toContain("These sales require server confirmation before inventory, revenue, receipt output, or customer balances change.");
    expect(checkout).toContain("Force sync all");
    expect(checkout).toContain('callRpc("complete_pos_sale"');
    expect(checkout).toContain('callRpc("record_pos_sync_event"');
    expect(checkout).toContain('p_status: "synced"');
    expect(checkout).toContain('p_status: "needs_attention"');
  });
});
