# SMART MANAGER — Live Supabase Verification and Security Advisor Report

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)

## Executive result

A complete read-only database verification suite was run after foreign-key remediation wave 002. The security and performance advisors were refreshed, the RLS and security-definer posture was catalogued, and foreign-key remediation wave 003 was selected from a fresh live catalog. Wave 003 applied successfully through the Supabase connector and added 25 indexes across finance and workforce tables.

The application and build validation suite passed after the database change. No business data, foreign-key constraints, RLS policies, function grants, security-definer modes, or tenant-isolation controls were modified.

## Live database verification

| Verification item | Live result |
|---|---:|
| Public tables | 525 |
| Public columns | 6,301 |
| Foreign-key constraints | 1,116 |
| Primary-key constraints | 525 |
| Unique constraints | 278 |
| Public indexes | 1,292 |
| Public triggers | 510 |
| Public functions | 236 |
| `SECURITY DEFINER` functions | 203 |
| Public views | 0 |
| RLS-enabled public tables | 525 |
| Public RLS policies | 728 |
| RLS-enabled tables without direct policies | 2 |
| Storage buckets | 3 |
| Storage policies | 3 |

The migration ledger contains wave 001, wave 002, and wave 003 entries. The wave 003 ledger entry is `fk_index_remediation_wave_003_20260825`.

## Foreign-key wave 003

The live catalog contained 587 missing exact FK index coverages before wave 003. The selected batch contained 25 relationships, prioritized across finance and workforce authorization tables. The batch was applied as idempotent `CREATE INDEX IF NOT EXISTS` statements through the connector; the repository also preserves the equivalent `CREATE INDEX CONCURRENTLY IF NOT EXISTS` review script for maintenance-window execution.

After application, the catalog measured 554 covered FK constraints and 562 remaining missing exact coverages. The refreshed performance advisor reported 554 remaining unindexed-FK findings, down from 579 before wave 003. The advisor and exact catalog use different composite-index heuristics, so both measurements are retained.

| Performance finding | Before wave 003 | After wave 003 |
|---|---:|---:|
| Unindexed foreign keys | 579 | 554 |
| Duplicate indexes | 0 | 0 |
| Multiple permissive policies | 150 | 150 |
| Unused indexes | 296 | 321 |
| RLS initplan findings | 10 | 10 |

The unused-index count is an advisor observation count, not a count of indexes removed. No unused index was removed.

## Security advisor remediation report

The refreshed Security Advisor reports **133 WARN findings and 2 INFO findings**.

| Finding | Severity | Count | Decision |
|---|---|---:|---|
| `anon_security_definer_function_executable` | WARN | 6 | Deferred for public booking/seat-hold threat-model review. |
| `authenticated_security_definer_function_executable` | WARN | 126 | Deferred for function-by-function least-privilege review. |
| `auth_leaked_password_protection` | WARN | 1 | Requires enabling the Supabase Auth setting by the project owner. |
| `rls_enabled_no_policy` | INFO | 2 | Restricted procedure-only access requires verification; no generic policy added. |

The live catalog verification found all 203 security-definer functions with pinned `search_path` configuration. This reduces search-path hijacking risk but does not prove that every function has correct tenant checks, return-shape minimization, or least-privilege grants.

The two RLS-enabled tables without direct policies are `public.platform_admin_actions` and `public.subscription_trial_expiry_notices`. They are intentionally treated as sensitive procedure-controlled records. Adding a broad authenticated policy would risk exposing administrator audit or subscription-notice data.

The performance advisor reports 150 multiple-permissive-policy findings, grouped by the catalog into 15 table/command combinations with more than one permissive policy. Because permissive policies combine with OR semantics, no policy was merged or dropped without formal predicate equivalence and representative tenant/role testing.

## Application verification

The post-wave repository checks completed successfully:

| Check | Result |
|---|---|
| TypeScript check | Passed |
| Full Vitest suite | 230 files passed, 6 skipped; 944 tests passed, 14 skipped |
| Vite production build | Passed |
| Server bundle build | Passed for application and API entrypoints |
| Migration-wave statement validation | 25 wave 003 statements verified |
| Git diff validation | Passed |

## Security decisions and deferred work

The security findings remain separate workstreams from FK indexing. Public security-definer functions must be reviewed for enumeration, token ownership, TTL bounds, and absence of tenant-data exposure. Authenticated security-definer functions must be reviewed for `auth.uid()` checks, company membership, workforce permissions, maker-checker enforcement, idempotency, expected-version checks, audit logging, search-path pinning, and narrow role grants.

Leaked-password protection is an Auth configuration setting and should be enabled in the Supabase dashboard, followed by a controlled password recovery and sign-in test. Multiple permissive policies should be consolidated only after staging row-set comparisons prove that the new `USING` and `WITH CHECK` predicates are equivalent for every role and command. Unused indexes should be removed only after workload-history review and staging query-plan validation.

## Artifacts

- `supabase/migrations/20260825_015_fk_index_remediation_wave_003.sql` — applied wave record.
- `supabase/scripts/fk-index-remediation-wave-003.sql` — concurrent review script.
- `verification/fk-advisor-remediation-wave-003-2026-08-25.sql` — wave SQL review artifact.
- `verification/supabase-security-advisor-remediation-2026-08-25.md` — comprehensive security-advisor report.
- This file — live verification and wave 003 evidence.

## References

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Performance and Security Advisors"  
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[3]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[4]: https://www.postgresql.org/docs/current/sql-createfunction.html "PostgreSQL CREATE FUNCTION"
