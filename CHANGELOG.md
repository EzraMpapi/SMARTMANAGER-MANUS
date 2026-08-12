# BusinessSphere ERP Change Log

## Delivery scope

The uploaded single-file BusinessSphere dashboard has been retained as `client/src/BusinessSphereDashboard.jsx` and exposed at `/app`. No component extraction, state-management replacement, visual redesign of the dashboard, or application-architecture refactor was introduced. The dashboard source required targeted repairs because the uploaded file contained parser errors, truncated markup, duplicate declarations, and a missing icon import that prevented the browser from loading it.

## Modified files

| File | Change | Purpose |
|---|---|---|
| `client/src/BusinessSphereDashboard.jsx` | Added the preserved dashboard as a single source file; made only targeted build/runtime corrections; replaced hardcoded Supabase values with Vite environment variables; surfaced Google, Microsoft/Azure, and Apple OAuth controls; adapted module-setting reads and writes to the connected generic `company_modules` schema; normalized the Daily Briefing employee source; imported the existing project shortcut icon; added a directly tested Daily Briefing fetch-state helper with live-data loading, retry, error, and demo-fallback handling; and adapted CRM/inventory mappers to the deployed generic schema aliases. | Enables the supplied dashboard to parse, build, render, and use the connected project configuration and live sample rows. |
| `client/src/App.tsx` | Registered the dashboard at `/app`. | Keeps the public home page and the ERP application as separate entry routes. |
| `client/src/pages/Home.tsx` | Replaced the template placeholder with the BusinessSphere marketing landing page and a factual product-proof section. | Provides the hero, capability highlights, verifiable implementation signals, and clear app-launch calls to action. |
| `package.json` and `pnpm-lock.yaml` | Added `xlsx`. | Resolves the existing spreadsheet export import used by the uploaded dashboard. |
| `server/supabase.config.test.ts` | Added configured Supabase REST/auth setting validation. | Verifies the managed project URL and publishable browser key are accepted. |
| `server/dashboard.integration.test.ts` | Added route, managed-config, authentication-routing, generic module-schema, executable baseline-entitlement mapping, CRM/inventory alias-mapper, Daily Briefing data-shape and direct fetch-state-helper, plus project-icon import tests. | Confirms the launch path, lack of the originally hardcoded Supabase URL, compatible module-setting persistence path, expected treatment of the approved generic baseline rows, live chart-row mapping, demo-entry boundaries, and Daily Briefing loading/error behavior. |
| `todo.md` | Recorded implementation, validation, and remaining configuration work. | Keeps project work auditable. |
| `CHANGELOG.md` | Created this delivery record. | Documents scope, fixes, validation, and remaining requirements. |

## Targeted fixes applied to the preserved dashboard

| Build or runtime blocker | Minimal repair |
|---|---|
| Broken JSX closures in the Sales, Receivables, Finance, HR, POS, VICOBA/SACCOS, School, Hotel, Fleet, Notifications, scheduled-report, microfinance, and balance/cash-flow sections. | Restored only the missing or excess JSX delimiters, fragments, table closures, and wrapper closures needed for the existing markup to parse. |
| Truncated attendance, report-scheduling, fleet-maintenance, reconciliation, CSV-export, and comment fragments. | Restored the smallest valid empty-state markup, newline escape, function closure, comment prefix, or removed only the non-renderable truncated fragment. |
| Duplicate `CommandPalette`, `BankingMFIModule`, `LOAN_TYPES`, and dark-mode declarations. | Retained the active implementations; renamed unused legacy duplicates and removed the redundant dark-mode state declaration. |
| `UserCircle is not defined` browser error. | Added the missing `UserCircle` import from the existing icon package. |
| Existing dashboard import of `xlsx` could not be resolved. | Added the missing `xlsx` package without altering the export implementation. |
| Dashboard embedded rejected, hardcoded Supabase credentials. | Replaced them with `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`. No Supabase secret key is present in browser code. |

## Exact parser, build, and runtime error ledger

| Exact observed failure | Location or feature | Minimal repair applied | Verification |
|---|---|---|---|
| `Unexpected token` / `Expected "}" but found ";"` | Receivables, cash-flow, VICOBA/SACCOS, school, register-history, and other affected component endings | Restored only the corresponding missing wrapper closure, fragment, or expression delimiter. | Successive parser/build passes advanced beyond each location. |
| `Expected corresponding JSX closing tag` / `Unterminated JSX contents` | Sales/Receivables summaries, attendance, roster, notifications, scheduled reports, microfinance, and balance sheet views | Corrected a single excess closing wrapper, completed an existing map/table return, or added the missing fragment/table closure. | `pnpm build` completed successfully. |
| `Expected "}" but found ")"` | Hotel header SVG background style | Removed the stray closing delimiter in the existing inline background value. | Parser advanced and production build passed. |
| `Expected ">" but found "tab === \"analytics\""` | Fleet maintenance tab | Removed the single truncated non-renderable card fragment immediately before the analytics expression. | Parser advanced and fleet analytics bundled. |
| `The symbol "CommandPalette" has already been declared`; duplicate banking and theme symbols | Dashboard module definitions | Retained the active implementations, renamed unused legacy declarations, and removed one redundant dark-mode state declaration. | Symbol-resolution build errors cleared. |
| `Failed to resolve import "xlsx"` | Existing spreadsheet export import | Added the required `xlsx` dependency only. | Rollup resolved the dashboard’s existing export feature. |
| `Uncaught ReferenceError: UserCircle is not defined` | Browser dashboard evaluation | Added `UserCircle` to the existing icon import list. | `/app` rendered its existing authentication screen in browser verification. |
| `The character ">" is not valid inside a JSX element` | PAR threshold label | Escaped the displayed comparison as `&gt;` without changing the label’s meaning. | Final build completed without this warning. |
| `$s.filter is not a function` | Daily Briefing, immediately after choosing **Preview demo** | The dashboard supplied the shared `useCompanyTable` employee result object to a briefing component that expected an array. The component now safely uses `employees.rows` when present, accepts a direct array for standalone callers, and otherwise falls back to an empty array. | Demo entry now renders both the Daily Briefing and dashboard workspace without the error. |
| `FolderKanban is not defined` | Dashboard project quick action and module health strip, exposed after the prior crash was removed | Added the missing `FolderKanban` import from the existing `lucide-react` package. | Demo entry and the rendered project shortcut now complete without a reference error. |

## Preservation evidence and scope qualification

The uploaded ERP continues to exist as one `BusinessSphereDashboard.jsx` file and the original module composition, feature inventory, business-flow functions, colors, and dashboard route were not refactored or redesigned. The required repairs were direct compatibility corrections inside that same source file because the uploaded artifact could not otherwise parse or render.

The landing-page-to-dashboard transition and the dashboard authentication shell were visually checked. The validation does **not** claim exhaustive post-login interaction equivalence for every module: completing that proof would require an authenticated test account plus real tenant records across the connected project’s intended ERP tables. The preserved design was not intentionally changed; the implemented evidence is single-file preservation, successful bundle generation, successful dashboard-shell rendering, and targeted automated configuration/route tests.

## Live Supabase and authentication status

The dashboard’s hand-rolled Supabase client now receives its URL and browser-safe publishable key through managed Vite variables. The configured Auth settings endpoint accepted the project configuration during automated testing, and the connected Supabase project was inspected for its company/profile schema and publishable-key availability. The latest settings check shows Google enabled, signup allowed, email confirmation required, and phone OTP disabled. Azure and Apple provider activation remain a user-managed Supabase Dashboard task.

The existing dashboard contains native email/password sign-up, sign-in, sign-out, session-token storage, reload-session checking, and OAuth redirect construction for Google, Microsoft/Azure, and Apple. The login screen now exposes provider-specific controls that call the existing helper with `google`, `azure`, and `apple`; the helper builds the Supabase `/auth/v1/authorize` URL. The project’s Auth settings expose Google, Azure, and Apple provider fields, but the management connection does not expose a reliable enabled/disabled-provider result. Consequently, the controls are correctly wired; actual provider login completion still requires the corresponding OAuth credentials, allowed redirect URLs, and providers to be enabled in the Supabase Dashboard.

> **Important:** Live table reads and writes depend on the matching table, column, relationship, and Row Level Security policy being present in the connected Supabase project. The dashboard is configured to use live requests; exhaustive validation of all approximately 174 table hooks would require a provisioned schema and authenticated tenant data for every module. At the initial baseline checkpoint, no sample operational records were created or altered. The later, explicitly requested sample-data population is documented in the section below and is tagged for safe identification.

## Baseline live tenant configuration

With the user's approval to proceed conservatively, the existing **Kilimanjaro Trading Co.** tenant received only non-personal setup records: one active `Primary Branch`, one active `Primary Warehouse`, and six active module entitlements for `analytics`, `crm`, `finance`, `inventory`, `procurement`, and `sales`. No customer, employee, supplier, invoice, expense, payroll, or transaction records were created.

The connected `company_modules` table uses its generic `name`, `status`, and JSON `data` fields rather than the dashboard’s former `module_key` and `enabled` columns. The minimal dashboard compatibility update preserves the module key and enabled state inside `data`, reads both formats safely, and updates existing generic rows by tenant and name.

All three baseline tables—`branches`, `inventory_warehouses`, and `company_modules`—are linked to `companies.id` through their `company_id` foreign key. The dashboard’s enabled-module loader explicitly queries `company_modules` with the active tenant’s `company.id`. Its focused integration coverage verifies that tenant-scoped read, the generic record mapping, and a mocked response containing the six approved active baseline rows yield the expected active entitlement set.

## Daily Briefing data-state handling

The Daily Briefing now gathers the existing shared-table `loading`, `error`, and `reload` signals for its live inputs. While any live source is loading, it displays an accessible animated preparation state. When a source fails, it shows a safe explanation and a retry action that reloads the available briefing sources in parallel; the dashboard remains usable behind the modal. Preview demo deliberately bypasses those live failure signals so its seeded report stays available even if a prior live request failed.

## Validation evidence

| Check | Result |
|---|---|
| Managed Supabase REST/Auth configuration test | Passed with the configured browser-safe project credential. |
| Full automated test suite | Passed: 3 test files and 15 tests. |
| Production bundle | Passed with `pnpm build` after the Daily Briefing data-state enhancement. |
| Public marketing page (`/`) | Visually verified at desktop size; hero, capability navigation, and launch calls to action render. |
| ERP entry route (`/app`) | Visually verified at desktop size; the preserved Smart Manager authentication screen renders with sign-in, account creation, demo, Google, Microsoft, and Apple controls. |
| Live data and reload-session evidence | The exact `crm_leads?select=*&order=created_at.desc` PostgREST request used by the dashboard’s `useCompanyTable("crm_leads", ...)` path returned HTTP 200 through the managed browser credential; a representative `companies` request also returned HTTP 200. Focused tests verify the stored `bs_access_token` bootstrap and `authGetUser(token)` path. |
| OAuth-routing evidence | Focused tests verify the three provider values and shared Supabase authorization URL; the rendered login screen exposes all three controls. |
| Baseline module retrieval endpoints | `branches`, `inventory_warehouses`, and `company_modules` each returned HTTP 200 through the managed browser credential; direct database verification confirmed 1 branch, 1 warehouse, and 6 active module records for the tenant. |
| Tenant-scoping relationship and loader | Foreign-key inspection confirmed each baseline table’s `company_id` references `companies.id`; the focused module-loader test passed against the tenant-scoped `company_modules` query and generic mapping. |
| Demo-entry runtime regression | The published production bundle was verified in-browser: **Preview demo** opened the Daily Briefing, the briefing dismissed successfully, and the interactive dashboard workspace remained available. Neither `$s.filter is not a function` nor `FolderKanban is not defined` appeared, and no browser-console exception was recorded. |
| Daily Briefing data-state handling | Development verification rendered the retryable briefing-unavailable state and its controls, then exercised the animated loading overlay and watched it resolve into the normal report in the **same browser session**. The loading/error preview is development-only; production behavior remains driven only by real shared-table loading and failure signals. Focused tests now invoke the dashboard’s exported local fetch-state helper to validate live-loading, failure, retry, and demo-bypass gates. |
| Dashboard preservation assessment | The dashboard remains one JSX source file and was not refactored or visually redesigned. Repairs were limited to parser, dependency, configuration, duplicate-symbol, and missing-import blockers. |

## Remaining deployment steps

The deployed production landing page is reachable at `https://bserp-dashbo-xgm6fauw.manus.space` and its public launch routes are available. Before public OAuth use, configure the production redirect URL in Supabase Auth and enable/configure the Google, Microsoft/Azure, and Apple providers if those social-login paths are required. Confirm that the connected project contains the ERP tables and RLS policies expected by the intended modules.


## Supabase reconnect-success notification

The shared `runCompanyTableQuery` retry path now records when a request recovers after a transient network failure and emits the existing visual toast bus event: **“Connection restored — live data is up to date.”** The toast uses the dashboard’s existing success styling and auto-dismiss behavior, so it informs the user without blocking module navigation or changing the preserved dashboard architecture. A three-second cooldown prevents a burst of simultaneous table retries from producing a notification storm. Focused integration coverage confirms the retry succeeds, reports `recoveredAfterRetry`, and publishes the expected success toast event.


## Live CRM and inventory sample data

At the user's request, the connected **Kilimanjaro Trading Co.** tenant (`3022205f-89d9-4790-affa-cde3a304ee27`) now contains clearly labeled, non-personal sample records for chart validation. Every inserted row is scoped to that tenant, uses synthetic names and `example.test` addresses, and carries `data.sample_batch = "erp-chart-sample-2026-08"` plus `data.is_sample = true` so the batch can be identified and removed deliberately later without touching unrelated tenant data.

| Table | Inserted records | Purpose |
|---|---:|---|
| `crm_contacts` | 5 | Populates contact coverage for the CRM workspace. |
| `crm_leads` | 6 | Populates lead stages, scores, owners, dates, and pipeline-value charts. |
| `inventory_items` | 8 | Populates SKU, category, quantity, reorder, unit-cost, price, and location charts. |

The live verification query returned **6 CRM leads** with a combined pipeline value of **TZS 125,700,000**, **5 CRM contacts**, and **8 inventory items** totaling **1,000 units**. Two inventory items are intentionally at or below their reorder level so the low-stock indicator has a visible live state. The sample items cover safety equipment, storage equipment, construction materials, electronics, furniture, and workshop equipment across Dar es Salaam, Arusha, and Mwanza.

The deployed schema uses generic aliases such as `item_sku`, `item_name`, and `quantity`, while the preserved dashboard mapper historically expected `sku`, `name`, and `qty_on_hand`. The minimal compatibility patch now accepts both forms, preserves richer-schema support, and maps CRM contact aliases (`contact_name`, `company_name`, `role`) into the existing dashboard row shape. Focused integration coverage and the complete 15-test suite passed; the production build also completed successfully.


## Dashboard chart-data export

The executive dashboard now exposes an **Export Charts** action in the command strip. Users can download the current dashboard chart data as either a CSV file or a formatted PDF report without leaving the dashboard. Both formats include the available Executive KPIs, six-month revenue-versus-expenses trend, accounts-receivable aging, CRM pipeline by stage, inventory value by category, work orders by status, and top customers by billed value. Empty sections are omitted rather than filled with fabricated values.

CSV downloads use RFC-style quoted fields with escaped quotes and stable filenames in the form `{company}-dashboard-{YYYY-MM-DD}.csv`. PDF downloads use the same stable base name with a `.pdf` extension and are generated in-browser with `jspdf`, keeping the feature usable with live data and without a new server endpoint. The menu is keyboard-reachable, exposes `aria-haspopup`, `aria-expanded`, and menu-item roles, and reports successful downloads through the existing toast system.

Validation completed: all 18 automated tests passed across the three Vitest files; the production bundle completed successfully; and a live preview demo produced both `beirahisi-hardware-dashboard-2026-07-02.csv` and `beirahisi-hardware-dashboard-2026-07-02.pdf` in the browser download directory. The CSV was 850 bytes and the PDF was 16,232 bytes. The preserved dashboard remains a single JSX source file; the only new dependency is `jspdf`.

## Dashboard export filters and recurring email reports — 2026-08-12

- Added date-range filters and module toggles to the executive dashboard CSV/PDF export menu. Export filenames now include the selected date range, and PDF headers include the active filter summary.
- Added an authenticated **Schedule email report** dialog with report name, recipient, daily/weekly/monthly frequency, CSV/PDF format, saved filters, existing-schedule listing, and deletion.
- Added durable `dashboard_report_schedules` persistence in the project database. Schedule ownership is tied to the authenticated Manus user, and Heartbeat task lifecycle operations use the platform task UID rather than request-body identifiers.
- Added the `/api/scheduled/dashboardReport` callback. It authenticates cron requests, queries live tenant-scoped Supabase rows with the server-only `SUPABASE_SECRET_KEY`, builds a filtered CSV/PDF attachment, sends it through Resend, and records the last successful send time.
- Added server-only `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SUPABASE_SECRET_KEY` configuration. Lightweight read-only credential tests pass without sending a test email.
- Validation: 24 Vitest tests pass, production build passes, and the `/app` entry route was visually verified after the export and scheduling changes. No scheduled email was sent during validation; schedules are created only when an authenticated user submits the dialog in the published app.

## Final scheduled-report hardening — 2026-08-12

The recurring-report workflow now forwards the dashboard’s `bs_access_token` through the tRPC client, validates it against Supabase Auth on the server, and checks the requested company through the user’s Supabase RLS-visible `companies` row before any schedule is persisted. Heartbeat jobs are created, updated, and deleted as project-owned jobs using the SDK’s documented empty-session owner fallback; the returned real task UID is stored in `dashboard_report_schedules`, and failed creation rolls the database row back. This avoids passing a Supabase JWT into a scheduler API that expects a Manus session token.

The scheduled callback remains mounted at `/api/scheduled/dashboardReport`, authenticates cron requests through the SDK, resolves schedules exclusively by the authenticated task UID, and keeps the Resend attachment delivery idempotent at the application level. Validation now includes real service-level mocks for Heartbeat task persistence, Supabase company authorization, schedule CRUD routing, database-backed orphan lookup, the HTTP cron handler, mocked Resend delivery, and the manual filtered export helpers. The final suite passes 33 tests, the production build passes, and the public landing page plus ERP authentication shell were visually rechecked. No live customer email was sent during validation.

## Schedule pause/resume and Send now controls — 2026-08-12

- Added interactive **Pause**, **Resume**, and **Send now** controls to each schedule item in the report scheduling dialog.
- Added protected tRPC mutations `reportSchedules.toggleActive` and `reportSchedules.sendNow` with schedule ownership verification.
- Added focused service and router tests covering pause state updates and immediate manual report dispatch.
- Validation: 34 Vitest tests pass, production build passes, and schedule actions integrate smoothly into the existing ERP dashboard layout.
