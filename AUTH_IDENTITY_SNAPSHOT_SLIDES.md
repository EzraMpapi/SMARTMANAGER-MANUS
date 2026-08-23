# SMART MANAGER Auth Identity Snapshot

## Slide 1 — Secure identity hydration
**Title:** Secure identity hydration for SMART MANAGER
**Subtitle:** One server-side snapshot, fail-closed authorization, and evidence-driven preview testing
**Key message:** The authentication hardening slice moves tenant and effective-permission evaluation behind a single PostgreSQL RPC while preserving the existing React/Vite + Express/tRPC + Supabase architecture.

## Slide 2 — Why the snapshot was needed
**Title:** The previous gap: fragmented browser authority
**Content:**
- Session restoration, profile loading, tenant membership, workspace selection, and permission hydration were split across several browser queries.
- Missing membership or workspace responses could be treated as nullable and still allow the shell to continue.
- Profile string roles could be mistaken for effective workforce permissions.
- The new contract makes one server response authoritative for browser hydration; server/RLS checks remain authoritative for business operations.

## Slide 3 — Migration design
**Title:** Additive database change
**Content:**
- New function: `public.auth_identity_snapshot()`
- `SECURITY DEFINER` with pinned `search_path = public, auth, pg_temp`
- No table creation, table alteration, data rewrite, RLS disablement, or migration-ledger edits
- `PUBLIC` and `anon` execution revoked; `authenticated` execution granted
- Returns limited JSONB identity data rather than raw table joins or secrets

## Slide 4 — Fail-closed identity gates
**Title:** Authorization gates before the dashboard
**Content:**
1. Require `auth.uid()`; unauthenticated calls raise SQLSTATE `42501`.
2. Require an active profile with company and role.
3. Require `current_company_id()` to match the profile company.
4. Require the company to exist.
5. Require a matching `company_memberships` row.
6. Require at least one workspace.
7. Otherwise return `authorized: false` with a bounded reason.

## Slide 5 — Effective permission evaluation
**Title:** Permissions are calculated in PostgreSQL
**Content:**
- Active workforce member-role assignments only.
- Active roles and active permission catalog entries only.
- Effective-date windows are enforced for assignments and grants.
- Supports role grants, profile module access, and role module access.
- Active `Deny` overrides any `Allow` for the same permission.
- Legacy profile/membership roles are display-only in the snapshot and cannot silently elevate access.

## Slide 6 — Frontend state machine
**Title:** Session and identity states remain explicit
**Content:**
- `INITIALIZING` → `AUTHENTICATED` → `PROFILE_LOADING` → `WORKSPACE_LOADING` → `AUTHORIZED`
- Valid session plus incomplete tenant identity → `UNAUTHORIZED` with setup-required UI.
- RPC/network failure → `AUTH_ERROR`; no silent authorization.
- Sign-out clears session, profile, company, workspace, membership, role, and permissions.
- The root protected surface blocks every `UNAUTHORIZED` state.

## Slide 7 — Verification workflow
**Title:** Test strategy and evidence
**Content:**
- Focused Vitest tests cover reducer transitions and source contracts.
- The migration contract checks security-definer settings, grants, fail-closed reasons, and deny precedence.
- The AuthProvider contract checks single-RPC hydration and removal of browser-side permission joins.
- Deployed Playwright suite covers user A sign-in/reload/sign-out, invalid credentials, incomplete identity, and tenant-B isolation.
- Real preview tests require disposable Supabase users and an exact approved HTTPS Vercel preview host.

## Slide 8 — Current status and next gate
**Title:** Safe to review; not yet applied or deployed
**Content:**
- Focused Vitest suite: 3 files / 10 tests passed.
- Migration not applied because no local Supabase CLI, Docker daemon, PostgreSQL client, or local database was available.
- Preview E2E not run because `.env.test` still contains placeholders.
- The management branch reports `MIGRATIONS_FAILED`, but the exact failed action and SQLSTATE remain unavailable; the identity migration is not claimed as its repair.
- Next gate: start an isolated local/staging environment, apply and verify the migration, populate disposable fixtures, then run the guarded remote suite.
