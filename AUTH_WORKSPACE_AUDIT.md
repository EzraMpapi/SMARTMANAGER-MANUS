# Authentication and Workspace Root-Cause Audit

## Verified live Supabase findings

The connected project is `rlhngsrihahhyxnjxrxm` in `ap-southeast-1` and reported `ACTIVE_HEALTHY` during this audit. The deployed `create_company_and_owner` RPC is a `SECURITY DEFINER` function that derives its user solely from `auth.uid()`, creates a company, and then performs only an `UPDATE profiles WHERE id = auth.uid()`.

That update is the workspace-creation root cause for a newly authenticated OAuth user with no existing business profile: it affects zero rows without raising an error, yet the function returns a company ID. The company can therefore exist while the profile remains absent/unassigned, so the next bootstrap cannot resolve the tenant and returns the user to onboarding rather than a dashboard. The same missing-profile gap exists in the deployed join RPC.

The `profiles` table uses `id` as a primary key and foreign key to `auth.users(id)`. Its required non-null fields other than the ID have defaults (`role` defaults to `staff`, `is_active` defaults to `true`, and timestamps default to `now()`), so the secure RPC can atomically insert or update a profile with the authenticated ID, verified JWT email, company ID, role, and full name. Existing RLS remains enabled: profiles are self-readable or company-readable, self-updatable, while company access is scoped to `current_company_id()`.

## Client-side findings

`App.tsx` now routes unauthenticated login, recovery, reset, and verification through `PublicAuthGateway`. Before the repair, its callback logic retained an OAuth fragment only for password-reset links. A Google callback arriving as `/app#access_token=...` therefore rendered the login screen without persisting the returned Supabase access/refresh session. The original full dashboard bootstrap has correct OAuth fragment capture, but it was bypassed by the smaller public-auth boundary.

The email signup creation path uses the atomic RPC but then delayed `onAuthenticated` with a 950 ms timer and inserted optional onboarding rows in a broad swallowed-error block. The repair will remove the navigation delay, preserve truthful optional-detail warnings, and rehydrate the newly created profile/company from confirmed server data before routing into the dashboard.

## Safety constraints retained

No policy will be relaxed, no user or company ID will be supplied as an authorization source, and no service key will be sent to the browser. The migration will change only the security-definer RPC behavior to close the missing-profile atomicity gap and will retain the existing `auth.uid()` and tenant-resolution model.

## Applied repair and production configuration observations

The `repair_workspace_profile_upsert` migration was applied successfully to the connected Supabase project. A readback of both RPC definitions confirmed that they now upsert `profiles` by the authenticated `auth.uid()`, return a company ID and name, and prevent joining a different company after assignment.

The production Google authorization endpoint returned HTTP 302 for the deployed `/app` callback, which confirms that Supabase accepted the provider authorization request and the production redirect URL. The public Auth settings endpoint reports `disable_signup: false` and `mailer_autoconfirm: false`. Therefore password signup still correctly requires a verification step whenever Supabase does not return a session; this is a provider configuration decision and cannot be bypassed safely by browser code. The application now presents that state explicitly rather than pretending the workspace RPC can run without an authenticated session.

After the repaired bundle compiled, browser checks confirmed that `/app?auth=signup` renders the progressive Account → Workspace → Modules flow and that `/app` renders the lightweight enterprise login with Google, Microsoft, and Apple controls. The initial automated capture caught the normal lazy-route loading fallback before the module had resolved; subsequent browser navigation confirmed the completed screens.
