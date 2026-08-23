# P0 Foreign-Key Index Execution Report — 23 August 2026

## Executive result

The explicitly authorized **P0 foreign-key index batch was applied successfully** to Supabase production project `rlhngsrihahhyxnjxrxm`. The migration contained exactly five idempotent `CREATE INDEX IF NOT EXISTS` statements and no P1/P2 indexes, drops, foreign-key changes, RLS changes, grants, or policy changes. The remote ledger records the migration as `fk_index_optimization_p0_review_20260823` at version `20260823204324`.[1]

The post-application catalog audit reports **1,097 foreign keys, 462 covered relationships, and 635 uncovered relationships**. This is the expected arithmetic change from the pre-application 457/640 split. All five expected index names are present with the intended definitions. P1 and P2 remain unapplied.[1]

## Supabase application evidence

| Item | Before | After | Interpretation |
|---|---:|---:|---|
| Foreign-key relationships | 1,097 | 1,097 | No FK definitions changed. |
| Covered by valid non-partial leading-column index | 457 | 462 | Exactly five additional covered relationships. |
| Uncovered relationships | 640 | 635 | Five P0 gaps removed; backlog remains intentionally untouched. |
| `workforce_role_permissions` estimated rows | 469 | 469 | No row data was changed by the migration. |
| `workforce_permissions` estimated rows | 140 | 140 | No row data was changed by the migration. |

The five production indexes are listed below.

| Table | Index | Columns |
|---|---|---|
| `workforce_role_permissions` | `ix_workforce_role_permissions_company_id_approval_request_id_fk` | `(company_id, approval_request_id)` |
| `workforce_role_permissions` | `ix_workforce_role_permissions_granted_by_fk` | `(granted_by)` |
| `workforce_role_permissions` | `ix_workforce_role_permissions_revoked_by_fk` | `(revoked_by)` |
| `workforce_permissions` | `ix_workforce_permissions_created_by_fk` | `(created_by)` |
| `workforce_permissions` | `ix_workforce_permissions_updated_by_fk` | `(updated_by)` |

The preflight workload snapshot showed 469 estimated rows, 8 sequential scans, and 480 index scans for `workforce_role_permissions`; it showed 140 estimated rows, 9 sequential scans, and 1,168 index scans for `workforce_permissions`. The post-application snapshot, after the audit and benchmark reads, showed 15/486 and 14/1,170 respectively. These counters include the verification workload and must not be interpreted as an isolated application-only delta.[1]

## Representative EXPLAIN ANALYZE evidence

The benchmarks used harmless bounded `SELECT` statements with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`. No inserts, updates, deletes, parent-side FK enforcement tests, or destructive operations were run. Three exact predicate shapes have historical pre-application plans and exact-shape post-application plans. Two audit-actor columns had no historical pre result in the captured evidence; the post checks used their current `IS NULL` state because no non-null production sample was available.

| Predicate shape | Pre plan | Post plan | Pre execution | Post execution | Buffer observation |
|---|---|---|---:|---:|---|
| `workforce_role_permissions` by `company_id + approval_request_id` | Bitmap heap scan using `workforce_role_permissions_company_role_status_idx` | Index scan using `ix_workforce_role_permissions_company_id_approval_request_id_fk` | 0.166 ms | 0.105 ms | 16 shared-hit blocks before; 1 after. |
| `workforce_role_permissions` by `company_id + granted_by`, ordered and bounded | Bitmap heap scan under sort using existing company-leading index | Bitmap heap scan under sort using `ix_workforce_role_permissions_granted_by_fk` plus company bitmap | 0.250 ms | 1.558 ms | 19 shared-hit blocks before; 20 after. |
| `workforce_permissions` by `company_id + created_by`, ordered and bounded | Bitmap heap scan under sort using existing company-leading index | Bitmap heap scan under sort using `ix_workforce_permissions_created_by_fk` plus company bitmap | 0.183 ms | 0.893 ms | 5 shared-hit blocks before; 6 after. |
| `workforce_role_permissions` by `revoked_by IS NULL` | Not captured before application | Sequential scan | Not available | 0.154 ms | 5 shared-hit blocks. |
| `workforce_permissions` by `updated_by IS NULL` | Not captured before application | Sequential scan | Not available | 0.213 ms | 5 shared-hit blocks. |

The plans demonstrate **index availability and selection** for the selective composite, granted-by, and created-by predicates. They do not demonstrate a universal wall-clock speedup: these relations are small, the before and after runs were separated in time, cache state and planner state can vary, and the after queries include verification overhead. The two NULL-heavy checks correctly remain sequential scans because every observed row matched the bounded NULL predicate and a sequential scan is cheaper at this table size. The indexes still address future selective history lookups and parent-side FK maintenance as data volume and non-null audit history grow.

Post-application index use was also observed in additional current-value checks: the composite index was selected for an exact `(company_id, approval_request_id)` predicate, the granted-by index was selected for an exact live non-null `granted_by` value, and the created-by index was selected for an exact live non-null `created_by` value.[1]

## Repository/live schema reconciliation

The refreshed Supabase inventory contained **519 public tables**. The repository currently contains 76 SQL migration files declaring 285 distinct table names. The reconciliation found **zero repository-declared tables missing from production**.[3]

Accordingly, no table DDL was executed. The eight local migration-name differences were not blindly replayed because table presence is already complete and migration filenames alone do not prove that replaying historical or review-only artifacts is safe. The applied P0 migration is present in the production ledger as the latest entry.[3]

## Vercel production status

The exact requested Vercel target was checked without creating or replacing any project or domain.

| Verification | Result |
|---|---|
| Team | `EZRA MPAPI` / `team_4wJsmnbcklDGcpeMu7Onld7v` |
| Project | `menejajanja` / `prj_R6b8nLQWSUUshxHW5O0rj8dDOyw2` |
| Required domain | `https://menejajanja.vercel.app` |
| Latest READY production deployment at verification time | `dpl_tywT2YyCoyChoW59WUubahd1Ftqi` |
| Latest READY production SHA | `cda9d3de1be5e8486c273b3aa30a5c2dadfa994c` |
| Requested SHA | `a273450c200b8041bab45682d6c49f3b4c362171` |
| Requested SHA ancestor of latest READY SHA | No |
| Required domain fetch | HTTP 200, `text/html; charset=utf-8`, Vercel cache MISS |

The domain is healthy and serves Smart Manager HTML, but at this checkpoint the exact target was **not verified as serving `a273450` or a descendant**. The repository’s current `main` is still `a273450` before the evidence commit. A normal push of the final evidence commit will be used to trigger the existing Git-linked project; deployment propagation will be checked again after the push. No manual direct upload and no alternate Vercel project/domain will be used.[1]

## References

[1]: ./p0-execution-evidence-20260823.json "Machine-readable Supabase P0 execution, benchmark, and Vercel evidence"
[2]: ../../migrations/20260823_062_fk_index_optimization_p0_apply.sql "Source-controlled five-index P0 migration"
[3]: ./schema-reconciliation-20260823-post-p0.json "Refreshed repository/live Supabase table reconciliation"
[4]: https://menejajanja.vercel.app "Required Vercel production domain"
