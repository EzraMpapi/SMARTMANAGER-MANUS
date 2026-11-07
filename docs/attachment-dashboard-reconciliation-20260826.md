# Complete Dashboard Attachment Reconciliation

**Date:** 2026-08-26
**Scope:** Full reconciliation of the supplied SMART MANAGER dashboard requirements and reference composition against the authenticated production application, its tenant-safe data access, saved preferences, and connected Supabase project.

## Implementation outcome

The default authenticated command center preserves the supplied reference composition: persistent application shell; module navigation; greeting, workspace date, and dashboard controls; KPI strip; revenue trend; sales mix; operational quick actions; product ranking; recorded cash movement; business-health signals; recent activity; and action center. It uses existing real ERP routes and sources rather than replacing the working architecture with a dashboard mockup.

The completion work adds persisted dashboard configuration to the existing `user_table_preferences` JSON record. An authenticated user can now select the saved performance period, select at least one KPI card, hide or show each dashboard panel, and reorder panels through keyboard-accessible controls. The command center consumes those saved settings directly, including its real-data period filter, KPI strip, responsive layout, and panel visibility.

## Requirement-to-component and data matrix

| Attachment requirement | Current implementation | Source, permission, and state behavior |
|---|---|---|
| Persistent shell, left navigation, top command bar, mobile navigation, profile controls | Existing `BusinessSphereDashboard.jsx` application shell and canonical enterprise navigation | Navigation remains role/subscription filtered; no new route is introduced. |
| Reference-aligned KPI strip | `ExecutiveCommandCenter.jsx` `MetricCard` components | Confirmed invoices, expenses, POS rows, and receivables only. Gross profit and bank balance are not inferred. |
| Revenue, cash movement, sales mix, products, health, activity, and attention panels | `ExecutiveCommandCenter.jsx` with Recharts and explicit source notes | Tenant-scoped company hooks provide rows. Each panel retains loading, empty, retry, insufficient-data, and source-label behavior. |
| Quick actions and drill-downs | Existing `onQuickAction` and `onNavigate` handoff | Buttons are only shown for allowed modules and write-capable roles; every action opens an existing ERP workflow. |
| Date range controls | Existing 30D, 3M, 6M, and 1Y real timestamp filter, now persisted | Undated rows are excluded from period figures. The selected range is stored per authenticated user and company. |
| Custom dashboard | `DashboardPreferencesDrawer.tsx`, `DashboardLayoutControls.tsx`, and existing preference context | Preferences are saved through authenticated tRPC to the company/user-scoped `user_table_preferences` record. No parallel local production preference model was created. |
| Panel visibility and order | New persisted `show*`, `widgetOrder`, and `kpiCardIds` preferences | The real command-center grid applies visibility and relative order. The drawer prevents an empty KPI strip. |
| Responsive desktop, tablet, and mobile behavior | Tailwind grid breakpoints in the command center and existing shell CSS | KPI cards progress from one to two to five columns; analytical panels use one column on compact screens and three columns on wide desktops; buttons retain keyboard and touch-friendly minimum dimensions. |
| Loading, error, empty, and permission states | Existing skeletons, retry banner, `EmptyState`, source labels, `allowedModules`, and `writeAccess` | Missing data is not replaced with demo numbers; unavailable panels explain the missing confirmed source. |
| Localization and Tanzania readiness | Existing TZS default, currency override, FX override, and `Africa/Dar_es_Salaam` preference | Date and money presentation remain controlled through the existing tenant-safe preference context. |
| Accessibility and performance | Semantic buttons, `aria-pressed`, labelled groups, visible focus rings, lightweight computed aggregates, and existing responsive containers | New ordering controls have explicit up/down labels and disabled boundary state. No duplicate fetch or new dashboard dependency was added. |

## Persisted customization contract

| Preference | Purpose | Validation boundary |
|---|---|---|
| `performanceWindow` | Saved 30D, 3M, 6M, or 1Y real-data window | Zod enum; default is 30D. |
| `kpiCardIds` | Visible KPI cards | Must contain one to five unique recognized KPI identifiers. |
| `widgetOrder` | Relative order of dashboard panels | Must contain unique recognized panel identifiers; legacy values normalize to the canonical order. |
| `showRevenueOverview`, `showSalesMix`, `showQuickActions`, `showTopProducts`, `showCashFlow`, `showBusinessHealth`, `showActionCenter` | Individual panel visibility | Boolean normalization preserves backwards compatibility for saved records. |

## Supabase inspection and migration decision

The connected project `rlhngsrihahhyxnjxrxm` is `ACTIVE_HEALTHY`. The migration ledger includes `user_table_preferences`, the ERP schema migrations, security hardening, and `add_missing_erp_tables_20260826`. The final post-rebase repository verifier reports **201 referenced tables**, **554 deployed tables**, no missing referenced tables, no tenant-column issues, and no critical-table contract issue.

The live relationship audit confirmed each command-center source table is company-bound through `company_id` foreign keys where applicable. The RLS audit showed authenticated policies for invoices, expenses, inventory, CRM, leave requests, POS transactions, work orders, and company/user-scoped preferences. The public-view audit returned no public views; the command center therefore continues to use its existing authenticated source-table path rather than creating a broad new view. Relevant company-context RPCs include `current_company_id`, `ensure_current_company`, and `switch_current_company`.

> **No SQL migration was applied.** The new configuration is intentionally stored in the existing JSON preference value whose table and RLS policies already exist. A new table, view, function, or policy would duplicate a tenant-safe capability and was not demonstrated as necessary by the live audit.

## Validation record

| Validation | Outcome |
|---|---|
| Focused preference, reference-dashboard, premium-header, and command-center contracts | Passed: 4 files and 13 tests. |
| Full serialized regression in one-thread pool | Passed: 249 files and 1,020 tests; 7 files and 15 tests skipped only because they are environment-gated. |
| TypeScript | Passed: `pnpm check`. |
| Repository-to-live schema verifier | Passed: 201 referenced tables, 554 deployed tables, no missing, tenant, or critical contract issue. |
| Supabase connector audit | Completed read-only for migrations, source relationships, RLS policies, views, and company/dashboard RPCs. |
| Production build | Vite transformed 2,702 modules, then the 4 GB sandbox terminated while rendering chunks with exit code 143. This is not reported as a successful build. |

The protected dashboard remains unavailable to an unauthenticated browser, as intended. An authorized disposable tenant session is still needed for a final live visual click-through; authentication, RLS, and tenant filtering were not bypassed merely to generate a screenshot.
