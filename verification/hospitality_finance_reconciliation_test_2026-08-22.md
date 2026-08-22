# Hotel POS-to-Finance / General Ledger Reconciliation Test

**Date:** 22 August 2026  
**Method:** Controlled live end-of-day test using the secured Hotel & Hospitality workflow and a tagged test property. All test data was removed after verification.

## Integration finding and remediation

The initial inspection found that hospitality folios supported a `finance_reference` field but did not create a Finance POS summary or General Ledger journal entry. The implementation now adds `hospitality_finance_reconciliations` and `hospitality_reconcile_end_of_day(property_id, business_date)`.

The reconciliation procedure aggregates all closed folios checked out on the property’s local business date, calculates gross revenue, taxes, refunds, captured payments, and variance, and creates the following linked records with one shared `HOSP-EOD` finance reference:

| Destination | Persisted record |
| --- | --- |
| Hospitality | `hospitality_finance_reconciliations` with the operational reconciliation state and variance. |
| Finance/POS | `pos_transactions` summary for the business date, property, payment total, and source breakdown. |
| General Ledger | `journal_entries` document containing cash, hospitality revenue, and tax payable journal lines. |
| Source folios | `finance_reference` updated for every included closed folio. |

The procedure is idempotent for a company, property, and business date. A zero or immaterial variance results in `Reconciled`; a material difference produces `Review` for finance investigation.

## Controlled test path

A test property and room were created, a guest was checked in, a TZS 30,000 restaurant POS order was posted to the room folio, a matching cash payment was recorded, and the guest was checked out. The end-of-day reconciliation was then executed for the property’s local date.

| Assertion | Expected | Actual | Result |
| --- | ---: | ---: | --- |
| Hospitality revenue | TZS 30,000 | TZS 30,000 | Pass |
| Captured payment total | TZS 30,000 | TZS 30,000 | Pass |
| Reconciliation variance | TZS 0 | TZS 0 | Pass |
| Reconciliation state | `Reconciled` | `Reconciled` | Pass |
| Finance POS summary | TZS 30,000 | TZS 30,000 | Pass |
| General Ledger journal amount | TZS 30,000 | TZS 30,000 | Pass |
| Journal debit total | TZS 30,000 | TZS 30,000 | Pass |
| Journal credit total | TZS 30,000 | TZS 30,000 | Pass |
| Journal balance | Debits equal credits | TZS 30,000 = TZS 30,000 | Pass |

The end-to-end test therefore verified the chain **Hotel POS charge → guest folio → cash settlement → end-of-day reconciliation → Finance POS summary → balanced General Ledger entry**.

## Security and cleanup

The reconciliation command requires an authenticated privileged hospitality session. The reconciliation table uses tenant row-level security, and anonymous users have no execute privilege on the command. After the test, the reconciliation, POS summary, journal entry, payment, property, guest, hospitality records, and tagged audit data were removed. A fresh verification query returned zero residual records in all tracked tables.

## Release control

Before real operational use, Finance should configure and approve the property’s chart-of-accounts mapping for cash, revenue, taxes, discounts, deposits, and refunds. The delivered journal data contains the standard cash, hospitality-revenue, and tax-payable lines; an authorised accountant should validate local tax treatment, bank/mobile-money clearing-account mappings, and reporting periods before closing the first production business day.
