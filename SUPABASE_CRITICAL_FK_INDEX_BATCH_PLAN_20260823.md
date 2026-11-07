# Critical Foreign-Key Index Deployment Plan

## Purpose and safety boundary

The Supabase performance advisor identified 632 unindexed foreign-key relationships. A read-only catalog query narrowed that set to **327 candidates** in the highest-value SMART MANAGER modules: banking, finance, MFI, POS, workforce, inventory, sales, and tenant-core tables. This document defines a controlled production rollout; it does not apply any index.

The existing generated migration `supabase/operations/20260824_062_critical_fk_indexes_candidate.sql` is a review inventory and uses ordinary transactional `CREATE INDEX`. It should **not** be run unchanged on a busy production database. The operational plan below uses one `CREATE INDEX CONCURRENTLY` statement per autocommit session, because PostgreSQL documents that concurrent builds avoid write-blocking table locks but cannot execute inside a transaction block [1]. Supabase similarly recommends concurrent creation when avoiding write blocking, while warning that index builds consume additional time, I/O, storage, and write overhead [2].

## Candidate distribution

| Deployment group | Candidates | Rationale |
|---|---:|---|
| Tenant core | 4 | Small identity and workspace boundary; deploy first as a control-path canary. |
| Banking | 66 | Customer, account, loan, transaction, cash, and reconciliation relationships. |
| Finance | 40 | Journal, approval, reconciliation, account, and posting relationships. |
| MFI, inventory, and sales | 39 | Lending, stock, orders, invoices, and payment relationships. |
| POS | 140 | Highest volume group; split most aggressively and serialize indexes on the same table. |
| Workforce | 38 | Role, permission, scope, assignment, and approval relationships. |
| **Total** | **327** | Candidate list generated from the verified live catalog. |

The grouping is a deployment sequence, not a claim that every candidate is equally valuable. Supabase’s Index Advisor notes that the planner may intentionally ignore an index when a sequential scan is cheaper, so query plans and workload value must be checked before promoting a candidate [2].

## Batch schedule

Each numbered batch contains at most **10 indexes** and runs sequentially. There must be no concurrent builds against the same table. The operator should stop after every batch, verify health, and obtain the next rollout gate before continuing.

| Wave | Tables/modules | Approx. indexes | Gate |
|---|---|---:|---|
| 0 | Tenant core: `company_memberships`, `profiles`, `workspaces` | 4 | Confirm no invalid indexes and no elevated lock waits. |
| 1A–1G | Banking, seven sub-batches grouped by table family | 66 | Validate account/customer/loan query plans and write latency. |
| 2A–2D | Finance, four sub-batches grouped by journal/approval/reconciliation paths | 40 | Validate journal posting and reconciliation latency. |
| 3A–3D | MFI, inventory, sales, and one remaining candidate | 39 | Validate loan, stock, invoice, and payment workflows. |
| 4A–4N | POS, fourteen sub-batches of roughly 10 | 140 | Validate sale, tender, shift, return, loyalty, and sync paths after each sub-batch. |
| 5A–5D | Workforce, four sub-batches grouped by role/permission/scope paths | 38 | Validate authorization snapshot and role-assignment paths. |

A production operator should adjust the sub-batch boundary downward for large or write-hot tables. The safe unit is **one concurrent index per session**, not a fixed number of SQL statements in one transaction.

## Preflight gate for every index

Before creating an index, confirm the candidate is still a foreign key in `public`, that the table and columns still exist, and that no equivalent valid index already covers the foreign-key column sequence. Do not use index-name existence alone as proof of equivalence: PostgreSQL notes that `IF NOT EXISTS` does not guarantee the existing index has the requested definition [1].

Capture the current table size, estimated row count, write rate, active locks, and representative `EXPLAIN (ANALYZE, BUFFERS)` plans for the affected query. Avoid starting when a long transaction, vacuum, bulk load, migration, or financial close is active.

Use an autocommit connection with conservative timeouts. A template for one reviewed candidate is:

```sql
SET lock_timeout = '2s';
SET statement_timeout = '15min';
SET application_name = 'smartmanager_fk_index_wave_0';

CREATE INDEX CONCURRENTLY IF NOT EXISTS smart_fk_<stable_hash>
  ON public.<verified_table> (<verified_columns>);
```

Do not wrap this statement in `BEGIN`/`COMMIT`. If the command times out or fails, inspect `pg_class` and `pg_index` for an invalid index before retrying. PostgreSQL documents that failed concurrent builds can leave an invalid index that consumes update overhead; drop the invalid index during an approved window and retry, or use `REINDEX INDEX CONCURRENTLY` where appropriate [1].

## Monitoring during a batch

Track `pg_stat_progress_create_index` for the active build, database CPU and I/O, replication lag, lock waits, API latency, error rate, and write throughput. Stop the wave if lock waits exceed the agreed threshold, p95/p99 latency rises materially, replication falls behind, or the build competes with a financial/POS close.

After each successful index, run `ANALYZE` only when the table needs refreshed statistics and the workload window permits it. Then repeat the representative `EXPLAIN (ANALYZE, BUFFERS)` query and record whether the planner uses the new index. An advisor finding alone is not sufficient proof of business value.

## Post-batch verification

After each wave, verify that every index is valid and ready, no duplicate equivalent index was introduced, foreign-key enforcement still succeeds, RLS and policies are unchanged, and the application’s critical read/write paths remain healthy. Re-run the bounded candidate query to measure the remaining unindexed relationships. Keep the result with the deployment record.

For SMART MANAGER, the minimum functional smoke set after each module wave is:

| Wave | Smoke paths |
|---|---|
| Tenant core | Session identity, company membership, workspace resolution, and auth snapshot. |
| Banking/finance | Account lookup, journal posting, approval lookup, reconciliation, and audit reads. |
| MFI | Client lookup, loan application, schedule, repayment, and collections lookup. |
| POS | Register/shift, sale/tender, return, loyalty, cash movement, and sync lookup. |
| Workforce | Role assignment, permission lookup, scope resolution, and protected RPC access. |

## Rollback and failure handling

An index is an additive performance object and is not part of business data. If a new index increases write cost or causes operational pressure, remove only the named index after confirming no query or constraint depends on it:

```sql
DROP INDEX CONCURRENTLY IF EXISTS public.smart_fk_<stable_hash>;
```

Do not drop an index solely because the advisor still reports a finding; first confirm whether it is equivalent, invalid, or intentionally excluded. Do not manually edit `supabase_migrations.schema_migrations`, disable RLS, or modify constraints as part of index remediation.

## Approval sequence

The recommended sequence is: approve the candidate list; choose a non-production or staging rehearsal; run Wave 0; review evidence; proceed module by module; pause at every gate; and only then promote to production. The 327-index SQL file remains a versioned candidate inventory until this operational approval is complete.

## References

[1]: https://www.postgresql.org/docs/current/sql-createindex.html "PostgreSQL 18: CREATE INDEX"

[2]: https://supabase.com/docs/guides/database/postgres/indexes "Supabase: Managing Indexes in Postgres"
