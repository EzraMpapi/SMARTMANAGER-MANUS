# Smart Manager Dashboard Redesign Audit

## Live Reference Observation — 24 August 2026

The authenticated reference application at `https://menejajanja.vercel.app/app` currently presents the existing **workspace-resolution error state** rather than an authenticated dashboard. The page states that sign-in remains secure but workspace details could not be loaded, and offers secure recovery or sign-out. This is an existing auth/workspace data-resolution boundary, not a cue to change session or database behavior during the UI redesign.

## Preserved Architecture

The cloned codebase uses React 19, Vite, Wouter, a protected `/app` route, Supabase Auth/session persistence, same-origin API access, tRPC queries, and company-scoped Supabase table hooks. The current workspace shell is implemented in `client/src/BusinessSphereDashboard.jsx`; it owns role-aware navigation, mobile navigation, `navigator.onLine` offline protection, subscription gating, session recovery, and real-company data hooks for invoices, inventory, CRM, expenses, suppliers, POS, subscriptions, quotations, documents, HR, and work orders.

The redesign must keep the existing secure recovery state, authentication redirects, role gating, subscription checks, company scoping, and confirmed-write/offline behavior intact. The visual work should therefore target the shell, overview composition, reusable state containers, and dashboard-specific presentation layer rather than replacing the existing data or security contracts.

## Local Build Visual Check

The cloned development server was opened locally after the dashboard changes. The existing unauthenticated enterprise login screen rendered successfully with its responsive secure-workspace layout, input labels, focusable sign-in controls, language selector, tenant-aware messaging, and existing module context. No authentication flow was attempted and no production data was modified. Dashboard-specific visual verification remains gated on an approved authenticated workspace session; the live reference currently reports its separate workspace-resolution condition.

An additional direct Vite launch with blank public Supabase variables was also checked. The same existing secure login gateway rendered after bootstrap, so it did not expose an unauthenticated dashboard or create a new local data state. This confirms the redesign did not weaken the app’s authentication boundary, but it also means a rendered dashboard screenshot requires an approved session or the project’s established isolated authenticated test mode.
