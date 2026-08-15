# Post-Authentication Reliability Audit

## Initial production observation

On 2026-08-15, the deployed `/app` entry route rendered the Smart Manager sign-in screen without browser-console errors while no Supabase session was present. This confirms that the public entry boundary is currently reachable and does not, by itself, report a runtime error.

## Shared pipeline mapped so far

Password and OAuth callbacks both persist the Supabase session under `bs_access_token` and re-enter `/app`. `App.tsx` routes `/app` to the ERP dashboard whenever that token is present. The dashboard bootstrap then verifies the token through Supabase Auth, resolves the authenticated profile and company, and distinguishes a missing workspace from an unauthenticated session.

Workspace Settings is an in-dashboard state (`active === "settings"`) rather than a separate URL route. Its initial screen includes server-backed audit data and its save path performs both a direct company update and a protected workspace-branding mutation.

## Next investigation focus

The remaining audit will trace whether a shared tRPC unauthorized redirect, profile/company lookup failure, or a settings-only server dependency can incorrectly interrupt an otherwise valid Supabase session. No authentication, RLS, or signup behavior has been changed at this stage.

## Verified architecture findings

The client role catalog uses human-readable roles such as `Organization Owner` and `Super Administrator`, whereas tenant bootstrap and membership procedures persist compact roles such as `owner`, `admin`, `manager`, `staff`, and `viewer`. The client previously fell back to the first role in its catalog whenever a persisted role was unknown. That fallback is `Super Administrator`, which could present an unassigned or standard user with privileged navigation and then surface misleading authorization errors when Workspace Settings saves or other protected actions reached the server.

An aggregate database check confirmed four assigned `owner` profiles and five `staff` profiles without a workspace assignment. The latter condition is a valid authenticated-but-not-ready state, not an authentication failure. The application must route it to protected workspace setup, never clear the session or send the user back to sign-in.

The server-side branding authorization has the same vocabulary mismatch: it authorizes `Organization Owner` and `Super Administrator`, but not the actual persisted `owner` and `admin` values. This explains an otherwise valid workspace owner receiving a settings-save failure. The next implementation stage will normalize role vocabulary at the client boundary and authorize only the corresponding persisted administrator aliases on the server; it will not weaken RLS or broadening role privileges.

## Current browser smoke check

After the repairs, the active development preview rendered the expected Smart Manager sign-in boundary with no current browser-console output. Historical development HMR WebSocket messages remain in archived logs, but no new HMR or application runtime error was emitted during the current preview load.

## Tenant security verification

The deployed Supabase tables used in this repair retained RLS: `profiles`, `companies`, `company_memberships`, and `audit_log` all report row-level security enabled, with their existing policy coverage intact. The implementation added no permissive policy and did not alter any RLS rule.

## Automated validation complete

TypeScript validation completed without errors. The complete automated suite passed 113 tests with 7 existing gated skips, and the production bundle built successfully. A final browser-based authenticated handoff and Settings save remains pending an interactive session; no personal credentials have been requested or stored.

## Final live acceptance finding and repair

The final Google OAuth handoff reached a real authenticated user and initially showed the protected workspace-retry state. Safe browser diagnostics identified the shared root cause: the profile RLS policy called `current_company_id()` but the function lacked `EXECUTE` permission for the `authenticated` database role, producing `42501 permission denied for function current_company_id`.

Migration `20260815_004_grant_current_company_id_to_authenticated.sql` revokes the default public grant and grants execute only to `authenticated`. It does not grant anonymous access, weaken an RLS policy, or alter company membership data. After the deployed migration, the same authenticated profile query changed from HTTP 403 to HTTP 200 with one tenant-scoped profile row, and the live account reached the Smart Manager dashboard. The final automated suite passed 114 tests with 7 existing gated skips; TypeScript and the post-authentication production build passed.
