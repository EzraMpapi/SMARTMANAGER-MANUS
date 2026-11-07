# External Supabase guidance consulted — team invitation remediation

## Sources

1. https://supabase.com/docs/guides/database/functions — Supabase Database Functions. Key points: `SECURITY INVOKER` is the default; when using `SECURITY DEFINER`, set `search_path`; restrict execution grants by revoking public/role access and regranting exact functions to intended roles.
2. https://supabase.com/docs/guides/database/postgres/row-level-security — Supabase Row Level Security. Key points: grants and policies both control access; enable RLS on exposed tables; signed-out requests use the `anon` role and signed-in requests use `authenticated`; service-role access must remain server-side.
3. https://supabase.com/docs/guides/database/inspect — Supabase Database Debugging and Monitoring. Key points: unused indexes can add write overhead; workload statistics are cumulative; use `pg_stat_statements`, index-usage inspection, cache-hit checks, locks, and query plans for performance review.
4. https://supabase.com/docs/guides/database/postgres/indexes — Supabase Managing Indexes in Postgres. Key points: the planner may intentionally ignore an index on small tables; `CREATE INDEX CONCURRENTLY` reduces write blocking; index-advisor suggestions are not proof that an index should be created or removed.

These sources support the decision to inspect exact grants and function bodies, preserve tenant/RLS boundaries, and treat unused-index findings as review signals rather than automatic deletion authorization.
