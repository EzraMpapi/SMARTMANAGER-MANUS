# SMART MANAGER Production Authentication Audit and Remediation

**Date:** 25 August 2026  
**Scope:** React/Vite client, Express/tRPC server, Supabase Auth, tenant identity hydration, RLS-facing procedures, Render production deployment, and session-recovery behavior.  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)  
**Remediation commit:** [`ff84690`](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/commit/ff8469095f2c92cd9ea5ec8a3befd0087661a901)  
**Live service:** [smartmanager-manus-render.onrender.com](https://smartmanager-manus-render.onrender.com)

## Executive conclusion

The `SM-AUTH-401` display was not caused by a single Supabase password-authentication defect. It was caused by **competing session authorities and an overly broad client-side 401 escalation path**. The modern application used Supabase Auth and its `smart-manager-auth` persistence key, while the preserved dashboard still made several requests through legacy `bs_*` token storage and the legacy `manus-cookie` header. When the legacy token was stale or absent, direct dashboard requests could omit the current Supabase session or use the publishable key as a bearer value. Separately, the tRPC client preferred legacy authorization material and the global React Query error handler converted protected-request failures into a login redirect/`SM-AUTH-401` even when a current Supabase session still existed.

The server-side bearer-precedence fix had already stopped some collisions, but the complete path still contained direct REST, guarded persistence, subscription access, realtime, and manual-refresh paths that did not share the same session authority. The remediation therefore centralizes browser session access around one Supabase client, adds a single-flight refresh lock, retries one genuine HTTP 401 exactly once, preserves the session on transient network failure, and removes the global “any unauthorized tRPC error means sign out” behavior. It does **not** bypass tenant authorization, RLS, identity snapshots, role checks, or security-definer controls.

The fix is pushed to GitHub and is live on Render. A genuine authenticated post-deployment login could not be independently completed because account credentials must be entered by the owner directly in the browser. Therefore, the transport/session architecture is remediated and the deployment is verified, but the final account-specific workspace result must still be confirmed by the owner.

## Exact root cause

| Area | Finding | Production consequence |
|---|---|---|
| Session persistence | `AuthContext` used the official Supabase client with persistent `smart-manager-auth` storage, while the legacy dashboard read `bs_access_token`, `bs_refresh_token`, and `bs_session_access_token`. | A valid modern session was not consistently visible to legacy direct-REST helpers. |
| Direct REST headers | The dashboard’s old `authHeaders()` selected legacy storage and fell back to `SUPABASE_ANON_KEY` as `Authorization: Bearer ...` when no legacy token existed. | PostgREST requests from an authenticated modern session could be sent without the user JWT or with a non-user bearer value, producing 401/RLS failures. |
| tRPC headers | `main.tsx` initially preferred the `manus-cookie` token and only conditionally added the Supabase token. | A stale legacy token could reach server code before the current Supabase session. |
| Server context | The old context path called legacy `sdk.authenticateRequest()` before validating the dedicated Supabase header. | Stale or incompatible legacy material produced `JOSEAlgNotAllowed` before the modern Supabase path could be used. |
| Global error escalation | `main.tsx` subscribed to all React Query query/mutation errors and redirected or dispatched the auth-expired diagnostic for broadly classified unauthorized failures. | A protected-feature failure was presented as a revoked/expired login, hiding whether the actual issue was refresh, network, identity, role, or tenant setup. |
| Manual refresh loops | The dashboard’s proactive refresh, workspace-RPC refresh, and request headers each used separate storage/read/refresh logic. | Concurrent or stale refresh paths could rotate different refresh-token state and create session races. |
| Identity boundary | `auth_identity_snapshot()` intentionally returns fail-closed incomplete-identity reasons when the Supabase user lacks a valid profile, company, membership, workspace, or effective permissions. | A valid Supabase session can correctly be unauthorized for the application workspace; that state must not be called a transport-authentication failure. |

The Render log evidence showed the exact old collision: repeated `JOSEAlgNotAllowed: "alg" (Algorithm) Header Parameter value not allowed` entries at approximately 12:34 UTC on the preceding runtime. After the new deployment started at approximately 13:30 UTC, the application log stream showed successful startup and no new `JOSEAlgNotAllowed` entries in the observed window.

## Authentication flow audited

The complete flow was traced through these layers:

| Stage | Primary implementation | Audit result |
|---|---|---|
| Public configuration | `server/_core/apiApp.ts`, `/api/config/public`, `client/src/lib/publicSupabaseConfig.ts` | Live endpoint returned HTTP 200 with a valid URL/key shape; secret values were not printed. |
| Browser Supabase client | `client/src/lib/supabaseAuthClient.ts` and `client/src/contexts/AuthContext.tsx` | Official `createClient`, `getSession`, `onAuthStateChange`, `setSession`, `signOut`, `refreshSession`, and persistent session storage are now consolidated. |
| Password login | `client/src/components/PublicAuthGateway.jsx` and `AuthContext.signIn()` | Uses official Supabase password sign-in. The gateway adopts the resulting session through the central client. |
| OAuth | `PublicAuthGateway`, Supabase provider configuration, Render redirect allow-list | Google initiation previously reached the Google chooser and the Supabase callback. The Render wildcard redirect was already configured. |
| Session initialization | `AuthContext` startup and `hydrateIdentity()` | `getSession()` is followed by one identity-snapshot hydration. A JWT-related identity-RPC 401 receives one shared refresh/retry. |
| Session persistence | Supabase client storage key `smart-manager-auth`; legacy storage migration | Legacy stored sessions are imported once through `setSession()` and then cleared. Direct runtime requests prefer the central session. |
| Session refresh | `refreshSupabaseSession()` | Single-flight promise prevents concurrent refresh-token rotation. Transient failures do not immediately sign the user out. |
| tRPC authorization | `client/src/main.tsx`, `server/_core/context.ts`, `server/_core/authHeaders.ts` | Current Supabase JWT is sent in both `Authorization` and the dedicated Supabase header; the server validates the dedicated header before legacy fallback. One 401 receives controlled refresh/replay. |
| Direct PostgREST/RPC calls | `BusinessSphereDashboard.jsx`, `guardedPersistenceClient.ts`, subscription access, hospitality/fleet helpers | All audited requests now resolve the central session and use the shared 401 recovery wrapper. The publishable key is never used as a user bearer token. |
| Tenant/workspace authorization | `auth_identity_snapshot()`, `resolveVerifiedProfile()`, workspace settings and billing services | Authentication and workspace authorization remain separate. Missing profile/company/membership/role states remain fail-closed. |
| RLS | Live policies on `profiles`, `companies`, `company_memberships`, `workspaces`, and workforce tables | Policies continue to scope access by `auth.uid()`, current company, and privilege helpers. No RLS policy was disabled or loosened. |
| Logout | `AuthContext.signOut()` plus legacy cleanup | Attempts server sign-out, falls back to local sign-out on network failure, clears legacy storage, and dispatches local signed-out state. |
| Session expiration | Supabase refresh events and controlled 401 recovery | Only definitive refresh-token failure clears local Supabase state and emits a redacted diagnostic; network errors remain retryable. |

## Remediation implemented

The remediation in commit `ff84690` includes the following production-safe changes.

1. `client/src/lib/supabaseAuthClient.ts` now owns the shared Supabase client, a single-flight `refreshSupabaseSession()` operation, definitive refresh-failure classification, and `fetchWithSupabaseAuthRecovery()`. A request that receives HTTP 401 performs at most one refresh and one replay. Network failures do not masquerade as proof of session revocation.

2. `client/src/main.tsx` now sends the current Supabase access token as the primary `Authorization` credential and as `x-supabase-authorization`. Legacy `manus-cookie` is retained only as a fallback for migration compatibility. The global query/mutation subscription that redirected on broadly classified unauthorized errors was removed; route protection remains owned by `AuthProvider` and `ProtectedSurface`.

3. `AuthContext.tsx` now ignores the duplicate `INITIAL_SESSION` callback because startup explicitly calls `getSession()`, avoids duplicate sign-in/sign-up identity hydration, uses the single-flight refresh operation, retries an identity-snapshot JWT failure once, and performs local cleanup safely when network sign-out is unavailable.

4. `BusinessSphereDashboard.jsx` now resolves the active Supabase session before direct REST/RPC requests. It no longer uses the publishable key as a bearer value. The proactive refresh loop and workspace-RPC recovery use the same Supabase refresh lock. Existing legacy token handling remains only as a bounded onboarding/migration fallback.

5. Guarded persistence, subscription access, hospitality RPCs, fleet calls, restaurant calls, and realtime now use the shared Supabase client or recovery wrapper rather than creating divergent browser session authorities.

6. `DashboardPreferencesProvider` now consumes `AuthContext` as its live-session gate rather than deciding authentication from `bs_*` storage keys.

7. Focused regression coverage was added for concurrent refresh single-flight behavior and definitive-versus-transient refresh failure classification. Existing auth, identity-snapshot, workspace-recovery, employee-portal, subscription, and reload contracts were updated only where their expected request wrapper intentionally changed.

No algorithm acceptance was widened, no RLS policy was disabled, no tenant check was removed, no identity snapshot was bypassed, and no production data was deleted or rewritten.

## Validation evidence

| Check | Result |
|---|---|
| `git diff --check` | Passed before commit. |
| TypeScript `pnpm check` | Passed. |
| Focused authentication/identity/session suite | **9 files, 30 tests passed.** |
| Direct Vite production build | Passed; 2,687 modules transformed. |
| Direct server artifacts | Passed for `dist/index.js` and `dist/api.js`. |
| Normal `pnpm build` locally | Prebuild stopped because the local sandbox intentionally lacks `SUPABASE_URL`/`VITE_SUPABASE_URL` and `SUPABASE_SECRET_KEY`; this is an environment prerequisite, not a code/build error. Render had the linked environment group and built successfully. |
| Full Vitest suite | **228 test files passed, 6 skipped; 936 tests passed, 14 skipped; one existing `server/dashboard.integration.test.ts` source-contract assertion failed because the latest upstream dashboard layout no longer contains the older expected `BrandLogo` markup.** This failure is unrelated to the authentication changes and should be handled as a separate contract/snapshot maintenance item. |
| Render deployment | Commit `ff84690`, deployment `dep-da6pgvoae00c738ld680`; Render reported build successful and service live at approximately 13:30:53 UTC. |
| Credential-free live smoke | `/`, `/app`, `/api/config/public`, and `/api/billing/catalog` returned HTTP 200; `/api/billing/access` returned expected HTTP 401 without credentials. Config shape contained URL and anon-key fields without printing values. |
| Post-deployment logs | Successful server startup. No new `JOSEAlgNotAllowed` observed after the `ff84690` runtime began; older entries were from the previous runtime before the fix. |

## Live Supabase security findings kept separate from the session fix

The live Supabase security advisor was inspected. It reported **2 informational RLS-enabled-without-policy findings**, **6 warnings for anonymous execution of security-definer booking/seat-hold functions**, **126 warnings for authenticated execution of security-definer functions**, and **1 warning for leaked-password protection configuration**. These are not evidence that the session transport fix failed, and they were not changed in this deployment because altering public booking access or hundreds of financial/workflow RPC grants without function-by-function review would be unsafe.

The two informational objects were `public.platform_admin_actions` and `public.subscription_trial_expiry_notices`. The anonymous security-definer warnings include public booking/seat availability workflows and require a deliberate public-workflow review. The authenticated security-definer warnings include the identity snapshot and financial/operations procedures; many are intentionally callable by authenticated users but should be reviewed for pinned search paths, explicit grants, and least privilege.

A separate high-priority security remediation remains: the Google OAuth client secret was exposed in an earlier browser transcript and must be treated as compromised. The owner should rotate it in Google Cloud, then replace it in Supabase’s Google provider settings. The new secret must not be pasted into chat, committed to Git, or placed in frontend code.

## Owner-side authenticated validation required

Because credentials and MFA/consent steps must be entered by the owner directly, the final account-specific session test remains manual:

1. Open [the live Render URL](https://smartmanager-manus-render.onrender.com), allow the Free-tier cold start to finish, and perform a hard refresh. Do not send the password or any MFA code in chat.
2. Use the email/password form or Google button directly in the browser. The current code will persist the session through the official Supabase client and send the same current access token to tRPC, PostgREST, billing, guarded persistence, and realtime paths.
3. Interpret the resulting screen correctly. The authorized workspace confirms the full path. “Secure workspace setup required” means Supabase authentication succeeded but the profile/company/membership/workspace identity contract is incomplete. “Secure authentication is unavailable” means the identity RPC or configuration failed and needs a separate database/network investigation. An invalid-password or email-confirmation message is a Supabase credential-state response, not an application session race.
4. For Google, complete the account chooser and consent in the browser. If Supabase returns an OAuth error, record only the redacted `error`/`error_code` values and callback stage; never copy authorization codes, tokens, or client secrets.
5. Test a refresh, a second tab, logout/login, and a temporary network interruption. A transient interruption should not immediately display `SM-AUTH-401`; a genuinely revoked refresh token should return to the sign-in boundary with the redacted refresh-token diagnostic.

## Final status

The authentication/session architecture has been audited and the evidence-backed remediation is deployed. The original stale legacy-token collision and broad 401 escalation paths have been corrected without bypassing authorization. The remaining release gate is a genuine owner-entered authenticated browser session after the new deployment, followed by classification of the result as **authorized workspace**, **valid session with incomplete workspace identity**, or **true authentication/configuration failure**.

## References

[1]: https://supabase.com/docs/guides/auth/sessions "Supabase Auth Sessions"  
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"  
[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/commit/ff8469095f2c92cd9ea5ec8a3befd0087661a901 "SMART MANAGER authentication remediation commit ff84690"  
[4]: https://smartmanager-manus-render.onrender.com "SMART MANAGER Render production service"
