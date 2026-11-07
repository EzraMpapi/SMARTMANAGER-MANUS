# SMART MANAGER — FK Advisor Remediation Wave 004

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)

## Result

Wave 004 was selected from a freshly refreshed live Supabase foreign-key coverage catalog and applied successfully through the Supabase connector. The wave contains 25 exact missing leading-column indexes across workforce authorization and POS pricing/loyalty tables.

The migration changed indexes only. It did not modify data, foreign-key constraints, RLS policies, grants, security-definer modes, or tenant-isolation predicates.

## Live coverage and advisor measurements

| Measurement | Before wave 004 | After wave 004 | Change |
|---|---:|---:|---:|
| Public FK constraints in catalog | 1,116 | 1,116 | 0 |
| Catalog-covered FKs | 554 | 579 | +25 |
| Catalog missing FK coverages | 562 | 537 | -25 |
| Performance Advisor unindexed-FK findings | 554 | 529 | -25 |
| Performance Advisor duplicate-index findings | 0 | 0 | 0 |

The exact catalog and the advisor both recorded a reduction of 25 for this wave. The live migration channel returned `success: true` for `fk_index_remediation_wave_004_20260825`.

## Wave scope

The 25 statements cover:

| Domain | Index statements |
|---|---:|
| Workforce data scopes, member roles, module access, permission conflicts, and roles | 17 |
| POS discount rules and loyalty ledger/members | 8 |
| **Total** | **25** |

The review script is `supabase/scripts/fk-index-remediation-wave-004.sql`. The applied repository migration is `supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql`. The review SQL is also preserved at `verification/fk-advisor-remediation-wave-004-2026-08-25.sql`.

## Regression verification

The current repository validation passed after the live database change:

| Check | Result |
|---|---|
| TypeScript check | Passed |
| Full Vitest suite | 230 files passed, 6 skipped; 944 tests passed, 14 skipped |
| FK migration-plan tests | Passed |
| FK optimization-script tests | Passed |
| Migration statement count | 25 |
| Git diff validation | Passed |

## Safety controls

Wave 004 was limited to `CREATE INDEX IF NOT EXISTS` statements generated from live catalog evidence. The corresponding review scripts use `CREATE INDEX CONCURRENTLY IF NOT EXISTS` and must be executed one statement at a time outside a transaction during a suitable maintenance window. The connector-applied migration is idempotent and is recorded in the Supabase migration ledger.

Remaining performance-advisor findings are not automatically cleared by this wave: 529 unindexed foreign-key findings, 346 unused-index observations, 150 multiple-permissive-policy findings, and 10 RLS-initplan findings remain. These require fresh evidence and separate review; no broad index drops or RLS/security-definer changes are included in wave 004.

## References

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Performance and Security Advisors"  
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[3]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[4]: https://www.postgresql.org/docs/current/sql-createindex.html "PostgreSQL CREATE INDEX"
