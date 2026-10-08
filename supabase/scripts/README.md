# Supabase FK-index optimization

This directory contains a **reviewable, dry-run-by-default** helper for the production foreign-key index audit. The helper is not a Supabase migration and it does not execute automatically. It generates `CREATE INDEX CONCURRENTLY IF NOT EXISTS` statements only after re-checking the live catalog, and it can apply them only when an operator supplies an explicit confirmation environment variable.

## Current audit artifacts

The captured advisor allowlist in [`fk-index-advisor-targets-20260823.txt`](./fk-index-advisor-targets-20260823.txt) contains the 622 `unindexed_foreign_keys` findings returned by the Supabase performance advisor on 23 August 2026. The corrected catalog comparison found 630 missing leading-column index relationships across 289 public tables. The eight catalog-only relationships are intentionally excluded from the default allowlist and are documented in [`FK_INDEX_AUDIT_20260823.md`](./FK_INDEX_AUDIT_20260823.md) for manual review.

## Plan mode

The script requires a PostgreSQL connection string because it refreshes live catalog state before producing a plan. It does not run production DDL in plan mode:

```bash
DATABASE_URL='postgresql://…' \
  ./supabase/scripts/optimize_unindexed_foreign_keys.sh \
  --plan \
  --output /tmp/fk-index-optimization-plan.sql
```

By default, the advisor allowlist is used, tables with estimated row counts below 100 are emitted as deferred comments, and at most 25 indexes would be eligible in a future apply run. Use `--min-rows`, `--include-empty`, `--max-indexes`, or `--targets-file` to change those review parameters deliberately. Use `--catalog` only when you intentionally want to inspect all corrected catalog gaps, including the eight advisor/catalog discrepancies.

## Apply mode

Apply mode is a separate, explicit operation. Review the generated SQL first, verify the target tables and query plans, and then run one bounded batch with `CONFIRM_FK_INDEX_DDL=YES`:

```bash
CONFIRM_FK_INDEX_DDL=YES DATABASE_URL='postgresql://…' \
  ./supabase/scripts/optimize_unindexed_foreign_keys.sh \
  --apply \
  --max-indexes 5 \
  --min-rows 100 \
  --output /tmp/fk-index-optimization-plan.sql
```

The script refuses to apply without the confirmation variable, refuses batches above `--max-indexes`, never drops indexes, and processes each concurrent index build one at a time. `CREATE INDEX CONCURRENTLY` is deliberately not wrapped in `BEGIN`/`COMMIT`; this avoids the PostgreSQL transaction restriction for concurrent index creation. If a statement fails, the script stops and leaves already-created indexes in place. Those additions are reversible with individually reviewed `DROP INDEX CONCURRENTLY IF EXISTS` statements, but no rollback DDL is executed automatically.

## Catalog coverage rules

A foreign key is considered covered only when a valid, non-partial index on the child table has the FK columns as its **leading columns**. Primary and unique indexes are accepted as coverage. The catalog query uses the corrected PostgreSQL zero-based `pg_index.indkey` slice:

```sql
i.indkey[0:cardinality(fk.conkey) - 1]::int[] = fk.conkey::int[]
```

This distinction matters for tenant-aware composite relationships. A leading `(company_id)` index is not treated as equivalent to a required `(company_id, related_id)` relationship index when the full composite foreign key is uncovered.

## Verification after any authorized apply

After a bounded apply, capture the exact output and re-run the Supabase performance advisor. Re-run the corrected catalog query, confirm the intended findings decreased, and repeat representative `EXPLAIN (ANALYZE, BUFFERS)` checks for the owning module. Also verify tenant isolation, insert/update/delete paths, approval workflows, and any relevant RLS tests. Do not remove zero-scan or left-prefix candidate indexes from this automation; those are a separate workload-observation and approval process.
