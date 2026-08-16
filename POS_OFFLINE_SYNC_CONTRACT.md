# POS Pending Queue and Synchronization Contract

## Purpose

Smart Manager POS will support temporary loss of connectivity without treating an unconfirmed sale as completed. The browser may retain a **pending transaction request** locally so the cashier can retry it after connection recovery. Inventory, revenue, shift totals, completed-sales reports, receipts, returns, and audit history remain driven only by a confirmed database transaction.

## Device-Local Queue Lifecycle

| State | Meaning | Cashier experience | Accounting and inventory effect |
|---|---|---|---|
| `pending` | A sale request was prepared while offline or a transient transport failure prevented delivery. | The POS shows a visible pending-sync record with its receipt reference, timestamp, and retry action. | No inventory deduction, revenue, transaction history, receipt, or final audit record is created. |
| `syncing` | The browser has regained connection and is submitting the original request. | The record is temporarily locked to prevent duplicate manual submission. | Still unconfirmed until the server RPC returns a confirmed result. |
| `synced` | The atomic server transaction has confirmed or safely replayed the original idempotency key. | The pending record disappears and the confirmed receipt is loaded. | The server transaction updates inventory, payments, audit records, and sales history atomically. |
| `needs_attention` | The server rejected the request because of a non-transient business rule, such as insufficient stock, an invalid customer-credit selection, or authorization. | The record remains visible with a safe diagnostic and retry/discard controls. | No completed sale is recorded. The cashier must correct or discard the pending request. |

The queue key is scoped to the active **company and authenticated user**. It stores product references, quantities, monetary amounts, customer IDs, payment methods, and the idempotency key necessary for safe replay. It must never store card numbers, mobile-money PINs, payment-provider tokens, passwords, or access tokens.

## Replay and Duplicate Protection

Every pending record retains the original POS document number and idempotency key. On reconnect, the browser calls the existing `complete_pos_sale` RPC using that same key. The server-side `pos_transaction_commits` constraint makes a retry return the original completed transaction rather than issuing a second sale. A pending record is removed only after the response is confirmed and the authoritative transaction and inventory caches refresh.

## Durable Multi-Device Foundation

An offline browser cannot report a pending item to another device until it reconnects. The first durable step therefore records the server-observed reconciliation outcome, keyed by the same company and idempotency key, after a sync attempt reaches the server. This supports operational visibility and later expansion to a managed multi-device queue without exposing a local-only record as a shared completed sale.

> **Operational rule:** a printed or displayed receipt marked “Pending sync” is not a finalized fiscal or accounting document. Only the confirmed server receipt is final.
