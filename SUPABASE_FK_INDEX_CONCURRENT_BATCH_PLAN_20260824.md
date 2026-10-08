# Safe Foreign-Key Index Execution Plan — Refreshed 2026-08-24

## Purpose and non-production boundary

This document defines a controlled rollout for **verified foreign-key index candidates**. It is an execution plan, not an instruction to apply DDL now. The current Supabase organization is on the Free plan and exposes only the production-associated default branch; therefore, no index is to be created from this document until an approved isolated staging target is available.

The plan uses PostgreSQL `CREATE INDEX CONCURRENTLY`, one statement per autocommit session, because concurrent index creation must not run inside a transaction block. The candidate SQL file under `supabase/operations/` remains a review artifact and must not be replayed unchanged: it uses ordinary transactional `CREATE INDEX` and was generated before this refreshed coverage classification.

## Refreshed catalog facts

The live public catalog currently contains **520 tables**, up from 518 in the previous snapshot. The two newly observed tables are `public.platform_admin_actions` and `public.platform_admin_dashboard_settings`; neither is missing from Supabase. All 520 public tables report RLS enabled.

The catalog contains **1,097 foreign-key constraints**. Exact index-prefix classification found **1,003 truly uncovered relationships**, four relationships with only non-leading composite coverage, two relationships covered by primary-key prefixes, 51 covered by unique composite prefixes, and 37 covered by non-unique composite prefixes.

| Classification | Count | Action |
|---|---:|---|
| Truly uncovered FK relationships | 1,003 | Review and prioritize; do not auto-apply. |
| Non-leading composite coverage only | 4 | Exclude from automatic creation; validate with query plans. |
| Primary-key leading-prefix coverage | 2 | Exclude; already covered. |
| Unique leading-prefix coverage | 51 | Exclude; already covered. |
| Non-unique composite leading-prefix coverage | 37 | Exclude; already covered. |

The earlier 1,008-candidate figure is retained as historical evidence only. It was generated against the earlier catalog snapshot and did not fully separate existing coverage classes. The refreshed strict unmatched-leading-prefix set is 1,007; four have non-leading composite coverage, leaving 1,003 truly uncovered relationships.

## Promotion gates

No candidate may enter a deployment wave until all of the following are true:

1. The child table and FK columns still exist in `public`, and the FK constraint is still present.
2. The candidate has no valid, ready, equivalent index whose leading key sequence covers the FK columns.
3. The child relation has RLS enabled and its policy behavior is unchanged.
4. A representative workload query and `EXPLAIN (ANALYZE, BUFFERS)` baseline have been recorded in staging.
5. The table is not undergoing a migration, vacuum, bulk load, financial close, POS close, or other high-lock operation.
6. A rollback owner, monitoring window, and stop thresholds have been identified.

`IF NOT EXISTS` is not an equivalence check. Recheck the actual index definition immediately before execution.

## Wave sequence

The safe unit is one index build per autocommit session. The table below is a scheduling sequence, not an approval to create all 997 indexes.

| Wave | Scope | Proposed unit | Exit gate |
|---|---|---|---|
| 0 | Tenant Core | Start with `profiles.company_id` only if the preflight confirms it remains uncovered. Recheck `company_memberships` and `workspaces` first; current evidence shows their relevant relationships are already covered. | Auth snapshot, profile/company lookup, workspace resolution, lock waits, and latency remain healthy. |
| 1 | Identity and authorization | `profiles`, `company_modules`, `workforce_roles`, `workforce_permissions`, and role/permission assignment paths, ordered by observed activity and then size. | Permission hydration and protected RPC smoke tests pass; no RLS or deny-precedence regression. |
| 2 | Finance and approvals | Journal, account, approval, reconciliation, and posting relationships. Keep same-table builds serialized. | Posting/reconciliation integrity, p95 latency, and replication remain within baseline. |
| 3 | Bank and MFI | Customer, account, loan, repayment, cash, and transaction relationships. | Account lookup, loan schedule, repayment, collections, and audit reads pass. |
| 4 | POS control and sales | Registers, terminals, shifts, sales, tenders, returns, tax, discounts, loyalty, and sync relationships. Split into small waves because POS has many FKs and write-sensitive paths. | Register/shift, sale/tender, return, cash movement, and sync smoke tests pass. |
| 5 | Inventory, sales, hospitality, workforce remainder | Remaining workload-approved candidates, grouped by business domain and serialized by table. | Domain smoke tests and workload plan checks pass. |
| 6 | Low-activity remainder | Candidates with no meaningful observed activity proxy, only after a workload owner confirms the relationship is worth indexing. | No unnecessary index growth, write regression, or advisor-induced over-indexing. |

Within each wave, use batches of at most **five to ten indexes**, reduce to one for a large or write-hot table, and stop after every build. Do not run multiple concurrent builds on the same table.

## Autocommit execution template

Run each statement from a connection configured with autocommit enabled. Do not wrap it in `BEGIN` or `COMMIT`.

```sql
SET lock_timeout = '2s';
SET statement_timeout = '15min';
SET application_name = 'smartmanager_fk_index_wave_0';

CREATE INDEX CONCURRENTLY IF NOT EXISTS smart_fk_<stable_hash>
  ON public.<verified_child_table> (<verified_fk_columns>);
```

The stable name and exact column list must be generated from the current catalog after the promotion gates pass. Do not substitute a guessed table or column name.

## Monitoring and stop gates

During each build, monitor `pg_stat_progress_create_index`, active locks, CPU, I/O, replication lag, API error rate, p95/p99 latency, and write throughput. Stop the wave if the build waits on a lock beyond the agreed threshold, materially increases latency or errors, competes with a financial/POS close, produces replication lag outside the service objective, or causes unexpected write pressure.

After success, verify `pg_class` and `pg_index` show the index as valid and ready. Run `ANALYZE` only when statistics are stale and the workload window permits. Repeat the baseline `EXPLAIN (ANALYZE, BUFFERS)` and record whether the planner uses the index; an advisor warning alone is not evidence of business value.

## Failure and rollback handling

A failed concurrent build may leave an invalid index. Inspect the index state before retrying. An invalid, unused index may be removed only after review:

```sql
DROP INDEX CONCURRENTLY IF EXISTS public.smart_fk_<stable_hash>;
```

Never repair an index failure by editing the migration ledger, disabling RLS, dropping an unrelated constraint, or replaying the entire local migration directory. Index rollback is an additive-object operation and must not mutate posted financial data.

## Evidence to retain per build

For every executed candidate, retain the FK constraint name, child table, column sequence, index name, exact SQL, preflight index list, relation size, row estimate, baseline and post-build query plans, build duration, lock/latency/I/O observations, replication state, smoke-test result, and final validity state. Rerun the catalog dry run after each wave.

## Current execution decision

The refreshed analysis is complete, but **no index DDL is approved or applied**. The current plan is a staging-ready runbook only. The Free-plan project has no isolated development branch, and the production-associated default branch must not be used as a canary target.

## References

[1]: https://www.postgresql.org/docs/current/sql-createindex.html "PostgreSQL: CREATE INDEX"  
[2]: https://supabase.com/docs/guides/database/postgres/indexes "Supabase: Managing Indexes in Postgres"
