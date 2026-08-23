# Supabase Migration Execution Log

| Timestamp (UTC) | Project | Migration | Status | Scope |
|---|---|---|---|---|
| 2026-08-13 03:39 | `rlhngsrihahhyxnjxrxm` | `20260812_001_complete_erp_schema_baseline.sql` | Succeeded in the authenticated Supabase SQL Editor (`Success. No rows returned`). | Additive repair for `public.audit_log.updated_at` only. |

The migration contains no table drops, truncation, or data deletion. Its execution is followed by a protected PostgREST contract audit before this release is marked complete.

The protected PostgREST verifier completed successfully at `2026-08-13T03:40:18.656Z`: all 110 dashboard-referenced tables were exposed by the live API and no tenant ownership or timestamp contract exceptions remained.

The authenticated SQL workspace was restored at `2026-08-13 03:46 UTC` to perform the remaining read-only RLS policy inventory.

A read-only inventory query covering RLS enablement and policy presence for every public table with a `company_id` column was submitted at `2026-08-13 03:47 UTC`; results are recorded after completion.

The first inventory statement returned PostgreSQL syntax error `42601` before execution. It was read-only and made no data, schema, or policy changes; a simplified equivalent query is being used for the verification retry.

The retry uses fully qualified PostgreSQL catalog names and remains read-only; the displayed syntax message at preparation time was the prior query result, not an execution result for the corrected statement.

The corrected read-only policy listing succeeded at `2026-08-13 03:49 UTC`. The first 100 returned tenant-scoped rows were all RLS-enabled and each showed a corresponding `*_tenant` policy, including `audit_log_tenant`. A separate zero-row exception query is used to confirm this across the complete set without relying on a display limit.

The zero-row exception query was submitted at `2026-08-13 03:50 UTC`; it returns only company-scoped public tables with disabled RLS or no associated policy.

The zero-row exception query completed successfully at `2026-08-13 03:50 UTC` with `Success. No rows returned`. No public company-scoped table lacks RLS or an associated policy.

| 2026-08-23 13:04 | `rlhngsrihahhyxnjxrxm` | `profile_identity_center` | Succeeded through the connected Supabase migration operation (`success: true`; version `20260823130430`). | Additive profile identity/preference columns, scoped avatar references, and authenticated self-service RPCs; no table drops or data deletion. |

The post-apply migration inventory confirmed `profile_identity_center` is recorded in the project. The complete verbose public-table inventory contained 475 tables, all reported RLS-enabled, and the repository comparison found zero missing referenced tables. The profile row now has the added identity columns required by the Profile Identity Center.

| 2026-08-23 13:54 | `rlhngsrihahhyxnjxrxm` | `rls_policy_helper_execute_grants` | Succeeded through the connected Supabase migration operation (`success: true`; version `20260823135435`). | Pins six reviewed RLS policy helpers to `pg_catalog, public, auth`; revokes `PUBLIC`/`anon`; grants `authenticated` execution only. No table data, policies, or broad RPC grants changed. |

Post-apply verification confirmed all six helpers have `authenticated` `EXECUTE=true`, `anon`/`PUBLIC` `EXECUTE=false`, and the pinned search path. Reversible transaction-scoped authenticated probes over billing, banking, fleet, HR, subscription, and profiles completed without the prior helper permission errors and rolled back without data changes.

The source migration is `supabase/migrations/20260823_047_rls_policy_helper_execute_grants.sql`; its focused contract test is `server/supabasePolicyHelperGrants.test.ts`.

| 2026-08-23 14:28 | `rlhngsrihahhyxnjxrxm` | `subscription_access_snapshot` | Succeeded through the connected Supabase migration operation (`success: true`; version `20260823142807`). | Adds the authenticated-only `billing_access_snapshot()` RPC over existing `profiles`, `tenant_subscriptions`, and `billing_plans` data; returns server-derived status, expiry, billing-admin capability, and module entitlements without duplicating billing tables. No payment activation or data deletion is performed. |

Post-apply ACL verification confirmed `billing_access_snapshot()` has `authenticated` `EXECUTE=true`, `anon` `EXECUTE=false`, and `search_path=pg_catalog, public, auth`. The same verification confirmed the six 047 policy helpers retain authenticated-only execution and the pinned search path.

The post-047 authenticated read sweep covered 511 company-scoped tables: 473 completed without execution error, with zero cross-tenant rows observed. The 38 remaining errors were the intentionally direct-denied `money_agent_pin_credentials` table and 37 intentionally locked Property Management tables; no reviewed SECURITY DEFINER helper permission errors remained. The sweep was transaction-scoped and rolled back.

A transaction-scoped authenticated call to `billing_access_snapshot()` using the existing audit fixture returned `Required`, `allowed=false`, no subscription, no plan, and `canManageBilling=true` for the fixture owner. This confirms fail-closed behavior without creating or modifying a live subscription.

| 2026-08-23 15:16 | `rlhngsrihahhyxnjxrxm` | `sensitive_rpc_execute_hardening` | Succeeded through the connected Supabase migration operation (`success: true`; version `20260823151641`). | Removes anonymous/public execution from profile identity and workspace membership RPCs, removes direct `authenticated` execution from the unreferenced Money Agent fee/commission calculation helpers, and pins all ten reviewed functions to `pg_catalog, public, auth`. Public SafariTiketi booking RPCs were intentionally preserved. |

Post-049 ACL verification confirmed the eight account/workspace functions remain authenticated-executable and are no longer executable by `anon` or `PUBLIC`; the two calculation helpers are no longer executable by `anon`, `PUBLIC`, or `authenticated`. All ten functions report the pinned search path. No function bodies or table data were changed.

The current connector-grounded schema parity audit reports 513 public tables, all 513 with RLS enabled and at least one policy, zero tables without primary keys, zero missing frontend/service-referenced tables among 247 references, and zero tenant-critical column issues. No speculative or duplicate tables were created. The rollback-only authenticated sweep covered 511 company-scoped tables: 473 completed without execution error, zero cross-tenant rows were observed, and 38 remaining errors were the intentional direct denials for 37 Property Management tables plus `money_agent_pin_credentials`.

The refreshed Supabase Security Advisor output contains 114 residual warnings: six intentionally public SafariTiketi booking RPCs, 107 authenticated SECURITY DEFINER endpoint notices requiring endpoint-by-endpoint review, and one leaked-password-protection configuration notice. The latter requires Supabase Auth configuration access rather than a database migration and was not falsely marked complete.

The source migration is `supabase/migrations/20260823_049_sensitive_rpc_execute_hardening.sql`; its focused contract test is `server/sensitiveRpcExecuteHardening.test.ts`.

The final post-049 rerun at 2026-08-23 15:19 UTC returned the same safe boundary: 511 company-scoped tables swept, 473 probes without execution errors, zero cross-tenant rows, and only the 37 protected Property Management tables plus `money_agent_pin_credentials` directly denied. The temporary probe transaction rolled back.

| 2026-08-23 17:05 | `rlhngsrihahhyxnjxrxm` | `bank_accounts_created_by_repair` | Succeeded through the connected Supabase migration operation (`success: true`; version `20260823170540`). | Additive `created_by uuid DEFAULT auth.uid()` column on `public.bank_accounts`, matching the repository’s bank/MFI contract. Existing row count was zero; no rows were rewritten, no data was deleted, and RLS was not changed. |

Post-repair verification confirmed the exact application contract still has zero missing referenced tables, zero required tenant-column issues, zero tables without RLS, zero tables without primary keys, zero missing public foreign-key targets, and zero missing repository-declared indexes. All 279 tables declared across repository migrations exist in production; the 38 tables in future-dated migrations 050–057 were already live under their reconciled migration records and were not reapplied.

The post-repair advisor counts are unchanged from the pre-repair baseline: 114 security warnings (6 intentionally public SafariTiketi booking RPCs, 107 authenticated SECURITY DEFINER notices requiring endpoint review, and 1 Auth leaked-password-protection configuration notice) and 843 performance notices (622 unindexed foreign keys, 10 auth RLS init-plan notices, 59 unused-index notices, and 152 multiple-permissive-policy notices). No bulk privilege revocation or speculative index migration was applied.

| 2026-08-23 19:30 | `rlhngsrihahhyxnjxrxm` | `subscription_free_plan_model` | Succeeded through the connected Supabase migration operation (`success: true`; version `20260823193058`). | Replaces the retired trial lifecycle with the exact `FREE_15` catalog row, six monthly paid packages with 1 paid month plus 1 promotional bonus month, server-side calendar-month expiry, Free-plan expiry reconciliation, curated catalog output, and preserved tenant/RLS/payment idempotency controls. Existing production subscription rows were zero at migration time; no business data was deleted. |

| 2026-08-23 19:38 | `rlhngsrihahhyxnjxrxm` | `subscription_monthly_constraint_correction` | Succeeded through the connected Supabase migration operation (`success: true`; version `20260823193854`). | Tightens the inherited `tenant_subscriptions` billing-cycle constraint to `Monthly` and removes the unnecessary `service_role` execute grant from `billing_start_free_plan`; no data rows were changed. |

Post-apply verification confirmed exactly seven active official packages: `FREE_15` at TZS 0 for 15 days, and TWIGA/TEMBO/SIMBA/SIMBA SC/YANGA SC/AZAM FC at their approved monthly prices with `paid_months=1`, `bonus_months=1`, and `total_months=2`. The live catalog returned zero subscription rows, two historical monthly payment rows, zero invoices, RLS enabled on all four billing tables, zero retired trial columns, zero old trial functions, and authenticated-only execution for `billing_start_free_plan`.

A transaction-scoped CRUD probe using temporary tables passed create, read, update, delete, Free-expiry transition, payment completion, and invoice-linkage assertions; the transaction rolled back. A Supabase development branch could not be created because the connected organization is not on a branching-supported plan, so no branch resource was left running.

The final live RLS query reported 518 public tables, 719 policies, zero RLS-disabled tables, zero policyless public tables, zero unrestricted true predicates, and 182 public SECURITY DEFINER routines. The subscription routines all report `search_path=pg_catalog, public, auth`. The refreshed Security Advisor reports 116 warnings: six intentional public SafariTiketi booking routines, 109 authenticated SECURITY DEFINER notices, and one Auth leaked-password-protection configuration notice. These residual warnings remain outside the bounded subscription change.

The source migration is `supabase/migrations/20260823_062_subscription_free_plan_model.sql`; the corrective migration is `supabase/migrations/20260823_063_subscription_monthly_constraint_correction.sql`; focused contract coverage is in `server/subscriptionBillingContracts.test.ts`, `server/subscriptionAccessContracts.test.ts`, and `server/subscriptionAccessAdapter.test.ts`.

Full verification after the source changes: 206 Vitest files passed with 842 tests passed and 13 skipped; the documented Vercel production build passed; and Playwright passed 23 of 23 browser tests. The build emitted only the existing large-chunk advisory. No production business CRUD records were created or deleted.
