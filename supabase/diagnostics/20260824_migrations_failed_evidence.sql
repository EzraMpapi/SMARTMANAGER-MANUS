-- Read-only evidence collection for a Supabase MIGRATIONS_FAILED branch state.
--
-- Run this script only against the affected non-production branch/project through an
-- approved read-only SQL channel. It intentionally performs no INSERT, UPDATE,
-- DELETE, DDL, ledger edit, reset, or repair. The Supabase management branch status
-- is not itself the failing SQL statement; the failed action/error from the branch
-- operation must be captured separately from the Supabase dashboard/API activity log.

-- 1. Applied database migration ledger, newest first.
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 250;

-- 2. Confirm the connected database and authenticated RPC surface.
SELECT current_database() AS database_name,
       current_schema() AS schema_name,
       current_user AS database_role
LIMIT 1;

SELECT p.oid::regprocedure AS routine,
       n.nspname AS schema_name,
       pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_get_function_result(p.oid) AS return_type,
       p.prosecdef AS security_definer,
       pg_get_userbyid(p.proowner) AS owner_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'current_company_id',
    'get_current_profile_identity',
    'auth_identity_snapshot',
    'workforce_has_permission',
    'workforce_require'
  )
ORDER BY p.proname, p.oid
LIMIT 50;

-- 3. Verify only the expected identity-table columns exist in the target.
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'companies', 'company_memberships', 'workspaces')
ORDER BY table_name, ordinal_position
LIMIT 150;

-- 4. Verify relevant RLS posture without modifying it.
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'companies',
    'company_memberships',
    'workspaces',
    'workforce_roles',
    'workforce_permissions',
    'workforce_role_permissions',
    'workforce_member_roles',
    'workforce_module_access'
  )
ORDER BY tablename, policyname
LIMIT 250;

-- 5. Capture function privileges for the relevant public RPCs.
SELECT routine_schema,
       routine_name,
       specific_name,
       grantee,
       privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN (
    'current_company_id',
    'get_current_profile_identity',
    'auth_identity_snapshot',
    'workforce_has_permission',
    'workforce_require'
  )
ORDER BY routine_name, specific_name, grantee, privilege_type
LIMIT 250;

-- Repair gate:
-- Do not create a corrective migration until the following are attached to the
-- change record from the affected branch operation:
--   * failed migration/version and migration name;
--   * exact SQL statement or migration file hash;
--   * PostgreSQL SQLSTATE and complete error text/context;
--   * whether the failure rolled back atomically or left partial DDL;
--   * the branch/project ref and operation timestamp.
--
-- Once those facts are known, author a NEW additive migration that corrects only
-- that verified defect. Never edit supabase_migrations.schema_migrations manually,
-- mark a migration applied by hand, or reset production data to clear the status.
