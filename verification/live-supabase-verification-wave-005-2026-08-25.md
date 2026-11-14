# SMART MANAGER — Live Supabase Verification and Performance Review, Wave 005

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)

## Executive result

The live Supabase database was rechecked after FK-index remediation wave 005. The wave migration returned `success: true`, the migration ledger contains `fk_index_remediation_wave_005_20260825`, and the full repository regression suite passed. The database remains structurally intact: all 532 public tables have RLS enabled, all 203 public `SECURITY DEFINER` functions have pinned `search_path` configuration, and the integrity checks found zero invalid indexes, zero duplicate index-name groups, and zero public tables with RLS disabled.

Fourteen foreign-key constraints were added by later schema activity between the previous wave-004 checkpoint and the wave-005 preflight. Accordingly, wave 005 is reported against the immediately preceding wave-005 baseline rather than against the older wave-004 totals.

## Live schema and integrity inventory

| Verification | Live result |
|---|---:|
| Public tables | 532 |
| Public columns | 6,414 |
| Foreign-key constraints | 1,130 |
| Primary-key constraints | 532 |
| Unique constraints | 278 |
| Public indexes | 1,397 |
| Non-internal triggers | 451 |
| Public functions/procedures | 246 |
| `SECURITY DEFINER` functions | 203 |
| Definer functions with `search_path` pinning | 203 |
| RLS-enabled public tables | 532 |
| Public RLS policies | 731 |
| Invalid public indexes | 0 |
| Unvalidated foreign keys | 4 |
| Unvalidated constraints, all types | 14 |
| Public tables without RLS | 0 |
| RLS-enabled tables without direct policy | 6 |
| Duplicate public index-name groups | 0 |

The four unvalidated foreign keys and 14 unvalidated constraints are existing catalog conditions requiring separate identification and owner review. Wave 005 did not alter constraint validation state.

## Wave 005 FK coverage

The exact catalog classifier was rerun before and after the migration using leading-column coverage, valid/non-partial indexes, and the FK column order. The first 25 uncovered relationships were selected because they were fresh catalog gaps and each had an estimated source-table row count of 1.

| Metric | Before wave 005 | After wave 005 | Change |
|---|---:|---:|---:|
| FK constraints | 1,130 | 1,130 | 0 |
| Catalog-covered FK relationships | 584 | 609 | +25 |
| Catalog-missing FK relationships | 546 | 521 | -25 |
| Performance Advisor unindexed-FK findings | 537 | 512 | -25 |
| Performance Advisor duplicate-index findings | 0 | 0 | 0 |

The wave covered 25 Fleet, Hospitality, and HR relationships. It added indexes only; it did not add tables, columns, foreign keys, policies, grants, RLS changes, or data changes.

## Performance Advisor snapshot

The post-wave-005 Performance Advisor returned 1,047 findings: 887 INFO and 160 WARN.

| Finding | Severity | Count | Treatment |
|---|---|---:|---|
| `unindexed_foreign_keys` | INFO | 512 | Remains staged for small reviewed waves; no bulk execution. |
| `unused_index` | INFO | 375 | No drops; requires workload and query-plan evidence. |
| `multiple_permissive_policies` | WARN | 150 | Requires predicate-equivalence and tenant-boundary review. |
| `auth_rls_initplan` | WARN | 10 | Requires policy-expression review and controlled plan validation. |

The increase in unused-index observations is informational and does not establish that any index is safe to remove. The remaining 512 advisor FK notices and 521 exact catalog gaps remain backlog rather than authorization to run wave 006 automatically.

## Operational activity

A read-only last-24-hour unified-log volume check returned the following activity counts:

| Supabase log source | Entries |
|---|---:|
| `edge_logs` | 6,639 |
| `auth_logs` | 2,260 |
| `postgres_logs` | 848 |
| `postgrest_logs` | 677 |
| `realtime_logs` | 210 |
| `function_logs` | 108 |
| `auth_audit_logs` | 71 |
| `function_edge_logs` | 36 |
| `pgbouncer_logs` | 11 |
| `storage_logs` | 11 |

These are activity volumes, not error rates. The available bounded query did not infer application correctness or absence of errors from volume alone. A focused error-rate query should be performed separately if a defined log field and incident time window are provided.

The live project also reports three active Edge Functions: `gate-keyring`, `issue-ticket`, and `standing-order-scheduler`. Their JWT verification configuration remains an application/security review item and was not changed during FK remediation.

## Automated verification

The repository-level validation completed after the live migration:

| Check | Result |
|---|---|
| TypeScript check (`pnpm check`) | Passed |
| Full Vitest suite | 230 files passed, 6 skipped; 944 tests passed, 14 skipped |
| Live migration result | `success: true` |
| Migration ledger | Wave 005 present at version `20260825161600` |
| Exact FK catalog before/after | 546 → 521 missing |
| Performance Advisor before/after | 537 → 512 unindexed-FK findings |
| Index integrity | 0 invalid; 0 duplicate-name groups |
| RLS posture | 532/532 public tables RLS enabled |
| Security-definer search path | 203/203 pinned |

## Overall assessment

Wave 005 was successful and low risk based on the checks performed. The index remediation reduced both the exact catalog gap and the advisor’s unindexed-FK findings by 25 without altering business behavior. The principal remaining risks are not addressed by FK indexing: 126 authenticated-executable security-definer findings, six anonymous-executable security-definer functions, six RLS-enabled/no-direct-policy tables, 150 multiple-permissive-policy warnings, 10 RLS-initplan warnings, and disabled leaked-password protection. These remain intentionally staged for separate, signature-specific and predicate-specific review.

The four unvalidated foreign keys should be identified and reviewed before any future constraint-related work. No production deployment is required for wave 005 because application code was unchanged; only the database migration ledger and review artifacts were updated.

## References

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Database Advisors"  
[2]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[3]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[4]: https://www.postgresql.org/docs/current/sql-createindex.html "PostgreSQL CREATE INDEX"
