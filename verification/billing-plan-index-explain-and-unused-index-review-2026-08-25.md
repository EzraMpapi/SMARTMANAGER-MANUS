# Billing Plan Index EXPLAIN and Unused-Index Review

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Review type:** Read-only production metadata and query-plan verification

## Result

The fresh Performance Advisor snapshot contains **372 unused-index observations**. A complete second-pass live catalog comparison found **no additional low-risk removal candidate beyond the seven previously classified conditional indexes**.

| Classification | Count |
|---|---:|
| Unused-index observations | 372 |
| Zero-scan observations | 372 |
| Empty estimated tables | 311 |
| Non-empty estimated tables | 61 |
| FK-leading indexes | 355 |
| Partial indexes | 15 |
| Broader same-prefix overlap | 17 |
| Exact expression-aware duplicates | 0 |
| Additional low-risk candidates beyond the seven | **0** |

The seven conditional indexes remain subject to workflow review, staging workload replay, and business-cycle observation. No index was dropped.

## Billing catalog EXPLAIN verification

The first attempted EXPLAIN used a migration-era `trial_days` column that is not present in the current live `billing_plans` schema. The live column contract was checked, the query was corrected to use only current columns, and no schema change was made.

### Production-shaped catalog query

The query filters global active plans and orders by `sort_order, name`:

```sql
SELECT p.code, p.name, p.plan_category, p.status, p.sort_order
FROM public.billing_plans AS p
WHERE p.company_id IS NULL
  AND p.status = 'Active'
ORDER BY p.sort_order, p.name
LIMIT 100;
```

The live plan used `billing_plans_active_idx` for the filter, returned 7 rows, used 8 shared-hit blocks, and completed in **0.156 ms**. The result confirms the active-plan sibling index is the preferred path for the current public catalog shape.

### Category-filtered catalog query

The category-filtered query adds `plan_category = 'Business'` and orders by `sort_order, code`:

```sql
SELECT p.code, p.name, p.plan_category, p.status, p.sort_order
FROM public.billing_plans AS p
WHERE p.company_id IS NULL
  AND p.status = 'Active'
  AND p.plan_category = 'Business'
ORDER BY p.sort_order, p.code
LIMIT 100;
```

The live plan used **`billing_plans_catalog_idx`**, with index conditions on `plan_category` and `status`, returned 4 rows, used 1 shared-hit block and 1 shared-read block, and completed in **1.082 ms**. This directly proves that the candidate is useful for category-filtered catalog access, even though its cumulative `idx_scan` value is currently zero in the observed production statistics.

## Retention decision

`billing_plans_catalog_idx` is retained. The default production-shaped query is served by `billing_plans_active_idx`, while the category-filtered query selects the catalog index. The zero-scan advisor observation is therefore a workload-shape signal, not evidence of redundancy.

The remaining six conditional indexes are also retained because they support webhook recovery, healthcare queues, Global Admin audit investigation, and payment reconciliation/idempotency. The recommended current removal count is **zero**.

## Safety boundary

The review executed no DDL, did not reset statistics, did not change planner settings, and did not mutate production data, RLS, grants, policies, constraints, or tenant-isolation logic. The existing `verification/unused-index-drop-wave-006-2026-08-25.sql` remains an explicit-confirmation, evidence-gated review script and was not executed.

## References

[1]: https://supabase.com/docs/guides/database/database-linter "Supabase Database Linter"  
[2]: https://www.postgresql.org/docs/current/using-explain.html "PostgreSQL EXPLAIN"  
[3]: https://www.postgresql.org/docs/current/monitoring-stats.html "PostgreSQL Monitoring Database Activity"
