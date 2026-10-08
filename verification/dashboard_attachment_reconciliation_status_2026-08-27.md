# Dashboard Reference Reconciliation Status

**Date:** 2026-08-27
**Scope:** The executive dashboard reference, the current authenticated shell, the navigation model, dashboard preferences, tenant-scoped sources, and the connected Supabase project.

## Confirmed implementation status

The current workspace preserves the reference dashboard's executive-command composition while using the existing ERP architecture rather than a static mockup. The shell now uses a **docked desktop navigation rail** that reserves workspace width, preventing content from rendering underneath navigation. On compact screens, the same navigation remains a deliberate overlay drawer with an explicit close affordance and backdrop.

The navigation model is now rendered from the existing role- and subscription-filtered enterprise navigation groups. The visible module set remains derived from the server-confirmed role, module enablement, and subscription checks; no client-side navigation change grants additional module access. Groups cover Home, Sales & CRM, Operations, Finance, People, Specialized, Analytics, and Administration, and are keyboard-accessible expandable sections.

The top command bar retains workspace context, live/offline state, entitlement status, universal search, creation actions, alerts, presence, appearance preferences, and profile controls. The onboarding tour trigger is visible on desktop and its overlay is rendered via a `document.body` portal. This removes the prior risk that a fixed tour dialog could be trapped under a sticky, blurred top bar or other shell stacking context.

## Requirement-to-source matrix

| Reference capability | Current source and behavior | Trust and access boundary |
|---|---|---|
| Persistent shell and left navigation | `BusinessSphereDashboard.jsx` with docked desktop rail and mobile drawer | Navigation is filtered by `visibleModules`, role grants, and subscription access. |
| Executive overview and KPI strip | Existing command-center components and saved dashboard preferences | Figures are built from confirmed tenant-scoped invoices, expenses, POS, CRM, and inventory records only. |
| Drill-downs and quick actions | Existing `go` and `goWithIntent` callbacks | Buttons route only to existing authorized workflows; no disconnected placeholders are introduced. |
| Grouped module discovery | `enterpriseNavigation.js` groups rendered by the dashboard shell | Group membership is presentation-only; the server-confirmed visible set remains authoritative. |
| Responsive desktop, tablet, and mobile layout | Tailwind breakpoint classes in the shell and responsive command centers | Desktop rail reserves width; mobile uses an explicit overlay; standard controls keep accessible labels and focus rings. |
| Tour overlay and guidance | `OnboardingTour` with `createPortal(..., document.body)` | Dialog focus management, Escape dismissal, and per-user/company completion state remain in place. |
| Saved dashboard preferences | Existing company/user-scoped preference storage | Preferences cannot be used to widen tenant, role, or module access. |
| Loading, error, empty, and offline states | Existing component-level skeleton, retry, empty, and offline patterns | Unavailable data is disclosed rather than replaced with invented metrics. |

## Live schema decision

The release schema gate completed against the active connected Supabase project at **2026-08-27T03:56:24.829Z**. It compared **201 referenced tables** against **554 deployed tables** and reported no missing tables, tenant-column issues, or critical contract drift. The dashboard changes use the existing `user_table_preferences` record and existing authenticated data paths, so no new table, view, function, policy, or DDL migration was required.

## Verification record

| Check | Result |
|---|---|
| Dashboard shell contract tests | 79 focused assertions passed. |
| Full regression suite | 263 test files and 1,076 tests passed; 7 files and 15 tests remained environment-gated/skipped. |
| TypeScript | Passed with no errors. |
| Production build | Passed; the bundle-size warning for the large dashboard chunk remains a performance follow-up, not a build failure. |
| Live production route | The ready Vercel production deployment returned HTTP 200 for `https://menejajanja.vercel.app/app`. |
| Supabase schema gate | Passed with no missing referenced objects or critical table drift. |

## Outstanding non-product constraints

The private GitHub repository cannot use required branch protection checks on its current plan without either changing repository visibility or upgrading GitHub. Recent hosted GitHub Actions jobs also end before runner execution, so no hosted CI claim is made here; the complete local validation record above remains the release evidence. These platform constraints do not alter the production application, database schema, tenant isolation, or dashboard authorization model.
