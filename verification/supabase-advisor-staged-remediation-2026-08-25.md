# SMART MANAGER — Supabase Advisor Staged Remediation

**Date:** 25 August 2026  
**Project:** `rlhngsrihahhyxnjxrxm`  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)

## Outcome

The live Supabase advisors were remediated in staged batches. The first batch added **25 exact missing foreign-key indexes** to the banking tables, and one verified redundant duplicate index was removed. No table data, foreign keys, RLS policies, grants, security-definer functions, or constraint-backed indexes were changed.

The database migration channel returned success for both changes. The live migration ledger now records:

| Migration | Live version |
|---|---:|
| `fk_index_remediation_wave_001_20260825` | `20260825141849` |
| `drop_redundant_fixed_deposit_product_index_20260825` | `20260825142251` |

## Foreign-key index classification

The live catalog contains 1,116 public foreign-key constraints. Before wave 001, the exact catalog classifier found 637 missing leading-column index coverages, while the Supabase advisor reported 626 findings. The difference is recorded rather than hidden: the advisor and catalog use different coverage heuristics for composite/overlapping indexes. The repository’s reviewed allowlist contained 623 targets; 616 were eligible under the exact catalog classifier and are represented in the review-only plan.

Wave 001 added 25 indexes. The exact catalog classifier then measured 504 covered foreign keys and 612 remaining missing coverages, a reduction of 25. The Supabase performance advisor reduced its `unindexed_foreign_keys` findings from 626 to **601**, also a reduction of 25.

The review-only full plan is stored at `verification/fk-advisor-remediation-plan-2026-08-25.sql`. It contains 616 `CREATE INDEX CONCURRENTLY IF NOT EXISTS` statements divided into waves of 25. It must not be executed inside a transaction. The first 25 statements are separately stored in `supabase/scripts/fk-index-remediation-wave-001.sql`; the applied repository migration is `supabase/migrations/20260825_013_fk_index_remediation_wave_001.sql`.

The first wave was deliberately prioritized for banking relationships and ran against tables whose live statistics reported zero rows. Future waves must be selected using live table size, write rate, query plans, storage headroom, and maintenance windows. The next wave must not be applied automatically merely because a statement exists in the plan.

## Duplicate and unused indexes

The performance advisor’s duplicate-index warning was verified precisely. The two identical indexes were:

- `bank_fixed_deposit_products_company_code_idx`
- `bank_fixed_deposit_products_company_id_code_key`

The second index is backed by the unique constraint `bank_fixed_deposit_products_company_id_code_key`; the first had no backing constraint. Only the redundant non-constraint index was dropped. The advisor now reports **zero duplicate-index findings**.

The advisor still reports 271 unused-index observations. These are informational and are not safe drop candidates without workload history, future-feature review, query-plan checks, and staging validation. No unused indexes were dropped.

## RLS policy and security-definer review

The live database has RLS enabled on all public tables and 728 public RLS policies. The performance advisor reports 150 multiple-permissive-policy findings. These policies may intentionally compose role and operational access rules; merging or dropping them without proving equivalent tenant and role semantics could widen or deny access. No policy was changed.

The security advisor reports 133 warnings and 2 informational findings:

| Finding | Count | Action |
|---|---:|---|
| Anonymous-executable security-definer functions | 6 | Deferred for public booking/seat-hold threat-model review. |
| Authenticated-executable security-definer functions | 126 | Deferred for function-by-function least-privilege review. |
| Leaked-password protection | 1 | Requires enabling the Supabase Auth setting and owner verification. |
| RLS enabled without policy | 2 | `platform_admin_actions` and `subscription_trial_expiry_notices`; direct table privileges are revoked and access is intentionally through restricted procedures. |

The security-definer inventory found pinned search-path configuration on the reviewed security-definer functions. No blanket `SECURITY INVOKER` conversion or mass privilege revocation was performed because that could break identity, financial, operational, and public booking workflows.

## Validation

The latest repository passed the post-remediation checks:

| Check | Result |
|---|---|
| TypeScript | Passed |
| Full Vitest suite | 230 files passed, 6 skipped; 944 tests passed, 14 skipped |
| Live migration application | Both requested narrow migrations returned success |
| FK advisor | 626 → 601 unindexed-FK findings |
| Duplicate-index advisor | 1 → 0 findings |
| Existing RLS/security controls | Not changed |

## Recommended next waves

The next FK wave should be a reviewed batch of no more than 25 statements, preferably selected from populated tables with high-value join/delete paths and no existing equivalent composite index. Each statement should be run independently with `CREATE INDEX CONCURRENTLY`, monitored for progress and lock impact, then followed by an advisor refresh and representative `EXPLAIN` checks.

The unused-index candidates should be reviewed only after sufficient workload history is available. A candidate may be dropped only when it is non-constraint-backed, not required by a foreign key or unique constraint, unused across a representative observation window, and validated in staging. Multiple permissive policies should be consolidated only when the resulting predicate is formally equivalent for every role and operation. Security-definer changes require individual function-body, search-path, role-grant, and caller-path review.

## References

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Performance and Security Advisors"  
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[3]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS "SMART MANAGER GitHub repository"  
[5]: https://smartmanager-manus-render.onrender.com "SMART MANAGER Render deployment"
