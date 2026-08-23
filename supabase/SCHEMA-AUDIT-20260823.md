# SMART MANAGER Supabase Schema Audit — 2026-08-23

## Scope

This audit compares the SMART MANAGER repository migration set with the live Supabase project `rlhngsrihahhyxnjxrxm`. It covers migration history, public-schema tables, repository-declared tables, and the controlled Community Groups migration that was pending in the live migration ledger.

## Results

| Evidence | Result |
|---|---:|
| Repository SQL migration files | 54 |
| Repository-declared tables parsed from migrations | 241 |
| Live Supabase migrations after reconciliation | 117 |
| Live public tables | 513 |
| Repository-declared tables missing from live | 0 |
| `audit_log` required baseline columns | Present: `id`, `company_id`, `created_at`, `updated_at` |
| Property Management snapshot functions | Present in production |
| Money Agent reconciliation `createdAt` correction | Present in production |
| Community Groups relationship-guard approval fix | Applied and recorded at version `20260823131351` |

## Migration actions

The local migration `20260823_043_community_groups_relationship_guard_approval_fix.sql` was applied through the Supabase migration interface using the migration name `community_groups_relationship_guard_approval_fix`. The migration is idempotent at the function-definition level and reconciles the production ledger with the already tracked repository migration.

The subsequent production ledger includes `security_hardening_search_paths_and_pin_rls` at version `20260823133542`, `workforce_permission_seed` at version `20260823133812`, and `rls_policy_helper_execute_grants` at version `20260823135435`. These are already applied in production; no duplicate execution was attempted.

The previously created `property_management_core` and `fix_money_agent_snapshot_reconciliation_created_at` migrations were already present in the production migration history at versions `20260823123739` and `20260823123817`. No duplicate application was attempted.

Several live migration names are not present as exact filenames in the current repository because they belong to earlier schema histories or use different logical names. Their declared tables and functions are already present in production, so they were not blindly reapplied. This avoids replaying baseline, cleanup, or privilege migrations against an active database.

## Missing-table assessment

No repository-declared table was missing from the live public schema. The live database contains 513 public tables, while the current repository migration parser declares 241 tables. The larger live count is expected because the production project includes earlier foundation histories, legacy compatibility tables, module schemas, and migrations whose source files are not represented by the current 53-file repository subset.

Because the audit found no missing repository-declared tables, no speculative tables were created. New tables should only be added when backed by a source contract, a migration, and an RLS policy design.

## Security follow-up

The Supabase security advisor still reports pre-existing SECURITY DEFINER execute-grant notices and other hardening items. The four targeted mutable search-path findings and the Money Agent PIN table’s missing-policy finding were remediated by `security_hardening_search_paths_and_pin_rls`; the remaining execute-grant findings require endpoint-by-endpoint access-contract review and are intentionally not hidden by this schema audit.

## Verification sources

The audit was grounded in the Supabase connector results for `list_migrations`, `list_tables` with public-schema metadata, the production `pg_proc` definition for `community_groups_assert_relationships()`, and the repository migration files under `supabase/migrations/`. The refreshed reconciliation on 2026-08-23 again found 0 missing repository-declared tables among 513 live public tables, so no speculative table creation was performed.
