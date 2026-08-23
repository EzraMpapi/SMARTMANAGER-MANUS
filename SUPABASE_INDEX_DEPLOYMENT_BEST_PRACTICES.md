# Index Deployment Guidance

## Sources

- PostgreSQL `CREATE INDEX`: https://www.postgresql.org/docs/current/sql-createindex.html
- Supabase Managing Indexes in Postgres: https://supabase.com/docs/guides/database/postgres/indexes

## Verified guidance

PostgreSQL documents that `CREATE INDEX CONCURRENTLY` avoids table locks that prevent concurrent inserts, updates, and deletes, while requiring additional scans and taking longer. It also documents that a concurrent build cannot run inside a transaction block, that only one concurrent index build can run on a table at a time, and that a failed concurrent build can leave an invalid index that must be removed or rebuilt.

Supabase documents that ordinary `CREATE INDEX` can lock a table from writes, while `CREATE INDEX CONCURRENTLY` prevents blocking writes at the cost of a longer build and additional overhead. Supabase also warns that indexes increase write and storage overhead and that the planner may intentionally ignore an index when a sequential scan is cheaper.

These constraints support an operational plan that uses one concurrent index per transaction/session, limits concurrent workers, pauses between batches, monitors `pg_stat_progress_create_index`, checks for invalid indexes after failures, and validates query plans before and after each workload-based batch.
