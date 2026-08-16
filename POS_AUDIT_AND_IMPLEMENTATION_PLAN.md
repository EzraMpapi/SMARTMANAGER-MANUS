# Smart Manager POS Audit and Integrated Implementation Plan

## Audit Scope

This audit reviews the existing Point of Sale module as an integrated Smart Manager workspace. The objective is to improve commercial reliability without creating a disconnected POS application, weakening Supabase Row Level Security, or replacing operational ERP tables that already exist.

| Area | Existing implementation | Assessment |
|---|---|---|
| Product and stock source | Checkout reads the shared `inventory_items` collection through the existing `useCompanyTable` contract. | Reuse this centralized inventory source. Product name, SKU, barcode, stock quantity, unit, and cost are already available to the POS mapper. |
| Checkout | The current register has category filtering, product cards, cart quantity controls, stock checks, VAT calculation, payment selection, receipt display, and browser printing. | Retain the operational layout, but move sale completion to a confirmed transaction workflow. |
| Transactions and returns | The deployed tables include `pos_transactions`, `pos_transaction_items`, `pos_returns`, and `pos_return_items`. | Reuse these tables; do not create a separate POS data store. Current sale and return code performs local UI/inventory changes before all server writes confirm. |
| Shifts and cash drawer | `pos_shifts` and `pos_cash_movements` already support opening float, pay-ins, pay-outs, expected cash, reconciliation, and Z-report printing. | Preserve the existing confirmed shift-write behavior and extend it through the shared POS transaction workflow. |
| Tenant security | The application uses authenticated Supabase headers, company-scoped table access, and RLS policies. Existing schema verification reports POS tables are present and tenant-scoped. | Maintain RLS and avoid client-supplied company identifiers. All additions must use the existing authenticated company-resolution path. |
| Shared persistence | `runCompanyTableMutation` requires a confirmed returned row and reconciles table caches through `companyMutationBus`. | POS sale and return workflows should use this confirmation discipline rather than direct optimistic table mutations. |
| Existing limits | Checkout supports name/SKU lookup, Cash/Card/Mobile Money selection, a single payment method, fixed markup/tax constants, and receipt printing. | Barcode keyboard handling, held carts, split payments, price/discount permissions, idempotency, offline queueing, configurable tax/pricing, and POS-specific audit metadata require additive work. |

## Confirmed Constraints

The live schema inventory confirms that the central POS, inventory, sales, finance, and customer tables already exist. The initial upgrade must therefore **reuse and extend** the existing POS records and shared inventory movements. It must not create duplicate inventory, customer, or sales ledgers.

The current POS creates temporary transaction and inventory state before every remote operation completes. If a later item, stock movement, or return write fails, the UI may temporarily present an incomplete commercial outcome. This conflicts with the required server-confirmed transaction contract and is the first root issue to address.

## Additive Domain Direction

The next implementation stages will retain existing transaction header/item/return/shift/cash movement tables and add fields or related records only after checking the exact deployed database contract. The intended additive model is as follows.

| Capability | Preferred implementation direction | Integrity boundary |
|---|---|---|
| Idempotent completion | Store a client-generated transaction reference/idempotency key on the POS transaction header and require its unique reuse. | A duplicate submit must return the original confirmed transaction rather than create another sale. |
| Split payments | Record a normalized payment allocation list tied to the confirmed POS transaction. | The allocation total must equal the approved sale total before completion. |
| Held carts | Store a draft/held transaction state separate from completed sales. | Held carts never decrement inventory or appear in revenue until confirmed. |
| Barcode input | Use existing barcode/SKU fields with a keyboard-scanner input buffer and an additive scan event handler. | A scan only adds a known, saleable product after current stock validation. |
| Discounts and overrides | Capture authorization decision, actor, rule, and before/after price in audit metadata. | Unauthorized cashiers cannot apply an override; a manual discount is traceable. |
| Inventory movement | Create stock movements only after a completed transaction header and its items are confirmed. | Failed sales do not alter the shared inventory balance. |
| Returns and refunds | Keep the original sale immutable and create return/refund records referencing it. | Return quantity cannot exceed the unreturned quantity; restock follows confirmed return creation. |
| Offline resilience | Use an explicit local queue with `pending`, `syncing`, `synced`, and `failed` states only after the online transaction contract is stable. | Pending sales are never displayed as completed or included in final financial totals. |

## Delivery Sequence

The implementation will start with a tested transaction boundary: complete POS sale or return only after all required server-side header, item, payment, and stock changes confirm. This will be followed by barcode-first cart behavior, held carts, clear split-payment/change states, and a permission-aware cashier experience. Shift/cash reporting, audit records, returns, and receipts will then consume confirmed transaction data.

Offline queueing is deliberately sequenced after online correctness and idempotency. A durable queue cannot safely compensate for a non-atomic or ambiguous server workflow. Fiscalization, live payment-provider capture, SMS/WhatsApp/email delivery, camera barcode scanning, physical printer drivers, and country-specific tax compliance remain adapter/integration boundaries and will not be represented as falsely connected until credentials and provider contracts are supplied.
