# Database Reconstruction Discovery

## Scope and Safety Boundary

The supplied directive authorizes rebuilding **application-owned Supabase objects and application data**. It explicitly excludes the Supabase project and `auth` system schema. Destructive execution remains deferred until a complete code-derived contract and final pre-execution confirmation are recorded.

## Code-Derived Contract

The restored dashboard contains **110 distinct direct `sb("table")` references**. It also calls these Supabase RPCs: `create_company_and_owner`, `join_company_with_code`, and `supplier_update_delivery_date`.

## Live State at 2026-08-13

The read-only verifier reports **153 exposed PostgREST tables**. Of the 110 dashboard references, **`audit_log` is missing**; all other referenced tables are exposed and satisfy the verifier's required tenant/audit-column check. The live schema contains `sm_audit_log`, which does not satisfy the dashboard's `audit_log` reference.

The live public-schema inventory reports RLS enabled for every listed table. It contains two `companies` rows and two `profiles` rows; the listed business tables are otherwise empty at inventory time.

## Material Migration Evidence

The Supabase migration history contains a recent `mybuz_application_schema_reset` migration followed by `0001_foundation`, `0002_business_tables`, `0003_audit`, `0004_missing_tables`, `0005_cleanup`, and `0006_harden_mybuz_functions`. These migrations post-date the repository's August 12 schema baseline. This explains why the repository’s documented `audit_log` contract no longer matches the live database and is the central defect to resolve before any additional destructive reset.

## Verified Root Cause Candidates

The live company-onboarding RPCs currently accept a single `jsonb` argument named `p` and return `company_id`. The restored dashboard calls those RPCs with named fields such as `p_name`, `p_industry`, `p_join_code`, and expects a result property named `id`. That contract mismatch prevents real company creation or joining from completing correctly and causes subsequent module/branch setup to be skipped. This must be repaired in the reconstruction contract before broad CRUD testing can be meaningful.

The live public function catalog also contains unrelated booking and ticketing functions that reference non-ERP tables. This is further evidence that `public` is shared with a different application and must not be indiscriminately dropped. Any approved reconstruction must use an explicit BusinessSphere-owned object inventory rather than `DROP SCHEMA public`.

## Installed Extensions to Preserve

The live project has system-managed extensions including `pgcrypto` (in `extensions`), `uuid-ossp` (in `extensions`), `pg_net` (in `extensions`), `supabase_vault` (in `vault`), `pg_stat_statements` (in `extensions`), and `plpgsql` (in `pg_catalog`). No application rebuild step will remove, alter, or recreate these extensions.

## RLS, Trigger, Storage, and Edge-Function Inventory

Every public table reported by the live catalog has RLS enabled. The representative BusinessSphere tenant policies consistently constrain `company_id` to `current_company_id()` for both row visibility and write checks; `companies` and `profiles` use scoped identity-specific policies. This confirms the intended access-control model, although real-JWT verification remains a later validation phase.

The public information-schema trigger view currently reports no table triggers. Therefore, the existing `handle_new_user` function is not attached as a trigger to `auth.users`, and the former `businesssphere_audit_log_set_updated_at` trigger function has no live target table. The reconstruction plan must explicitly create the required user-profile and updated-at triggers rather than assuming they exist.

BusinessSphere uses Manus-managed S3 helpers for file storage and has no Supabase Storage bucket dependency in the application code. The connected Supabase project does, however, host active `gate-keyring` and `issue-ticket` Edge Functions. These functions are unrelated to the restored ERP code and will not be changed.

## Next Inventory Work

The remaining read-only inventory will capture live functions, triggers, policies, indexes, storage dependencies, exact foreign-key relationships, and the authoritative column contract for all dashboard-referenced tables. The rebuild decision will be based on that reconciled inventory rather than on assumptions.
