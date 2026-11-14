# SMART MANAGER Authentication and Application Gap Assessment

**Review date:** 23 August 2026
**Repository head reviewed:** `268f8dde9bd05e16d2bcf48425840239c64dadbe`
**Scope:** Remaining work identified in `IMPLEMENTATION_PUSH_AND_SUPABASE_RECONCILIATION.md` and the attached enterprise-authentication prompt. This is an inspection-only assessment; no code, database, or deployment changes were made.

## Executive assessment

The project has a real Supabase-backed authentication flow and substantial security hardening, but it does not yet match the attachment’s final target architecture. The central gap is not a missing authentication table. The gap is that authentication state is still owned by several independent paths: the public gateway performs direct Supabase Auth REST requests, the large dashboard performs its own token persistence and workspace bootstrap, `useAuth` reads the server’s tRPC `ctx.user`, and the root route decides whether to render the dashboard partly from browser storage. There is no single `AuthProvider`, `AuthWrapper`, or `onAuthStateChange`-driven state machine currently governing the whole application.

The safest next step is therefore an incremental frontend/server auth convergence slice, beginning in preview with real test identities and no production feature-flag change. A blanket database rewrite or duplicate auth schema would be incorrect because Supabase Auth and the application’s existing identity/tenant tables are already present.

## Prioritized gap matrix

| Priority | Remaining work | Current evidence | Risk | Recommended treatment |
|---|---|---|---|---|
| P0 | Introduce one authoritative AuthProvider/AuthWrapper state machine | `App.tsx` selects the dashboard using `isPublicAuthRequest()`; `BusinessSphereDashboard.jsx` owns a separate session/bootstrap state; `useAuth.ts` independently queries `auth.me` | Redirect races, inconsistent identity state, and duplicated refresh/logout logic | Add provider at the root, expose session/user/profile/company/membership/role/permissions, and make route protection consume only provider state |
| P0 | Fail closed when production Supabase configuration is missing | The dashboard initializes `{ demo: true }` when `IS_CONFIGURED` is false, and the signup path has an explicit local demo branch | A misconfigured production deployment can present a simulated workspace instead of a hard authentication failure | Permit demo behavior only behind an explicit non-production build flag; production must show configuration-unavailable and never create a simulated authenticated state |
| P0 | Remove browser storage as an authentication authority | `authSessionStorage.js`, `main.tsx`, and `App.tsx` read/write `bs_access_token`, `bs_refresh_token`, and session variants; the dashboard uses them for API headers and launch decisions | Token theft/XSS exposure, stale-token routing, and divergence from Supabase’s session lifecycle | Migrate to one Supabase client/provider session source; retain localStorage only for non-security preferences. If a compatibility bridge is temporarily required, make it provider-owned and time-bounded |
| P1 | Replace direct REST auth duplication with a single Supabase client boundary | `PublicAuthGateway.jsx` calls `/auth/v1/token`, `/recover`, `/resend`, `/user`, and `/authorize`; `BusinessSphereDashboard.jsx` repeats sign-in, refresh, logout, and recovery helpers | Different error, refresh, callback, and persistence semantics across entry points | Use one configured Supabase browser client and provider methods for sign-in, sign-up, recovery, update, OAuth, sign-out, and session restoration |
| P1 | Add a real auth lifecycle listener | Repository search found no application `onAuthStateChange()` implementation | `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`, and `PASSWORD_RECOVERY` can be observed inconsistently or not at all | Register exactly one listener in the provider, normalize events into explicit states, and unsubscribe on unmount |
| P1 | Make profile/company/workspace/membership/role/permission loading authoritative | `resolveVerifiedProfile()` verifies the token and reads `profiles.company_id` and legacy `profiles.role`, but does not resolve a selected membership and permission set; `ctx.user` maps a Supabase user to a synthetic Drizzle user with role `user` | Modules can see different notions of the current user or authorization context | Add a server-side identity snapshot contract that resolves active membership and permissions from the database, with tenant selection validated server-side |
| P1 | Make signup onboarding atomic and retry-safe | `SignupPage` uses a real server account-creation route, then calls workspace RPCs; optional company details, modules, and branch writes are separately attempted and reported as warnings. `passwordAccountProvisioning.ts` creates a confirmed account before tenant provisioning | Orphan accounts or partially provisioned workspaces after a network failure or refresh | Use an idempotent onboarding orchestration boundary with a pending/complete state, unique user/profile constraints, and a safe retry or compensation path. Do not mark setup complete until required records are confirmed |
| P1 | Replace the isolated signup test path with live preview coverage | `signupWizard.spec.ts` explicitly asserts that no authentication request or tenant record was sent and labels the result an isolated authenticated workspace | Signup UI coverage does not prove Supabase Auth or database persistence | Keep the isolated test as a unit/UI test, but add a separate preview suite with disposable real accounts and tenant fixtures |
| P1 | Protect every private entry point through the wrapper | `App.tsx` has public `/`, `/app`, `/patient/sms-preferences`, and `/404` routes; the monolithic dashboard contains internal modules rather than independently guarded URL routes | Direct URLs or future routes can bypass a consistent guard even when navigation is hidden | Define public versus protected route metadata and wrap every private route; keep patient portal access as an explicit, separately authorized route |
| P1 | Implement safe multi-company selection and stale-context invalidation | The report records `workspaceSwitchingAvailable: false`; current code relies on `profiles.company_id`, and no provider-level membership selector was found | Stale dashboard data or accidental access to the previous tenant after a switch | Add server-validated active-company selection, invalidate all tenant-scoped queries on switch, reload permissions, and test both directions across two tenants |
| P1 | Verify OAuth rather than treating buttons as completion | The UI exposes Google, Microsoft/Azure, and Apple controls and the gateway builds provider authorization URLs; current browser tests are mocked and no live provider configuration test was completed | Callback, redirect, provider enablement, and first-login provisioning failures can remain hidden | Verify only configured providers in preview, use a single callback/session exchange, and test first login with profile/workspace provisioning |
| P1 | Complete deployment configuration verification | The local schema verifier could not use its direct HTTP path because server-only Supabase variables were unavailable; Vercel environment and OAuth/password-reset URL verification were not completed | A source-correct build can still fail at runtime or redirect to the wrong host | Validate preview/production public URL, `VITE_SUPABASE_URL`, public anon/publishable key, server-only key isolation, Site URL, redirect allow-list, OAuth callbacks, and password-reset redirects |
| P2 | Finish account/security settings capabilities | `profileIdentity.ts` reports `passwordChangeAvailable: false`, `workspaceSwitchingAvailable: false`, and `sessionDeviceListAvailable: false` | Users lack a coherent account-management surface | Add provider-backed password update, active-session/device visibility only if supported by the chosen security model, and explicit workspace/account status presentation |
| P2 | Align frontend permissions with database authorization | Dashboard comments acknowledge a global role write switch rather than complete per-action gating; workforce role grants are seeded but `workforce_member_roles` has no production assignments | UX may overstate or understate access; frontend hiding alone remains insufficient | Derive menu/action visibility from the server permission snapshot, while keeping PostgreSQL RLS and protected RPC checks authoritative |
| P2 | Review legacy `public`-role policies module-by-module | Live inspection found representative older MFI, pharmacy, and school policies with `public` role metadata alongside authenticated tenant policies | A broad policy rewrite could break working flows; leaving all legacy policies unreviewed could preserve unnecessary exposure | Produce a table-by-table policy matrix, test each operation under anonymous/authenticated contexts, and change only policies with a demonstrated defect |

## Current strengths

Supabase Auth remains the actual identity authority for the implemented password, recovery, reset, resend, and OAuth request paths. The server verifies bearer tokens against Supabase before sensitive profile-backed operations. The current bootstrap has deliberate loading, retry, terminal-session, and workspace-resolution handling rather than blindly redirecting on every transient error. The project also has protected tRPC procedures, tenant-aware database policies, additive authorization tables, routine privilege hardening, and a rollback-only structural test history.

The existing signup path is not purely a mock in configured runtime: it can use the server-side account-provisioning procedure and workspace RPCs. The important distinction is that the test suite’s signup scenario is intentionally isolated, optional setup writes are non-blocking, and the overall lifecycle is not yet governed by the provider state machine required by the attachment.

## Test-coverage assessment

| Requirement | Current coverage | Assessment |
|---|---|---|
| Password sign-in errors and UI states | Contract tests and mocked browser flows | Partial; needs live preview sign-in |
| Session restoration and one-time refresh | Mocked browser tests in `sessionRecovery.spec.ts` | Partial; logic is covered, Supabase lifecycle is not |
| Signup | Isolated `.e2e.invalid` preview test; server contract coverage | Not production E2E |
| Profile/company bootstrap | Mocked REST responses and server contracts | Partial |
| Logout | Existing tRPC/browser contracts | Partial; needs provider event and multi-tab verification |
| Password recovery/reset | Direct REST UI path and contract coverage | Partial; needs real recovery-link test |
| OAuth | UI/URL contract coverage | Not live verified |
| `getSession()` / `onAuthStateChange()` | No centralized provider implementation found | Missing |
| Direct protected URL | Monolithic `/app` bootstrap behavior | Partial; no reusable route guard |
| Two-tenant isolation | Database/RLS architecture and rollback checks | No controlled authenticated two-tenant browser matrix completed |
| Authenticated SELECT/INSERT/UPDATE/DELETE under RLS | Structural and mocked/contract coverage | Live positive/negative matrix remains |
| Production deployment/auth redirect verification | Not completed in this review | Missing |

## Recommended implementation sequence

### Phase A: establish a provider without changing business modules

Create a single browser Supabase client and an `AuthProvider` with explicit states: `INITIALIZING`, `UNAUTHENTICATED`, `AUTHENTICATED`, `PROFILE_LOADING`, `WORKSPACE_LOADING`, `AUTHORIZED`, `UNAUTHORIZED`, and `AUTH_ERROR`. Register one `onAuthStateChange` listener. Move token persistence, refresh, logout, and recovery-session handling behind the provider. Keep the current public visual components and business dashboard intact, and initially run the provider in preview behind a feature flag.

### Phase B: establish a canonical server identity snapshot

Add a protected identity query or equivalent server contract that verifies the Supabase token, resolves the profile, validates active company membership, and returns the active workspace, role, and effective permission set. Existing module services should continue using verified server context during migration. The synthetic tRPC `ctx.user` should not be treated as the granular permission authority.

### Phase C: make onboarding durable

Refactor account creation and workspace onboarding into an idempotent workflow. Required records should be confirmed before success is shown. If email confirmation is required by the live Supabase configuration, the UI should remain in a confirmation state and resume setup only after the real session exists. If confirmation is disabled, the behavior should be discovered from configuration rather than hardcoded.

### Phase D: add the authenticated preview matrix

Use two disposable test identities in two logical tenants. Test sign-in, signup, confirmation behavior, recovery, reset, refresh, logout, direct URL access, permission denial, company switching, and cross-tenant isolation. Exercise authenticated database reads and writes through the actual application path. Keep all fixtures in a non-production project or an explicitly isolated staging tenant.

### Phase E: deploy and canary

Verify public and server-only environment variables, Supabase redirect configuration, OAuth provider settings, password-reset URLs, and the production build. Deploy a preview, run the authenticated matrix against it, then canary the provider behind a controlled flag. Do not enable the production flag until the old and new paths have equivalent logout, refresh, and tenant-isolation behavior.

## Database conclusion

No new authentication or tenant table is justified by this review. The live project already has Supabase-managed Auth tables, application profiles, companies, memberships, workspaces, and modules, and the additive finance/POS/workforce migrations are applied. The next database work should be narrowly scoped to any identity-snapshot or onboarding-state object proven necessary by the provider design. It must be an additive migration with RLS, explicit tenant relationships, idempotency, and a rollback plan; it should not duplicate `auth.users`, `profiles`, `companies`, or `company_memberships`.

## Final conclusion

The remaining work is a **controlled authentication architecture convergence and real authenticated test program**, not a table-creation exercise. The highest-risk issues are the absence of a single provider/guard, storage-driven routing and token forwarding, production demo fallback when configuration is absent, non-atomic onboarding, and the lack of live two-tenant/OAuth/recovery verification. These can be addressed incrementally while preserving the current Smart Manager UI, modules, database, RLS, and authentication authority.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/client/src/App.tsx "SMART MANAGER application root and route selection"
[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/client/src/main.tsx "SMART MANAGER tRPC bootstrap and request headers"
[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/client/src/lib/authSessionStorage.js "SMART MANAGER session-storage compatibility bridge"
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/client/src/components/PublicAuthGateway.jsx "SMART MANAGER public authentication gateway"
[5]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/client/src/BusinessSphereDashboard.jsx "SMART MANAGER dashboard authentication and workspace bootstrap"
[6]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/server/passwordAccountProvisioning.ts "SMART MANAGER server-side password account provisioning"
[7]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/server/profileIdentity.ts "SMART MANAGER verified profile identity service"
[8]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/browser-tests/signupWizard.spec.ts "SMART MANAGER isolated signup browser coverage"
[9]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/browser-tests/sessionRecovery.spec.ts "SMART MANAGER session-recovery browser coverage"
[10]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/268f8dde9bd05e16d2bcf48425840239c64dadbe/IMPLEMENTATION_PUSH_AND_SUPABASE_RECONCILIATION.md "Published reconciliation report"
