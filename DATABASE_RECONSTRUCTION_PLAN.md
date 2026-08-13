# BusinessSphere ERP Supabase Reconstruction Plan

> **Status: Prepared, not executed.** This runbook is a reconstruction plan only. It does not delete data, alter Supabase objects, or change authentication users.

## Verified Contract

The restored ERP code directly references **110 public tables** and three BusinessSphere RPCs: `create_company_and_owner`, `join_company_with_code`, and `supplier_update_delivery_date`. The scheduled-report backend adds tenant-filtered reads of `companies`, `sales_invoices` with `sales_invoice_items`, `finance_expenses`, `crm_leads`, `inventory_items`, and `manufacturing_work_orders`.

| Object category | Required reconstruction rule |
|---|---|
| Identity | Retain `auth.users`; recreate the application `profiles` relation and the guarded `auth.users` profile-creation trigger. |
| Tenant root | Recreate `companies` with a UUID primary key, unique join code, timestamps, and owner setup driven by `auth.uid()`. |
| Tenant data | Recreate each code-referenced business table with its current code-required fields, `company_id`, timestamps, a company foreign key, and a company index. |
| Audit log | Recreate `audit_log` with `id`, `company_id`, `action`, `module`, `actor`, `details`, `created_at`, and `updated_at`; the dashboard requires this exact name. |
| RLS | Enable RLS on each application table. Tenant tables use `company_id = current_company_id()` for both visibility and writes. `profiles` and `companies` retain the special identity-scoped policies. |
| Functions | Recreate `current_company_id()`, `handle_new_user()`, `create_company_and_owner(...)`, `join_company_with_code(...)`, and `touch_updated_at()`. Security-definer functions use a fixed `search_path` and validate `auth.uid()`. |
| Triggers | Attach `handle_new_user()` to `auth.users` and attach the updated-at trigger to application tables carrying `updated_at`. |
| Non-table storage | Preserve Manus-managed S3 storage. BusinessSphere has no Supabase Storage bucket dependency. |

## Live-State Reconciliation

The connected project exposes 153 public PostgREST tables. The code contract is missing only `audit_log`; it currently has `sm_audit_log`, whose name and column contract are not compatible with the dashboard. More materially, live onboarding RPCs accept one `jsonb` argument named `p` but the dashboard sends named arguments such as `p_name` and `p_join_code`, then expects an `id` result. This mismatch prevents correct tenant onboarding.

The live project also contains booking/ticketing functions and active Edge Functions not referenced anywhere in BusinessSphere. Therefore the database uses a **shared `public` schema**. A blanket `DROP SCHEMA public CASCADE` would destroy another application and is not an acceptable implementation of the supplied directive.

| Candidate action | Decision | Reason |
|---|---|---|
| Drop the entire `public` schema | Rejected | It would delete verified non-BusinessSphere booking/ticketing resources. |
| Delete only the exact 110-table BusinessSphere contract and rebuild it | Prepared pending confirmation | It satisfies the requested application-data reset while preserving unrelated Supabase resources. |
| Recreate Supabase system schemas or authentication users | Excluded | The directive explicitly excludes Supabase-managed infrastructure. |
| Add only `audit_log` and patch the RPCs | Insufficient for the requested reset | It repairs the immediate defect but does not perform the requested clean application-schema reconstruction. |

## Proposed Execution Sequence

The production migration will be one transaction where feasible and will operate only on the code-derived BusinessSphere inventory. It will first remove BusinessSphere policies, triggers, and functions; next remove only BusinessSphere tables in dependency order; then recreate the tenant root, profiles, all code-required business tables, indexes, policies, functions, and triggers. It will not touch the unrelated booking/ticketing tables, Edge Functions, extensions, or Supabase system schemas.

The rebuilt onboarding RPC signatures will match the existing dashboard exactly. `create_company_and_owner` will accept the dashboard's named onboarding parameters and return `{ "id": "…", "join_code": "…" }`; `join_company_with_code` will accept the dashboard's named join parameters and return `{ "id": "…" }`. The migration will not rely on browser-provided tenant IDs for authorization.

## Mandatory Post-Rebuild Verification

The verification sequence will confirm the PostgREST contract, function availability, RLS coverage, and generated indexes directly in Supabase. It will then run project type checks, tests, and a production build. Live CRUD verification requires controlled authenticated accounts for two separate companies; records will be created through the actual application flow, read after reload/login, updated, deleted, and checked for cross-tenant denial.

## Final Confirmation Required

Before executing the destructive migration, the user must explicitly confirm this **scoped** action:

> Delete and recreate only the 110 BusinessSphere code-referenced application tables, their BusinessSphere policies, triggers, and RPCs in the shared `public` schema; preserve the unrelated booking/ticketing objects, Supabase system schemas, auth users, extensions, Edge Functions, and Manus S3 storage.

This scope is the only way to meet the application-reset goal without deleting separately identified non-BusinessSphere resources.
