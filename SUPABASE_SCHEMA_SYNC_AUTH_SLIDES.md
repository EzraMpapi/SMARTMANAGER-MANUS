# SMART MANAGER — Supabase Schema Synchronization & Auth Identity Snapshot

## Cover
Supabase Schema Synchronization & Auth Identity Snapshot
SMART MANAGER ERP
Evidence-led reconciliation of repository, database controls, and authentication hydration

## Slide 1
### Synchronization objective
- Align versioned code and migrations with the verified Supabase project without resetting or rewriting production data.
- Validate the chain: repository → migration ledger → live catalog → backend/API → frontend.
- Apply only additive, dependency-checked changes.

## Slide 2
### Live schema is present; migration history has drift
- Verified project: `rlhngsrihahhyxnjxrxm`.
- Live catalog: 518 public tables.
- All 279 tables declared by local migrations were present in the live catalog.
- Difference is primarily migration-source drift and historical naming aliases, not missing live tables.

## Slide 3
### Database controls remain enabled
- 0 public tables reported with RLS disabled.
- 2,546 constraints, 1,189 indexes, 441 non-internal triggers, and 719 public policies inventoried.
- Storage buckets present: `avatars`, `company-logos`, and private `documents`.
- No destructive reset, manual ledger edit, or blanket RLS change was performed.

## Slide 4
### One server snapshot closes the tenant boundary
- `public.auth_identity_snapshot()` is a new additive RPC.
- Requires an authenticated `auth.uid()` and raises SQLSTATE `42501` when absent.
- Requires active profile, matching company context, existing company, membership, and workspace.
- Returns limited identity metadata instead of exposing browser-side table joins as authority.

## Slide 5
### Effective permissions are evaluated in PostgreSQL
- Active workforce member roles are filtered by status and effective date.
- Permission catalog is limited to active tenant permissions.
- Role grants and profile/role module access can allow access.
- Active, time-valid Deny grants override Allow grants; legacy profile role strings are display-only.

## Slide 6
### Frontend hydration now fails closed
- AuthProvider calls the single snapshot RPC after session restoration or sign-in.
- `authorized: false` dispatches `INCOMPLETE_IDENTITY` and retains only the verified session/user.
- RPC failures dispatch `AUTH_ERROR` instead of entering the secured shell.
- ProtectedSurface blocks every unauthorized identity, including missing membership or workspace.

## Slide 7
### Verification evidence is layered
- SQL privilege check: security definer enabled; `anon` execution false; `authenticated` execution true.
- Unauthenticated RPC invocation: SQLSTATE `42501` as expected.
- Focused auth tests: 3 files / 10 tests passed.
- Full Vitest suite: 204 files / 835 tests passed, with 5 skipped files.
- Production build completed through the Vercel-compatible path.

## Slide 8
### Advisor findings require targeted follow-up
- Security: 117 warnings — 110 authenticated security-definer calls, 6 anonymous calls, and 1 breached-password protection setting.
- Performance: 855 findings — 632 unindexed foreign keys, 152 multiple permissive-policy findings, 61 unused indexes, and 10 auth RLS init-plan findings.
- These are not blanket migrations: each affected RPC, policy, and index requires workload and product-intent review.

## Slide 9
### Current deployment boundary
- First synchronization commit and follow-up local browser regression fix are pushed to `auth-provider-preview-e2e`.
- Synthetic local AuthProvider browser matrix passes 3/3 after the RPC fixture correction.
- Real deployed-preview E2E remains fixture-gated: approved Vercel preview and disposable Supabase users are required.
- Production end-to-end certification is intentionally not claimed.

## Slide 10
### Safe next sequence
- Provision isolated non-production Auth users, tenants, memberships, workspaces, roles, and markers.
- Run the guarded remote Playwright suite against an approved preview URL.
- Review six anonymous security-definer routines one by one before changing privileges.
- Prioritize high-value FK indexes and policy simplification from measured workloads.
- Reconcile historical migration-source drift through a deliberate snapshot process, not blind replay.

## Closing
The schema synchronization is additive and evidenced; authorization hydration is centralized and fail-closed. The remaining work is fixture-backed deployed E2E and targeted advisor remediation—not an unsafe global rewrite.
