# SMART MANAGER — Unused-Index Review

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Status:** Read-only analysis; no indexes were dropped.

## Executive conclusion

The refreshed Performance Advisor returned **370 current `unused_index` observations**, compared with the previously reported 375. The difference is a snapshot change and is not evidence that five indexes are safe to remove. A live catalog join against all 370 current names found:

| Classification signal | Count |
|---|---:|
| Advisor observations reviewed | 370 |
| `idx_scan = 0` in the live cumulative statistics | 370 |
| On empty estimated tables | 309 |
| On non-empty estimated tables | 61 |
| Partial indexes | 14 |
| Leading a foreign-key column set | 354 |
| With an exact duplicate after expression-aware comparison | 0 |
| With a broader same-prefix index | 17 |
| Invalid indexes | 0 |
| Unique or primary indexes among the observations | 0 |
| Constraint-backed indexes among the observations | 0 |
| Low-risk structural review candidates after exclusions | 7 |

**No index is recommended for immediate production removal.** The advisor’s unused label is an INFO observation based on the current cumulative workload window; it does not prove that an index is redundant, unused by future traffic, irrelevant to RLS or scheduled jobs, or safe to drop.

## Why the result is not a deletion list

PostgreSQL index statistics are workload-dependent and cumulative. All 370 observations currently show zero direct index scans, but 61 are on non-empty tables and 354 lead foreign-key column sets. Those indexes may protect delete/update referential-integrity paths, support nested-loop joins, improve tenant/RLS filtering, or be needed by infrequent financial, audit, webhook, scheduler, or administrative workflows.

Fourteen are partial indexes. Partial indexes frequently support queue, status, expiry, or control-plane predicates that may be exercised only during exceptional or scheduled workflows. Seventeen have a broader same-prefix index, but a larger composite index is not automatically a safe replacement: ordering, predicate, selectivity, index-only behavior, expression trees, and planner cost must be validated with representative `EXPLAIN` plans.

An initial vector-only duplicate heuristic identified one apparent duplicate, but direct index definitions and expression-aware comparison showed it was not a true duplicate. It was an expression-index comparison false positive: `mfi_credit_scorecards_company_application_idx` and `mfi_credit_scorecards_company_borrower_idx` index different JSON expressions. It is therefore not a drop candidate.

## Seven conditional review candidates

After excluding FK-leading, partial, broader-prefix, unique, primary, constraint-backed, invalid, and non-empty-table observations, seven small indexes remain structurally unprotected candidates for **conditional** review. Each is on an empty estimated table and currently occupies only 8–16 KiB. None is approved for deletion yet.

| Index | Table | Bytes | Reason it is only conditional |
|---|---|---:|---|
| `bank_provider_webhook_drain_approvals_scope_idx` | `bank_provider_webhook_drain_approvals` | 8,192 | Webhook drain approval/control-plane lookup; empty now does not mean unused during incident recovery. |
| `billing_plans_catalog_idx` | `billing_plans` | 16,384 | Catalog lookup index; table is expected to become populated and is read by subscription flows. |
| `hc_insurance_claims_company_status_idx` | `hc_insurance_claims` | 8,192 | Tenant/status workflow index; healthcare claims may be infrequent and sensitive. |
| `hc_notifications_company_status_idx` | `hc_notifications` | 8,192 | Tenant/status notification lookup; scheduled or portal workflows may be sparse. |
| `platform_admin_actions_actor_idx` | `platform_admin_actions` | 16,384 | Administrative audit lookup; removal could degrade support/security investigations. |
| `platform_admin_actions_target_idx` | `platform_admin_actions` | 16,384 | Administrative audit lookup by target; same auditability risk as above. |
| `subscription_payments_provider_order_idx` | `subscription_payments` | 16,384 | Payment-provider reconciliation/idempotency lookup; must not be removed without tracing webhook and retry paths. |

These candidates are **review queue entries, not safe-to-drop indexes**. In particular, the two `platform_admin_actions` indexes and the payment-provider index should be treated as high-risk despite empty current row estimates.

## Index classes that must not be dropped from this analysis

| Class | Count | Required treatment |
|---|---:|---|
| FK-leading indexes | 354 | Retain unless an equivalent leading-column path and referential-integrity workload proof exist. This review does not authorize removal. |
| Partial indexes | 14 | Inspect predicate-specific queue/scheduler/webhook usage and test exact predicate plans first. |
| Non-empty-table indexes | 61 | Require a longer observation window, query-corpus review, and `EXPLAIN` comparison before any change. |
| Broader-prefix overlap | 17 | Verify true key order, expressions, predicates, selectivity, and planner choices; prefix overlap alone is insufficient. |
| Recently created/remediation indexes | Included in observations | Do not drop based on short or zero usage after creation; allow workload to mature. |

## Required evidence before any drop

A future removal proposal must first identify the index’s creation migration, constraint/RLS/policy relationship, exact key expressions and predicate, dependent procedures and scheduled jobs, and all application call sites that filter or sort by the indexed columns. The owner should then capture a representative query corpus from `pg_stat_statements`, including normal, month-end, reconciliation, webhook retry, admin, and incident-recovery paths.

The proposed candidate should remain unused over a defined observation window that spans the application’s real business cycle. For each candidate, compare `EXPLAIN` plans with and without the index in a staging or disposable clone, confirm that foreign-key checks and deletes/updates retain acceptable plans, and measure write latency, storage, lock behavior, and cache impact. The change must be a separate, owner-approved migration using `DROP INDEX CONCURRENTLY` only where the operational environment supports it; it must not be mixed into FK-index creation waves.

After a canary drop, monitor query latency, error rates, webhook/scheduler outcomes, RLS-sensitive access paths, and write performance. Keep a reversible recreation script with the exact original definition. Do not drop an index because it is small, because a table is currently empty, or because another index shares a prefix.

## Recommended disposition

| Disposition | Count | Action |
|---|---:|---|
| Retain | 363 | Includes FK-leading, partial, non-empty, broader-prefix, and control/audit-sensitive cases. |
| Conditional review queue | 7 | Collect provenance, workload, policy, and staging-plan evidence. No production DDL. |
| Immediate safe removal | 0 | No candidate meets a production-safe deletion standard from current evidence. |

The five-observation difference from the earlier 375 count should be reconciled by comparing advisor snapshots and migration history before any deletion decision. It should not be treated as implicit authorization to remove five indexes.

## References

[1]: https://supabase.com/docs/guides/database/inspect "Supabase Database Debugging and Monitoring"  
[2]: https://supabase.com/docs/guides/database/postgres/indexes "Supabase Managing Indexes in Postgres"  
[3]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[4]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"  
[5]: https://www.postgresql.org/docs/current/monitoring-stats.html "PostgreSQL Monitoring Statistics"
