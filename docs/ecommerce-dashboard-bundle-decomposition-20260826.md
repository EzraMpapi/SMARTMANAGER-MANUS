# Dashboard Bundle Decomposition Analysis

**Date:** 26 August 2026
**Author:** Manus AI
**Target:** Keep the dashboard route entry below 500 kB without misrepresenting the practical initial payload.

## Result in one sentence

The route entry is now **1.66 kB**, but the dashboard still immediately loads a **3,983.68 kB** `BusinessSphereDashboardCore` chunk; therefore the requested practical initial-dashboard target has **not** yet been achieved.

## Measured production assets

The measurements below come from a fresh direct Vite production build after the wrapper/core split. The normal `pnpm build` command remains credential-gated by the protected Supabase schema verifier; the direct Vite build was used only to measure already-local frontend assets and made no Supabase request.

| Emitted asset | Minified size | Delivery role |
|---|---:|---|
| `BusinessSphereDashboard-D69alrEn.js` | 1.66 kB | App route entry wrapper; lazy-loads the core |
| `BusinessSphereDashboardCore-RO3pFgwC.js` | 3,983.68 kB | Current dashboard core; fetched immediately by the wrapper |
| `dashboard-community-modules-Da-nTuP_.js` | 438.01 kB | Lazy Community Groups and Employee Portal factory module |
| `dashboard-additional-modules-QDYiPT5p.js` | 93.50 kB | Shared extracted dashboard factories and module dependencies |
| `dashboard-static-data-CabCJ56K.js` | 56.26 kB | Static/configuration data extracted from the core |

Vite still reports a chunk-size warning because the core remains above the configured warning threshold. The small wrapper is a valid structural entry split, but it is not a valid claim that the user-visible dashboard has a sub-500 kB initial JavaScript payload.

## Completed decomposition

The first extraction wave separated Community Groups and Employee Portal into an asynchronous factory boundary, moved static/configuration data into its own module, and split additional reusable factories. The wrapper preserves the existing `App.tsx` import contract while allowing the production route to remain lazy. Source-contract tests now read the moved core explicitly, and the protected Supabase schema verifier also reads the core so table discovery is not reduced to the wrapper.

This wave reduces cache coupling and enables feature-specific downloads, but the core shell still contains most ERP module implementations and the complete switchboard. The emitted asset names and sizes above are evidence of this distinction.

## Largest measured extraction candidates

A source-size profile identified the following top-level functions as the most promising next boundaries. Source size is a prioritization signal, not a direct minified-size forecast.

| Candidate | Approximate source bytes | Suggested boundary | Rationale |
|---|---:|---|---|
| `SettingsPage` | 106,344 | `SettingsWorkspace.jsx` | Large, route-specific, low value to load for ordinary operators |
| `SmartManager` shell | 87,311 | Keep a thin shell; move route registry and active workspace renderer | The shell owns global data hooks, so extraction must avoid duplicating session and tenant authority |
| `LegacyBankingMfiSeededModule` | 52,911 | Banking/MFI workspace chunk | Sector-specific and already route-gated |
| `Checkout` | 51,990 | POS checkout interaction chunk | Load only when POS checkout is opened; preserve inventory and transaction hooks as props |
| `Sales` | 45,558 | Sales workspace chunk | Route-specific, but requires shared document panels and query adapters |
| `SignupPage` | 44,991 | Auth/signup chunk | Should not be part of the authenticated ERP dashboard path |
| `ChatInterface` | 41,781 | AI/support conversation chunk | Feature-specific and can retain a narrow data contract |
| `WorkingTimetable` | 40,926 | HR timetable chunk | Role- and tab-specific; can be nested below the HR boundary |
| `DailyBriefing` | 40,913 | Executive/dashboard briefing chunk | Keep a small summary shell and lazy-load detail/export functionality |
| `PharmacyManagementModule` | 40,491 | Pharmacy workspace chunk | Already a natural feature boundary |
| `SchoolManagementModule` | 40,401 | School workspace chunk | Already a natural feature boundary |

## Recommended next waves

**Wave 2 should remove route-specific workspaces from the core switchboard.** Extract Settings, Sales, Finance, Inventory, Procurement, HR, POS/Checkout, and Reports behind `lazy()` imports. The shell should pass only confirmed query snapshots, tenant identity, authorization flags, navigation callbacks, and narrow mutation adapters. No extracted workspace should recreate tenant authority or invent fallback data.

**Wave 3 should split nested heavy tools.** Move PDF/export code, checkout/receipt panels, AI/chat, workflow studio, dashboards, and large sector modules behind tab-level boundaries. The existing TRA, School, Pharmacy, Microfinance, and Community boundaries demonstrate the intended pattern. Each module must have a loading fallback, preserve keyboard and responsive behavior, and remain covered by source-contract and runtime tests.

**Wave 4 should reduce shared-core coupling.** Move pure mapping/formatting utilities into small shared modules, replace broad dependency maps with explicit factories, and eliminate imports that force unrelated icons, chart libraries, or export libraries into the core. This should be done only after the route boundaries are stable, because premature utility splitting can increase import churn without reducing the initial graph.

## Acceptance criteria for the requested target

The target should be measured using the browser’s actual `/app` navigation graph, not only the filename of the route entry. A successful claim requires the dashboard route’s initial network payload to exclude the large core until the first workspace is needed, or for the first loaded workspace plus shell to be below 500 kB under the agreed measurement method. The report should include raw emitted sizes, gzip/brotli sizes if used, and a cold-load trace. Until that measurement exists, the correct status is **not yet below 500 kB in practical initial consumption**.

## References

1. [`/tmp/smartmanager-direct-vite-build.log`](../tmp/smartmanager-direct-vite-build.log), local build output captured during validation; the temporary path is retained as execution evidence where available.
2. [`BusinessSphereDashboard.jsx`](../client/src/BusinessSphereDashboard.jsx), thin production route wrapper.
3. [`BusinessSphereDashboardCore.jsx`](../client/src/BusinessSphereDashboardCore.jsx), current core implementation.
4. [`server/dashboardSourceSnapshot.ts`](../server/dashboardSourceSnapshot.ts), source-contract aggregation after the split.
5. [`ecommerce-skipped-tests-and-bundle-optimization-20260826.md`](./ecommerce-skipped-tests-and-bundle-optimization-20260826.md), prior baseline and first extraction-wave evidence.
