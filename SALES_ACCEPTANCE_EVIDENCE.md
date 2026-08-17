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

## Remaining validation boundaries

The following work is intentionally not claimed as complete in this evidence record: lifecycle progression through fulfillment, payment recording, invoice printing/download behavior, quotation conversion, subscription billing, and a live server-denial recovery path. Those actions need a dedicated non-production document and a separately approved scope because they can affect inventory, receivables, payment history, print outputs, or recurring billing state.
