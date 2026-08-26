# Property Management snapshot-read repair — 2026-08-26

## Scope

The Property Management workspace displayed a server-confirmed snapshot-read failure. The repair is deliberately restricted to the read-only snapshot RPC definitions and their regression coverage. No application data, table shape, RLS policy, membership, financial posting, or audit record was created, changed, or deleted.

## Root causes repaired

| Defect | Repair migration | Outcome |
|---|---|---|
| JSON aggregate order clauses referenced source names rather than the camel-case aliases exported by their derived projections. | `20260826_022_property_snapshot_ordering_repair.sql` | Every reviewed aggregate ordering now references its emitted API alias. |
| Local PL/pgSQL variable `l` conflicted with nested lease aliases also named `l`. | `20260826_023_property_snapshot_limit_scope_repair.sql` | The local variable is `v_limit`; all snapshot row limits use that name. |
| The work-order aggregate sorted by `createdAt`, but the work-order projection did not export it. | `20260826_024_property_snapshot_work_order_timestamp_repair.sql` | Work orders now export `created_at AS "createdAt"`. |

Each migration replaces only `property_snapshot(integer)` and `property_tenant_snapshot(integer)`, retains `SECURITY DEFINER` and `search_path=public, auth`, revokes `PUBLIC`/`anon`, and grants execution only to `authenticated`.

## Production validation

The active Supabase project registered the repairs as `property_snapshot_ordering_repair_20260826` (`20260826130920`), `property_snapshot_limit_scope_repair_20260826` (`20260826131136`), and `property_snapshot_work_order_timestamp_repair_20260826` (`20260826131406`). A privacy-preserving owner-session smoke test returned `snapshot_ok` and exposed no tenant or property data.

The regression suite passed 2 files / 15 tests. TypeScript passed. The full test suite passed 246 files / 1,010 tests, with 7 credential-gated files / 15 tests skipped. The Vite client and both server bundles compiled successfully. The schema-preflight build requires protected runtime credentials unavailable to this sandbox; no credential substitute was committed.
