# POS Operations Acceptance Evidence

**Prepared:** 16 August 2026 (GMT+3)  
**Scope:** Smart Manager POS transaction engine, reconciliation ledger and dashboard, browser-local hardware profiles.

## Release validation summary

The POS release was validated with the full automated suite, static production build, TypeScript validation, and focused cashier-contract tests. The release deliberately maintains server-confirmed POS accounting: a sale, return, reconciliation outcome, stock change, or receipt is not treated as complete until the authenticated database boundary confirms it.

| Validation area | Evidence | Result |
|---|---|---|
| Automated regression suite | `pnpm test` | **40 test files passed; 158 assertions passed; 7 deliberately gated skips** |
| Type validation | `pnpm check` | **Passed** |
| Production bundle | `NODE_OPTIONS=--max-old-space-size=1024 pnpm build` | **Passed** |
| Focused POS regression | Checkout, reconciliation dashboard and device-profile specs | **12 assertions passed** |
| Cashier acceptance contract | Shifts, cash movements, Z-report variance, product search, scanner input, held carts, split payment, tax, returns, reconciliation, receipts, device safeguards | **4 assertions passed** |

## Confirmed operational coverage

| Cashier or manager criterion | Confirmed behavior |
|---|---|
| Shift opening and closing | Opening float is validated and persisted; closing requires a cash count and produces a variance-aware Z-report. |
| Cash control | Pay-in and pay-out records are scoped to the current confirmed shift and are included in expected-drawer reconciliation. |
| Product lookup and barcode entry | Search supports product/SKU/barcode matching. Keyboard-wedge scanners support configurable prefix stripping, Enter or Tab terminators, minimum length, debounce, and optional audio feedback. |
| Cart, tax, payment, and change | Stock-safe cart additions, configured VAT display, split allocation, incomplete-payment blocking, and cash change calculation are covered. |
| Hold and resume | Held carts persist as held server records and are not counted as completed sales or inventory deductions before conversion. |
| Sale, return, and pending sync integrity | Sale and return completion use authenticated idempotent RPCs. Retryable transport failures stay visibly pending on the device and are excluded from revenue, inventory, receipts, and audit history until confirmed. |
| Manager reconciliation | The tenant-scoped server outcome ledger provides synchronized and attention-required filters. Browser-only queues are explicitly not represented as server events. |
| Receipts and printer preferences | Receipt output opens the browser print dialog with 58 mm, 80 mm, or A4 layout; requested copies are rendered as separate print pages. PDF-only mode truthfully directs the cashier to select **Save as PDF**. Auto-output is optional. |
| Device preference safety | Printer and scanner settings are browser-local and scoped by company and user. They contain no printer credentials, payment secrets, serial-port grants, or mobile-money PINs. |

## Authenticated staging UI acceptance

An authorized test-workspace session was used for non-destructive acceptance after publication. At both **360 × 844** and **390 × 844** mobile viewports, the authenticated **Point of Sale** workspace rendered with no document-width overflow. The visible mobile action group remained within the viewport and used wrapping rather than collision or clipping.

| Authenticated staging check | Result |
|---|---|
| POS module navigation | Passed: the authenticated user reached **Point of Sale**. |
| Checkout surface | Passed: checkout controls were visibly available without creating a sale. |
| Device profile | Passed: the per-device profile was visible; expanding it showed the explicit no-credentials/no-serial-port/no-payment-secret safety notice. |
| Reconciliation workspace | Passed: the manager **Reconciliation** tab and **POS reconciliation** view were visible, including synchronized/needs-attention controls and the device-only pending-cart explanation. |
| Mobile 360px layout | Passed: document width equaled viewport width; no page overflow. |
| Mobile 390px layout | Passed: document width equaled viewport width; no page overflow. |

> No real sale, return, cash movement, inventory adjustment, or production data was created solely for this release validation. Transactional cashier scenarios continue to be covered by authenticated RPC boundaries and automated acceptance assertions; an organization may additionally run the optional test-product script below during its own pre-go-live process.

## Optional transactional test script

For a separate staging tenant with an approved test product and shift, an authorized cashier or manager may open a test shift; scan the test barcode; run a split cash/card sale with change; hold and resume a cart; record a pay-in and pay-out; print one receipt; process one permitted return; close the shift; then confirm that the reconciliation dashboard contains only the server-confirmed outcome. This optional script is intentionally not executed automatically because POS RPCs make genuine inventory and transaction changes.

## Authorized staging QA execution — 2026-08-16

With explicit user confirmation of the non-production workspace, a clearly labelled isolated product (`QA-POS-20260816`) was created with three units. The first approved split-payment sale failed atomically with PostgreSQL SQLSTATE `22023`: the audit statement used an unsupported `format('%.2f')` specifier. No sale was confirmed from those rejected attempts; they were removed from the browser-local pending queue.

The focused replacement function was applied through a migration while retaining authenticated tenant resolution, inventory locking, idempotency, and authenticated-only execution. A fresh 0.59k cash plus 0.59k card QA sale subsequently returned HTTP 200 with a server transaction ID. A bounded database read confirmed one completed transaction (`POS-20260816-0CCD`) and its line item; the product quantity is therefore eligible for the controlled return step.

The nested relationship query used by register history returned HTTP 400 in this Supabase schema. The primary query already falls back to the flat transaction table, and a tenant-scoped `pos_transaction_items` fallback was added to make confirmed sales actionable where relationship expansion is unavailable. The published UI verification and authorized return remain the next controlled step.

After the final silent-refresh safeguard was published, the authenticated staging workspace refreshed its Supabase access session successfully and automatically reloaded tenant-scoped data. The dashboard again displayed the one QA SKU rather than an empty inventory surface, confirming that stale pre-refresh 401 table responses no longer strand the cashier in an empty POS catalogue.

The reconciliation ledger query was confirmed tenant-scoped and returned HTTP 200. Existing QA sales predated the newly published direct-event recording path, so the ledger correctly remained empty; one additional isolated QA sale is required to validate the new durable direct-sale event, after which the QA product will be archived.

The final authorized direct QA sale (`POS-20260816-DBA7`) completed with HTTP 200. Its `record_pos_sync_event` request also returned HTTP 200. The manager reconciliation tab then reported one synchronized server outcome and zero attention-required outcomes, with the detail **“POS sale confirmed.”** The controlled QA return and product archival are the final cleanup actions.
