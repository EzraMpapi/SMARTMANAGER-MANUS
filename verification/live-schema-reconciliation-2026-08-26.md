# Live Supabase Schema Reconciliation

**Date:** 26 August 2026  
**Target:** `rlhngsrihahhyxnjxrxm` — active Supabase project.

## Reconciliation method

The repository verifier inspected persistence-table references from `BusinessSphereDashboard.jsx` and the protected Microfinance, Pharmacy, and School Management services. The live catalog was then read through the enabled Supabase connector, and the migration ledger was checked for the current repository migration series.

| Check | Result |
|---|---:|
| Repository-referenced persistence tables | 201 |
| Deployed tables reported by repository verifier | 536 |
| Missing contract tables | 0 |
| Tenant-column contract issues | 0 |
| Critical contract issues | 0 |
| Public-table entries returned by connector inventory | 535 |

The connector table inventory is a compact public-schema catalog response, while the verifier uses the application’s deployed OpenAPI contract view. Their aggregate counts are not a missing-object signal: every repository-referenced table resolves in the live schema.

## Migration ledger

The live migration ledger includes the recent project schema work, including team invitation storage, duplicate-index cleanup, healthcare laboratory categories, and bank-provider webhook FK indexes. No repository migration was found to be absent from the live ledger in the reviewed current series.

## SQL decision

No new schema SQL file or Supabase migration was generated or applied. The authoritative verifier identified no missing table, tenant contract, or critical schema object. Creating tables without a demonstrated contract gap would duplicate production objects and could undermine existing RLS and tenant-isolation safeguards.
