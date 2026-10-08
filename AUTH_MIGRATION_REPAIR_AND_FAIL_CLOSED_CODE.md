# Supabase Migration Repair and Fail-Closed Auth Implementation

## 1. Attachment review

The attachment is a comprehensive forensic-audit and repair brief. It requires tracing the actual system from frontend, application logic, authentication, Supabase client, schema, RLS, functions, triggers, data, GitHub, Vercel, and the live application. It explicitly prohibits guessing the Supabase project, disabling RLS to hide errors, casually deleting data, force-pushing, manually overwriting the migration ledger, or declaring success from a build alone. It also requires a code/database comparison, migration reconciliation, tenant isolation checks, end-to-end workflow tests, deployment verification, and a final re-audit.

The document’s authentication requirement is:

> `LOGIN → SESSION → USER → PROFILE → COMPANY/TENANT → ROLE → PERMISSIONS → MODULE ACCESS`

Its database requirement is that permanent changes must be represented by migrations in GitHub and applied through the Supabase connector. Its deployment requirement is that GitHub, Vercel, and the production URL must be verified as one coherent release chain.

The specific repair requested here is narrower than the full attachment: safely diagnose and repair a Supabase branch reporting `MIGRATIONS_FAILED`, verify the ledger without editing it manually, and make tenant/permission hydration fail closed.

## 2. Important distinction: branch status versus migration ledger

`MIGRATIONS_FAILED` is a Supabase branch/action status, not a PostgreSQL value that can safely be repaired with `UPDATE`. The correct repair is to identify the migration/action failure, fix the migration source, rerun the migration runner on the staging branch, and allow Supabase to record the migration only after successful completion. Never insert or update rows in `supabase_migrations.schema_migrations` by hand.

The current inspected environment had only the default `main` branch and reported `MIGRATIONS_FAILED` with `with_data: false`. It did not expose a separate disposable staging branch. Do not reset, delete, or reuse that target for real-user E2E until its status and migration history are healthy.

## 3. Exact diagnostic and ledger-verification SQL

Run this script against the **staging branch only** using the branch-specific database connection. It is read-only: the final transaction is rolled back and it does not change the ledger or application data.

```sql
\set ON_ERROR_STOP on
\pset pager off
\pset format aligned

BEGIN;
SET LOCAL statement_timeout = '30s';

-- A. The ledger is evidence; do not update it manually.
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version ASC
LIMIT 200;

-- B. Verify the required migration sequence known to this project.
WITH expected(version, name) AS (
  VALUES
    ('20260823130419', 'fin_foundation'),
    ('20260823130441', 'fin_journal_core'),
    ('20260823130501', 'fin_reconciliation_core'),
    ('20260823130526', 'pos_register_control'),
    ('20260823130546', 'pos_register_control_hardening'),
    ('20260823130606', 'pos_sales_returns'),
    ('20260823130847', 'pos_pricing_loyalty'),
    ('20260823130909', 'workforce_authorization'),
    ('20260823130928', 'workforce_role_assignment_approval'),
    ('20260823131454', 'new_routine_privilege_hardening'),
    ('20260823133812', 'workforce_permission_seed')
)
SELECT
  e.version,
  e.name,
  CASE WHEN m.version IS NULL THEN 'MISSING' ELSE 'APPLIED' END AS ledger_status,
  m.version AS recorded_version,
  m.name AS recorded_name
FROM expected e
LEFT JOIN supabase_migrations.schema_migrations m
  ON m.version = e.version OR m.name = e.name
ORDER BY e.version;

-- C. Verify the critical tables exist and are protected by RLS.
WITH required(relname) AS (
  VALUES
    ('fin_periods'), ('fin_accounts'), ('fin_approval_requests'),
    ('fin_journal_batches'), ('fin_journal_lines'),
    ('pos_registers'), ('pos_terminals'), ('pos_shift_sessions'),
    ('pos_cash_movements'), ('pos_sync_devices'),
    ('pos_sale_headers'), ('pos_sale_lines'), ('pos_sale_tenders'),
    ('workforce_roles'), ('workforce_permissions'),
    ('workforce_role_permissions'), ('workforce_member_roles'),
    ('workforce_module_access'), ('workforce_data_scopes'),
    ('workforce_approval_limits'), ('workforce_permission_conflicts')
)
SELECT
  r.relname,
  c.oid IS NOT NULL AS table_exists,
  COALESCE(c.relrowsecurity, false) AS rls_enabled,
  COALESCE(c.relforcerowsecurity, false) AS rls_forced
FROM required r
LEFT JOIN pg_class c
  ON c.relname = r.relname
 AND c.relnamespace = 'public'::regnamespace
 AND c.relkind IN ('r', 'p')
ORDER BY r.relname;

-- D. Verify key protected routines exist and are not executable by anon.
-- Keep identity_args exactly as reported by pg_get_function_identity_arguments()
-- if a later migration changes an overload.
WITH required(proname, identity_args) AS (
  VALUES
    ('workforce_has_permission', 'p_permission_code text'),
    ('workforce_require', 'p_permission_code text'),
    ('pos_open_shift', 'p_register_id uuid, p_terminal_id uuid, p_opening_float numeric, p_idempotency_key text, p_request_hash text'),
    ('pos_record_cash_movement', 'p_shift_session_id uuid, p_amount numeric, p_direction text, p_reason text, p_idempotency_key text, p_approval_request_id uuid'),
    ('pos_accept_sync_device_sequence', 'p_device_id uuid, p_sequence bigint, p_idempotency_key text, p_request_hash text'),
    ('workforce_request_role_assignment', 'p_target_profile_id uuid, p_target_role_id uuid, p_idempotency_key text, p_request_hash text, p_metadata jsonb'),
    ('workforce_decide_role_assignment', 'p_request_id uuid, p_decision text, p_idempotency_key text, p_request_hash text, p_metadata jsonb')
), routines AS (
  SELECT
    p.oid,
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS identity_args
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
)
SELECT
  q.proname,
  q.identity_args,
  r.oid IS NOT NULL AS function_exists,
  COALESCE(has_function_privilege('anon', r.oid, 'EXECUTE'), false) AS anon_execute,
  COALESCE(has_function_privilege('authenticated', r.oid, 'EXECUTE'), false) AS authenticated_execute
FROM required q
LEFT JOIN routines r
  ON r.proname = q.proname
 AND r.identity_args = q.identity_args
ORDER BY q.proname, q.identity_args;

-- E. Confirm permission seed coverage and that no production users were assigned.
SELECT 'roles' AS metric, count(*)::bigint AS value
FROM public.workforce_roles
WHERE role_kind = 'System'
UNION ALL
SELECT 'permissions', count(*)::bigint
FROM public.workforce_permissions
UNION ALL
SELECT 'role_permissions', count(*)::bigint
FROM public.workforce_role_permissions
UNION ALL
SELECT 'member_role_assignments', count(*)::bigint
FROM public.workforce_member_roles;

ROLLBACK;
```

The routine query in section D is intentionally a catalog check. If a deployment exposes overloaded routines, verify each exact overload directly with `pg_get_function_identity_arguments()` and `has_function_privilege()`; do not rely only on routine names.

## 4. Safe repair procedure for `MIGRATIONS_FAILED`

First obtain the failed action/migration error from the Supabase Branches/Database Migrations logs. The generic SQL executor cannot infer which migration statement failed. Without the failing migration name and error, there is no responsible “exact repair SQL”; guessing could damage the branch.

For a disposable staging branch whose data may be discarded:

```bash
# Work from the reviewed repository commit.
cd /home/ubuntu/SMARTMANAGER-MANUS
git checkout auth-provider-preview-e2e

git status --short
supabase migration list --project-ref <staging-project-ref>

# After correcting the specific migration file and reviewing the diff:
supabase link --project-ref <staging-project-ref>
supabase db push --include-all
supabase migration list --project-ref <staging-project-ref>
```

If the Supabase branch manager reports the branch action itself as failed and the branch is disposable, delete/recreate that **staging branch only** after confirming the cost/plan implication. Supabase then reapplies migrations sequentially and reseeds the branch. Do not do this to the project’s `main` branch or any target containing production data.

For a persistent staging project, do not delete the database. Correct the migration in Git, run the repository migration runner against the staging project, and verify the ledger with the SQL above. If migrations are applied through the connected management integration, use its reviewed `apply_migration` operation and then rerun the verification query. The operation that applies the migration must be the same operation that records the migration ledger entry.

Do not run this unsafe pattern:

```sql
-- NEVER DO THIS:
UPDATE supabase_migrations.schema_migrations SET ...;
INSERT INTO supabase_migrations.schema_migrations (...);
```

Manually marking a row applied creates a false ledger and leaves the database schema unreconciled.

## 5. Complete fail-closed identity and permission implementation

The following TypeScript implementation is designed for `client/src/contexts/AuthContext.tsx`. It uses the existing schema, requires a company, exactly one active membership, and a workspace, then evaluates effective permissions through the existing protected `workforce_has_permission(text)` RPC. It intentionally does not grant permissions from `profiles.role` or `company_memberships.role`; those values are display/compatibility data only.

```ts
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { AuthIdentity } from "../lib/authStateMachine";

type Row = Record<string, unknown>;

type QueryResult<T> = {
  data: T[] | null;
  error: { message?: string; code?: string } | null;
};

class IdentityHydrationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IdentityHydrationError";
    this.code = code;
  }
}

function firstRow<T>(result: QueryResult<T>): T | null {
  if (result.error) throw result.error;
  return result.data?.[0] ?? null;
}

function isActiveRelationship(row: Row) {
  const status = typeof row.status === "string" ? row.status.trim().toLowerCase() : null;
  if (status && !["active", "approved", "enabled"].includes(status)) return false;
  if (typeof row.is_active === "boolean" && !row.is_active) return false;
  if (typeof row.active === "boolean" && !row.active) return false;
  return true;
}

function isEffective(row: Row, now = Date.now()) {
  if (row.status && String(row.status).toLowerCase() !== "active") return false;
  if (typeof row.effective_from === "string" && Date.parse(row.effective_from) > now) return false;
  if (typeof row.effective_to === "string" && Date.parse(row.effective_to) <= now) return false;
  return true;
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function loadEffectiveWorkforcePermissions(
  client: SupabaseClient,
  companyId: string,
): Promise<string[]> {
  // workforce_permissions is intentionally readable to authenticated users in
  // the migration policy. The decision for each code is made by the SECURITY
  // DEFINER workforce_has_permission() helper, not by client-side role joins.
  const catalog = await client
    .from("workforce_permissions")
    .select("code")
    .eq("company_id", companyId)
    .eq("status", "Active")
    .limit(500);

  if (catalog.error) throw catalog.error;

  const codes = Array.from(
    new Set(
      (catalog.data ?? [])
        .map((row) => asNonEmptyString(row.code))
        .filter((code): code is string => Boolean(code)),
    ),
  );

  const effective: string[] = [];
  // Sequential evaluation is deliberate during the compatibility phase. It
  // avoids a burst of RPCs and fails closed on the first decision error.
  for (const code of codes) {
    const decision = await client.rpc("workforce_has_permission", {
      p_permission_code: code,
    });
    if (decision.error) throw decision.error;
    if (decision.data === true) effective.push(code);
  }

  return effective.sort();
}

export async function loadTenantIdentity(
  client: SupabaseClient,
  session: Session,
): Promise<AuthIdentity> {
  const userId = session.user.id;
  if (!userId) throw new IdentityHydrationError("AUTH_USER_MISSING", "The authenticated user is unavailable.");

  const profileResult = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .limit(2);
  if (profileResult.error) throw profileResult.error;
  if ((profileResult.data ?? []).length !== 1) {
    throw new IdentityHydrationError(
      "AUTH_PROFILE_REQUIRED",
      "A verified workspace profile is required before access can continue.",
    );
  }
  const profile = profileResult.data[0] as Row;

  const companyId = asNonEmptyString(profile.company_id);
  if (!companyId) {
    throw new IdentityHydrationError(
      "AUTH_PROFILE_COMPANY_REQUIRED",
      "The authenticated profile is not assigned to a workspace.",
    );
  }

  const companyResult = await client
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .limit(2);
  if (companyResult.error) throw companyResult.error;
  if ((companyResult.data ?? []).length !== 1) {
    throw new IdentityHydrationError(
      "AUTH_COMPANY_REQUIRED",
      "The assigned workspace could not be verified.",
    );
  }
  const company = companyResult.data[0] as Row;

  const membershipResult = await client
    .from("company_memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .limit(2);
  if (membershipResult.error) throw membershipResult.error;
  const memberships = (membershipResult.data ?? []) as Row[];
  if (memberships.length !== 1 || !isActiveRelationship(memberships[0])) {
    throw new IdentityHydrationError(
      "AUTH_ACTIVE_MEMBERSHIP_REQUIRED",
      "An active membership in the assigned workspace is required.",
    );
  }
  const membership = memberships[0];

  const workspaceResult = await client
    .from("workspaces")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true })
    .limit(2);
  if (workspaceResult.error) throw workspaceResult.error;
  const workspaces = (workspaceResult.data ?? []) as Row[];
  const workspace = workspaces.find(isActiveRelationship) ?? null;
  if (!workspace) {
    throw new IdentityHydrationError(
      "AUTH_WORKSPACE_REQUIRED",
      "An active workspace record is required before access can continue.",
    );
  }

  const permissions = await loadEffectiveWorkforcePermissions(client, companyId);
  const role =
    asNonEmptyString(profile.role) ??
    asNonEmptyString(membership.role) ??
    null;

  return {
    profile,
    company,
    workspace,
    membership,
    role,
    permissions,
  };
}
```

### Provider integration requirement

Replace the existing local identity hydration path with the function above, or make the provider call the function after the profile check. Any thrown `IdentityHydrationError` must dispatch:

```ts
dispatch({
  type: "INCOMPLETE_IDENTITY",
  session,
  user: session.user,
  profile,
  reason: error instanceof IdentityHydrationError ? error.code : "IDENTITY_BOOTSTRAP_FAILED",
});
```

Any permission-catalog or permission-decision error must fail closed. Do not catch it and continue with profile-role permissions. If the browser needs a faster permission snapshot, add a protected server procedure that evaluates the same database helper in one request; do not loosen the workforce table policies merely to make client hydration easier.

## 6. Stronger server-side permission snapshot recommendation

The per-code RPC loop above is a safe compatibility implementation but not the preferred production shape. The preferred shape is a protected server/tRPC identity snapshot that evaluates effective permissions inside PostgreSQL and returns only the resulting codes. The database helper already implements active role windows, direct/role module access, and deny precedence. The browser should use that snapshot for navigation only; all mutations must continue through server authorization, RLS, and protected RPCs.

## 7. References

[1]: https://vercel.com/docs/deployments/environments "Vercel Environments"

[2]: https://vercel.com/docs/environment-variables "Vercel Environment Variables"

[3]: https://supabase.com/docs/guides/deployment/branching/working-with-branches "Supabase Working with Branches"

[4]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Auth Redirect URLs"
