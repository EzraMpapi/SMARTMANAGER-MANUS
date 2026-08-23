# Centralized AuthProvider Implementation Report

**Date:** 23 August 2026
**Scope:** Incremental implementation of the centralized Supabase authentication provider and explicit auth state machine described in the authentication gap assessment.
**Deployment:** Not deployed. No Supabase schema, production data, feature flag, or remote repository was changed in this implementation pass.

## Implementation summary

SMART MANAGER now has a browser-level `AuthProvider` backed by the existing public Supabase configuration and the official `@supabase/supabase-js` dependency already present in the project. The provider creates one managed Supabase client, restores the current session, registers one `onAuthStateChange` listener, and exposes session, user, profile, company, workspace, membership, role, permissions, configuration, and auth operations through a single context.

The state machine uses explicit lifecycle states: `INITIALIZING`, `UNAUTHENTICATED`, `AUTHENTICATED`, `PROFILE_LOADING`, `WORKSPACE_LOADING`, `AUTHORIZED`, `UNAUTHORIZED`, and `AUTH_ERROR`. It retains a verified Supabase session when a profile or workspace assignment is incomplete, but clears tenant identity and permissions so an incomplete account cannot inherit stale workspace state.

## Changed files

| File | Change |
|---|---|
| `client/src/contexts/AuthContext.tsx` | New centralized provider, Supabase session lifecycle, identity loading, auth operations, sign-out, recovery, OAuth, confirmation resend, and passkey session adoption |
| `client/src/lib/authStateMachine.ts` | New pure reducer, state constants, identity contract, and loading predicate |
| `client/src/lib/supabaseAuthClient.ts` | New singleton browser client factory with managed Supabase session persistence |
| `client/src/lib/authSessionStorage.js` | Added one-time legacy session read and cleanup helpers |
| `client/src/lib/authSessionStorage.d.ts` | Added declarations for compatibility helpers |
| `client/src/App.tsx` | Added root `AuthProvider`, explicit protected-surface routing, fail-closed configuration state, and public auth route handling |
| `client/src/main.tsx` | Changed tRPC bearer forwarding and unauthorized recovery to read the provider-owned Supabase session |
| `client/src/_core/hooks/useAuth.ts` | Converted shared hook to provider-backed compatibility API |
| `client/src/components/PublicAuthGateway.jsx` | Delegated password, OAuth, recovery, reset, resend, and passkey session handling to the provider |
| `client/src/BusinessSphereDashboard.jsx` | Synchronized the preserved dashboard bootstrap and callbacks with provider-owned sessions |
| `server/authStateMachine.test.ts` | Added reducer transition coverage |
| `server/authExperience.test.ts` | Updated auth contracts for provider delegation |
| `server/appBootstrap.test.ts` | Updated root bootstrap contracts for provider routing |
| `server/dashboard.integration.test.ts` | Updated integration contracts for provider session and OAuth behavior |
| `server/e2eUserJourney.test.ts` | Updated journey contract for provider wrapping |
| `server/passkeyLoginUi.test.ts` | Updated passkey contract for provider adoption |
| `server/publicAuthGatewayLexical.test.ts` | Updated gateway lexical contract |
| `server/publicPasskeyEntry.test.ts` | Updated public passkey contract |

## Compatibility and safety decisions

The existing dashboard was not rewritten. Its internal workspace bootstrap remains as a compatibility layer, but it now accepts the provider-owned session when the dashboard is mounted and adopts newly created or passkey sessions into the provider. Existing tenant-scoped Supabase reads and server-side verified-profile checks remain authoritative for business operations.

A one-time compatibility bridge imports legacy `bs_access_token` and `bs_refresh_token` values into the Supabase-managed client session, then removes those legacy keys. New tRPC requests read the current Supabase client session instead of treating those legacy keys as the authentication authority. The existing Manus cookie fallback remains available for the platform’s established session path.

If public Supabase configuration is unavailable, the root protected surface now fails closed with an authentication-unavailable state rather than presenting the application as a simulated authenticated workspace. The reserved `MODE=e2e` signup route remains available for the existing isolated UI tests only.

## Validation

| Check | Result |
|---|---|
| TypeScript | **PASS** |
| `git diff --check` | **PASS** |
| Focused auth/provider suite | **PASS** — 9 files, 91 tests |
| Full configured Vitest suite | **PASS** — 202 files, 830 tests; 5 skipped files and 13 skipped tests remain intentionally skipped |
| Vite production build | **PASS** — completed successfully after provider integration |
| Live Supabase writes | **Not run** |
| Production deployment | **Not run** |
| GitHub push | **Not run** |

## Remaining validation boundary

The implementation has not yet been proven through a live authenticated browser matrix. The next safe step is a preview deployment with two disposable identities and controlled tenant fixtures. That matrix should verify password sign-in, OAuth callback, recovery/reset, refresh, logout, direct protected URLs, profile-without-workspace handling, permission denial, two-tenant switching/isolation, and the existing POS/workforce adapters. Production activation should wait until those checks pass and redirect/environment configuration is verified.
