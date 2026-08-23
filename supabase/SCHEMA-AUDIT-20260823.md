# SMART MANAGER Supabase Schema Audit — 2026-08-23

## Scope

This audit compares the SMART MANAGER repository’s frontend and protected-service persistence contracts with the connected Supabase project `rlhngsrihahhyxnjxrxm` (`EzraMpapi's Project`). It covers migration history, the live public-schema table inventory, tenant-critical columns, RLS coverage, subscription tables, Property Management tables, and the reviewed security migrations. All observations below are read-only connector evidence except for the explicitly recorded versioned migrations.

## Current results

| Evidence | Result |
|---|---:|
| Repository SQL migration files | 68 |
| Frontend/service persistence tables parsed | 247 |
| Live Supabase migration entries | 121 |
| Live public base tables | 513 |
| Live tables with RLS enabled | 513 |
| Live tables with at least one policy | 513 |
| Live tables without a primary key | 0 |
| Repository-referenced tables missing from live | 0 |
| Referenced tenant tables missing `id`, `company_id`, `created_at`, or `updated_at` | 0 |
| Company-scoped tables in live inventory | 511 |
| Subscription-related tables | 32 |
| Property Management tables | 37 |

## Entity-to-schema mapping

The frontend’s company-scoped persistence calls resolve to the existing public tables and use the database’s `company_id` tenant boundary. The profile bootstrap reads `profiles` and its assigned `companies` record; membership and role workflows use the existing `company_memberships` and membership RPCs; operational module calls use the existing module tables; and the platform billing center uses `billing_plans`, `billing_profiles`, `tenant_subscriptions`, `subscription_payments`, `subscription_invoices`, `subscription_usage`, `subscription_events`, and related notification/audit tables. The live schema contains every one of the 247 referenced frontend/service tables, so no duplicate table was created.

The live subscription architecture already includes database-driven official plans, 30-day company-scoped trials, provider-confirmed payment state, billing-manager checks, invoice/payment/audit records, and the additive `billing_access_snapshot()` contract. The platform UI reuses those tables and RPCs rather than introducing a second billing system.

## Migration actions

The live ledger includes the previously applied `profile_identity_center` migration at version `20260823130430`, `security_hardening_search_paths_and_pin_rls` at `20260823133542`, `rls_policy_helper_execute_grants` at `20260823135435`, `subscription_access_snapshot` at `20260823142807`, and `sensitive_rpc_execute_hardening` at `20260823151641`. Each has a tracked source migration in `supabase/migrations/`; no duplicate application was attempted.

The repository also contains earlier baseline and module histories whose live logical migration names do not always match the current filename stem. The comparison therefore uses actual frontend/service references and the authoritative live table inventory rather than blindly replaying historical DDL. This avoids destructive or duplicate schema changes against an active database.

## Missing-table assessment

No repository-declared frontend or protected-service table is missing from the live public schema. No tenant-critical column issue was found, and all 513 live public base tables have RLS enabled and at least one policy. The 511 company-scoped tables were included in the authenticated transaction-scoped RLS sweep described below. Because the audit found no missing required table or column, no speculative table creation was justified.

The live schema is larger than the current repository’s directly parsed table set because it includes earlier foundation histories, compatibility tables, module schemas, and applied migrations from prior repository states. A live-only table is not evidence of drift by itself; it must first be referenced by a current source contract or required by a reviewed feature migration.

## RLS and tenant-isolation verification

The rollback-only authenticated sweep covered all 511 live company-scoped tables using the existing audit fixture. **473** probes completed without execution errors, **zero** cross-tenant rows were observed, and the remaining **38** errors were intentional direct denials for the 37 Property Management tables and `money_agent_pin_credentials`. No reviewed SECURITY DEFINER helper permission error remained in the current sweep. Ten tables returned rows for the fixture, and all observed rows respected the company boundary.

The direct denials are preserved deliberately: Property Management data is exposed through its protected server/RPC workflow rather than direct PostgREST table access, and Money Agent PIN credentials remain inaccessible by direct table operations. No RLS policy was replaced with `USING (true)` or disabled to suppress an error.

## Security follow-up

The 047 helper migration repaired authenticated RLS policy evaluation for the six reviewed helper functions while retaining anonymous/public denial. The 049 migration additionally removed anonymous execution from sensitive profile and workspace RPCs, removed direct execution from unreferenced Money Agent fee/commission helpers, and pinned all ten reviewed functions to `pg_catalog, public, auth`.

The refreshed Supabase Security Advisor output contains 114 residual warnings: six intentionally public SafariTiketi booking RPCs, 107 authenticated SECURITY DEFINER endpoint notices requiring endpoint-by-endpoint review, and one leaked-password-protection configuration notice. These were not mass-revoked because they cover separate booking, billing, banking, workforce, POS, portal, and module contracts. Enabling leaked-password protection requires Supabase Auth configuration access; it is not a database table or migration operation and was not falsely marked complete.

## Verification sources

The audit is grounded in the connector results for `list_projects`, `get_project`, `list_tables` with verbose public-schema metadata, `list_migrations`, `get_advisors`, live PostgreSQL catalog privilege queries, the rollback-only authenticated RLS sweep, and repository source contracts under `client/`, `server/`, and `supabase/migrations/`. The current comparison found zero missing referenced tables and zero tenant-critical column issues, so no missing-table migration was applied.


## Deep reconciliation update — 2026-08-23 17:06 UTC

The complete live public-schema inventory reports **513 tables**, **1,173 indexes**, **714 RLS policies**, **200 public functions**, **499 triggers**, **4,683 check constraints**, and **266 unique constraints**. There are no public views, materialized views, enums, or sequences in the live catalog. Storage contains three buckets and three storage policies. Two active Edge Functions are present: `gate-keyring` and `issue-ticket`; the repository does not contain source files for either function, so they are treated as deployed operational assets rather than missing database objects.

All **279 tables declared across the repository’s migration files** exist in production. All **38 table declarations** in future-dated migrations 050–057 were already present under reconciled live migration records, so those files were not replayed. The 177 repository-declared indexes are all present by name. No unvalidated public constraint was found. Public foreign-key targets are complete; the only cross-schema targets reported by the table inventory are intentional references to `auth.users`.

One genuine schema drift was found: `public.bank_accounts` was missing the `created_by uuid DEFAULT auth.uid()` column defined by `20260823_015_bank_mfi_core.sql`. The table had zero rows. The additive repair `20260823_061_bank_accounts_created_by_repair.sql` was applied through the connector at version `20260823170540`, and the fresh inventory now confirms the column and default. No data, RLS policy, or privilege was removed or rewritten.

The complete public-policy inventory contains **714 distinct policies across all 513 tables**: 626 authenticated-role policies and 88 public-role policies. Of these, 673 contain a company/tenant predicate, 12 contain an `auth.uid()` predicate, and 272 contain a reviewed capability helper predicate. There are no unrestricted `USING (true)` or `WITH CHECK (true)` predicates. Thirty-eight policies are intentionally fail-closed: the 37 Property Management direct-denial policies and `money_agent_pin_credentials_no_direct_access`. The 88 public-role policies are legacy/module-scoped predicates using `company_id = current_company_id()` and require separate contract review; they were not mass-rewritten.

The post-repair Security Advisor remains unchanged at 114 warnings: six intentionally public SafariTiketi booking RPCs, 107 authenticated SECURITY DEFINER notices requiring endpoint-by-endpoint review, and one Auth leaked-password-protection configuration notice. The Performance Advisor remains at 843 notices: 622 unindexed foreign keys, 10 auth RLS init-plan notices, 59 unused-index notices, and 152 multiple-permissive-policy notices. These advisory notices are not proof of missing schema and no speculative privilege or index changes were applied.

## Final audit classification

| Category | Result |
|---|---|
| Required missing tables | None |
| Required missing columns | Repaired: `bank_accounts.created_by` |
| Required missing indexes | None of 177 repository-declared indexes |
| Required missing public FK targets | None |
| Unvalidated constraints | None |
| Tables without RLS | None |
| Tables without primary keys | None |
| Unrestricted RLS predicates | None |
| Data modifications | None except the explicitly recorded additive schema repair |
| Duplicate tables created | None |
| Destructive DDL executed | None |
