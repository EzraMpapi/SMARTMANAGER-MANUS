# Supabase Foreign-Key Index Coverage Refresh

**Date:** 2026-08-24  
**Project:** `rlhngsrihahhyxnjxrxm`  
**Scope:** Read-only public-schema catalog analysis; no DDL was executed.

## Executive result

The live Supabase catalog was re-read through the connector. The public table inventory increased from the previous **518** tables to **520** tables. Two tables are newly visible in the current catalog: `public.platform_admin_actions` and `public.platform_admin_dashboard_settings`. No previously observed public table was removed. All 520 public tables report RLS enabled.

The refreshed catalog contains **1,097 foreign-key constraints**. A corrected coverage query classified each FK against valid, ready, and valid PostgreSQL indexes on the child table. The leading-column-prefix test now distinguishes true gaps from existing primary-key and composite-index coverage.

| Classification | FK relationships | Tables affected | Deployment interpretation |
|---|---:|---:|---|
| Truly uncovered | **997** | **506** | Candidate for workload review; not automatically approved for creation. |
| Non-leading composite coverage only | **4** | **4** | All FK columns occur in an index, but not at its leading prefix; exclude from automatic creation until query plans justify a separate index. |
| Primary-key leading-prefix coverage | **1** | **1** | Already covered; do not create another index. |
| Unique leading-prefix coverage | **50** | **50** | Already covered by valid unique/composite indexes; do not create another index. |
| Non-unique composite leading-prefix coverage | **37** | **37** | Already covered by valid composite indexes; do not create another index. |
| **Total** | **1,097** | — | — |

The earlier **1,008** figure was a previous-snapshot strict-detector result. On the refreshed snapshot, the strict unmatched-leading-prefix set is **1,001**; four of those have non-leading composite coverage, leaving **997 truly uncovered** relationships. These counts must not be interpreted as proof that 997 indexes should be deployed.

## Safety checks

The current catalog contains 520 public tables, and the direct FK/RLS reconciliation found all 1,097 public foreign keys on RLS-enabled child relations. The result was `1,097` RLS-enabled, `0` RLS-disabled, and `0` NULL RLS-state foreign keys. No table, index, constraint, policy, trigger, function, storage bucket, or migration-ledger row was changed.

The two newly observed tables are already present in Supabase and are not declared in the current repository migration text. Their presence is therefore not a missing-table gap. No table creation is justified by this refresh.

## Size and activity prioritization proxy

Among the 997 truly uncovered relationships, the relation-size distribution is:

| Child-relation size tier | Uncovered FK relationships |
|---|---:|
| `<= 64 KiB` | **889** |
| `> 64 KiB and <= 256 KiB` | **102** |
| `> 256 KiB` | **6** |

The largest uncovered child relations observed were `workforce_role_permissions` (425,984 bytes; six FKs), `subscription_payments` (229,376 bytes; three FKs), `workforce_permissions` (180,224 bytes; three FKs), and `pos_shift_sessions` (180,224 bytes; seven FKs). The strongest `pg_stat_user_tables` activity proxies among uncovered relationships were `profiles` (2,126 combined sequential and index scans), `company_modules` (196 sequential scans), `hr_employees` (139 combined scans), and `sales_subscriptions` (121 combined scans). These counters are accumulated table-level proxies, not query-level execution costs and not evidence that an index will improve a particular plan.

## Tenant Core consequence

The fresh exact index-definition check shows that the current Tenant Core set is smaller than the prior strict dry-run suggested:

- `company_memberships.company_id` is covered by valid indexes beginning with `company_id`.
- `company_memberships.user_id` is covered by the primary key beginning with `user_id`.
- `profiles.id` is covered by the primary key.
- `workspaces.company_id` is covered by a valid index beginning with `company_id`.
- `profiles.company_id` remains the material Tenant Core FK gap in the refreshed strict coverage view.

This is a deployment candidate only after a representative authorization/profile query plan is captured and the object is rechecked immediately before any future deployment.

## Interpretation and limitations

A foreign-key advisor warning is a prompt for review, not a missing-table or missing-relationship finding. A primary or composite index can cover a relationship when its leading key sequence matches the FK columns. An index whose columns are present only after another leading column may support other workloads but is not equivalent for a direct FK lookup; it is classified separately here rather than silently treated as a replacement.

The catalog snapshot does not establish write frequency, lock contention, buffer-cache behavior, replication impact, or whether the planner will choose an index. Those questions require representative `EXPLAIN (ANALYZE, BUFFERS)` plans and workload observation in an isolated non-production environment. The current Supabase organization remains on the Free plan and exposes only the production-associated default branch, so no concurrent index deployment was attempted.

## References

[1]: https://www.postgresql.org/docs/current/sql-createindex.html "PostgreSQL: CREATE INDEX"  
[2]: https://supabase.com/docs/guides/database/postgres/indexes "Supabase: Managing Indexes in Postgres"
