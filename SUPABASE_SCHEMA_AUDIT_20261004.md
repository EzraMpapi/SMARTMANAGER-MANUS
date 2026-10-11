# SMART MANAGER Supabase Schema Audit — 2026-10-04

## Executive result

The connected production Supabase project was inspected through the Supabase management connector and compared with the repository's current `supabase/migrations` and schema contracts.

**Result: no repository-declared table is missing from production.**

Because the live catalog already contains the complete declared table set, no `CREATE TABLE` migration was applied. Creating duplicate tables would be unsafe and would violate the requirement to preserve existing production data and architecture.

## Scope and evidence

- Repository: `EzraMpapi/SMARTMANAGER-MANUS`
- Branch checked: `main`
- Checkout commit: `7bbe33fa7a90f8324a498511c65bc07ca738c383`
- Git synchronization: `HEAD...origin/main = 0 0` (no ahead/behind drift)
- Supabase project: the connected project identified by the repository's configured production URL
- Inspection path: repository migrations/contracts → Supabase live catalog → RLS/policy/function/trigger/storage inventory → local tests/build gates

## Live inventory

| Object | Count | Result |
|---|---:|---|
| Public tables/views in the scoped catalog | 565 | Present |
| Foreign-key constraints | 1,162 | Present |
| Public RLS policies | 782 | Present |
| User triggers in `public` | 455 | Present |
| Public functions | 258 | Present |
| Storage buckets | 4 | Present |
| `public` schema relation objects | 565 | Present |
| `bank_private` schema relation objects | 0 | Expected: private routines/schema, not tables |
| `storage` schema relation objects | 8 | Managed storage objects |

## Repository-to-live table comparison

A parser over every SQL migration in `supabase/migrations` found **314 distinct repository-declared table names**. Every one of those 314 names was present in the live Supabase catalog.

- Repository-declared tables missing in live: **0**
- Live tables not declared by the current checkout: **251**

The 251 live-only tables are not automatically missing objects. They represent legacy/previously applied module schema and managed historical objects (including HR, POS, Sales, Inventory, Support, School, Pharmacy, Microfinance, Banking, Hospitality, Restaurant, Fleet and other module tables). Dropping or recreating them would risk production data and backward compatibility.

## Tenant and RLS review

The targeted inspection searched for public tables that either lacked a `company_id` column or had zero RLS policies.

- Tables with zero RLS policies in the returned scope: **0**
- Tables without a direct `company_id` column: **11**

The 11 tables are protected control/global/read-link tables rather than an indication that a tenant column should be blindly added:

- `bank_provider_webhook_account_controls`
- `bank_provider_webhook_drain_approvals`
- `bank_provider_webhook_drain_runs`
- `companies`
- `hr_announcement_reads`
- `platform_admin_actions`
- `platform_admin_dashboard_settings`
- `schema_drift_monitors`
- `schema_drift_runs`
- `users`
- `website_feedback_submissions`

Each returned table had at least one RLS policy. These tables require module-specific policy review if their authorization model is changed; no blanket `company_id` column or permissive policy was added.

## Migration alignment

The live migration ledger contains the current major domain migrations, including:

- `employee_portal_core`
- `tanzania_payroll_calculation_engine`
- `hospitality_core`
- `fleet_management_core`
- `restaurant_fnb_management_core`
- `restaurant_tanzania_fiscal_configuration`
- `fin_foundation`
- `pos_register_control`
- `workforce_authorization`
- `platform_governance`
- `governed_company_join`
- `sales_quotation_invoice_conversion`
- `customer_communications`

The migration ledger tail reaches `customer_communications` at version `20261002042925`, matching the current mainline schema boundary observed in the audit.

## Function and trigger comparison

Repository SQL declared 235 distinct public/private function names and 58 trigger names. All 58 repository trigger names were found in the live trigger catalog.

Four apparent function mismatches were reviewed and are not missing live functionality:

- `billing_start_trial`
- `billing_select_trial_plan`
- `billing_reconcile_trial_expiry`
- `bank_private`

The first three are intentionally dropped by the later `20260823_062_subscription_free_plan_model.sql` migration as the subscription model was replaced. `bank_private` is a schema name falsely captured by a simple parser, not a function; the private schema exists and is intentionally not exposed as a table namespace.

## Advisor findings (not silently changed)

Supabase advisors reported existing hardening/performance findings that are separate from missing-table detection:

- 6 anonymous-executable `SECURITY DEFINER` functions
- 133 authenticated-executable `SECURITY DEFINER` functions
- 518 unindexed foreign-key findings

These cannot be safely remediated with a blanket migration: function execution grants need per-routine threat modeling, and index creation must be prioritized by workload/size and normally scheduled with production-safe concurrent builds. No unrelated security or performance change was applied during this table audit.

## Application validation

| Check | Result |
|---|---|
| Vitest | **PASS** — 290 test files passed; 1,191 tests passed; 7 files / 15 tests skipped because they require live credentials/providers |
| TypeScript (`pnpm check`) | **PASS** |
| Direct Vite production bundle (`pnpm exec vite build`) | **PASS** — 2,698 modules transformed and production assets emitted |
| Schema-gated `pnpm build` | **BLOCKED by credential preflight** — the supplied browser anon credential returned HTTP 401 to the server-only OpenAPI schema check; no application failure was inferred |
| GitHub synchronization | **PASS** — local `main` and `origin/main` are aligned |

The schema verifier intentionally requires `SUPABASE_URL` plus a server-only `SUPABASE_SECRET_KEY`. The browser anon key must not be used as the server-only schema credential. The connected Supabase management inspection succeeded independently and is the authoritative live catalog evidence for this audit.

## Decision and next action

**No database migration was applied in this audit because no missing repository table was found.** Existing production data, RLS, policies, constraints, triggers, functions and storage configuration were left unchanged.

If the deployment build gate must be restored, configure the GitHub/Render server-only Supabase secret with the current least-privilege schema-inspection credential (not the browser anon key), then rerun the schema-gated build and read-only workflow. Any future table/column/index/RLS change should be a separately reviewed additive migration with a backup/rollback plan and authenticated tenant CRUD verification.
