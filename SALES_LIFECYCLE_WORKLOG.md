# Sales Lifecycle Acceptance Worklog

## Temporary Invoice — 2026-08-17

The authenticated KMKM owner workspace created the temporary invoice **INV-4902** for `TEMP QA Invoice 20260817` through the normal Sales form. Supabase confirmed the canonical row `e313148e-8ead-4590-b3a3-cfb7aff4b6f9` with typed customer, issue date (`2026-07-02`), due date (`2026-07-09`), `Unpaid` status, and `amount_paid = 0`.

The initial direct click on the form’s lower-right submit control navigated the automated browser to the Manus landing page, while the database contained no invoice. A subsequent React-managed form submit completed successfully and the app showed the server-confirmed Invoice Created panel. This indicates test-environment interaction overlap with the fixed attribution badge rather than a confirmed product persistence failure; the form handler itself prevented native navigation and created the Invoice correctly.

The temporary Invoice’s **Print / Save PDF** action was invoked from the post-create panel. The control transitioned to its completed `Sent — Print / Save PDF` state. Browser-system dialog completion remains outside browser automation; no printer was selected and no PDF was saved.

The delivery panel then closed automatically. The Invoice list continued to show the one confirmed row with its original `Unpaid` status, ready for the authorized payment lifecycle test.

The temporary Invoice payment control accepted a cash payment for the full TZS 1k balance with reference `TEMP-PAY-20260817`. The Invoice changed to `Paid`, `amount_paid` displayed as TZS 1k, the balance displayed as TZS 0k, and a one-entry payment history appeared. The payment-received receipt panel was displayed without sending a message or saving a receipt PDF.

Supabase independently confirmed the same Invoice as `Paid` with `amount_paid = 1` and one `sales_payments` record for Cash amount `1.00` and the temporary reference. The Invoice detail panel was then closed without altering the payment receipt share fields.

The Subscription tab opened its lazy-loaded detail workspace without changing the existing paid Invoice or any other Sales data. The authenticated form is ready for one clearly labeled temporary subscription, which will be paused or cancelled and then deleted.

The normal Subscription form created `SUB-20260817-E83A` for `TEMP QA Subscription 20260817` on the `TEMP QA Plan`, with a TZS 1k monthly amount and an initial `Active` status. The list, active-plan summary, and monthly run-rate updated to reflect that one confirmed temporary record.

Supabase confirmed the Subscription’s typed document number, customer, plan, `1.00` amount, monthly cycle, dates, and initial `Active` status. The subscription detail panel’s **Pause** control then changed the record to `Paused`; the active-plan count and monthly run-rate both dropped to zero, and the lifecycle control correctly changed to **Resume**.

The paused Subscription was still present after a browser-attribution-overlay click navigated away instead of confirming deletion. After returning to the application, the visible browser identity unexpectedly showed **BEIRAHISI HARDWARE · Super Administrator** rather than the earlier KMKM owner workspace while still displaying the temporary Invoice activity. Further user-interface deletion was paused pending a read-only company-scope check. No additional operational record was changed after this observation.
