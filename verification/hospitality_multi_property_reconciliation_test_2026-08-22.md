# Multi-Property Hotel End-of-Day Reconciliation Test

**Date:** 22 August 2026  
**Method:** Controlled live test across two distinct hospitality properties, followed by complete tagged-data cleanup.

## Scenario

Two independent properties were created in the same company context. Each property completed a guest stay with its own room, restaurant POS order, folio, payment method, checkout, and end-of-day reconciliation. Property A settled a TZS 30,000 cash restaurant charge. Property B settled a TZS 45,000 mobile-money restaurant charge.

The reconciliation procedure was executed separately for each property and local business date. Each execution created its own linked hospitality reconciliation, Finance POS summary, General Ledger entry, and `HOSP-EOD` finance reference. Consolidation was then calculated across both resulting finance documents.

## Results

| Measure | Property A | Property B | Consolidated | Outcome |
| --- | ---: | ---: | ---: | --- |
| Hospitality revenue | TZS 30,000 | TZS 45,000 | TZS 75,000 | Pass |
| Captured payments | TZS 30,000 | TZS 45,000 | TZS 75,000 | Pass |
| Reconciliation variance | TZS 0 | TZS 0 | TZS 0 | Pass |
| Reconciliation status | Reconciled | Reconciled | Reconciled | Pass |
| GL debits | TZS 30,000 | TZS 45,000 | TZS 75,000 | Pass |
| GL credits | TZS 30,000 | TZS 45,000 | TZS 75,000 | Pass |
| Property separation | Distinct property document | Distinct property document | 2 properties | Pass |

## Conclusion

The Hotel Finance bridge correctly maintained property-level isolation while enabling consolidated reporting at company level. Each property produced a separate reconciled end-of-day record and balanced General Ledger entry. The combined company view reconciled to TZS 75,000 gross revenue, TZS 75,000 payments, zero variance, and equal TZS 75,000 debit and credit totals.

All controlled data was removed after the test. Independent verification returned zero residual reconciliations, properties, guests, and tagged audit records.
