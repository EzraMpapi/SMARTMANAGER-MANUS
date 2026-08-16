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

## Authenticated browser acceptance status

The existing non-destructive authenticated-device script could not be completed in this session because its browser-debug target was no longer an authenticated Smart Manager page. The configured user browser connector is enabled, but the available debug target was a new tab. Opening the currently published `/app` route in the available browser displayed the application’s secure loading boundary rather than an authenticated POS workspace, with no console exception reported during the observed interval.

> No real sale, return, cash movement, inventory adjustment, or production data was created solely for this release validation. The remaining live-cashier check must be run from an authenticated staging workspace with an approved test product and shift.

## Required live staging handoff

An authorized cashier or manager should complete the following non-production tenant test after deployment: open a test shift; scan a test barcode; run a split cash/card sale with change; hold and resume a cart; create a pay-in and pay-out; print one receipt; process one permitted return; close the shift; then confirm that the reconciliation dashboard contains only the server-confirmed outcome. The test should be run in a staging tenant because POS RPCs perform real stock and transaction changes.
