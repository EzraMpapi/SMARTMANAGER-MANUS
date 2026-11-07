# Notification Center and Command Palette Production-Build Audit

**Date:** 27 August 2026

## Scope and isolation

This audit exercised the protected dashboard through the compiled isolated browser artifact. The test session routes Supabase calls only to `e2e.supabase.invalid` and application calls only to local `/api/trpc/`; no production tenant, production record, credential, or browser-authenticated session was used.

## Verified interactions

| Surface | Desktop and mobile verification |
|---|---|
| Notification Center | The labelled trigger is visible; it opens the notification panel and exposes the Daily Brief action. The panel closes with both **Escape** and an outside click. |
| Notification accessibility | The trigger now reflects open state with `aria-expanded` and identifies its controlled notification region with `aria-controls`. |
| Command Palette | `Control+K` opens the labelled dialog, transfers focus to the search input, filters visible results for `sales`, and closes with **Escape**. |
| Access boundary | The palette continues to receive the already visible module list, so it does not introduce a new route or data-access path. |
| Network boundary | Every observed request was limited to `e2e.supabase.invalid` or local `/api/trpc/`. |

## Finding and repair

The audit found that the Command Palette already handled **Escape**, while the Notification Center did not. The Notification Center now adds an event listener only while its panel is open, closes on **Escape**, and removes that listener on close or unmount. Its existing alert derivation, alert-click navigation callback, outside-click close behavior, Daily Brief action, tenant-scoped inputs, and visual data remain unchanged.

## Validation record

| Check | Result |
|---|---|
| Isolated production-build dashboard browser suite | 5 assertions passed across desktop/mobile; 3 project-guard skips remained expected. |
| Focused command-strip contract | 6 assertions passed. |
| Full regression suite | 269 test files and 1,104 assertions passed; 7 files and 15 assertions were skipped by existing configuration. |
| TypeScript | `pnpm exec tsc --noEmit` passed. |
| Production build | 2,704 modules transformed and server bundles were emitted successfully with a 4GB Node heap. |
| Schema build gate | 201 referenced tables were present within 556 deployed tables; no missing, tenant, or critical-table issue was reported. |

The existing large `BusinessSphereDashboard` bundle warning remains non-blocking and was not caused by this narrow interaction/accessibility repair.
