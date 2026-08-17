# Sales Acceptance Evidence

## Authenticated workspace observations — 17 August 2026

The authenticated KMKM owner workspace opened the Sales module through the supported dashboard **Open sales** action. The Sales workspace loaded without an application error and showed a confirmed-data empty state: **0 quotations · TZS 0k combined value** and **No quotations yet**. The empty state directs the user to create the first quotation rather than fabricating Sales data.

The visible controls available for safe acceptance include the Quotations, Sales Orders, Invoices, and Subscriptions tabs; CSV export; search; and the Columns menu. Creation, lifecycle, payment, conversion, deletion, and subscription-write controls remain excluded from this non-destructive pass unless separately approved.

The **Sales Orders** and **Invoices** tabs were each opened in the authenticated workspace. Both responded immediately, displayed their corresponding columns and search field, and showed accurate zero-record empty states. Neither navigation action created a sales document or changed any tenant data.

The **Subscriptions** tab opened its on-demand detail workspace and showed zero active plans and zero monthly run rate from confirmed data. The **New Subscription** control opened a form with required customer, plan, amount, cycle, and start-date fields; the form was closed with **Cancel** without entering or submitting data. No subscription, invoice, or other sales record was created.

In Quotations, the **Columns** control opened its accessible visible-column menu and exposed required and optional table-column choices without changing a record. The quotation search accepted a temporary harmless query and was then cleared; the zero-record view remained accurate and no data was written.

The primary **New Quotation** control opened a complete quotation form with customer, dates, line item, quantity, rate, discount, and owner inputs. It was closed with **Cancel** before any field was entered or submitted. The Sales workspace returned to its original zero-quotation confirmed-data state without creating a document.

## Approved temporary Sales Order persistence check — 17 August 2026

With explicit approval, a clearly labeled temporary order for `TEST-DELETE Sales Acceptance` was submitted with one `TEST-DELETE acceptance service` line. The Supabase server confirmed exactly one header row (`SO-2539`) with one line item and a line total of `1`; the prior `sales_orders.issue_date` schema-cache error did not recur.

The first post-submit screen exposed two presentation issues: the database row lacked its locally-derived `Pending` status, quotation reference, and owner label, and it was displayed alongside a temporary client row. These were traced to server normalization and manual post-create prepending. The follow-up repair adds the supported Sales Order metadata columns, persists the status/reference/owner in the confirmed header write, and reloads the canonical server row instead of prepending a second local representation. The repaired live flow still requires final post-deployment verification and removal of the temporary order.

After the follow-up was published, the order reloaded as exactly one canonical server-backed row rather than two. The previously created record could not verify the new metadata because it predated the metadata migration, but it confirmed that the duplicate-row repair uses a single server source of truth. The approved temporary order was then deleted through the authenticated application confirmation flow. The Sales Orders workspace returned to its zero-record state and a direct server check returned no matching row, confirming cleanup.
