# P0 Foreign-Key Index Follow-Up Performance Report — 24 August 2026

## Result

A fresh read-only performance check was completed against Supabase production project `rlhngsrihahhyxnjxrxm` after the five authorized P0 indexes were deployed. All five expected indexes remain present with the intended definitions. No new DDL was executed during this follow-up, and P1/P2 indexes remain unapplied.

## Current relation and index metrics

| Object | Current observation |
|---|---:|
| `workforce_role_permissions` relation size | 120 kB |
| `workforce_permissions` relation size | 48 kB |
| Deployed P0 indexes found | 5 of 5 |
| Each P0 index size | 16 kB |
| Current `pg_stat_user_tables.n_live_tup` snapshot | 0 for both tables |
| Current `pg_stat_user_indexes.idx_scan` snapshot | 0 for each P0 index |
| Current performance-advisor notices | 1,012 unindexed-FK lints |

The statistics snapshot is a point-in-time operational observation. It should not be confused with the planner estimates reported by `EXPLAIN`, nor should the zero `idx_scan` counters be interpreted as proof that an `EXPLAIN ANALYZE` statement was not able to use an index. PostgreSQL statistics and query-plan observations are different measurement surfaces.

## Fresh query execution times

The same bounded, read-only predicate shapes used in the deployment evidence were executed with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`. No DML, parent-side deletes, or destructive FK-enforcement tests were run.

| Predicate | Observed plan | Actual rows | Planning time | Execution time | Buffers |
|---|---|---:|---:|---:|---|
| `workforce_role_permissions` by `company_id + approval_request_id` | Index Scan using `ix_workforce_role_permissions_company_id_approval_request_id_fk` | 0 | 10.256 ms | 0.125 ms | 0 hit / 1 read |
| `workforce_role_permissions` by `company_id + granted_by`, ordered and bounded | Bitmap Heap Scan; new `granted_by` index plus company bitmap | 10 returned; 67 heap rows | 1.869 ms | 2.313 ms | 4 hit / 16 read |
| `workforce_permissions` by `company_id + created_by`, ordered and bounded | Bitmap Heap Scan; new `created_by` index plus company bitmap | 10 returned; 20 heap rows | 4.730 ms | 3.915 ms | 4 hit / 2 read |
| `workforce_role_permissions` by `revoked_by IS NULL` | Sequential Scan | 100 | 0.970 ms | 0.127 ms | 5 hit / 0 read |
| `workforce_permissions` by `updated_by IS NULL` | Sequential Scan | 100 | 0.707 ms | 3.915 ms | 5 hit / 0 read |

The current plans confirm that the composite, `granted_by`, and `created_by` indexes are available to the planner for selective predicates. The `revoked_by IS NULL` and `updated_by IS NULL` predicates remain sequential scans, which is expected for NULL-heavy predicates on small relations. A single fresh execution per query is not a controlled latency benchmark, and no universal speedup claim is made.

## Schema reconciliation and table DDL decision

The current connector inventory reports 520 live public tables, 285 distinct repository-declared table names, and zero missing repository-declared tables. The production migration ledger contains 137 entries, with the latest observed migration `platform_admin_dashboard_settings_direct_access_policy` at version `20260824123045`.

Because every repository-declared table is already present, the correct senior-engineering action is **no table DDL**. Local migration-name differences were not blindly replayed, and no speculative “new” tables were created from the attachment’s broad Global Admin requirements. The attachment was reviewed as an architectural directive; it does not by itself prove that a production table is missing.

## Evidence sources

The raw Supabase connector captures are retained outside the repository task workspace. The source-controlled companion evidence records the deployment baseline and exact P0 definitions in `p0-execution-evidence-20260823.json`; the refreshed table reconciliation is in `schema-reconciliation-20260823-post-p0.json` from the prior execution. The current raw captures are:

- Performance metrics: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-27-27.274174772_supabase_execute_sql_94edbcbe.json`
- Composite plan: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-27-47.487766741_supabase_execute_sql_027bda47.json`
- Granted-by plan: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-28-05.280202854_supabase_execute_sql_9db7fc93.json`
- Created-by plan: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-28-28.876302402_supabase_execute_sql_8eb891f5.json`
- Revoked-by plan: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-28-49.642479926_supabase_execute_sql_0690f320.json`
- Updated-by plan: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-29-11.721563797_supabase_execute_sql_0be79d2b.json`
- Live table inventory: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-29-53.863226748_supabase_list_tables_cda77021.json`
- Live migration ledger: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-30-12.580816768_supabase_list_migrations_81f7bbc9.json`
- Performance-advisor snapshot: `/home/ubuntu/.mcp/tool-results/2026-08-24_17-31-03.052875419_supabase_get_advisors_ab28c2b3.json`
