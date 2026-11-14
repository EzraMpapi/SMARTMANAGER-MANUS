# Reference-aligned SMART MANAGER Dashboard Implementation Report

**Date:** 2026-08-26
**Scope:** Production-safe reconstruction of the default authenticated SMART MANAGER command center against the supplied dashboard reference and requirements attachment.

## Delivered result

The default broad-role dashboard now follows the supplied command-center composition: a compact workspace greeting and date control, a five-card KPI strip, revenue trend, sales mix, action grid, top-products ranking, cash-movement view, explainable health panel, recent activity, and exception action center. The change keeps the existing persistent ERP shell, left navigation, top bar, role-specific routes, profile controls, mobile navigation, theme system, and existing dashboard preferences drawer.

This is a functional reconstruction rather than a static mockup. All visible business values derive from the existing tenant-scoped hook data, and every action opens an existing role-authorized route or existing quick-action workflow. Values which require data that is not reliably available—such as a bank cash balance, COGS-based gross profit, supplier payables, and sales-target achievement—are not represented as fabricated cards.

## Files inspected

| File | Purpose in the audit |
|---|---|
| `client/src/BusinessSphereDashboard.jsx` | Authenticated application shell, tenant-scoped data hooks, row mappers, role routing, navigation, quick actions, and preferences integration. |
| `client/src/components/ExecutiveCommandCenter.jsx` | Default command center rebuilt to match the reference composition. |
| `client/src/components/EnterpriseDashboardOverview.jsx` | Existing executive-only dashboard retained as a separate role view with the same preferences drawer. |
| `client/src/contexts/DashboardPreferencesContext.tsx` | Tenant-safe authenticated dashboard preferences and TZS/Dar es Salaam formatting. |
| `client/src/dashboardContracts.js` | Canonical truthfulness, source-note, metric, action, and trend helpers. |
| `client/src/navigation/enterpriseNavigation.js` | Canonical role-filtered module-navigation source. |
| `server/verifySupabaseSchema.mjs` | Repository-to-live table and tenant-column schema contract verifier. |

## Files changed or created

| File | Change |
|---|---|
| `client/src/components/ExecutiveCommandCenter.jsx` | Rebuilt the default command-center layout using the supplied visual hierarchy and existing real data sources. |
| `client/src/BusinessSphereDashboard.jsx` | Passes existing activity, quick-action, and RBAC context into the rebuilt default command center. |
| `server/referenceDashboard.contract.test.ts` | New source contract for reference composition, tenant source ownership, permission handoff, and real route wiring. |
| `server/executiveCommandCenter.test.ts` | Updates the command-center quality contract for the intentionally compact, reference-aligned KPI set and explicit calculation boundaries. |
| `server/dashboardPremiumHeader.contract.test.ts` | Aligns period-window contract with the intentional current-month default. |
| `docs/reference-dashboard-schema-audit-20260826.md` | Read-only frontend-to-Supabase audit record. |
| `todo.md` | Tracks this reference-aligned reconstruction and the outstanding connector review. |

## Widget and data-source matrix

| Reference widget | Real source | Tenant/RBAC behavior | Empty or unavailable behavior |
|---|---|---|---|
| Total revenue | `sales_invoices` with nested `sales_invoice_items` | Loaded through authenticated `useCompanyTable`; dashboard visibility follows current role | States that no confirmed invoice records exist. |
| Total expenses | `finance_expenses` | Authenticated `useCompanyTable`; Finance route is role filtered | States that no confirmed expense records exist. |
| Net operating result | Confirmed invoice collections less recorded expenses | Deliberately not labelled as gross profit | Explains that COGS is not inferred. |
| Orders and sales | `sales_invoices` plus `pos_transactions` | Existing Sales/POS row hooks and authorized Sales route | States that no confirmed order records exist. |
| Outstanding invoices | Unpaid `sales_invoices` | Existing Finance route and role filtering | Shows no overdue invoice indication or no invoice records. |
| Revenue overview | Timestamped confirmed invoice collections and expenses | Selected 30D, 3M, 6M, or 1Y period excludes rows without a confirmed date | Explains that no trend is invented. |
| Sales mix | Confirmed invoice collection grouped by invoice status | Existing Sales route | Clearly reports the absence of confirmed mix data. |
| Top products | Confirmed nested invoice line items | Existing Inventory route | Requires invoice lines with quantity and rate; no ranking is invented. |
| Cash-flow overview | Confirmed invoice collections and recorded expenses | Existing Finance route | Explicitly says this is not a bank-balance statement. |
| Business health | Explainable financial, receivables, inventory, and operation conditions | No arbitrary composite score | Each row identifies insufficient data separately. |
| Recent activity | Existing merged confirmed activity passed by the parent | Existing Reports route | Does not manufacture local activity events. |
| Action center | Overdue invoices, low stock, and pending leave rows | Existing Finance, Inventory, and HR routes | States that no confirmed urgent items are present. |
| Quick actions | Existing `onQuickAction` and `onNavigate` handlers | `allowedModules` and `writeAccess` limit visibility | No unavailable action is rendered. |

## Database comparison and safety decision

The repository-to-live schema verifier passed on 2026-08-26 with **201 referenced tables**, **536 deployed tables**, **zero missing tables**, **zero tenant-column issues**, and **zero critical contract issues**. Read-only OpenAPI and zero-row endpoint checks confirmed the live table endpoints used by the default dashboard, including `company_id` fields. The live OpenAPI surface exposes 198 RPC routes, including company-context routines such as `current_company_id`, `ensure_current_company`, and `switch_current_company`.

No migration, table, view, RPC, index, policy change, seed record, or production-data write was needed or applied. The existing dashboard calculations use the role-scoped browser data path with authenticated Supabase headers; no browser service-role credential or RLS bypass was added.

## Permissions and responsive behavior

The parent dashboard continues to apply `currentRole.allowedModules` and `currentRole.writeAccess`. The default command center receives those constraints and only renders write-oriented quick actions when write access and the target module are available. More limited roles continue to receive their existing focused or minimal dashboards rather than company-wide financial exposure.

The KPI strip uses one column on compact screens, two columns from the small breakpoint, and five columns only on extra-large screens. Major panels collapse from three columns to a vertical sequence on smaller devices, while buttons retain keyboard focus treatment and touch-sized minimum heights. The selected-period controls use native buttons, a labelled group, and `aria-pressed` state; all cards and routes remain semantic interactive controls.

## Validation

| Validation | Result |
|---|---|
| Focused command-center, premium-header, reference, and quality contracts | Passed: 5 files, 21 tests. |
| TypeScript | Passed: `pnpm check`. |
| Full serialized regression | Passed: 246 files, 1,011 tests; 7 files / 15 tests skipped because they are intentionally environment-gated. |
| Repository-to-live schema verification | Passed with no missing or tenant/critical contract issue. |
| Browser protected-shell check | Correctly blocked unauthenticated access and displayed no tenant data. |
| Production build | Vite transformed 2,701 modules, then the 4 GB sandbox terminated chunk rendering with exit code 143. This is not claimed as a successful production build. |

## Remaining external blockers

The Supabase connector service returned HTTP 403 for configuration lookup, tool listing, and project discovery during this task. The fallback OpenAPI contract and repository schema verifier completed successfully, but the live connector could not enumerate the current policy catalog, full view definitions, or routine definitions. Consequently, no RLS, view, or RPC mutation was attempted. This preserves security and production data while leaving one explicit read-only verification step to repeat once connector access recovers.

An authorized disposable browser session was also unavailable. The protected route correctly withheld the dashboard, so live visual click-through of the authenticated shell remains a safe follow-up rather than an auth bypass.
