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
