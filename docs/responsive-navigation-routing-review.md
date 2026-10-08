# Responsive Navigation and Route Verification

## Route check — 2026-08-27

The public Smart Manager homepage and the protected application entry point both returned HTTP 200 on the published Vercel origin and the managed preview origin. Direct visits to `/app` reached the intended authentication gateway when no authenticated session was available; no 404 response or browser console error was reproduced.

The deployed rewrite configuration retains the catch-all SPA fallback to `/index.html`, while the client router explicitly declares `/app` as a protected route. A source-level regression assertion in `server/dashboardShellInteraction.contract.test.ts` now verifies both conditions.

## Responsive shell check

The responsive shell refinement preserves a real desktop navigation state at the `1024px` breakpoint, prevents the docked rail from being hidden from assistive technology, and redistributes top-bar density: the guided-tour entry is available on laptop-and-larger layouts while the expanded search control starts at extra-large widths. The mobile drawer remains off-canvas below the desktop breakpoint.

At `1440×900` and `1024×768`, the managed preview's direct `/app` route consistently reached the intended responsive authentication gateway with no route-not-found state. The authentication surface retained readable content and operable controls at both viewports.

An authenticated visual session is still required to inspect the protected dashboard's desktop, tablet, and mobile shell without bypassing authentication. The validation deliberately did not submit any sign-in form or alter account or tenant data.

## Personal dashboard customization — 2026-08-27

The existing authenticated, user-and-company-scoped dashboard preferences model now supports personal presentation choices for expanded or compact navigation, priority or alphabetical ordering, visible authorized menu groups, and optional command-bar controls (search, tour trigger, connection indicator, and date). The sidebar is always derived from the existing role-, enabled-module-, and subscription-filtered `navigationGroups` first; a preference can only hide a permitted group from the user's presentation. It cannot add an unauthorized module or bypass a server-side access check.

The Home group remains mandatory as a safe return destination. Account, notification, alert, security, and mobile-menu controls are not user-hidden. The onboarding tour retains its body-level portal and is only optionally hidden as a trigger—its focus management and layering behavior are unchanged.

The post-change protected `/app` route rendered cleanly at `1440×900` and `390×844` in the managed preview. These checks covered the unauthenticated gateway; a user-authorized authenticated session is still necessary for a visual interaction walkthrough of the new drawer itself.

### Validation record

The focused preference and shell suites passed `12` assertions. The broader dashboard integration, command-strip, and existing executive-drawer suites passed `76` assertions. The complete repository test suite, TypeScript check, Supabase schema verification (201 referenced tables; no missing, tenant, or critical-contract issues), production build, and whitespace check completed successfully. The managed release checkpoint created the clean commit `e46d180`.
