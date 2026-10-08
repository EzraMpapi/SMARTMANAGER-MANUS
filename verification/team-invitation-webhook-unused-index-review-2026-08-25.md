# Team Invitation, Webhook, and Unused-Index Verification

**Date:** 25 August 2026  
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`  
**Supabase project:** `rlhngsrihahhyxnjxrxm`

## Executive result

The prior team-invitation failure is resolved in the repository implementation and live schema. The invitation service no longer depends on the optional MySQL `DATABASE_URL`; it uses the server-side Supabase data path after verifying the bearer session, workspace profile, tenant, and manager role. The live `team_invitations` table exists with RLS enabled and no direct client-role privileges.

The standing-order webhook integration and contract tests are green. Unused-index findings were reviewed from a fresh Performance Advisor snapshot. No index is approved for immediate removal. A default-aborting, runtime-gated script has been prepared for seven conditional candidates only; it was not executed.

## Team invitation verification

The original error branch was caused by the invitation service calling the optional Drizzle/MySQL database bootstrap. In the deployed Supabase-backed environment, the absent `DATABASE_URL` left the database handle unavailable. The corrected service uses `public.team_invitations` through server-side Supabase REST requests and retains `resolveVerifiedProfile(req)` as the authorization boundary.

Focused invitation tests passed: **93 tests passed across the combined invitation and webhook run**, including the invitation helper, dashboard contract, and invitation persistence contract coverage. The invitation-related service source no longer imports `getDb`, `drizzle-orm`, or `drizzle/schema`.

The live schema verification returned:

| Control | Result |
|---|---:|
| `team_invitations` table | Present |
| Invitation rows | 0 at verification time |
| Unique constraints | 2 |
| RLS enabled | Yes |
| Direct `anon`/`authenticated`/`public` privileges | 0 |
| Service-role privilege rows | 7 |

No invitation or business data was created, changed, or deleted during verification.

## Standing-order webhook verification

The current run passed both webhook suites:

| Test file | Result |
|---|---|
| `server/standingOrderWebhookMigration.test.ts` | Passed |
| `server/standingOrderWebhookRemediationContract.test.ts` | Passed |
| Combined result | **5 files passed, 93 tests passed** |

The standing-order coverage verifies durable event and processing relations, provider-account-scoped replay identity, advisory locking, trusted tenant derivation, signature/execution controls, append-only evidence, service-role claim boundaries, approval-token separation, bounded leases with `SKIP LOCKED`, safe/unsafe remediation classification, and final processing delegation.

## Current unused-index snapshot

The fresh Performance Advisor response contained **1,046 total lints**, including **372 unused-index observations**, **514 unindexed foreign-key findings**, **150 multiple-permissive-policy findings**, and **10 RLS-initplan findings**. The unused-index observations were joined to live PostgreSQL statistics and catalog metadata.

| Classification | Count | Interpretation |
|---|---:|---|
| Unused-index observations | 372 | Advisor signal; not deletion authorization |
| `idx_scan = 0` | 372 | No observed planner scan since statistics reset/window |
| Empty estimated tables | 311 | Low current population, not proof of future safety |
| Non-empty estimated tables | 61 | Retain pending workload evidence |
| Partial indexes | 15 | Retain; predicate-specific access path |
| FK-leading indexes | 355 | Retain; protects referential operations and tenant joins |
| Broader-prefix overlaps | 17 | Requires query-plan proof before considering removal |
| Exact duplicates | 0 | No confirmed expression-aware duplicates |
| Immediate safe removals | 0 | None |
| Conditional empty/non-FK/non-partial/no-prefix candidates | 7 | Review only; not approved |

The seven conditional candidates are:

| Index | Table | Size | Reason it remains conditional |
|---|---|---:|---|
| `bank_provider_webhook_drain_approvals_scope_idx` | `bank_provider_webhook_drain_approvals` | 8 KiB | Webhook recovery and approval scope path |
| `billing_plans_catalog_idx` | `billing_plans` | 16 KiB | Plan catalog and subscription selection path |
| `hc_insurance_claims_company_status_idx` | `hc_insurance_claims` | 8 KiB | Healthcare claims workflow |
| `hc_notifications_company_status_idx` | `hc_notifications` | 8 KiB | Healthcare notification workflow |
| `platform_admin_actions_actor_idx` | `platform_admin_actions` | 16 KiB | Administrative audit lookup |
| `platform_admin_actions_target_idx` | `platform_admin_actions` | 16 KiB | Administrative target/audit lookup |
| `subscription_payments_provider_order_idx` | `subscription_payments` | 8 KiB | Provider payment reconciliation and idempotency |

The seven candidates were valid, non-unique, non-primary, non-constraint-backed, non-partial, zero-scan indexes on tables with zero estimated rows and no broader same-prefix sibling at the snapshot. These properties are necessary but not sufficient: advisor counters can be reset, small tables can favor sequential scans, and scheduled, recovery, audit, and future workflows may not have run during the observation window.

## Prepared drop script and gates

`verification/unused-index-drop-wave-006-2026-08-25.sql` contains seven `DROP INDEX CONCURRENTLY IF EXISTS` statements. It is intentionally **review-only by default** and exits before any DDL unless the operator explicitly supplies `-v confirm_unused_index_drop=on` in `psql`.

Even with explicit confirmation, the script rechecks each target’s exact definition, zero `idx_scan`, validity, uniqueness/primary status, constraint backing, estimated table population, and broader-prefix overlap. A failed gate aborts the script. The script must not be submitted through the Supabase migration connector because `DROP INDEX CONCURRENTLY` cannot run inside a transaction.

Before any authorized removal, the operator must complete a representative workload window, inspect `pg_stat_statements`, compare `EXPLAIN (ANALYZE, BUFFERS)` plans in staging, review scheduled jobs/webhooks/audit paths, obtain business-owner approval, capture a recreation script, and monitor after a canary. No index removal was executed during this task.

## Repository validation

The invitation and webhook-focused run passed with **5 files and 93 tests**. `git diff --check` passed for the new script. The local repository was synchronized with `origin/main` before this review.

## References

[1]: https://supabase.com/docs/guides/database/database-linter "Supabase Database Linter"  
[2]: https://supabase.com/docs/guides/database/inspect "Supabase Database Debugging and Monitoring"  
[3]: https://supabase.com/docs/guides/database/postgres/indexes "Supabase Managing Indexes in Postgres"  
[4]: https://www.postgresql.org/docs/current/monitoring-stats.html "PostgreSQL Monitoring Database Activity"
