# Dashboard Build Memory and Isolated Browser Validation

**Date:** 2026-08-26

## Build-memory findings

The production client graph transforms **2,702 modules**. The peak RSS observed while Vite renders chunks is approximately **1.52–1.85 GiB**, depending on the chunking and minification experiment. A one-gigabyte V8 old-space ceiling fails deterministically during chunk rendering with a JavaScript heap exhaustion; a 2.3 GiB ceiling is sufficient only when the unrelated managed development watcher is not concurrently consuming sandbox memory.

| Build configuration | Peak Vite RSS | Result |
|---|---:|---|
| Existing chunk strategy, 2.3 GiB V8 cap, competing watcher present | 1.52 GiB | Sandbox SIGTERM while rendering chunks. |
| Extra vendor manual chunks, 2.3 GiB V8 cap | 1.85 GiB | Regression: higher peak RSS and sandbox SIGTERM. The experiment was reverted. |
| No JavaScript minification, 2.3 GiB V8 cap | 1.80 GiB | Sandbox SIGTERM; minification was not the root cause. |
| Existing chunk strategy, 1 GiB V8 cap | 1.25 GiB | Deterministic V8 heap exhaustion while rendering chunks. |
| Existing chunk strategy, 2.3 GiB V8 cap, clean worker | 1.62 GiB | **Passed:** client bundle produced in 11.01 seconds. |

The successful client build produced a 7.26 MB uncompressed `BusinessSphereDashboard` chunk (1.08 MB gzip), confirming that the broad dashboard shell remains the dominant output. The safe resolution is operational: run the build in a clean worker with no long-running type checker or unrelated dev server, and retain the existing source-level lazy workspace boundaries. The failed additional vendor chunk partition increased memory and was intentionally not retained.

## Isolated browser boundary

The browser verification uses the existing `/app?auth=signup` e2e-only path. It is compiled only in e2e mode, uses an empty public Supabase configuration, stores preference changes only in browser-local isolated preview storage, and the automated test blocks `/auth/v1/**`, `/rest/v1/**`, and `/api/trpc/**` routes before navigation. No production credentials, tenant records, or company data are supplied.

The local e2e development-server diagnostic established that rendering the oversized dashboard module during browser startup can contend with the sandbox. The completed visual suite therefore uses the already built application through a small SPA-aware static server; this preserves the real browser UI while avoiding a second high-memory source transform.

## Completed browser verification

The final browser suite ran against an already built application served by a local SPA-aware static server. It used a disposable `layout-e2e-company` and `layout-e2e-user` session; every Supabase REST, authentication, and dashboard-preference save response was intercepted in-browser, and no production tenant endpoint was contacted. The suite passed **six assertions across desktop and Pixel 5 projects** in 23.0 seconds.

The desktop capture shows the updated panel order with **Sales mix** above **Revenue overview**, while **Quick actions** is visibly disabled through its slate status indicator. The persisted panel list keeps every ordering control visible, including the disabled boundary control after moving Sales mix up. The mobile capture confirms that the preferences drawer remains readable and vertically scrollable, retaining the Manual Settings and AI Assistant tabs, TZS/FX settings, timezone control, and subsequent preference sections at a compact viewport.

## Final repository validation

The final post-rebase serialized Vitest run completed with **256 passing files and 1,036 passing tests**. Seven files and fifteen tests remain skipped only where their existing environment gate requires unavailable credentials or external runtime configuration. `pnpm check` also passed. The repository-to-live schema verifier completed with **201 referenced tables** and **554 deployed tables**, with no missing tables, tenant-table issues, or critical-table issues.

## Final build result

The clean-worker Vite build now completes after transforming **2,703 modules** in **10.64 seconds** using the 2.3 GiB V8 ceiling. Profiling showed that compressed-size reporting was a diagnostic-only post-emission cost at the point of the last sandbox termination. The Vite configuration now sets `reportCompressedSize: false`, preserving the emitted asset graph and existing Rollup chunk strategy while removing that non-runtime gzip reporting pass. The primary dashboard shell remains **7.28 MB** before transfer compression; its size warning is retained as an operational follow-up, not hidden.
