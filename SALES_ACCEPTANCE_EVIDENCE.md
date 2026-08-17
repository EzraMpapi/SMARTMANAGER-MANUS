# Sales Acceptance Evidence

## Scope and safeguards

This record captures authenticated acceptance carried out in the **KMKM owner** workspace on 17 August 2026. Only clearly labeled temporary Sales documents were created, each with a value of `TZS 1`, no customer contact details, no payment, no inventory SKU, no fulfillment action, and no subscription or operational data. Each temporary record was deleted after verification. The checks used the application UI and direct server reads; **no RLS policy, tenant rule, or authentication check was weakened**.

## Authenticated control acceptance

The Sales workspace opened from the supported dashboard action and loaded without a runtime error. Quotations, Sales Orders, Invoices, and Subscriptions each responded with the expected table, search, and confirmed-data empty state. The **Columns** menu and temporary search input worked and were restored without data changes. New Quotation and New Subscription forms were opened and cancelled without submitting values.

| Surface | Result | Data boundary |
| --- | --- | --- |
| Sales navigation and document tabs | Passed | No record created or changed. |
| Search and visible-column controls | Passed | Temporary query was cleared; preferences were not altered. |
| Quotation and Subscription form opening/cancellation | Passed | No document, plan, or invoice was submitted. |
| Server-confirmed temporary Order and Invoice creation | Passed | Explicitly approved temporary data only. |
| Temporary record cleanup | Passed | Final Supabase check found no approved temporary Order or Invoice row. |
| Temporary Invoice payment lifecycle | Passed | Explicitly approved TZS 1k temporary payment only; final server cleanup verified. |
| Temporary Subscription lifecycle | Passed | Explicitly approved temporary subscription only; final server cleanup verified. |

## Sales Order schema and metadata acceptance

The original screenshot failure was reproduced against the documented schema mismatch: the UI sent `issue_date` to `sales_orders`, while the table exposes `order_date`. The corrected Order write used `order_date`; the previous missing-`issue_date` database error did not recur.

The first approved temporary Order proved server creation and one line-item write, but exposed two post-create defects: `Pending`, quotation reference, and owner metadata were not stored in the typed header fields, and the UI briefly represented the new document twice. The published follow-up corrected the metadata mapping and reloaded the canonical server row rather than prepending a transient copy.

| Verified Order contract | Result |
| --- | --- |
| Typed date field | `order_date` accepted; `issue_date` was not sent to Orders. |
| Header and line-item persistence | One header and one linked line item were confirmed. |
| Status, quotation reference, owner | `Pending`, `TEST-REF-POST-FIX`, and `TEST-OWNER-POST-FIX` were present in typed server columns. |
| Canonical post-create UI state | One server-backed row was shown after refresh, with no duplicate local row. |

## Sales Invoice typed-persistence acceptance

The initial approved temporary Invoice uncovered a second shared normalization defect. It created and appeared in the UI, but its document number, customer, issue date, and due date were stored in the generic `data` envelope rather than the repaired typed schema columns. That behavior was not accepted as a successful schema-contract result. The generic payload boundary was corrected so the verified Sales document, line-item, payment, subscription, and return fields remain typed while client-supplied tenant identity remains rejected.

After publication, replacement temporary Invoice `INV-8577` was created through the authenticated application form. The UI displayed one `Unpaid` record with total `TZS 1`. A direct server join verified the exact typed document fields and one linked line item. A browser refresh retained the same canonical server record.

| Verified Invoice contract | Server result |
| --- | --- |
| Document number | `INV-8577` in `sales_invoices.doc_number` |
| Customer | `TEST-DELETE Typed Invoice Acceptance` in `sales_invoices.customer` |
| Status | `Unpaid` |
| Issue date | `2026-07-02` in `sales_invoices.issue_date` |
| Due date | `2026-07-09` in `sales_invoices.due_date` |
| Payment amount | `0` in `sales_invoices.amount_paid` |
| Line-item relation | Exactly one `sales_invoice_items` row linked by `invoice_id` |
| Refresh persistence | Passed; the application reloaded the single canonical record. |

## Cleanup outcome

The application deletion control displayed its confirmation state; however, the automation browser navigated away during confirmation, so its completion could not be observed reliably. With the owner's explicit approval already granted for these temporary records, cleanup was completed through the server-side database control. Direct final queries returned **no matching row** for the approved temporary Sales Order or either temporary Invoice. This preserves the workspace's original operational data state.

## Authorized Invoice, payment, print, and Subscription lifecycle acceptance

With explicit approval, the authenticated KMKM workspace created temporary Invoice `INV-4902` for `TEMP QA Invoice 20260817`. Supabase confirmed its canonical `sales_invoices` row with typed document number, customer, issue date, due date, `Unpaid` status, and `amount_paid = 0`. The normal post-create panel invoked the **Print / Save PDF** handoff and showed its completed state. No printer was selected and no file was saved, because the system print dialog remains outside browser automation.

The Invoice was opened through the normal Sales detail panel and paid in full through **Record Payment** with the temporary Cash reference `TEMP-PAY-20260817`. The UI changed to `Paid`, showed `amount_paid = TZS 1k`, a zero balance, and one payment-history entry. Supabase independently confirmed `sales_invoices.status = Paid`, `amount_paid = 1`, and one `sales_payments` row for amount `1.00`, method `Cash`, and the same temporary reference.

The authenticated Subscription form created `SUB-20260817-E83A` for `TEMP QA Subscription 20260817` on `TEMP QA Plan`, monthly, for TZS 1k. Its detail panel successfully moved it from `Active` to `Paused`, changed the available lifecycle control to **Resume**, and reduced active MRR to zero. A direct Supabase read confirmed the typed Subscription fields and its `Paused` status.

The lower-right fixed attribution overlay intercepted two automated confirmation clicks and navigated the test browser away. This did **not** represent an application persistence failure: direct React-managed submission created the Invoice and Subscription correctly, and the form source calls `preventDefault()` before awaiting server confirmation. The regression suite now asserts that native-submit prevention remains present. A direct company-scoped read mapped both temporary rows to the KMKM company ID, so no cross-tenant write was observed. Because the user had already authorized cleanup, the temporary Invoice, invoice line, payment, and Subscription were deleted through a company-scoped server transaction. A final verification returned zero rows for all four temporary record categories.

## Remaining validation boundaries

The following work is intentionally not claimed as complete in this evidence record: fulfillment and returns, quotation conversion, subscription invoice generation, physical printer output, actual PDF-save completion, and a live server-denial recovery path. These require either a dedicated non-production document with an appropriate scope, supported hardware/system-dialog access, or a sanctioned no-write denial trigger. No RLS weakening or cross-tenant write will be used merely to manufacture a denial.
