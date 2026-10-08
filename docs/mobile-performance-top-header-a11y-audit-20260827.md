# Mobile Performance and Top-Header Accessibility Audit

**Date:** 27 August 2026
**Scope:** Protected SMART MANAGER dashboard production artifact at a 375 × 812 mobile viewport, plus desktop/mobile header accessibility verification.

## Test boundary

The audit used the compiled `e2e` artifact and the repository's isolated dashboard session. Browser requests were restricted to `e2e.supabase.invalid` and local `/api/trpc/`; no production tenant, authenticated production browser session, production row, or data write was used.

The timing values are **local isolated-artifact measurements**, not field telemetry or a simulated cellular-network score. They are suitable for detecting large local regressions and for repeatable CI comparison, but real-device and 4G/3G measurements are still required before treating them as customer-experience SLOs.

## Mobile loading measurement

| Metric | Measured value | Interpretation |
|---|---:|---|
| Time to first byte | 8 ms | Local test-server response time; not comparable to public-network latency. |
| DOM content loaded | 233 ms | Initial document parsing completed quickly in the isolated artifact. |
| Load event | 236 ms | Static resource loading reached the browser load event promptly. |
| Dashboard-ready heading | 3,010 ms | The protected dashboard greeting became visible after isolated session/bootstrap work. |
| Resource entries | 47 | Measured browser resource entries in the isolated page load. |
| Transfer bytes | 2,319,595 bytes | Total browser-reported transferred bytes for the run. |

The automated regression envelope requires the dashboard-ready state to occur below 12 seconds. The 3.01-second local measurement passed that guard. The production build also completed successfully, although the existing `BusinessSphereDashboard` chunk remains larger than the configured 2.5MB warning threshold. This warning predates this audit and remains the principal performance follow-up for real-network optimisation.

## Header accessibility review

| Control or behavior | Verified outcome |
|---|---|
| Visible top-header controls | Each visible control had an accessible name, was enabled, and accepted keyboard focus. |
| Mobile touch targets | Every visible retained header action measured at least 40 × 40px after the menu-control repair. |
| Notification Center | Its trigger exposes `aria-expanded` and `aria-controls`; it opens and closes with **Escape**. |
| Create action | It now has the accessible name `Open create menu`, exposes `aria-expanded` and a controlled-menu relation, closes with **Escape**, and restores focus to its trigger. |
| Command Palette | `Control+K` opens the labelled search dialog, focuses its input, filters results, and closes with **Escape**. |
| Responsive containment | The header did not overlap dashboard content or horizontally overflow at 320px, 360px, 375px, 390px, or 412px. |

## Demonstrated fixes

The audit found and corrected three concrete issues. The mobile menu icon's measured 36px target was raised to 40px. The Create control received an explicit accessible name and `aria-controls` relationship to its menu. The Create menu now closes on **Escape** and returns focus to the original trigger. These changes preserve the existing actions, quick-create authorization, routes, protected surface, tenant inputs, and backdrop-close behavior.

## Validation summary

| Check | Result |
|---|---|
| Combined desktop/mobile header interaction and a11y suite | 9 passed; 5 expected project skips |
| Focused mobile performance audit | 1 passed |
| TypeScript | Passed |
| Production build | Passed with the pre-existing large dashboard-chunk warning |
| Read-only schema build gate | 201 referenced tables within 556 deployed paths; no missing, tenant, or critical issue |

No Supabase schema, RLS/RBAC policy, authentication flow, production data, or dashboard data model was changed.
