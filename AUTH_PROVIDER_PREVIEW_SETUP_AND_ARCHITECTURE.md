# AuthProvider Preview Setup and Architecture Review

**Review scope:** Pull request [#15](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/pull/15), branch `auth-provider-preview-e2e`, commit `55f10920129b3cc8a980605ef1f5df6fbe06ab7f`.

**Purpose:** Explain the centralized authentication architecture and provide a safe configuration path for a deployed preview with disposable Supabase Auth users and isolated tenants.

## Executive summary

Pull request #15 centralizes browser authentication around one Supabase client and one React provider. The provider owns session restoration, Auth lifecycle events, identity hydration, authentication actions, and compatibility methods consumed by older components. A pure reducer defines the application-visible state machine, while `ProtectedSurface` prevents unauthenticated or incompletely provisioned identities from entering protected application surfaces.

The implementation is locally validated and the synthetic preview matrix passes. Real-user E2E remains blocked for two independent reasons: the linked Vercel project has not produced a preview for the PR branch, and the connected Supabase project has no disposable Auth users or controlled tenant fixtures. The current Supabase branch inventory also reports its default `main` branch as `MIGRATIONS_FAILED`; it must not be used as the E2E fixture until that status is resolved.

## AuthProvider architecture

| Layer | Location | Responsibility |
|---|---|---|
| Public configuration | `client/src/lib/publicSupabaseConfig.ts` | Reads build-time `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, with a public `/api/config/public` fallback. Only browser-safe values belong here. |
| Supabase client | `client/src/lib/supabaseAuthClient.ts` | Creates one browser client per URL/key pair with automatic refresh, managed persistence, URL session detection, and storage key `smart-manager-auth`. |
| Pure state machine | `client/src/lib/authStateMachine.ts` | Reduces explicit auth events into deterministic state: initialization, unauthenticated, authenticated, profile loading, workspace loading, authorized, unauthorized, and auth error. |
| Provider | `client/src/contexts/AuthContext.tsx` | Subscribes to `onAuthStateChange()`, restores or imports a session, hydrates tenant identity, exposes auth actions, and publishes the state-machine snapshot. |
| Compatibility hook | `client/src/_core/hooks/useAuth.ts` | Preserves the older `{ user, loading, error, isAuthenticated, refresh, logout }` shape while sourcing values from the provider. |
| Root guard | `client/src/App.tsx` | Wraps the application in `AuthProvider`; `ProtectedSurface` separates public auth screens, loading, unavailable configuration, incomplete identity, and protected application routes. |
| Legacy bridge | `client/src/lib/authSessionStorage.js` and `BusinessSphereDashboard.jsx` | Imports a pre-existing verified legacy session once into Supabase-managed storage, clears legacy keys, and keeps the monolithic dashboard compatible during migration. |

### Provider initialization sequence

1. `AuthProvider` loads the public Supabase configuration.
2. If configuration is unavailable, it enters `AUTH_ERROR` with `AUTH_CONFIGURATION_MISSING`; the application does not silently enter demo or unverified mode.
3. The singleton Supabase client is created with `autoRefreshToken`, `persistSession`, `detectSessionInUrl`, and `storageKey: "smart-manager-auth"`.
4. The provider subscribes to `client.auth.onAuthStateChange()` and defers event handling to avoid performing dependent database work inside the Auth callback stack.
5. A legacy stored access/refresh-token pair, if present, is imported once with `setSession()` and then cleared regardless of import success.
6. `getSession()` restores the current Supabase-managed session. No session produces `UNAUTHENTICATED`; a session enters identity hydration.
7. Identity hydration reads the verified `profiles` row, then the company, membership, workspace, role catalog, and permission grants. A generation counter prevents stale asynchronous responses from replacing a newer signed-out or refreshed state.

### State transitions

| State | Meaning | Protected-surface behavior |
|---|---|---|
| `INITIALIZING` | Provider has not completed configuration and session restoration. | Shows secure loading fallback. |
| `UNAUTHENTICATED` | No valid Supabase session is available. | Shows public auth gateway unless the route is public home. |
| `AUTHENTICATED` | A Supabase session and user exist, but tenant identity is not yet hydrated. | Keeps the secure loading boundary. |
| `PROFILE_LOADING` | Provider is loading the verified profile. | Shows secure loading fallback. |
| `WORKSPACE_LOADING` | Profile exists and tenant context is being resolved. | Shows secure loading fallback. |
| `AUTHORIZED` | Provider resolved the tenant identity snapshot. | Renders the protected child surface. |
| `UNAUTHORIZED` | The session is valid but identity/workspace resolution is incomplete. | Shows `Secure workspace setup required`; it does not enter the dashboard. |
| `AUTH_ERROR` | Configuration, session restoration, or identity bootstrap failed. | Shows `Secure authentication is unavailable`. |

## Important code-review watch items

The provider is a strong centralization step, but it is not the final authorization boundary. The server-side verified profile resolver, protected tRPC procedures, PostgreSQL RLS, and protected RPCs remain authoritative.

There is one material follow-up in `loadTenantIdentity()`: the current code treats a missing membership or workspace as nullable and still returns an identity after finding a company. The `ProtectedSurface` therefore blocks a missing profile, but not necessarily a missing membership or workspace. Before production rollout, the provider or server identity snapshot should require an active membership and the required workspace, or explicitly define why a profile-company relationship alone is sufficient.

The current permission hydration also begins from `profiles.role` and queries role catalog/grant rows. It does not yet resolve the seeded `workforce_member_roles` relationship as the sole source of effective permissions, nor does it visibly apply deny-overrides in the client snapshot. This is acceptable as a compatibility bridge only if every sensitive operation is enforced again on the server; it should not be treated as complete enterprise authorization.

The `remember` argument of `adoptSession()` is currently unused, and the state-machine session/user fields use broad `any` types. These are quality and maintainability follow-ups rather than reasons to bypass the preview boundary.

## Vercel preview configuration

Vercel defines separate Local, Preview, and Production environments. A push to a non-production branch or an opened pull request normally creates a Preview deployment, and Preview variables apply to non-production branches [1] [2]. The existing project has produced production deployments from `main`, but the PR branch has not generated a preview, so the Git integration or project preview policy needs to be checked.

### Recommended project settings

1. In the Vercel project connected to `EzraMpapi/SMARTMANAGER-MANUS`, verify that the Git repository is linked to the intended Vercel project and that the Production Branch is exactly `main`.
2. Confirm that Preview deployments are enabled for pull requests and non-production branches, and that the repository’s GitHub App has access to pull request events. PR #15 should then receive a Vercel preview check/comment without being merged.
3. Add Preview-only environment variables. The current client code requires:

```text
VITE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-or-publishable-key>
```

The value in `VITE_SUPABASE_ANON_KEY` must be a browser-safe anon/publishable key. Never place a Supabase service-role key, database password, or other privileged secret in a `VITE_*` variable or client bundle.
4. Configure all server-only variables required by the existing Express/tRPC deployment in the Preview environment separately from the public variables. Do not copy Production database or service-role credentials into Preview. Pull the exact server variable names from the project’s existing deployment configuration rather than inventing replacements.
5. If the team plan supports a persistent Custom Environment, create a `staging` environment with branch tracking for `auth-provider-preview-e2e` and attach a stable staging domain. Otherwise, use the built-in Preview environment with a commit-specific URL for each test run. Vercel documents Custom Environments for longer-lived staging or QA workflows [1].
6. Redeploy after changing variables. Vercel environment-variable changes apply to new deployments, not already-built deployments [2].

### Preview URL requirement

The browser test harness currently defaults to a local Vite preview at `http://127.0.0.1:4173`. To run against Vercel, the harness should accept an explicit `E2E_BASE_URL` and skip its local `webServer` when that variable is set. The deployed test command should use the exact commit-specific preview URL, not the production alias.

## Supabase staging fixture

The safest choice is a separate Supabase development branch or a separate staging project. Supabase branches are isolated and do not carry production data; they have their own database, Auth, storage, and API credentials [3]. The connected project currently reports only its default `main` branch, with `with_data: false` and status `MIGRATIONS_FAILED`, so it is not yet a ready E2E fixture.

### Branch or project setup

1. Resolve the existing `main` migration failure or create a clean staging project/branch after confirming the associated cost and plan implications. The connector requires a cost check and explicit cost confirmation before creating a paid Supabase branch.
2. Apply the repository migrations in order to the staging target. Use the migration tool for DDL and verify the migration ledger before testing. Do not run the E2E suite against the production project reference.
3. Configure staging Auth settings independently. Use a staging Site URL and staging redirect allow-list. Supabase requires the `redirectTo` value used by passwordless/OAuth flows to match the configured Redirect URLs [4].
4. Add exact staging redirects for the preview origin. For Vercel preview deployments, Supabase documents wildcard patterns such as `https://*-<team-or-account-slug>.vercel.app/**`, but exact production paths are preferable for production [4]. For a persistent staging domain, add the exact `https://staging.example.com/**` pattern and keep production redirects separate.
5. Configure email confirmation and password reset for staging. Use a test mailbox provider or a controlled inbox. Do not disable confirmation in production. Ensure email templates use the redirect destination correctly when `redirectTo` is supplied [4].
6. Enable only the OAuth providers required for the preview test. Configure each provider’s callback URL for the staging Supabase Auth callback and the application redirect allow-list. If provider credentials are unavailable, mark OAuth as excluded rather than replacing it with a mocked success.

### Disposable fixture set

Use a dedicated namespace such as `e2e-auth-provider-<run-id>` and never use a real employee or customer account.

| Fixture | Required condition | Purpose |
|---|---|---|
| Authorized user A | Confirmed Supabase Auth user, verified `profiles` row, company A, active membership, workspace, and a controlled role/permission set. | Positive login, refresh, logout, profile hydration, and protected-route tests. |
| Incomplete user | Confirmed Auth user with intentionally missing profile or workspace, isolated from all business data. | Verifies `UNAUTHORIZED` and fail-closed routing. |
| Authorized user B | Confirmed user assigned only to company B, with a distinct role set. | Verifies that company A data cannot be read or mutated with user B’s session. |
| Optional maker/checker pair | Two active users in one staging company with distinct approval permissions. | Exercises workforce assignment approval and maker-checker boundaries. |

Create Auth users through Supabase Auth administration or the application’s real signup/onboarding flow, not by inserting arbitrary rows into `auth.users` with SQL. Seed only the minimum company/profile/membership/workspace records required by the application contract. Tag all fixture records with the run ID if the schema has a suitable metadata field, and delete them after the run using an audited staging-only cleanup operation.

Do not place passwords or access tokens in GitHub, Vercel source files, test reports, or chat. Supply them through protected local/CI secrets or an authenticated browser session. The browser test should sign in using the public client and should never receive a service-role key.

## Full E2E matrix after the preview exists

| Scenario | Expected result |
|---|---|
| Cold visit to `/app` without a session | Public auth gateway; no dashboard data request. |
| Valid sign-in as user A | `INITIALIZING → UNAUTHENTICATED → AUTHENTICATED → PROFILE_LOADING → WORKSPACE_LOADING → AUTHORIZED`; dashboard renders company A. |
| Page refresh with managed session | Session restored through Supabase client; no legacy token required; identity rehydrates. |
| Access-token refresh | `TOKEN_REFRESHED` updates the session without losing the tenant snapshot. |
| Invalid credentials | Auth error is shown; no session or tenant record is created. |
| Confirmed user with missing profile/workspace | `UNAUTHORIZED`; secure setup screen; no dashboard mount. |
| Password reset request and callback | Email redirect lands on the preview origin and reset screen; update-password succeeds only with a valid recovery session. |
| OAuth provider configured for staging | Provider callback returns to the preview origin and resolves one session; first-login onboarding is idempotent. |
| Sign-out | Supabase session is cleared, provider reaches `UNAUTHENTICATED`, and protected routes return to public auth. |
| User A reads company B URL/data | RLS/server identity denies the request; no company B data is rendered. |
| User B reads or mutates company A data | RLS/server authorization denies the request; no cross-tenant write remains. |
| Workforce role request/decision | Protected tRPC adapter and database RPC enforce role, tenant, approval, and audit rules. |
| POS protected RPC smoke | Authenticated user can invoke only permitted POS operations; all temporary business records are cleaned from staging. |

The first pass should run read-only and authentication-only scenarios. Run transactional POS/workforce scenarios only after controlled register, terminal, financial period, and approval fixtures are created in staging and after a cleanup query is prepared.

## Recommended implementation order

1. Fix or isolate the Supabase staging branch until its migration status is healthy.
2. Configure Vercel Preview variables to point only to that staging Supabase target.
3. Enable the PR preview build and verify the preview commit equals `55f1092`.
4. Add `E2E_BASE_URL` support to Playwright and replace synthetic interception with real disposable credentials for the deployed suite.
5. Provision the three required identities and two isolated companies.
6. Run the authentication lifecycle matrix, then tenant-isolation checks, then protected POS/workforce workflow checks.
7. Capture results without credentials or tokens, clean all staging fixtures, and only then consider merging PR #15. Do not promote to Production until the membership/workspace authorization watch item is resolved and the preview matrix is green.

## References

[1]: https://vercel.com/docs/deployments/environments "Vercel Environments"

[2]: https://vercel.com/docs/environment-variables "Vercel Environment Variables"

[3]: https://supabase.com/docs/guides/deployment/branching/working-with-branches "Supabase Working with Branches"

[4]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Auth Redirect URLs"

## Exact remediation for `MIGRATIONS_FAILED`

Do not edit `supabase_migrations.schema_migrations` manually to mark a failed migration as applied. The ledger is evidence of successful execution; changing it without applying the SQL creates schema drift. First inspect the failed branch action in the Supabase Dashboard Branches page and identify the migration name and failing SQL statement.

The current connector inventory showed only the default `main` branch for project `rlhngsrihahhyxnjxrxm`, with `with_data: false` and `status: MIGRATIONS_FAILED`. Treat that entry as the project’s current branch/production baseline, not as a disposable E2E fixture. Do not reset or delete it.

For a real disposable Supabase branch, the safe recovery sequence is:

```bash
# local repository checks
cd /home/ubuntu/SMARTMANAGER-MANUS
supabase migration list --project-ref <staging-ref>
git log --oneline -- supabase/migrations

# after fixing the failing migration in Git and linking the staging target
supabase link --project-ref <staging-ref>
supabase db push --include-all
supabase migration list --project-ref <staging-ref>
```

If the failed target is a disposable Supabase preview branch and its fixture data can be discarded, fix the migration in Git, delete/recreate the preview branch, and let Supabase rerun migrations sequentially. Supabase documents that recreated preview branches are reseeded and migrations are rerun; old branch data is lost [3]. If the target is the main/production project, do not delete or reset it. Instead, repair the failed SQL, apply the corrected migration through the repository migration workflow, and verify the ledger and schema after each step.

With the connected management integration, use `list_migrations` to inspect applied history and `apply_migration` for reviewed DDL on a staging project/branch. Before creating a Supabase branch, use the required cost-check and confirmation flow; do not create a billable branch implicitly. For custom ORM migrations, Supabase’s documented pattern is to wait for the preview branch and run the project’s migration command in GitHub Actions [3].

After recovery, verify all of the following on the staging target:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 100;
```

Also verify the expected table, function, RLS, and policy catalogs. A healthy migration ledger alone is not enough; the database objects and security policies must match the repository contract.

## Fail-closed `loadTenantIdentity()` refactor

The minimum safe change is to make membership and workspace mandatory, not nullable. Keep the company lookup, then require exactly one active membership and at least one valid workspace. Use the actual membership status column if present in the live schema; if the legacy table has no status column, use the existing row plus the application’s active flag contract rather than inventing a new column.

```ts
async function loadRequiredTenantIdentity(
  client: SupabaseClient,
  session: Session,
  profile: Record<string, unknown>,
): Promise<AuthIdentity> {
  const userId = session.user.id;
  const companyId = typeof profile.company_id === "string" ? profile.company_id : null;
  if (!companyId) throw new Error("AUTH_PROFILE_COMPANY_MISSING");

  const companyResult = await client
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .limit(1);
  const company = firstRow(companyResult);
  if (!company) throw new Error("AUTH_COMPANY_NOT_FOUND");

  const membershipResult = await client
    .from("company_memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .limit(2);
  if (membershipResult.error) throw membershipResult.error;
  const memberships = membershipResult.data ?? [];
  if (memberships.length !== 1) throw new Error("AUTH_ACTIVE_MEMBERSHIP_REQUIRED");
  const membership = memberships[0];
  if (membership.status && String(membership.status).toLowerCase() !== "active") {
    throw new Error("AUTH_ACTIVE_MEMBERSHIP_REQUIRED");
  }

  const workspaceResult = await client
    .from("workspaces")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (workspaceResult.error) throw workspaceResult.error;
  const workspace = workspaceResult.data?.[0] ?? null;
  if (!workspace) throw new Error("AUTH_WORKSPACE_REQUIRED");

  const { role, permissions } = await loadEffectiveWorkforceAccess(
    client,
    userId,
    companyId,
    profile,
    membership,
  );

  return { profile, company, workspace, membership, role, permissions };
}
```

The provider should dispatch `INCOMPLETE_IDENTITY` for any of those errors. The root guard should treat `company`, `membership`, and `workspace` as required before rendering the protected dashboard. This is a client fail-closed measure; the server and PostgreSQL RLS must independently enforce the same tenant boundary.

## Fail-closed workforce permission hydration

Do not derive effective permissions from `profiles.role` alone. The workforce schema’s authoritative relationship is `workforce_member_roles(profile_id, company_id, role_id, status, effective_from, effective_to)` joined to active `workforce_role_permissions` and `workforce_permissions`. A safer client-side compatibility implementation is:

```ts
type WorkforceGrant = {
  role_id: string;
  permission_id: string;
  effect: "Allow" | "Deny";
  status: string;
  effective_from: string;
  effective_to: string | null;
};

function isCurrentlyEffective(row: { status?: string; effective_from?: string; effective_to?: string | null }) {
  const now = Date.now();
  return row.status === "Active"
    && (!row.effective_from || Date.parse(row.effective_from) <= now)
    && (!row.effective_to || Date.parse(row.effective_to) > now);
}

async function loadEffectiveWorkforceAccess(
  client: SupabaseClient,
  userId: string,
  companyId: string,
  profile: Record<string, unknown>,
  membership: Record<string, unknown>,
) {
  const memberRoleResult = await client
    .from("workforce_member_roles")
    .select("role_id,status,effective_from,effective_to")
    .eq("company_id", companyId)
    .eq("profile_id", userId)
    .eq("status", "Active");
  if (memberRoleResult.error) throw memberRoleResult.error;

  const activeRoleIds = (memberRoleResult.data ?? [])
    .filter(isCurrentlyEffective)
    .map((row) => row.role_id)
    .filter((id): id is string => Boolean(id));

  const roleIds = Array.from(new Set(activeRoleIds));
  if (roleIds.length === 0) {
    // Optional legacy compatibility is explicit and should be removed after
    // every user has a workforce_member_roles assignment. It must not grant
    // sensitive permissions by itself.
    const legacyRole = typeof profile.role === "string" ? profile.role : typeof membership.role === "string" ? membership.role : null;
    return { role: legacyRole, permissions: [] };
  }

  const grantResult = await client
    .from("workforce_role_permissions")
    .select("role_id,permission_id,effect,status,effective_from,effective_to")
    .eq("company_id", companyId)
    .in("role_id", roleIds)
    .eq("status", "Active");
  if (grantResult.error) throw grantResult.error;
  const grants = (grantResult.data ?? []).filter(isCurrentlyEffective) as WorkforceGrant[];

  const permissionIds = Array.from(new Set(grants.map((grant) => grant.permission_id)));
  if (permissionIds.length === 0) return { role: null, permissions: [] };

  const permissionResult = await client
    .from("workforce_permissions")
    .select("id,code,status")
    .eq("company_id", companyId)
    .in("id", permissionIds)
    .eq("status", "Active");
  if (permissionResult.error) throw permissionResult.error;

  const codeById = new Map((permissionResult.data ?? []).map((permission) => [permission.id, permission.code]));
  const effects = new Map<string, "Allow" | "Deny">();
  for (const grant of grants) {
    const code = codeById.get(grant.permission_id);
    if (!code) continue;
    if (grant.effect === "Deny") effects.set(code, "Deny");
    else if (!effects.has(code)) effects.set(code, "Allow");
  }

  return {
    role: roleIds[0] ?? null,
    permissions: Array.from(effects.entries()).filter(([, effect]) => effect === "Allow").map(([code]) => code),
  };
}
```

The stronger design is to expose one protected server identity-snapshot procedure that evaluates `workforce_has_permission()` and deny-overrides in PostgreSQL, then return only the effective permission codes to the browser. The browser should use the result for navigation and UX only. Sensitive mutations must continue to call protected tRPC procedures/RPCs; a client permission array is never an authorization boundary.

## Exact Playwright configuration for a deployed Vercel preview

Replace the current hard-coded `playwright.config.ts` with this configuration. It uses a remote URL when `E2E_BASE_URL` is present and only starts the local Vite server when the variable is absent.

```ts
import { defineConfig } from "playwright/test";

const remoteBaseURL = process.env.E2E_BASE_URL?.trim();
const baseURL = remoteBaseURL || "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./browser-tests",
  timeout: 60000,
  expect: { timeout: 30000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=1"],
    },
  },
  ...(remoteBaseURL
    ? {}
    : {
        webServer: {
          command: "pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
          url: "http://127.0.0.1:4173",
          timeout: 30000,
          reuseExistingServer: false,
        },
      }),
});
```

Run against a commit-specific Vercel Preview URL, not the production alias:

```bash
E2E_BASE_URL='https://<commit-preview>.vercel.app' \
E2E_REAL_AUTH=1 \
pnpm exec playwright test browser-tests/authProviderPreview.spec.ts
```

The preview bundle itself must already have been built by Vercel with staging values. Set these in Vercel’s **Preview** environment before deployment:

```text
VITE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-or-publishable-key>
```

Add an allow-list assertion in the real-user test setup so an accidental production run aborts:

```ts
const target = process.env.E2E_BASE_URL ?? "";
if (process.env.E2E_REAL_AUTH === "1" && !/^https:\/\/[a-z0-9-]+\.vercel\.app\/?$/.test(target)) {
  throw new Error("Refusing real-auth E2E outside an approved Vercel preview host.");
}
```

The deployed test runner should obtain disposable credentials from protected CI secrets, for example `E2E_USER_A_EMAIL`, `E2E_USER_A_PASSWORD`, `E2E_USER_B_EMAIL`, and `E2E_USER_B_PASSWORD`. Do not put those values in the Playwright file, Vercel source, GitHub comments, or test artifacts.
