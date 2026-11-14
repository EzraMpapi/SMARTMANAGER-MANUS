# Auth Identity Snapshot and Deployed Preview E2E Status

**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Working branch:** `auth-provider-preview-e2e`
**Scope:** additive authentication hardening only; no production deployment, merge, or Supabase DDL application was performed.

## Implemented artifacts

| Artifact | Purpose | Safety property |
|---|---|---|
| `supabase/migrations/20260824_061_auth_identity_snapshot.sql` | Creates `public.auth_identity_snapshot()` as a single server-side identity contract. | Additive `BEGIN/COMMIT`; `SECURITY DEFINER`; pinned `search_path`; anonymous/public execution revoked; authenticated execution granted. |
| `client/src/contexts/AuthContext.tsx` | Hydrates AuthProvider through the snapshot RPC rather than browser-side tenant and role joins. | RPC failure becomes `AUTH_ERROR`; `authorized=false` becomes `INCOMPLETE_IDENTITY`; no raw profile role is treated as a permission grant. |
| `client/src/App.tsx` | Protects the application shell. | Every `UNAUTHORIZED` state is blocked, including missing membership and workspace. |
| `playwright.config.ts` | Supports local synthetic tests and explicitly configured remote previews. | `E2E_BASE_URL` disables the local web server; otherwise the existing local behavior remains. |
| `browser-tests/authProviderDeployedPreview.spec.ts` | Real-auth deployed-preview suite. | Requires `E2E_REAL_AUTH=1`, an exact approved HTTPS Vercel preview host, isolated fixture credentials, and tenant markers; refuses known production hosts. |
| `server/authIdentitySnapshotMigration.test.ts` | Migration source-contract checks. | Verifies additive/security/grant/fail-closed/deny-precedence requirements. |
| `server/authContextSnapshotContract.test.ts` | AuthProvider source-contract checks. | Verifies single RPC hydration, no raw membership/role-grant joins, and broad unauthorized gating. |
| `supabase/diagnostics/20260824_migrations_failed_evidence.sql` | Read-only evidence collection for the reported branch state. | Contains no write, DDL, ledger-edit, reset, or repair operation. |

## Snapshot behavior

The RPC first requires `auth.uid()`. It then loads the caller's profile and requires a non-null company, a non-empty profile role, and `is_active = true`. It compares the profile company to the verified `public.current_company_id()` result, confirms the company exists, requires a matching `company_memberships` row, and requires at least one workspace for that company. The connected schema was inspected before authoring the function: `company_memberships` exposes `user_id`, `company_id`, `role`, and `created_at`; `workspaces` exposes `id`, `company_id`, channel/department/description/member/name fields, and timestamps; neither verified table has a status column, so the migration does not invent one.

Permission output is limited to active workforce assignments, active roles, active and time-valid role/module grants, and active catalog permissions. An active `Deny` excludes the same permission even when an `Allow` exists. The existing `workforce_is_privileged()` compatibility shortcut is deliberately not used by this snapshot, and the legacy profile/membership role is display-only. Existing server/RLS enforcement remains authoritative for every business operation.

For incomplete identity, the RPC returns `authorized: false` with a bounded reason such as `PROFILE_MISSING`, `PROFILE_INACTIVE`, `TENANT_CONTEXT_MISMATCH`, `COMPANY_MISSING`, `MEMBERSHIP_MISSING`, or `WORKSPACE_MISSING`. For a missing authenticated session it raises SQLSTATE `42501`. For a real RPC/network failure the AuthProvider dispatches `AUTH_ERROR` rather than silently authorizing or remaining indefinitely in a loading state.

## Remote preview test contract

The command is:

```bash
E2E_BASE_URL="https://<approved-preview-host>.vercel.app" \
E2E_PREVIEW_HOST="<approved-preview-host>.vercel.app" \
E2E_TENANT_A_MARKER="<tenant-a-display-name>" \
E2E_TENANT_B_MARKER="<tenant-b-display-name>" \
E2E_USER_A_EMAIL="..." E2E_USER_A_PASSWORD="..." \
E2E_USER_B_EMAIL="..." E2E_USER_B_PASSWORD="..." \
E2E_INCOMPLETE_EMAIL="..." E2E_INCOMPLETE_PASSWORD="..." \
pnpm run test:browser:preview-auth
```

Credentials must be injected by CI or a local secret manager and must belong to disposable, isolated Supabase fixtures. They are not stored in the repository, screenshots, reports, or test source. User A covers sign-in, reload/session restoration, and sign-out. Invalid credentials cover the unauthenticated path. The incomplete fixture covers a valid Supabase session that must remain outside the protected shell. User B must resolve only its own tenant marker and must not display tenant A's marker.

A real remote run has not been claimed because the existing Vercel project did not create a preview deployment for PR #15, and no isolated Supabase staging fixture with disposable users was available. The suite is intentionally not a synthetic pass: it fails with a clear missing-environment error when enabled without the required fixture values, and otherwise skips only when `E2E_REAL_AUTH` is not set.

## Migration-failure evidence status

The connected Supabase catalog check returned a healthy applied migration ledger through the known workforce hardening migrations, while the Supabase management branch metadata reported `MIGRATIONS_FAILED`. The exact failed branch action, migration statement, SQLSTATE, and error context were not exposed by the available branch listing. A historical PostgreSQL unified-log query for the reported window returned no migration error records. Therefore, a root-cause correction cannot be authored honestly from the current evidence.

The new `20260824_061_auth_identity_snapshot.sql` file is a complete additive identity migration, **not** a claimed repair of the unknown historical failure. The diagnostic file must be run against the affected non-production branch or the Supabase action log must be exported before a narrowly scoped corrective migration is written. The repair must be a new migration; it must never edit `supabase_migrations.schema_migrations` manually, mark a failed migration as applied, reset production, or bypass RLS.

## Validation completed

The following checks passed on the working branch:

| Check | Result |
|---|---|
| `pnpm check` | Passed. |
| Focused Vitest suite: state machine, migration contract, AuthProvider contract | 3 files / 10 tests passed. |
| Playwright remote suite discovery | 4 tests discovered; no remote credentials or preview was used. |
| `git diff --check` | Passed. |

No Supabase migration was applied. No production user or business data was used. PR #15 remains separate from `main`; merging, deploying, creating a paid Supabase branch, and applying the new migration remain explicit follow-up actions.
