# Procurement Workspace — Confirmed Purchase-Order Persistence Upgrade

## Scope and Priority

Procurement was selected after Inventory because purchase orders govern committed spend, supplier obligations, stock receipts, approval controls, and vendor-payment readiness. The review focused on preventing a configured workspace from displaying a created, received, cancelled, or approved purchase order before the relevant server write succeeds.

## Verified Defects and Repair

| Workflow | Previous behavior | Repair |
| --- | --- | --- |
| Create purchase order | A local PO appeared and the form closed before its server header and line items were confirmed. | The table receives a canonical purchase-order row only after the header and all line items return successfully. If a line insert fails, the header deletion is attempted; a failed cleanup produces an explicit reconciliation warning. |
| Receive purchase order | Inventory quantities and PO status changed locally before server receipt work completed. | Inventory rows and PO status now change only after confirmed item updates, movement records, and the returned received PO. A failed sequence leaves the screen unchanged and directs reconciliation before retrying. |
| Cancel purchase order | The local order became cancelled before the server response. | The returned cancellation row is required before visible status changes. A failed cancellation preserves the active order and detail panel. |
| In-flight controls | PO creation, receipt, and cancellation controls could be activated repeatedly while saving. | Form and detail-panel controls now use saving states to prevent duplicate requests while retaining draft and panel context after failure. |

## Validation

Focused Procurement persistence contracts passed with **1 file / 2 tests**, covering server-before-state ordering, failed-write preservation, and duplicate-submit prevention. Static TypeScript validation also passed. The complete suite passed with **93 files / 304 tests**, alongside 5 intentionally gated files and 8 skips. The bounded-heap production build passed with 2,653 modules transformed. Authenticated non-destructive browser acceptance remains in the final validation phase.

No purchase order, PO line, stock quantity, stock movement, supplier, contract, expense, RLS policy, credential, provider configuration, or Resend setting changed during this repair.
