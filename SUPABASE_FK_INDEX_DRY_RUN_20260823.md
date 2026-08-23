# Foreign-Key Index Safety Dry Run — 2026-08-23

## Result

A bounded read-only catalog query was run against Supabase project `rlhngsrihahhyxnjxrxm`. It found **1,008 remaining unindexed foreign-key relationships** across all public tables.

| Safety check | Result |
|---|---:|
| Remaining unindexed foreign keys | 1,008 |
| Candidates with valid table and column definitions | 1,008 |
| Invalid table/column candidates | 0 |
| Candidates on RLS-enabled tables | 1,008 |
| Candidates on non-RLS tables | 0 |

The result is a safety inventory, not proof that every candidate needs an index. The earlier critical-module query selected 327 candidates for a reviewable operational inventory. The difference exists because the critical query is intentionally narrower than the all-public-table advisor result.

## Candidate script review

`supabase/operations/20260824_062_critical_fk_indexes_candidate.sql` contains 327 ordinary `CREATE INDEX IF NOT EXISTS` statements, each using a stable `smart_fk_<hash>` name and verified table/column sequence. It is wrapped in one `BEGIN;`/`COMMIT;` transaction and therefore is **not** the low-locking production execution form.

The script is kept under `supabase/operations/`, not `supabase/migrations/`, to prevent automatic migration pipelines from applying it accidentally. Production execution must use the approved batch plan: one `CREATE INDEX CONCURRENTLY IF NOT EXISTS` statement per autocommit session, no transaction wrapper, conservative lock and statement timeouts, one active concurrent build per table, and a stop/rollback gate after every batch.

## No live DDL was applied

The current connected Supabase branch inventory exposes only the default `main` branch, associated with the live project and reporting `MIGRATIONS_FAILED` management metadata. No isolated staging branch was available. No index DDL was applied, no table or constraint was changed, RLS remained enabled, and existing data was not touched.

## Follow-up

Before any production index rollout, provision or approve an isolated staging target, compare candidate definitions against existing equivalent indexes, capture table sizes and representative query plans, execute small workload-based waves, monitor lock waits/latency/I/O/replication, and re-run this dry-run query after each wave.
