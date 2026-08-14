# Project TODO

- [x] Preserve the uploaded 45,756-line ERP application as one dashboard source file without altering its UI, business logic, feature set, or internal architecture.
- [x] Identify the exact package dependencies required by the uploaded dashboard and add only missing dependencies needed to build it.
- [x] Place the uploaded single-file ERP source into the web application runtime without splitting its internal components, hooks, API logic, or state management.
- [x] Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as managed environment variables rather than hardcoding credentials.
- [x] Verify the dashboard's live Supabase REST data requests, authentication endpoints, and reload session handling against the supplied Supabase project.
- [x] Verify that Google, Microsoft, and Apple OAuth links are correctly routed to the configured Supabase providers, while documenting any provider-side configuration still required.
- [x] Create a public marketing landing page with a hero, ERP feature highlights, responsible social-proof messaging, and clear app-launch calls to action.
- [x] Route the landing-page Launch App and Get Started calls to the preserved ERP dashboard.
- [x] Add focused automated tests for routing, configuration validation, and the dashboard integration boundary.
- [x] Build the application, inspect runtime and browser errors, and make only minimal changes required for successful operation.
- [x] Capture visual verification of the landing page and ERP dashboard to confirm the dashboard design remains unchanged.
- [x] Prepare a complete change log that lists all modified files, exact errors, minimal fixes, validation evidence, and preservation confirmations.
- [x] Replace the initially rejected Supabase credentials with the newly supplied project URL and anonymous key, then rerun live REST validation.
- [x] Replace the rejected legacy anonymous key with the supplied Supabase publishable key and verify live REST access.
- [x] Configure the confirmed Supabase publishable client key, verify it against the project, and ensure the supplied secret key is never exposed to the browser.
- [x] Inspect the connected Supabase project schema and confirm which existing ERP data tables, relationships, and authentication requirements are available for live integration.
- [x] Handoff Microsoft/Azure and Apple provider credential setup plus approved production redirect URLs to the user for manual Supabase Auth configuration; deployed controls are ready.
- [x] Exercise and document a live dashboard `useCompanyTable` data path against the connected Supabase project.
- [x] Add focused verification for reload-session bootstrap using the stored `bs_access_token` path.
- [x] Inspect and verify the exact Google, Microsoft/Azure, and Apple provider arguments used by the dashboard OAuth controls.
- [x] Add the missing Google, Microsoft/Azure, and Apple sign-in controls that invoke the existing Supabase OAuth helper.
- [x] Validate exact Supabase Auth state: Google enabled; email signup available with confirmation required; phone OTP disabled; Azure and Apple pending the user’s manual configuration.
- [x] Validate the deployed Apple sign-in control and hand off Apple provider activation to the user for manual configuration.
- [x] Inspect the connected Supabase tenants, available ERP tables, and relationships needed to validate additional live modules.
- [x] Confirm the target tenant and approved business data scope; do not fabricate customer, employee, financial, or operational data.
- [x] Create only a primary branch, an inventory warehouse, and enabled-module configuration for Kilimanjaro Trading Co.; do not create people, customer, supplier, invoice, expense, payroll, or transaction records.
- [x] Adapt the dashboard’s enabled-module load and toggle path to the existing generic `company_modules` schema without changing its single-file architecture.
- [x] Validate additional ERP module retrieval paths and update the delivery log with the created baseline records and results.
- [x] Inspect and document company-scoping relationships for the validated branch, warehouse, and module tables.
- [x] Verify tenant-specific baseline records through an authenticated dashboard retrieval path or a focused equivalent test.
- [x] Diagnose and fix the `$s.filter is not a function` runtime error without refactoring the preserved dashboard.
- [x] Add a focused regression test for the affected data-shape boundary and verify the repaired ERP route.
- [x] Resolve the `FolderKanban is not defined` dashboard startup error exposed after the data-shape repair.
- [x] Publish the demo-entry runtime repairs and verify the live production `/app` route.
- [x] Confirm the published Preview demo flow reaches an interactive dashboard without either repaired error.
- [x] Inspect Daily Briefing data dependencies and identify available loading, error, and reload signals.
- [x] Add a smooth accessible loading state and retryable error state to the Daily Briefing without refactoring the preserved dashboard.
- [x] Add regression coverage and visually verify the Daily Briefing loading and failure-handling paths.
- [x] Exercise the Daily Briefing loading overlay in-browser and confirm it transitions to a resolved state.
- [x] Add executable coverage for the Daily Briefing live-loading and error gating logic.
- [x] Verify the Daily Briefing loading overlay resolves within one browser session without a navigation-based state switch.
- [x] Extract the Daily Briefing fetch-state gate to a small local helper and test the real helper rather than a duplicated expression.

- [x] Audit every ERP table request against the connected Supabase schema and current API/Postgres logs.
- [x] Repair shared Supabase request fallbacks for unsupported relationships and missing order columns.
- [x] Add bounded retry handling for transient Supabase failures and preserve loaded rows during refresh.
- [x] Treat absent tables as honest unavailable/empty states rather than generic connection failures.
- [x] Add executable regression coverage for all-table fallback, retry, and missing-table behavior.
- [x] Validate representative real-data modules and flicker-free navigation, then publish the repair.
- [x] Deliver a table-audit report separating connection defects from missing operational data or user-managed schema prerequisites.

- [x] Emit a visual success toast when a Supabase request succeeds after a transient network retry.
- [x] Add focused regression coverage for the retry-success notification signal.
- [x] Visually verify the toast in the dashboard and publish the enhancement.

- [x] Inspect the connected CRM and inventory table schemas and current Kilimanjaro Trading Co. rows.
- [x] Insert clearly labeled non-personal sample CRM and inventory records with tenant scoping.
- [x] Verify the inserted rows through live Supabase reads and representative ERP chart data paths.
- [x] Document the sample-data population and publish the update.
- [x] Adapt the inventory and CRM contact mappers to the deployed tenant schema aliases so live sample rows render with quantities and labels.

- [x] Inspect existing dashboard chart data, export helpers, and action-menu patterns for a minimal integration point.
- [x] Implement CSV and PDF downloads for the dashboard chart data with accessible controls and stable filenames.
- [x] Add focused automated coverage for CSV serialization, PDF export preparation, and the dashboard export controls.
- [x] Visually verify the export controls in the dashboard, update delivery documentation, and publish the enhancement.

- [x] Add date-range and module filters to manual dashboard CSV/PDF exports, with clear active-filter labels and stable filenames.
- [x] Add managed recurring dashboard report schedules with recipient, frequency, format, and filter settings, delivered by email through the platform notification path.
- [x] Add schema/API/test coverage for report schedules, verify manual and scheduled flows, update documentation, and publish the enhancement.

- [x] Bridge the ERP dashboard Supabase session to the report-schedule API with validated bearer tokens and tenant-access checks.
- [x] Add integration tests for schedule CRUD, Supabase company authorization, cron callback execution, and mocked Resend delivery.
- [x] Save and publish a final checkpoint after the hardened scheduled-report flow passes tests, build, and visual verification.

- [x] Add pause/resume toggles and a "Send now" trigger to the report schedule dialog and API router.
- [x] Add automated coverage for pause/resume state changes and immediate manual test-dispatch.
- [x] Save and publish a final checkpoint with the updated schedule controls.

- [x] Align the landing page, authentication views, and dashboard shell with the Smart Manager visual style and Kiswahili/Tanzania-first positioning.
- [x] Add noble design tokens (deep slate/charcoal background, brushed gold/emerald accents, Poppins/Inter typography) to index.css and dashboard styling.
- [x] Verify accessibility, responsiveness, and automated tests for the redesigned experience, then publish the final checkpoint.

- [x] Implement persistent theme preference (Noble Dark vs Light / High Contrast) and bilingual English/Kiswahili language state.
- [x] Add discoverable header toggles for theme and language on both landing page and dashboard shell.
- [x] Verify test suite, production build, and publish the final polished version.

- [x] Add animated gold geometric line art (topographic supply-chain paths) to landing background surfaces and glassmorphic cards.
- [x] Implement a persistent user preference drawer for customizable dashboard layout widgets and compact view settings.
- [x] Verify automated tests and production build, then publish the final polished checkpoint.

- [x] Implement server-side AI model discovery and multi-model chat/analysis procedures using `invokeLLM` and `listLLMModels`.
- [x] Connect Collaboration Hub calendar events, team channels, messaging, and workspaces to live database persistence and state handlers.
- [x] Add automated tests for the new AI procedures and collaboration actions, verify the build, and publish the final upgrade.

- [x] Implement AI prompt suggestion bar in the dashboard assistant and automated cash-flow/stock-level anomaly detection in the server router.
- [x] Verify automated tests and production build, then publish the final AI-enhanced checkpoint.
- [x] Save and publish a new checkpoint/version after the AI prompt suggestion bar and anomaly-detection changes.

- [x] Implement persistent TZS/USD currency preference and transparent display conversion helper in dashboard context.
- [x] Add currency toggle button to the executive command strip and format KPIs and chart tooltips accordingly.
- [x] Verify automated tests and production build, then publish the final currency-enhanced checkpoint.

- [x] Diagnose live Supabase table queries and company ID filtering for Inventory, Finance (invoices/expenses), and CRM modules.
- [x] Ensure robust fallback and tenant-scoping normalization across live inventory, invoice, expense, and CRM table loading helpers.
- [x] Add regression tests confirming non-empty rows for Inventory, Finance, and CRM modules.
- [x] Run test suite, verify build, and publish checkpoint with restored live data modules.

- [x] Locate the undefined `preferences` reference in BusinessSphereDashboard.jsx.
- [x] Fix the scope or fallback for `preferences` so executive command strip currency toggle renders safely.
- [x] Run test suite and production build to verify the fix.
- [x] Save and publish checkpoint with the error resolved.

- [x] Add `ai.configurePreferences` tRPC procedure using `invokeLLM` with structured JSON schema output for safe configuration recommendations.
- [x] Integrate an interactive AI configuration assistant tab/section into `DashboardPreferencesDrawer.tsx`.
- [x] Add automated regression coverage for the AI configuration procedure and preference application flow.
- [x] Run test suite, verify production build, and publish the AI-enhanced preferences checkpoint.

- [x] Trace loan/finance write handlers and identify why server updates fail while local state succeeds.
- [x] Implement robust server-side write fallbacks and schema normalization for loan/finance records.
- [x] Add regression tests covering successful live server writes and graceful offline fallback.
- [x] Run test suite, verify production build, and publish the persistence fix.

- [x] Implement `runCompanyTableMutation` helper in `BusinessSphereDashboard.jsx` for robust server inserts/updates with automatic retry and error propagation.
- [x] Upgrade loan, expense, CRM, inventory, and banking mutation handlers to await server confirmation and sync state.
- [x] Add persistence integration tests asserting server-confirmed mutation helpers and reload safety.
- [x] Run test suite, verify production build, and publish checkpoint with bulletproof database persistence.

- [x] Implement server-save loading indicators and success toast notifications across module forms.
- [x] Ensure AI preferences assistant in `DashboardPreferencesDrawer.tsx` provides full preview and apply functionality with error handling.
- [x] Add custom date range presets (This Month, Last Quarter, Year-to-Date, All Time) to analytics report builder and filter financial metrics.
- [x] Add automated integration tests covering the new features, verify build, and publish checkpoint.

- [x] Make desktop sidebar responsive on lg+ viewports and ensure main content area respects sidebar gutter.
- [x] Run test suite and save final responsive checkpoint.

- [x] Audit all tRPC and Supabase persistence endpoints for robust error handling and server-confirmed state.
- [x] Run endpoint health checks and mock-verified persistence test suites.
- [x] Run complete test suite and production build, then save final audited checkpoint.

- [x] Audit date/time usage (`TODAY`, record stamps, filters) across `BusinessSphereDashboard.jsx`.
- [x] Implement robust real-time dynamic date extraction (`new Date()`) for new records, reports, and current command strip indicators.
- [x] Add regression test coverage for date handling and verify build/tests.

- [x] Add timezone selector and customizable FX rate override to `DashboardPreferencesContext.tsx` and `DashboardPreferencesDrawer.tsx`.
- [x] Wire timezone-aware date formatting and FX conversion into dashboard modules and financial summaries.
- [x] Add automated test coverage for timezone and FX preference handling, run build and tests, and publish checkpoint.

- [x] Audit expense mapper and form handlers for multi-department cost center support.
- [x] Add department and cost center fields to expense row mapper (`mapExpenseRow`), mutation helper, and expense form modal.
- [x] Add departmental breakdown summary in the Finance module and export columns.
- [x] Add automated regression tests, run test suite and production build, and publish checkpoint.

- [x] Implement departmental budget threshold state in `DashboardPreferencesContext.tsx`.
- [x] Add departmental spending comparison and visual alert cards in Finance module view.
- [x] Add regression tests, verify production build, and publish checkpoint.

- [x] Add inline departmental budget adjustment section to Finance module view.
- [x] Add automated test coverage, run build and tests, and publish checkpoint.

- [x] Implement departmental budget vs actual bar chart in `BudgetsView` within `BusinessSphereDashboard.jsx` using Recharts.
- [x] Add automated test coverage and verify successful build and test suite.

- [x] Implement exact variance tooltip on the departmental budget comparison bar chart in `BudgetsView`.
- [x] Add regression test coverage, run build and test suite, and publish checkpoint.

- [x] Implement sorting state and dropdown above the departmental budget comparison chart in `BudgetsView` (by name, largest variance, highest actual spending).
- [x] Add automated regression coverage, verify build and test suite, and publish checkpoint.

- [x] Add unit test verification for departmental chart sorting logic in integration test suite.

- [x] Implement ascending/descending sort direction toggle state and UI control next to the chart sorting dropdown in `BudgetsView`.
- [x] Update chart sorting logic to respect the direction toggle and add automated unit test coverage.
- [x] Run test suite and production build, then publish checkpoint.

- [x] Add dedicated unit test coverage for ascending and descending sort direction toggling across chart modes.

- [x] Implement click-to-filter interaction on departmental budget comparison chart bars in `BudgetsView` to filter transaction ledger / expenses by department.
- [x] Add reset filter control, regression test coverage, verify build and test suite, and publish checkpoint.

- [x] Implement department summary card above filtered ledger in `BudgetsView` showing transaction count and total spending sum.
- [x] Add regression test coverage, verify test suite and production build, and publish checkpoint.

- [x] Audit frontend-to-backend architecture, persistence helpers (`runCompanyTableMutation`, `runCompanyTableQuery`), authentication flow, and environment variables.
- [x] Verify Supabase table availability, tenant ownership scoping (`company_id`), constraints, and error-handling fallbacks.
- [x] Conduct end-to-end persistence audit across major ERP entities (Customers/CRM, Products/Inventory, Invoices, Expenses, Loans).
- [x] Add focused integration tests and regression specs covering transaction resilience, error boundaries, and account data isolation.
- [x] Execute full Vitest test suite, production build, runtime verification, and publish final production-hardened checkpoint.

- [x] Configure and request production environment secrets (`RESEND_API_KEY`, Supabase OAuth credentials) via `webdev_request_secrets`.
- [x] Document Supabase point-in-time recovery and automated backup policy in `BACKUP_POLICY.md`.
- [x] Implement company-scoped compliance audit log table and tRPC/server persistence helpers for sensitive administrative actions.
- [x] Add automated integration test coverage for audit logs, run test suite and production build, and publish final checkpoint.

- [x] Implement admin audit viewer in Management UI / Settings / Compliance panel.
- [x] Implement backup-retention notifications and scheduled audit check.
- [x] Enforce admin-only role gating for sensitive departmental budget threshold adjustments.
- [x] Add regression test coverage, verify test suite and production build, and publish final published checkpoint.

- [x] Implement weekly backup-status verification workflow and scheduled Heartbeat route.
- [x] Build admin role-management interface in Management UI settings.
- [x] Add module and date range filters to the compliance audit log viewer.
- [x] Run full test suite, verify production build, document provider limitations, and publish checkpoint.

- [x] Implement admin user-role directory tRPC procedure and management UI table.
- [x] Implement scheduled weekly compliance PDF export handler and webhook dispatcher for high-severity audit events.
- [x] Run full test suite, verify production build, document feature contract, and publish final published checkpoint.

- [x] Implement CSV export for filtered compliance audit logs.
- [x] Implement secure webhook configuration panel and dispatcher for audit events.
- [x] Implement schedule controls for automated compliance digests in the management experience.
- [x] Run full test suite, verify production build, document feature contract, and publish final checkpoint.

- [x] Implement webhook test ping endpoint and UI action.
- [x] Implement compliance digest schedule management UI and tRPC procedure.
- [x] Implement severity badges and severity filtering across audit records.
- [x] Run full test suite, verify production build, document feature contract, and publish final checkpoint.

- [x] Implement executive report schedule controls in the reporting/dashboard views.
- [x] Implement severity level filter in audit CSV exports.
- [x] Implement webhook persistent retry and dead-letter queue mechanism.
- [x] Run full test suite, verify production build, document feature contract, and publish final published checkpoint.

- [x] Audit server-side persistence helpers (`runCompanyTableMutation`, `runCompanyTableQuery`) and Supabase client bindings.
- [x] Verify Supabase table availability, RLS policies, and server mappers across ERP modules.
- [x] Generate SUPABASE_PERSISTENCE_GUIDE.md detailing table schemas, RLS policies, parameterized query builders, and React integration examples.
- [x] Run full test suite, verify production build, document feature contract, and publish final checkpoint.

- [x] Verify Supabase schema migration script and execution workflow.
- [x] Implement Supabase Realtime subscription hook with graceful fallback.
- [x] Implement backup-completion webhook notification handler and documentation.
- [x] Run full test suite, verify production build, document implementation contract, and publish final checkpoint.

- [x] Wire `useSupabaseRealtime` into Inventory and Finance ledger data queries for instant multi-client reactivity.
- [x] Implement HMAC SHA-256 signature verification for incoming backup webhook payloads.
- [x] Create CLI migration runner script (`server/runMigrations.mjs`) for automated CI/CD database schema deployment.
- [x] Run full test suite, verify production build, document implementation contract, and publish final checkpoint.

- [x] Add a GitHub Actions pull-request workflow that runs the CI-safe migration verification command.
- [x] Add a realtime workspace presence indicator for active connected users.
- [x] Add an administrator webhook delivery dashboard for successful and failed events.
- [x] Add focused tests, verify production build, and publish the completed work.

- [x] Add durable database-backed webhook delivery history with migration coverage.
- [x] Add secure per-delivery retry procedures and retry controls in the administrator dashboard.
- [x] Add an approval-gated production migration workflow that uses protected deployment secrets.
- [x] Add regression tests, run full verification, and publish the completed release.

- [x] Extract the complete required ERP table contract and compare it with the connected Supabase schema.
- [x] Create only verified missing Supabase ERP tables, indexes, relationships, and RLS policies through idempotent migrations.
- [x] Verify tenant-scoped live access paths and publish a Supabase schema inventory report.
- [x] Add focused schema regression coverage, run build checks, and publish the completed database release.

- [x] Assess and document the alert schedule, delivery path, and administrator ownership model for schema-drift monitoring.
- [x] Implement an idempotent scheduled schema-drift verifier with administrator notifications and durable execution history.
- [x] Add claim-aware RLS regression tests that exercise tenant and role boundaries with safely gated real Supabase JWTs.
- [x] Convert the `/app` ERP entry route to a resilient lazy-loaded module with an accessible loading boundary.
- [x] Run focused and full verification, document operations, and publish the hardening release.

- [x] Identify and defer a safe Sales detail workspace boundary without changing live data or RLS behavior.
- [x] Add concise in-app guidance explaining deferred loading without introducing telemetry or sensitive-data collection.
- [x] Add regression coverage, verify bundle output and runtime behavior, then publish the release.

- [x] Provision bounded controlled identities and obtain disposable JWTs for live RLS claim checks.
- [x] Extract additional Finance and CRM workspace boundaries into lazy-loaded modules.
- [x] Run live RLS, TypeScript, production build, and regression verification, then clean up QA identities.
- [x] Save checkpoint and publish the final optimized release.

- [x] Remove email-confirmation pause in signup flow and present congratulations message with direct login action.

- [x] Fix undefined handleSubmit reference in SignupPage / company-setup flow and add regression coverage.

- [x] Apply uploaded Smart Manager UI/UX references (login screen, company setup, brand logo with Tanzania accent, design system colors/typography/icons) across the project.

- [x] Implement real-time form validation and clear error messages for company registration steps.

- [x] Create a smooth success animation and a welcome modal that appears immediately after the user completes the registration steps.

- [x] Implement the main dashboard layout with a sidebar navigation and top header matching the uploaded system design.

- [x] Create a user profile dropdown menu in the top header containing options for account settings, billing, and logout.

- [x] Fix login connection error and redirect signup directly to login upon successful account creation without email-confirmation block.

- [x] Add a "Remember Me" checkbox and a "Forgot Password" link to the login page to improve user convenience.

- [x] Implement real-time email format validation and error handling for the new forgot password submission form.

- [x] Add a 'Back to Login' button in the forgot password modal to allow users to easily return.

- [x] Troubleshoot and eliminate local fallback persistence, making Supabase the sole source of truth for all database writes and surfacing real Supabase write errors.

- [x] Create an activity log section in the dashboard to display recent successful user actions and database writes.

- [x] Fix shared persistence root cause: remove local-success fallback across all modules and enforce confirmed Supabase database persistence.

- [x] Trace one complete pos_shifts write, capturing safe diagnostic fields and preserving original Supabase errors without logging credentials.

- [x] Verify and repair Supabase authentication context (getUser and getSession) to ensure auth.uid() is correctly populated during database requests.

- [x] Verify and repair dynamic company/tenant resolution (auth.uid() -> profile/membership -> current_company_id() -> RLS) without hardcoding or trusting frontend company IDs.

- [x] Fix RLS root cause: ensure current_company_id() correctly resolves authenticated user company ownership without disabling RLS or weakening tenant isolation.

- [x] Remove false success behavior: ensure failed Supabase inserts never update local state as successfully saved, keeping form data available for retry and logging safe diagnostics.

- [x] Require confirmed Supabase responses before updating UI state for CREATE, UPDATE, and DELETE operations.

- [x] Verify a real authenticated pos_shifts create through the app, browser refresh, renewed session, and direct tenant-scoped Supabase read.

- [x] Fix the pos_shifts cashier-column schema mismatch so POS writes match the live Supabase table contract and persist successfully.

- [x] Verify confirmed Supabase CRUD persistence across Customers, Suppliers, Products, Inventory, Sales, Expenses, Employees, Invoices, and Payments using shared tenant-safe infrastructure.

- [x] Reconcile every frontend module and table contract shown in the dashboard navigation with the live Supabase schema, adding only verified missing tenant-safe backend objects.

- [x] Route authenticated users with an existing profile but no company assignment into the required company-setup flow before any tenant-scoped mutation.

- [x] Remove the remaining manual tenant-bootstrap dead end for authenticated profiles that have no company assignment, without weakening RLS or hardcoding a company.

- [x] Verify refresh-backed CREATE, READ, UPDATE, and DELETE persistence for Customers, Suppliers, Products, Inventory, Sales, Expenses, Employees, Invoices, and Payments, including post-delete confirmation from Supabase.

- [x] Audit every local cache, queue, fallback, and mutation path; remove accidental local-success behavior or implement an explicit Supabase-confirmed offline synchronization queue where offline support is intentional.

- [x] Preserve every existing Supabase table and verify persistence hardening uses only authenticated application integration, tenant resolution, RLS, and confirmed server responses rather than any schema rebuild.

- [x] Produce final acceptance evidence for application-created records through Supabase INSERT, browser refresh, logout/login, and direct database reads.
- [x] Defer final live tenant-isolation evidence because the nominated session resolved to Tenant A; retain the evidence requirements for a future independent Tenant B session.

- [x] Diagnose and repair the browser session identity mismatch observed during the Tenant B acceptance check before making any cross-tenant security claim.

- [x] Explicitly defer the live two-tenant isolation acceptance check until an independently provisioned second-company account is available; do not substitute another user in the same company.

- [x] Record that the nominated session belongs to Tenant A and therefore cannot validly verify cross-tenant read, create, update, or delete isolation; preserve this check for a future independent session.

- [x] Validate that the nominated session resolves to Tenant A rather than a distinct company; do not use it as Tenant B evidence.

- [x] Defer live two-company RLS acceptance verification until an independently provisioned Tenant B account is available, without marking a same-company session as tenant-isolated.

- [x] Verify the authenticated Supabase API rejects a forged client-supplied company_id on a tenant-owned insert, without creating any record.
- [x] Produce final server-failure evidence showing no false saved state, no fake persistence, meaningful errors, and retry-safe form handling.

- [x] Diagnose and fix the reproduced live CRM lead form submission that left no confirmed Supabase row, without recreating database tables.

- [x] Audit the existing AI Assistant module, related server APIs, dashboard integration points, and provider configuration.
- [x] Supersede the externally funded provider configuration with the project’s built-in server-side AI service; no assistant credential is exposed to the browser.
- [x] Implement server-side context-aware AI responses with bounded conversation memory, structured suggestions, provider-managed retries, rate-limit-aware errors, and safe usage telemetry.
- [x] Integrate the enhanced assistant into the existing dashboard with clear loading, actionable suggestions, safe navigation actions, and truthful error states.
- [x] Add focused automated tests and production validation for the AI Assistant module, then publish the enhancement.

- [x] Replace the external DeepSeek assistant provider with the built-in server-side AI service so live assistant generation does not depend on the external account balance.
- [x] Verify a real, non-sensitive built-in AI Assistant response and retain tenant-safe context, conversation memory, and provider-error behavior.

- [x] Audit current AI recommendation rendering, action execution handlers, user-role state, and audit-log boundaries.
- [x] Define role-specific approval authority and an explicit recommendation lifecycle from draft through approval, rejection, expiry, and manual post-authorization execution.
- [x] Implement review and authorization controls that prevent AI-suggested business actions from executing until an authorized user explicitly approves them.
- [x] Persist tenant-scoped approval decisions and audit metadata without exposing or trusting browser-supplied authorization claims.
- [x] Add automated authorization-boundary tests, production validation, and publish the AI approval workflow.

- [x] Diagnose and fix the Vite WebSocket/HMR connection failure in the managed development preview without changing production routing.
