# Smart Manager — Resume Where You Left Off

## Implemented behavior

Smart Manager now keeps a tenant-scoped last working location for an authenticated user. The location record is keyed by the authenticated user ID and company ID and stores only the `/app` route, sanitized URL state, active module, and timestamp. The current module is also written to the URL as the `module` query parameter, so browser refresh and browser history remain addressable.

On startup, the dashboard waits for the authenticated session, verified profile, assigned company, role permissions, and subscription entitlement state before restoring the previous location. Explicit URL state takes priority over the close-and-reopen fallback. A stored location is accepted only when its user ID and company ID match the verified session and its module is allowed by the current role, enabled-module configuration, and subscription boundary. Invalid or unauthorized locations safely fall back to Dashboard.

Normal logout clears the active user/company resume record before removing local authentication state. This prevents the next browser user from inheriting a previous tenant’s working location.

## Persistence boundaries

The implementation does not store passwords, access tokens, refresh tokens, secrets, payment credentials, card fields, authorization values, or OAuth fragments in the resume record. The `resumeSession` utility also exposes a safe-draft boundary that strips sensitive field names. Existing onboarding recovery continues to use its session-scoped, non-secret draft contract and explicitly requires the password to be re-entered.

Business records remain server-authoritative. The resume record contains navigation context only; customers, products, sales, purchases, invoices, payments, employees, expenses, inventory transactions, settings, and other business data continue to load from the authenticated Supabase-backed application path.

## Network behavior

The existing dashboard network boundary preserves the currently loaded workspace during temporary connection loss, pauses permanent writes until confirmation is available, and avoids presenting a failed local write as saved. Existing retryable workspace recovery remains distinct from terminal session expiry, and terminal failures clear authentication only after the session is genuinely invalid.

## Verification

The focused resume tests cover tenant-scoped read/write behavior, invalid-route rejection, unauthorized-module rejection, cross-user and cross-company rejection, removal of credential-bearing query/hash state, URL construction, and safe-draft filtering. A source-level contract covers the central dashboard restore gate, entitlement validation, module catalogue coverage, and logout cleanup.

The final local quality gate completed with 220 test files passing and 6 skipped, for 895 passing tests and 14 skipped. TypeScript validation and the production build completed successfully. The Supabase schema guard reported 201 referenced tables, 536 deployed tables, no missing tables, no tenant-table issues, and no critical-table issues.

## Scope note

The application contains many module-specific in-memory controls because the dashboard is a large single-file shell. The central resume contract now preserves the active module and any URL-safe query/hash state already present. A future module-by-module enhancement can migrate individual filters, tabs, pagination, and sort controls to the same URL or tenant-scoped preference boundary without weakening the current security model.
