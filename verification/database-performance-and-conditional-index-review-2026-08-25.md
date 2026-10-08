# Database Performance Benchmark and Conditional Index Review

**Date:** 25 August 2026  
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Benchmark time:** 2026-08-25 19:12:15 UTC

## Executive result

The selected GitHub repository is synchronized with `origin/main` at commit `0ed0c67` and has no uncommitted changes. The live Supabase migration ledger was reconciled before any DDL decision. All reviewed local schema work is already present in the live ledger, and the required recent objects are present. **No additional tables or migrations were missing, so no schema DDL was replayed.**

A read-only benchmark was run using `pg_stat_statements`, `pg_stat_user_indexes`, `pg_stat_user_tables`, `pg_statio_user_tables`, and live catalog metadata. The database shows a strong sampled shared-buffer hit ratio, but the statistics are cumulative and include Supabase catalog/advisor introspection as well as application traffic. This is an operational benchmark snapshot, not a controlled isolated load test.

## Schema synchronization checkpoint

The live public inventory returned **533 public tables**, with **RLS enabled on all 533**. The recent required objects were all present:

| Object | Live status |
|---|---|
| `team_invitations` | Present |
| `bank_provider_transactions` | Present |
| `bank_provider_webhook_events` | Present |
| `bank_provider_webhook_processing` | Present |
| `bank_provider_webhook_drain_approvals` | Present |
| `bank_provider_webhook_drain_runs` | Present |
| `bank_provider_webhook_account_controls` | Present |
| `bank_provider_webhook_remediation` | Present |

The live migration ledger contains the reviewed invitation, webhook, and FK remediation entries. Re-running local migrations would risk duplicate objects or mismatched ledger history and was correctly avoided.

## Benchmark methodology

The benchmark did not reset `pg_stat_statements`, run write operations, alter planner settings, create/drop indexes, or execute business transactions. It collected the top 100 public-index usage rows, the top 100 zero-scan public indexes, the top 100 public-table activity rows, the top 50 cumulative statements, all seven candidate-index usage rows, and cache/maintenance statistics.

The `pg_stat_statements` data is cumulative since the last statistics reset and includes connector/catalog inspection and Supabase metadata activity. It must not be interpreted as an application-only latency SLA. The benchmark therefore reports both aggregate signals and the query classes that dominate the current sample.

## Live performance results

| Metric | Result |
|---|---:|
| Statements in top-query sample | 50 |
| Calls represented in sample | 25,344 |
| Total execution time in sample | 739,256.219 ms |
| Call-weighted mean execution time | 29.169 ms |
| Shared blocks hit | 47,450,375 |
| Shared blocks read | 1,768 |
| Shared-buffer hit ratio | **99.9963%** |
| Public index rows sampled | 100 |
| Zero-scan index rows sampled | 100 |
| Candidate index rows checked | 7 |

The strongest latency outliers are metadata-introspection queries rather than normal business endpoints. The dominant catalog query averaged approximately 24.6 seconds across 17 calls, while another catalog query averaged approximately 19.7 seconds across two calls. These queries performed many shared-buffer hits and should not be confused with customer-facing ERP transaction latency. By contrast, commonly observed application RPCs were materially lower in this snapshot: `auth_identity_snapshot` averaged approximately 52.6 ms, `billing_access_snapshot` approximately 19.5 ms, `employee_portal_snapshot` approximately 13.9 ms, and `billing_public_plan_catalog` approximately 10.0 ms.

Table activity is concentrated in small or empty metadata and authorization tables. `profiles` recorded 11,085 sequential scans and 66,188 sequentially read tuples; `company_modules` recorded 293 sequential scans and 18,166 sequentially read tuples; `workforce_permissions` recorded 305 index scans and 2,060 sequentially read tuples. Many sampled tables have zero estimated rows, and the observed maintenance timestamps are null in the returned `pg_stat_user_tables` sample. These observations support a later statistics-maintenance review, but they do not justify dropping indexes or changing autovacuum settings in production.

## Conditional candidate usage

All seven conditional candidates returned **`idx_scan = 0`**, zero tuple reads/fetches, and small relation sizes. That signal is insufficient for deletion because the affected workflows are empty, infrequently scheduled, recovery-oriented, administrative, or not exercised during the current statistics window.

| Candidate index | Size | Current scans | Workflow risk | Recommendation |
|---|---:|---:|---|---|
| `bank_provider_webhook_drain_approvals_scope_idx` | 8 KiB | 0 | Provider/account-scoped recovery approvals and expiry/lease operations | **Retain** |
| `billing_plans_catalog_idx` | 16 KiB | 0 | Public plan catalog, plan ordering, billing selection | **Retain pending catalog EXPLAIN proof** |
| `hc_insurance_claims_company_status_idx` | 8 KiB | 0 | Tenant-scoped insurance claims listing and billing workflow | **Retain** |
| `hc_notifications_company_status_idx` | 8 KiB | 0 | Tenant-scoped healthcare notification queue/read state | **Retain** |
| `platform_admin_actions_actor_idx` | 16 KiB | 0 | Global Admin actor audit history and support actions | **Retain** |
| `platform_admin_actions_target_idx` | 16 KiB | 0 | Global Admin target audit history and trial-notice resets | **Retain** |
| `subscription_payments_provider_order_idx` | 16 KiB | 0 | HarakaPay provider-order lookup and payment reconciliation/idempotency | **Retain; P0 protection** |

### 1. Webhook drain approvals

`bank_provider_webhook_drain_approvals_scope_idx` covers `(provider, provider_account_key, status, expires_at)`. The standing-order remediation control plane opens and leases provider-account-scoped drains, checks approval state, enforces expiry and item/settlement caps, and serializes the scope with advisory locks. The contract test explicitly verifies separate request, approver, and final tokens, provider-account binding, one-use consumption, and service-role-only operational access. A zero-scan reading is expected while the recovery queue is empty; removal would make the first recovery event pay the full filter cost and would weaken a safety-critical operational path. **Do not drop.**

### 2. Billing plan catalog

`billing_plans_catalog_idx` covers `(plan_category, status, sort_order, code)`. The subscription catalog RPC and server billing catalog handler expose active plans and their deterministic ordering. The live table currently has no estimated rows, while the table has other activity, so the zero index scan is not proof that the index is redundant. Before any review, capture `EXPLAIN (ANALYZE, BUFFERS)` for the exact `billing_public_plan_catalog` query in staging with representative plans and compare it against the sibling active-plan index. **Retain until that proof exists.**

### 3. Healthcare insurance claims

`hc_insurance_claims_company_status_idx` covers `(company_id, status)`. The healthcare server contract requires verified-profile authentication, company-scoped REST filters, and role gates for front-desk, billing, and administrative claims workflows. The list path filters by company and excludes archived records by status. Even if the current table is empty, removing the index would turn claims queue and billing-status reads into unindexed tenant scans when claims arrive. **Retain.**

### 4. Healthcare notifications

`hc_notifications_company_status_idx` covers `(company_id, status)`. The same healthcare server contract supports tenant-scoped notification listing, creation, update, acknowledgement, and archive operations across clinical, laboratory, pharmacy, front-desk, and billing roles. Notification queues are typically bursty and status-driven; current emptiness is not a safe deletion basis. **Retain.**

### 5. Global Admin actions by actor

`platform_admin_actions_actor_idx` covers `(actor_user_id, created_at DESC)`. The Global Admin adapter requires a verified bearer and platform-admin role before calling `platform_admin_snapshot`, `platform_admin_executive_snapshot`, and `platform_admin_record_action`. The SQL control plane records support actions with actor identity and time ordering. This index supports audit investigation and compliance evidence, even if no current operator has generated enough rows to make the planner use it. **Retain.**

### 6. Global Admin actions by target

`platform_admin_actions_target_idx` covers `(target_type, target_id, created_at DESC)`. It supports reverse investigation of actions against a subscription, user, company, or other target, including legitimate trial-expiry notice resets. Removing it would make targeted support/audit lookups scan the administrative action log. **Retain.**

### 7. Subscription payments by provider order

`subscription_payments_provider_order_idx` covers `(provider, provider_order_id)`. The server payment path directly queries `subscription_payments` by provider and provider order ID before applying provider status, and it uses that lookup for status checks and webhook processing. The same migration family documents payment idempotency, provider dispatch, reconciliation, and the one-pending-payment constraint. This index is a **P0 retention requirement** and must not be dropped based on current zero scans.

## Removal-script status

The repository already contains `verification/unused-index-drop-wave-006-2026-08-25.sql`. It is not a migration and was not sent through the Supabase connector. It is review-gated by default, requires explicit operator confirmation, rechecks exact index definitions and current safety conditions, and uses `DROP INDEX CONCURRENTLY` only outside a transaction. The current benchmark does not authorize enabling it. **Zero indexes were removed.**

The correct next step is a staging replay with representative data and workload capture, followed by a full scheduled/webhook/business-cycle observation window. Only candidates with stable evidence, no policy or scheduler dependency, no FK/constraint role, and an approved recreation plan should proceed to a canary removal. In the present production state, the recommended removal count is **zero**.

## Repository result

The branch was synchronized with `origin/main` at `0ed0c67` before this review. The report records the benchmark and dependency review; no application or schema code was changed by this task.

## References

[1]: https://supabase.com/docs/guides/database/database-linter "Supabase Database Linter"  
[2]: https://supabase.com/docs/guides/database/postgres/indexes "Supabase PostgreSQL Index Guidance"  
[3]: https://www.postgresql.org/docs/current/monitoring-stats.html "PostgreSQL Monitoring Database Activity"  
[4]: https://www.postgresql.org/docs/current/pgstatstatements.html "PostgreSQL pg_stat_statements"
