# Smart Manager Profile Identity Center

## Release scope

This change replaces the internal dashboard’s basic account dropdown with a premium, responsive **Profile Identity Center** and adds a dedicated **My Profile** destination. The existing search, theme, notifications, workspace navigation, mobile navigation, customer portals, and sign-out boundary remain intact.

The implementation is deliberately vertical and evidence-driven. It provides a server-verified identity read, a self-only personal-field update contract, a secure avatar upload/preview/remove lifecycle, and navigation into existing security, notifications, support, and workspace settings surfaces. It does not manufacture workspace memberships, device sessions, activity events, branch assignments, or password controls that are not returned by the current backend.

## Delivered components

| Area | Delivered behavior | Persistence / authority |
|---|---|---|
| Account popover | Identity photo or initials, preferred/full name, role, active status, company, completion, quick actions, workspace/security limitations, sign-out | Profile identity query and verified session; no personal browser storage as source of truth |
| My Profile route | Responsive Overview, Personal, Work, Security, Preferences, and Activity sections | Dedicated shell-level `profile` route rendered by the existing dashboard |
| Personal details | Preferred/legal/first/middle/last name, phone, date of birth, gender, address, country, language, currency, timezone, date format, theme, notification preferences | `update_current_profile_identity(jsonb)` accepts only the allowlisted self-service fields |
| Work identity | Company, verified role/status, and HR-linked employee number/department/position/start/status when assigned | Verified profile, tenant-scoped company row, and `hr_employees` linkage; read-only to the user |
| Avatar lifecycle | PNG/JPEG/WebP selection, client-side centered-square preview transform, 2 MB limit, server magic-byte validation, secure storage upload, URL/key persistence, removal | `storagePut` followed by `set_current_profile_avatar(text,text)`; storage bytes are not stored in browser localStorage |
| Security | Last sign-in when returned by the auth provider, current-session verification, recovery handoff, existing security settings navigation | Existing authenticated auth flow; password values and device/session details are never exposed |
| Activity and notifications | Renders only server-returned records; empty and unavailable states are explicit | Existing workspace notification data where available; no synthetic activity |
| Workspace switching | Explicitly unavailable in this backend contract | No fake company selector or unverified membership switch |

## Backend contract

The source-ready migration is [`supabase/migrations/20260823_045_profile_identity_center.sql`](supabase/migrations/20260823_045_profile_identity_center.sql). It is additive and intentionally **not applied to a live Supabase project in this delivery**.

The migration adds profile-owned identity and preference columns with `ADD COLUMN IF NOT EXISTS`, indexes the authenticated profile path, and defines three security-definer functions. `get_current_profile_identity()` and `update_current_profile_identity(jsonb)` require `auth.uid()`, lock and update only the current profile, and reject unknown or protected keys. Protected authority fields include role, company, email, customer reference, active status, and avatar references. `set_current_profile_avatar(text,text)` is the only avatar-reference mutation and also requires an authenticated, company-assigned profile.

The server module [`server/profileIdentity.ts`](server/profileIdentity.ts) uses the established `resolveVerifiedProfile(req)` bearer/session and tenant verification boundary before every operation. The tRPC router exposes `get`, `update`, `uploadAvatar`, and `removeAvatar` under `profileIdentity`. Before the migration is available, extended reads and writes fail closed with a clear precondition error; the UI keeps fields disabled and states that the migration is pending rather than claiming a local-only save.

> **Controlled-live boundary:** applying the migration, validating the actual deployed OpenAPI schema, testing against a real tenant, and deploying provider/storage configuration require a separate controlled authorization and were not performed here.

## Frontend behavior

The standalone [`client/src/components/ProfileIdentityCenter.jsx`](client/src/components/ProfileIdentityCenter.jsx) owns the new profile surface. The dashboard imports it without moving existing module components into the identity center. The header uses the premium trigger, while existing portal consumers retain the legacy-compatible menu component.

The profile form sends the entire editable profile payload only after the server reports the extended contract as available. Avatar bytes are transformed in the browser solely to prepare a preview/upload payload; the final lifecycle is server validation, storage upload, database URL/key confirmation, and query refresh. A failed database confirmation is shown as an error and is never presented as a successful save.

Security actions route to the existing password-recovery and settings flows. Notification, activity, and workspace actions route to existing destinations or show truthful unavailable/empty states. No password, access token, or session/device secret is rendered.

## Authorization and privacy controls

Self-service updates are scoped to `auth.uid()` and cannot change role, company, email, customer reference, active status, or HR assignment. Work data is read from a profile-linked employee record scoped by both `profile_id` and `company_id`. Avatar storage keys include the verified company and profile IDs; the client cannot choose another user’s profile path. Server responses are returned only after a confirmed database operation.

## Validation evidence

| Check | Result |
|---|---:|
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm audit --prod --audit-level high` | Passed |
| `pnpm check` | Passed |
| Focused profile service and source-contract tests | Passed; 11 tests |
| Full Vitest suite | Passed; 189 files passed / 5 skipped; 766 tests passed / 13 skipped |
| Configured production build | Passed with the existing non-fatal large dashboard chunk warning |
| Profile browser suite | Passed; 2 tests covering popover, profile route, save confirmation, security/preferences, mobile layout, and sign-out |
| Complete isolated Playwright suite | Passed; 21 tests |
| Live migration/provider/deployment | Not performed by design |

The browser suite runs in both the configured profile path and the repository’s isolated e2e/demo build. In the demo build, profile fields remain disabled and the test verifies the truthful migration-pending state; in the configured preview, it verifies server-confirmed identity hydration and personal save behavior through intercepted tRPC responses.

## Follow-up after controlled migration

After a reviewed migration apply, run the repository schema verifier against the intended Supabase project, verify the actual `profiles`, `companies`, and `hr_employees` contracts, execute tenant-isolation CRUD tests with a staging user, and confirm the configured storage provider’s lifecycle and cache behavior. If branch or department membership becomes an approved canonical profile capability, add a separate authorized workspace-assignment workflow rather than expanding the self-service allowlist.
