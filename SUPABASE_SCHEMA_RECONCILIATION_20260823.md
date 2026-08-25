# SMART MANAGER GitHub ↔ Supabase Schema Reconciliation

**Date:** 2026-08-23

**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`

**Verified Supabase project:** `rlhngsrihahhyxnjxrxm`

**Working branch:** `auth-provider-preview-e2e`

## Scope and safety boundary

This reconciliation was performed additively. No production data was deleted or rewritten, no RLS policy was disabled, no migration ledger row was edited manually, and no branch reset or force push was performed. The only new database DDL applied during this pass was the versioned identity snapshot migration already present in the repository.

## Repository state

The active branch contains the centralized Supabase AuthProvider, explicit auth state machine, guarded deployed-preview Playwright suite, identity snapshot migration, contract tests, migration diagnostics, and implementation documentation. The branch is based on the previously pushed AuthProvider commit and has not been merged into `main`.

The working tree also contains generated browser test artifacts under `test-results/`. These are test outputs and must not be included in the source commit. The versioned migration and application source changes are the intended synchronization payload.

## Live Supabase evidence

The connector first resolved the project through `list_projects`; the only available project was `rlhngsrihahhyxnjxrxm` (`ACTIVE_HEALTHY`). The live migration ledger contained the historical ERP, POS, workforce, banking/MFI, school, healthcare, hospitality, subscription, restaurant, and security migrations. The new migration was then applied with the migration name `auth_identity_snapshot` and was recorded by Supabase as version `20260823184420`.

The live public catalog contains **518 public tables**. Every table declared by the repository’s local Supabase migrations was present in the live catalog; the comparison found **0 local-declared tables missing from Supabase**. The live table inventory reported **0 public tables with RLS disabled**. The live catalog also reports **2,546 constraints**, **1,189 indexes**, **441 non-internal triggers**, and **719 public RLS policies** in the bounded catalog inventory.

The repository migration filenames and the live migration ledger are not a one-to-one name match. Many historical local files have different timestamped names or semantic aliases in the live ledger. Therefore, the local files must not be replayed wholesale against the live project. The live catalog is already ahead of the original local migration history for several modules. The new identity migration was applied only after its function dependencies and exact columns were verified.

## Identity snapshot verification

The applied routine is `public.auth_identity_snapshot()` with no arguments. The live catalog verifies:

| Control | Live result |
|---|---|
| Security definer | `true` |
| Anonymous execution | `false` |
| Authenticated execution | `true` |
| Unauthenticated invocation | Raises SQLSTATE `42501` with an authenticated-session error |
| Profile/company/membership/workspace dependencies | Present with verified columns |
| Public table RLS | Enabled on all 518 inventoried public tables |

The function requires an authenticated `auth.uid()`, an active profile with a company and role, a matching `current_company_id()`, an existing company, a matching company-membership row, and at least one workspace. Effective permission output is calculated from active workforce member roles and active time-valid role/module grants. Deny rows override Allow rows. Legacy profile and membership role strings are returned for display compatibility but are not used as a privileged permission shortcut.

## Tables, relationships, and columns

The verified dependency tables are present with the required fields:

| Table | Verified contract used by the RPC |
|---|---|
| `profiles` | `id`, `company_id`, `role`, `is_active`, profile display and preference fields |
| `companies` | `id`, `name`, `category`, `country`, `currency`, `timezone`, brand fields |
| `company_memberships` | `user_id`, `company_id`, `role`, `created_at`; composite primary key `(user_id, company_id)` |
| `workspaces` | `id`, `company_id`, `name`, channel/department/description/members, timestamps |
| `workforce_roles` | Tenant-scoped role identifiers, code, status, hierarchy, metadata |
| `workforce_member_roles` | Active assignment, profile/role/company keys, effective date window, status |
| `workforce_permissions` | Tenant-scoped permission code, module, action, active status |
| `workforce_role_permissions` | Role-to-permission links, Allow/Deny effect, active date window |
| `workforce_module_access` | Profile/role module access, Allow/Deny effect, active date window |

The live catalog also verifies the relevant composite and lookup indexes, including company/profile/status indexes for workforce assignments, company/role/status indexes for role grants, company/module/action indexes for permission lookup, and company indexes for memberships, profiles, workspaces, and roles.

## Storage configuration

The live storage bucket inventory contains:

| Bucket | Public | File-size limit |
|---|---:|---:|
| `avatars` | Yes | 2 MiB |
| `company-logos` | Yes | 2 MiB |
| `documents` | No | 25 MiB |

No storage bucket was created or altered during this reconciliation. Storage object RLS and upload workflows remain a separate validation item for the application modules that use documents, avatars, or logos.

## Advisor findings not automatically changed

Supabase security advisors still report pre-existing `SECURITY DEFINER` routines callable by `anon` or `authenticated`, including public booking/seat routines and financial/workforce RPCs. The new identity snapshot also appears in the authenticated `SECURITY DEFINER` advisory because it is intentionally callable by signed-in users. This is not itself a defect: the routine is designed as an authenticated RPC and has anonymous execution revoked. Existing public booking/seat behavior was not changed automatically because revoking it without confirming intended public workflows could break existing functionality.

Supabase performance advisors report numerous unindexed foreign keys across historical modules. These are performance advisories, not evidence that tables or required relationships are missing. A blanket index migration was not generated because it would touch many legacy modules and could create unnecessary production write/lock overhead. Each index recommendation should be reviewed by module and workload before applying an additive index migration.

## Remaining reconciliation limits

The live database is schema-rich and contains many historical objects that are not declared by the current local migration directory. This is migration-source drift, not a missing-live-table finding. The current repository does not contain a complete replayable history for all 518 live tables and 719 policies. Reconstructing that history would require a deliberate schema snapshot/import process, not replaying local files blindly.

The management metadata previously reported `MIGRATIONS_FAILED`, but the exact historical failed action and SQLSTATE were not exposed by the connector logs. The identity snapshot migration is therefore recorded as an independent additive migration, not as a repair of that unknown historical failure.

The application’s real-user deployed-preview E2E suite remains gated on an approved non-production Vercel preview and disposable Supabase fixture credentials. No production user or business data was used.

## Next safe actions

1. Keep the applied migration file in Git and push it with the AuthProvider changes.
2. Exclude generated `test-results/` files from the source commit.
3. Run repository checks, the focused auth suite, and the production build.
4. Validate a real JWT-backed `auth_identity_snapshot()` response using disposable non-production fixtures.
5. Review advisor findings individually before authoring any additional index or privilege migration.
6. Do not call the repository fully synchronized until the migration-source drift and deployed real-user E2E prerequisites are addressed.
