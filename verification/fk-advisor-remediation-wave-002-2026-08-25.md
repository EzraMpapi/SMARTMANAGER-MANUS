# SMART MANAGER — FK Advisor Remediation Wave 002

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)

## Scope and safety

Wave 002 was selected from a refreshed live foreign-key catalog after wave 001. It contains 25 exact foreign-key relationships still lacking a leading-column B-tree index under the catalog classifier. The selection was limited to banking and finance tables, with priority given to deterministic table/constraint order and current live row estimates.

The applied SQL added indexes only. It did not modify table data, foreign-key constraints, RLS policies, grants, security-definer functions, or constraint-backed indexes. The review artifact retains `CREATE INDEX CONCURRENTLY IF NOT EXISTS` statements for maintenance-window execution. The Supabase migration channel applied the idempotent equivalent as one named migration.

## Selected relationships

The wave covered the following areas:

| Area | Relationships |
|---|---:|
| Bank loan applications, approvals, and repayments | 5 |
| Bank notifications, payment instructions, reconciliations, shares, standing orders, tellers, and wallets | 13 |
| Finance accounts, journal lines, and journal batches | 7 |
| **Total** | **25** |

The full exact statements are stored in `supabase/scripts/fk-index-remediation-wave-002.sql`, and the applied migration is `supabase/migrations/20260825_014_fk_index_remediation_wave_002.sql`.

## Live application and verification

The Supabase connector returned `success: true` for migration `fk_index_remediation_wave_002_20260825`. The live catalog then measured 529 covered foreign keys and 587 remaining missing coverages, reducing the catalog missing count by 25 from the pre-wave value of 612.

The refreshed Supabase performance advisor reported:

| Finding | Before wave 002 | After wave 002 | Change |
|---|---:|---:|---:|
| Unindexed foreign keys | 601 | 579 | -22 |
| Duplicate indexes | 0 | 0 | 0 |
| Multiple permissive policies | 150 | 150 | 0 |
| Unused indexes | 271 | 296 | advisor observation count changed; no indexes were dropped |
| Auth RLS initplan findings | 10 | 10 | 0 |

The advisor’s reduction was 22 rather than 25 even though the catalog classifier reduced its missing count by 25. This is recorded as a measurement difference between the advisor’s heuristic and the exact catalog classifier, not treated as a failure. The next wave must be selected from a fresh advisor/catalog comparison rather than assumed from arithmetic alone.

## Repository validation

The existing foreign-key migration-plan tests passed with 11 tests. The full repository validation immediately before this wave had passed with 230 Vitest files and 944 tests, TypeScript checks, and direct production artifact builds. The wave contains no application-code changes.

## Next-wave controls

Remaining FK findings should continue in batches of no more than 25. Before each batch, refresh the advisor and catalog, exclude already-covered prefixes and constraint indexes, inspect estimated table size and write activity, and prefer `CREATE INDEX CONCURRENTLY` outside transaction blocks during a controlled maintenance window. After each batch, refresh advisors and run representative `EXPLAIN` checks.

The 150 multiple-permissive-policy findings, 296 unused-index observations, and 10 RLS-initplan findings remain deferred because changing them without policy equivalence proofs, workload history, or query-plan validation could weaken tenant isolation or regress writes. Security-definer and leaked-password-protection findings remain separate security workstreams.

## References

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Performance and Security Advisors"  
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[3]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS "SMART MANAGER GitHub repository"
