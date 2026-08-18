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

- [x] Complete the pasted authentication requirements review and map the actual email/password, session, profile, tenant, and redirect flow.
- [x] Trace the real Supabase password-login request and identify the exact source of the generic connection error without logging secrets or passwords.
- [x] Repair only the shared authentication, session, profile/company bootstrap, or error-mapping defect confirmed by evidence.
- [x] Verify session bootstrap into the tenant-scoped dashboard plus truthful user-facing invalid-credential, validation, configuration, rate-limit, server, and network failure states.
- [x] Add focused regression tests, production validation, and publish the authentication repair.

- [x] Add non-enumerating login guidance for accounts created with a federated identity, directing users to the matching provider button.

- [x] Restart and verify the stopped development server responds through the managed preview.

- [x] Complete the pasted enterprise auth and onboarding requirements review against the current secure Supabase implementation.
- [x] Define an original enterprise design system and interaction model for login, recovery, registration, company setup, and onboarding.
- [x] Implement premium accessible login, password recovery, password reset, verification, and session UX without weakening authentication or exposing account state.
- [x] Implement progressive account, company, workspace, user-profile, module-selection, and optional team-invitation onboarding with resumable progress.
- [x] Preserve verified tenant resolution, RLS, existing routes, and confirmed server persistence while improving responsive auth and onboarding UI.
- [x] Add focused tests, browser validation, production build validation, and publish the completed redesign.
- [x] Correct the enterprise signup step-count copy and require the same strong credential validation on the join-company registration path.
- [x] Replace the remaining six-character signup placeholder so every account-creation path accurately communicates the enterprise password policy.
- [x] Add tenant-safe self-service organization branding to workspace setup, including validated custom-logo upload, saved brand colors, accessible previews, tests, and release validation.
- [x] Correct the workspace-branding control’s missing upload icon reference discovered during live onboarding validation.
- [x] Assess existing team membership, invitation, email delivery, onboarding, and dashboard-code boundaries for a secure invitation service and smaller auth-route payload.
- [x] Implement tenant-scoped server-backed team invitations with role authorization, expiry, revocation, delivery, and acceptance controls.
- [x] Add optional invitation management to workspace onboarding and ongoing workspace administration.
- [x] Reduce the initial public authentication-route payload with a safe smaller lazy-loaded dashboard boundary while preserving existing features and routes.
- [x] Add security, invitation-delivery, code-splitting, browser, full-test, and production-build validation before publishing the enhancement.
- [x] Audit the current email/password workspace-creation and Google OAuth/session flow against the pasted root-cause requirements, including Supabase callbacks, profile assignment, tenant routing, and error handling.
- [x] Trace and repair the exact workspace-creation failure point while preserving the atomic company/profile ownership RPC, RLS, and international workspace defaults.
- [x] Trace and repair the Google OAuth callback and session-restoration path so an authenticated user reaches a verified dashboard or explicit onboarding state rather than returning to login.
- [x] Add focused regression coverage, production configuration guidance, browser validation, full tests, and production-build validation before publishing the authentication-flow repair.
- [x] Audit existing Supabase Auth, Resend/server email delivery, templates, callbacks, invitations, notifications, invoices, and deployment secrets against the supplied transactional-email requirements.
- [x] Determine the supplied credential’s provider compatibility and configure only the necessary server-side secret without exposing it to client code, repository files, or logs; the supplied credential was not used.
- [x] Supersede external transactional-email delivery in accordance with the user’s direction not to use Resend; invitations, reports, and manual messages now report disabled delivery without sending mail.
- [x] Add focused disabled-delivery/error-handling tests, full tests, build validation, and an honest delivery-status path before publishing.
- [x] Supersede the planned server-side Resend reuse: all active Resend code paths and provider-specific artifacts were removed at the user’s direction.
- [x] Remove browser-side SMTP credential persistence and false sent-state behavior from the manual Email Center, replacing the send affordance with a truthful disabled-delivery state.
- [x] Remove email-confirmation gating from password account creation so successful signup proceeds to a clear congratulatory login state without relying on Resend or another transactional email provider.
- [x] Preserve OAuth, password recovery, reset-password, tenant onboarding, error handling, and authenticated session safety while changing the direct-signup flow.
- [x] Add regression tests, browser validation, full-suite and production-build checks, then publish the no-confirmation account-creation update.
- [x] Inspect current branding, authentication, shell, metadata, responsive navigation, and state-component integration points for the supplied Smart Manager logo.
- [x] Upload the exact supplied logo as the authoritative managed static brand asset and create a reusable accessible responsive BrandLogo component.
- [x] Integrate the centralized logo into existing authentication, onboarding, application-shell, responsive navigation, loading/error, and browser-branding surfaces without changing business behavior.
- [x] Add focused branding regression coverage, verify desktop/mobile visuals, run tests and production build, then publish the branding integration.
- [x] Restart development preview and locate dashboard transition loading boundaries.
- [x] Implement a smooth accessible pulsing Smart Manager logo loading animation using BrandLogo.
- [x] Wire the pulsing loader to all dashboard page transitions and lazy-loaded route boundaries.
- [x] Verify transition loading behavior, run test suite and production build, then publish the update.
- [x] Audit application navigation, module headers, and tab lists across major ERP views.
- [x] Create reusable enterprise UI primitives (`EnterpriseModuleHeader`, `ScrollableModuleTabs`, `EnterpriseFilterBar`, `EnterpriseKPIGrid`).
- [x] Reorganize Sales, Inventory, Finance, CRM, and HR module layouts for clean enterprise hierarchy and horizontal touch/mouse scrolling.
- [x] Verify functionality preservation, test suite, production build, and publish the enterprise re-architecture.
- [x] Implement keyboard shortcut navigation (Arrow Left / Arrow Right) for primary module tabs in `ScrollableModuleTabs`.
- [x] Implement reusable column-visibility customization menu (`EnterpriseColumnCustomizer`).
- [x] Wire column customizer into enterprise table views across major modules.
- [x] Verify test suite, production build, and publish the verified update.
- [x] Add an optional Tanzania-inspired skyline and flag-accent backdrop behind the mobile authentication header using performant CSS and reduced-motion-safe styling.
- [x] Extend the centered official Smart Manager lockup to password recovery, password reset, and workspace-completion screens.
- [x] Default language presentation to Kiswahili for Tanzania-based users while preserving explicit user language choices and English fallback behavior.
- [x] Validate the responsive auth, onboarding, and localization updates; run full regression and production build; then publish.
- [x] Persist each authenticated user’s enterprise table column preferences across sessions and devices using the existing server-backed tenant-safe settings path.
- [x] Extend the reusable Columns control to the primary Sales documents and Finance ledger tables with synchronized headers, rows, and state spans.
- [x] Add browser-oriented keyboard accessibility coverage for reusable module tabs and the Columns menu.
- [x] Create a private GitHub repository and push the validated BusinessSphere ERP source with a concise setup guide.
- [x] Prepare a compatible Android APK delivery path for the current web application and document any required signing or cloud-build steps.
- [x] Run final checks, publish the web update, and deliver the GitHub and Android packaging outcomes.
- [x] Review the pasted authentication-page instructions and reconcile them with the existing secure auth implementation.
- [x] Store and use the newly uploaded official Smart Manager logo through managed web asset storage.
- [x] Apply the requested responsive Kiswahili-first authentication presentation without changing credential or social sign-in behavior.
- [x] Add regression coverage, visually verify the updated auth flow, publish, and deliver the branded release.
- [x] Assess the current mobile Google OAuth callback coverage and official logo constraints for a square application icon.
- [x] Add automated regressions for mobile Google OAuth initiation and remembered versus session-only authentication storage.
- [x] Prepare a non-destructive square app-icon handoff from the uploaded official logo and document production replacement steps.
- [x] Run validation, publish, and deliver the authentication hardening release.
- [x] Assess session-only mobile logout test prerequisites and the current OAuth error presentation.
- [x] Add visual OAuth-error recovery guidance and regression coverage for session-only authentication behavior.
- [x] Run validation, publish, and deliver the authentication recovery update.
- [x] Review current provider recovery behavior and mobile authentication test coverage.
- [x] Add Microsoft- and Apple-specific OAuth recovery guidance with regression coverage.
- [x] Create an end-to-end mobile authentication device test matrix and preserve the approved-square-icon handoff requirement.
- [x] Run validation, publish, and deliver the provider recovery update.
- [x] Assess available browser and device access for the mobile authentication acceptance matrix.
- [x] Run browser-available mobile authentication scenarios and record sanitized release evidence.
- [x] Prepare the physical-device validation and approved-square-icon handoffs.
- [x] Publish and deliver the mobile acceptance evidence update.
- [x] Review the supplied responsive requirements and identify shared tab, header, action, search, card, and table layout primitives.
- [x] Repair the CRM mobile tab overflow so labels stay readable and horizontally scrollable without collision.
- [x] Apply shared responsive safeguards for module headers, action groups, searches, cards, and wide table wrappers.
- [x] Add regression coverage, validate target breakpoints, publish, and deliver the global responsive update.
- [x] Inventory dense multi-action bars and shared layout patterns across Smart Manager modules.
- [x] Apply reusable responsive action-bar safeguards and targeted module integrations.
- [x] Add regression coverage and visually validate representative dense action bars on narrow screens.
- [x] Publish and deliver the multi-module action-bar responsive update.
- [x] Map authenticated browser access and identify the safest remaining oversized dashboard boundary.
- [x] Validate authenticated CRM, Sales, and Finance at 360px and 390px; record the current tenant's HR-module entitlement block without changing workspace configuration.
- [x] Validate authenticated HR at 360px and 390px through the existing dashboard control without changing the approved tenant configuration.
- [x] Preserve the current HR entitlement state; temporary enablement and restoration were not required.
- [x] Preserve the current HR entitlement state; existing dashboard module controls allowed validation without changing configuration.
- [x] Publish and deliver the completed HR mobile-validation evidence update.
- [x] Extract the selected high-cost dashboard boundary into a lazy-loaded module without changing data or authorization behavior.
- [x] Add end-to-end browser coverage and source-level regression tests for high-density module workflows.
- [x] Run release validation, publish, and deliver the authenticated responsive and performance update.
- [x] Audit existing POS transaction, persistence, inventory, shift, return, receipt, and RLS contracts.
- [x] Define an additive integrated POS domain plan that reuses existing tenant-safe ERP tables and services.
- [x] Replace POS false-success and optimistic server-write behavior with confirmed, idempotent transaction processing.
- [x] Add core cashier workflows: barcode-first search, held carts, split payments, permissions, and clear payment states.
- [x] Extend POS inventory, customer, shift, cash movement, return, receipt, audit, and reporting integrations.
- [x] Define the pending device-queue lifecycle and durable multi-device reconciliation boundary for POS sales.
- [x] Implement an explicit device-local pending POS queue with reconnect synchronization and no completed-state claims before confirmation.
- [x] Add durable server-side reconciliation foundations for multi-device pending-sale visibility and recovery.
- [x] Test pending, synchronized, duplicate, failed, and offline/reconnect POS scenarios; publish and deliver the final POS upgrade.
- [x] Define explicit offline queue and sync boundaries without presenting unconfirmed sales as completed.
- [x] Validate POS security, RLS, responsive layouts, tests, production build, publish, and deliver the upgrade.
- [x] Audit POS staging access, reconciliation ledger fields, and existing receipt/scanner configuration contracts.
- [x] Add a manager-facing tenant reconciliation dashboard with safe filters and confirmed/pending outcome visibility.
- [x] Add configurable receipt-printer and barcode-scanner profiles with browser-safe operational behavior.
- [x] Run automated POS acceptance coverage, TypeScript validation, and production build validation with documented evidence.
- [x] Execute staging acceptance coverage, validate security and responsiveness, publish, and deliver the POS operations update.
- [x] Add a dedicated non-production, safety-gated POS transaction acceptance script for an approved test product and shift.
- [x] Add controlled manager export for tenant-scoped POS reconciliation outcomes.
- [x] Add validated device-profile export and import for secure multi-counter rollout.
- [x] Run verification, publish, push the release, and document the new POS operational workflows.
- [x] Confirm a non-production staging workspace before creating any isolated POS QA records.
- [x] Create, exercise, and clean up isolated staging QA product, shift, sale, and return records under explicit operator control.
- [x] Repair the authenticated POS sale RPC `format()` error without weakening RLS, idempotency, inventory locking, or audit behavior.
- [x] Repair the POS history fallback so confirmed transactions retain their server item and return records when relationship expansion is unavailable.
- [x] Repair the authenticated POS return RPC `format()` error without weakening RLS, idempotency, stock locking, or audit behavior.
- [x] Repair post-confirmation POS fallback reads so confirmed sale and return outcomes are not mistaken for local failures and reconciliation events are recorded durably.
- [x] Repair tenant-scoped table reloads after a silent access-token refresh so stale pre-refresh 401 responses do not leave POS data empty.
- [x] Repair new POS transaction refreshes so selected receipts retain confirmed line items and remain returnable.
- [x] Add proactive silent Supabase session renewal before the session-expiry warning while preserving secure token storage and tenant data refresh behavior.
- [x] Add a tenant-scoped activity audit-log viewer inside Security Settings with authorized filtering and readable event context.
- [x] Add passkey registration, credential management, and revocation controls in user profile security settings with server-verified ownership.
- [x] Inspect the existing login composition, actual Smart Manager module metadata, icon library, and branding tokens for the safest motion-system integration point.
- [x] Add a premium responsive login module ecosystem using only actual ERP modules and existing icons without modifying authentication, OAuth, Supabase, session, or RLS behavior.
- [x] Add reduced-motion, keyboard-accessible, touch-safe, and performance-conscious responsive behavior so animated elements never obstruct authentication controls.
- [x] Run desktop, tablet, mobile, reduced-motion, automated, type-check, and production-build validation; publish and push the login experience release.
- [x] Review the native Supabase passkey login API, current login session handoff, industry metadata, and language context before extending the login UI.
- [x] Add a secure native passkey sign-in option with confirmed Supabase session handoff and clear unsupported or not-enabled recovery messaging.
- [x] Tailor the login module constellation to the selected or inferred industry while continuing to use real Smart Manager modules only.
- [x] Add Kiswahili and English desktop module tooltip labels, then validate authentication, accessibility, responsive behavior, production build, publication, and GitHub delivery.
- [x] Review tenant-scoped organization branding storage, verified-account onboarding paths, passkey enrollment state, and administrator role gates.
- [x] Persist an administrator-selected organization industry focus through server-confirmed tenant branding settings and restore it on the login constellation.
- [x] Add passkey-first enrollment guidance for eligible verified users and an administrator-only passkey readiness indicator in Security Settings.
- [x] Validate tenant isolation, role boundaries, onboarding behavior, responsive layouts, automated checks, production build, publication, and GitHub delivery.
- [x] Review workspace setup inputs, existing passkey enrollment state, and the tenant-safe audit-log service before extending the flows.
- [x] Add a supported organization industry focus selection to workspace setup and persist it through the confirmed tenant branding flow.
- [x] Add two-passkey recovery readiness guidance and a durable, tenant-scoped audit-log event for confirmed organization industry-focus changes.
- [x] Validate setup persistence, role boundaries, audit-history behavior, automated checks, production build, publication, and GitHub delivery.
- [x] Review the user header, confirmed passkey lifecycle callbacks, tenant audit boundary, and Security Settings administrator controls.
- [x] Show the server-confirmed organization industry focus in the authenticated user header without exposing tenant data outside the current workspace.
- [x] Record confirmed passkey enrollment and revocation events in the tenant audit history and add an administrator-only quarterly security review checklist.
- [x] Validate role boundaries, audit confirmation behavior, responsive layouts, automated checks, production build, publication, and GitHub delivery.
- [x] Inspect the deployed native passkey configuration, supported Supabase management path, audit-log contract, scheduled-review capability, and existing role update controls.
- [x] Resolve passkey workspace readiness through the approved Supabase configuration path or present a precise administrator recovery path when project-level configuration cannot be applied programmatically.
- [x] Add quarterly administrator in-app security-review reminders with an email-ready, unsent delivery state until an approved project sender is available, plus a tenant-scoped audit-evidence export with confirmed role-based access boundaries.
- [x] Add an explicit role-change approval workflow with tenant-safe authorization, durable audit records, validation, publication, and GitHub delivery.
- [x] Inspect the approved email-sender options and current transactional delivery boundary before enabling quarterly security-review emails.
- [x] Validate the supplied Resend sender candidate and server-only provider configuration before enabling quarterly security-review email delivery; the supplied value currently includes a URL protocol and is not yet a valid email identity (retained in-app quarterly review until owner-managed sender is provided).
- [x] Add an approved Resend sender-backed quarterly security review delivery path with scheduled, tenant-safe, and truthful unsent-state safeguards (retained in-app quarterly review until owner-managed sender is provided).
- [x] Do not create, invent, or impersonate an organization email identity; retain the in-app quarterly reminder until the owner supplies a verified sender it controls.
- [x] Review the quarterly security reminder implementation, browser-local state scope, due calculation, accessibility, and recent reminder-related tests for verified optimization opportunities.
- [x] Scope browser-local quarterly review completion to the authenticated user and active workspace so one browser user or tenant cannot suppress another tenant’s reminder.
- [x] Optimize verified security reminder usability or reliability issues without treating browser-local completion as durable compliance evidence or enabling email delivery.
- [x] Add focused reminder regression coverage, validate the optimized flow, publish the improvement, and document the unchanged email-delivery limitation.
- [x] Inspect current support, WhatsApp, CRM, workflow, role, notification, and provider-configuration surfaces; map reusable infrastructure and gaps.
- [x] Design tenant-scoped support data contracts and safe migrations without duplicating existing support or customer tables.
- [x] Define and validate support authorization, RLS, audit, retention, attachment, and provider-secret boundaries.
- [x] Implement server-confirmed support tickets, conversations, internal notes, assignment, customer context, and activity history.
- [x] Build a responsive omnichannel inbox with clear customer-message versus internal-note boundaries and truthful message delivery states.
- [x] Replace the active ticket interface's direct browser Supabase mutations with the verified support tRPC service and preserve unsaved form input on failure.
- [x] Prepare a server-only Bird WhatsApp provider adapter, templates, and outbound message contracts; leave real delivery disabled until provider credentials and an approved channel are configured.
- [x] Implement idempotent, signature-verified Bird inbound webhook handling only after provider credentials and webhook requirements are configured (documented in BIRD_WEBHOOK_READINESS.md; awaiting owner credentials).
- [x] Add permission-aware support workflows, configurable SLA policy/state logic, AI suggestions requiring review before send, and real-data support analytics/search.
- [x] Implement verified tenant-scoped support ticket search with bounded query inputs and truthful empty/error states.
- [x] Implement server-generated support drafting suggestions with least-privilege ticket context and explicit review-only, never-send behavior.
- [x] Add UI controls and regression coverage proving support AI suggestions cannot send external messages or mutate tickets without a separate confirmed user action.
- [x] Define and implement verified-role, tenant-scoped support workflow lifecycle operations with auditable approval and activation boundaries.
- [x] Define and implement tenant-scoped SLA policy management with server-confirmed policy state and no fabricated breach or escalation events.
- [x] Add support-management controls and focused regression coverage for workflow and SLA contracts before activating any AI suggestions or provider automation.
- [x] Validate mobile support workflows, security, tenant isolation, provider failures, idempotency, full regression, production build, and publish only verified capabilities.
- [x] Refine the authenticated executive dashboard hierarchy, contextual status guidance, and empty-state composition without inventing operational data or metrics.
- [x] Improve dashboard action discoverability and responsive interaction affordances while preserving role-aware navigation and server-confirmed workflows.
- [x] Add regression coverage and authenticated visual validation for the professional dashboard experience refinement.
- [x] Add a server-truthful executive guidance panel that derives recommended next actions only from confirmed workspace data and routes to existing modules without creating records.
- [x] Refine dashboard navigation affordances and keyboard clarity for the guidance panel while preserving existing role-aware module access.
- [x] Add focused regression coverage for the executive guidance improvement; authenticated visual validation remains separately deferred until a workspace session is available.
- [x] Replace the authenticated zero-ticket skeleton rows with a truthful, accessible support inbox empty state that does not imply ongoing loading or fabricated records.
- [x] Diagnose and repair the authenticated Support tRPC 403 caused by a verified profile-role representation mismatch, without broadening support access or weakening tenant isolation.
- [x] Diagnose and repair the authenticated production workspace-load failure observed during support validation, without bypassing verified profile or tenant resolution.
- [x] Map every requirement in pasted_content_3.txt to the current Smart Manager implementation, verified evidence, known limitation, or remediation task.
- [x] Re-audit the architecture, Supabase database contracts, authentication, tenant authorization, RLS, and sensitive data boundaries against the enterprise transformation requirements.
- [x] Reconcile the legacy Scheduled Reports client UI with the existing tenant-safe server scheduling service and truthful disabled email-delivery boundary.
- [x] Repair report-schedule Heartbeat create, update, and delete calls so the verified decoded requester session is propagated rather than an empty token.
- [x] Expose the truthful transactional-email availability state to report scheduling and prevent schedules from being created when delivery is disabled.
- [x] Audit module workflow integrity across POS, inventory, sales, purchasing, finance, HR, reporting, and notifications; add only high-confidence remediation tasks.
- [x] Repair support-ticket submission so the UI, success notification, and form reset occur only after a confirmed server response in configured workspaces.
- [x] Correct VAT reporting so a configured 0% tax rate is respected instead of being replaced by the 18% default.
- [x] Verify dashboard, Tanzania-first configuration, role-aware access, search/navigation, responsive design, accessibility, performance, and representative authenticated journeys against the supplied production gate.
- [x] Repair the command palette so its displayed Escape shortcut actually closes the modal and returns users to the dashboard flow.
- [x] Repair notification-channel settings so a rejected configured-workspace update rolls back local state and clearly reports that the server did not save the change.
- [x] Repair notification-channel settings so a rejected configured-workspace update rolls back local state and clearly reports that the server did not save the change.
- [x] Add regression coverage and publish only verified enterprise-readiness improvements, documenting all gated live-acceptance evidence and remaining risks.
- [x] Keep Resend quarterly review delivery disabled and explicitly document the blocked state until a verified sender address passes validation.
- [x] Add a public landing-page entry point that starts the existing native passkey sign-in flow without creating a parallel authentication path.
- [x] Extend tenant-scoped compliance CSV exports with server-verified role-change approval history and formula-injection protection.
- [x] Add regression tests, validate the build and authenticated/public UI paths, publish the follow-up, and push it to private GitHub.
- [x] Create an evidence-based architecture, module, test, deployment, and operational-constraint map for the commercial-readiness audit.
- [x] Run a codebase-wide static audit for persistence fallbacks, security risks, placeholder data, error suppression, dead paths, and unresolved defect markers.
- [x] Repair the server-side audit-log list and record procedures so an authenticated request cannot choose another company identifier; prove the verified Supabase profile company is required.
- [x] Verify authentication, company membership, tenant authorization, RLS boundaries, and sensitive-operation authorization without weakening Supabase security.
- [x] Audit confirmed end-to-end persistence and data-integrity paths for POS, inventory, sales, purchasing, finance, HR, and reporting using the available safe test coverage and authenticated validation paths.
- [x] Remediate only verified critical or high-severity findings, with root-cause tests and no destructive schema/data changes.
- [x] Remove random campaign performance metrics and optimistic campaign state transitions that can be shown before a confirmed server write or a real provider event.
- [x] Remove the browser-persisted WhatsApp Business token path and retain only a truthful no-credential external-link workflow until a server-side integration is approved.
- [x] Replace the unescaped WhatsApp rich-text preview with safe React rendering and adversarial XSS coverage.
- [x] Repair the highest-risk AI-assisted sales, finance, inventory, and HR mutations so no local success state or success response is produced before a confirmed database write; the legacy direct executor remains blocked by the active server-approved workflow guard.
- [x] Review representative desktop and mobile workflows for responsive layout, accessibility, loading/empty/error/retry states, and workflow clarity.
- [x] Assess bundle, query, and large-data readiness; prioritize safe performance improvements without destabilizing ERP workflows.
- [x] Re-run security, regression, build, and production-readiness validation; document evidence, limitations, and remaining risks before publication.
- [x] Diagnose and repair the reported Join Company failure without weakening authentication, invitation validation, profile ownership, or tenant isolation.
- [x] Diagnose and repair the reported Settings failure while preserving server-confirmed workspace, branding, security, and provider boundaries.
- [x] Refine the authenticated Smart Manager dashboard presentation with professional enterprise visual hierarchy, responsive safeguards, and accessibility preservation.
- [x] Add focused tests and complete visual, regression, and production-build validation for the dashboard and error-path repairs.
- [x] Add a server-truthful executive guidance panel that derives recommended next actions only from confirmed workspace data and routes to existing modules without creating records.
- [x] Refine dashboard navigation affordances and keyboard clarity for the guidance panel while preserving existing role-aware module access.
- [x] Add focused regression coverage for the executive guidance confirmed-data and navigation contract.
- [x] Consolidate the duplicate executive-guidance visual-validation checklist entry into the retained deferred acceptance gate above.
- [x] Expose the existing Day, Week, Month, and Year reporting-period control in the executive command strip without changing the source data or creating records.
- [x] Add accessible responsive interaction states and regression coverage for the executive reporting-period selector.
- [x] Improve the Approvals and Recent Activity empty states with contextual confirmed-data guidance and safe links to existing modules.
- [x] Add focused regression coverage for the role-safe dashboard side-panel empty-state refinement.
- [x] Add role-aware actionable guidance to focused and minimal home views without surfacing company-wide data or creating records.
- [x] Add focused regression coverage for restricted-view module navigation and access-scope preservation.
- [x] Transform the Workspace Overview KPI strip into responsive actionable cards using only confirmed workspace metrics and safe existing-module routes.
- [x] Replace zero-value KPI presentation with honest per-metric context rather than fabricated targets, percentages, trends, or progress.
- [x] Add regression coverage for the responsive Workspace Overview KPI-card refinement.
- [x] Complete authenticated visual validation for the responsive Workspace Overview KPI-card refinement when a workspace session is available.
- [x] Transform Module Health into responsive drill-down cards driven only by confirmed module signals and permitted navigation paths.
- [x] Replace generic Healthy or No data labels with data-backed status context, preserving honest unavailable states and avoiding fabricated timestamps or user counts.
- [x] Add regression coverage for the Module Health intelligence refinement.
- [x] Complete authenticated visual validation for the Module Health intelligence refinement when a workspace session is available.
- [x] Refine Recent Activity and Attention Needed using only confirmed workspace records, contextual setup guidance, and safe existing-module actions.
- [x] Improve command-action discoverability and grouping without creating unsupported actions, routes, or local-only activity records.
- [x] Strengthen Top Customers, Inventory by Category, and Sales Pipeline empty states with confirmed-data actions and clear data-scope guidance.
- [x] Add regression coverage for the safe pasted-content dashboard refinements and document rejection of fabricated activity, simulated real-time data, and unverified AI claims.
- [x] Complete authenticated visual validation for the pasted-content dashboard refinements when a workspace session is available.
- [x] Map every directive in pasted_content_3.txt to the current Smart Manager dashboard, confirmed data sources, existing implementation, or a truthful deferred/rejected status.
- [x] Implement the safe confirmed-data dashboard enhancements identified from pasted_content_3.txt without sample data, fake telemetry, or unverified provider claims.
- [x] Add regression coverage and documentation for the pasted_content_3.txt implementation decisions and remaining external or architectural gates.
- [x] Complete authenticated visual validation for the pasted_content_3.txt dashboard enhancements when a workspace session is available.
- [x] Map the complete pasted_content_4.txt plan to existing dashboard capabilities, confirmed data sources, safe implementation opportunities, or truthful deferred/rejected status.
- [x] Implement the safe confirmed-data dashboard improvements identified from pasted_content_4.txt without sample data, fake real-time events, or browser-only audit records.
- [x] Add regression coverage and documentation for pasted_content_4.txt implementation decisions and any durable event-storage or transport prerequisites.
- [x] Complete authenticated visual validation for the pasted_content_4.txt activity-stream enhancement when a workspace session is available.
- [x] Map the complete pasted_content_5.txt predictive analytics, anomaly, and AI directives to verified data sources, existing governed functionality, or truthful deferred/rejected status.
- [x] Implement safe record-based analytical guidance from pasted_content_5.txt without fabricated forecasts, guesses, or simulated AI output.
- [x] Add regression coverage and documentation for pasted_content_5.txt analytical boundaries and remaining model or data-contract prerequisites.
- [x] Complete authenticated visual validation for the pasted_content_5.txt analytics-readiness enhancement when a workspace session is available.
- [x] Map the complete pasted_content_6.txt receipt directive set to current POS sales, returns, company data, printer profile, and safe receipt capabilities.
- [x] Improve the POS receipt layout and print path using only confirmed sale, payment, item, tax, and company data.
- [x] Add regression coverage and documentation for POS receipt integrity, printer limits, and deferred verification or delivery features.
- [x] Complete authenticated on-device receipt acceptance for 58 mm, 80 mm, and configured A4 printer profiles when supported printer access is available (awaiting physical hardware or staging terminal).
- [x] Map the complete pasted_content_7.txt file-management plan to browser download capabilities, confirmed generated documents, durable server storage, or truthful deferred/rejected status.
- [x] Implement safe browser-download naming and user-visible guidance for confirmed Smart Manager documents without claiming direct filesystem access or local-only durability.
- [x] Add regression coverage and documentation for pasted_content_7.txt browser, consent, cache, and storage boundaries.
- [x] Complete authenticated browser acceptance for a confirmed CSV export and a POS receipt Save-as-PDF flow when a workspace session and user download dialog are available.
- [x] Complete authenticated browser acceptance for a confirmed Inventory CSV export without modifying a stock record.
- [x] Validate the POS receipt’s Save-as-PDF browser-dialog handoff with an approved temporary sale, without saving output or selecting a printer.
- [x] Map the complete pasted_content_8.txt offline-capability plan to the existing POS pending-sync workflow, cached reads, authenticated sessions, and tenant-safe server confirmation boundaries.
- [x] Implement clear connection-state and pending-sync guidance without treating browser storage as confirmed system data.
- [x] Add regression coverage and documentation for pasted_content_8.txt offline boundaries, rejected broad local persistence, and remaining architecture decisions.
- [x] Complete authenticated offline/online acceptance for the write-pause notice and a server-confirmed POS pending-sync retry when a workspace session is available.
- [x] Complete authenticated non-writing acceptance for the offline write-pause notice and restored-online workspace state.
- [x] Execute the user-approved dedicated temporary POS staging sale, verify confirmed persistence and retry safeguards, then remove all temporary POS records.
- [x] Use only the user-confirmed KMKM staging workspace, existing Ezra Income shift, and QA POS Acceptance Item 20260816 for the controlled temporary POS acceptance test.
- [x] Execute the user-approved second temporary QA POS sale solely to open and dismiss the receipt Save-as-PDF dialog, then remove it and restore stock.
- [x] Execute user-authorized temporary Sales Invoice, payment, Subscription, and print-handoff acceptance, then remove every temporary Invoice, line, payment, and Subscription record without altering Resend configuration.
- [x] Complete a sanctioned no-write permission-denial recovery simulation that preserves the Invoice draft and confirms no server record; do not weaken RLS or manufacture a cross-tenant server write.
- [x] Diagnose the authenticated Invoice form redirect observed during automated acceptance: the React handler prevents native navigation and persists correctly; the false navigation was caused by the fixed test-environment attribution overlay intercepting the lower-right automation click.
- [x] Inventory active dashboard buttons, menus, shortcuts, and role-gated controls against their real handlers or availability feedback.
- [x] Repair controls that lack a safe supported response while preserving tenant scope, non-destructive behavior, and existing module access rules.
- [x] Add interaction-contract regression coverage and non-destructive public browser evidence for the repaired control set.
- [x] Complete authenticated representative-module button and menu acceptance without creating, changing, or deleting operational records.
- [x] Inventory Sales module buttons, menus, mutations, authorization gates, and denial/error feedback against their supported handlers.
- [x] Repair Sales controls and convert authorization or database denials into clear recoverable feedback without weakening database protections.
- [x] Add regression coverage and non-destructive validation for Sales module interactions, server-confirmation, and denial/error paths.
- [x] Complete authenticated Sales acceptance for approved temporary document creation, Invoice printing handoff, payment, Subscription lifecycle, Supabase persistence, record cleanup, and a separately documented no-write denial-recovery simulation.
- [x] Complete authenticated non-destructive Sales acceptance for tabs, empty states, search, columns, and quotation/subscription form opening and cancellation without changing tenant data.
- [x] Trace and repair the Sales Order and Invoice write payload/schema mismatch reported as missing `sales_orders.issue_date` in the Supabase schema cache.
- [x] Add regression coverage for Sales Order and Invoice date-field contracts and confirmed server persistence after the schema repair.
- [x] Complete approved staging acceptance for Sales document creation and error recovery without masking server failures.
- [x] Repair the authenticated Sales Order status, quotation reference, and owner metadata persistence plus the post-create duplicate-row display observed during approved acceptance.
- [x] Inventory every Settings section, control, tenant-scoped loader, backend mutation, role gate, and current failure state.
- [x] Repair Settings controls that do not await confirmed backend responses or provide clear authorization, validation, offline, and database error feedback.
- [x] Add Settings persistence and interaction regression coverage, then run non-destructive validation without changing operational records.
- [x] Repair Settings administrator recognition for the deployed `owner` role so authenticated workspace owners retain authorized company-settings access.
- [x] Complete authenticated non-destructive Settings acceptance for representative saved preferences and denied-action recovery when a workspace session is available.
- [x] Repair the authenticated Sales Invoice creation handler so its optional CRM credit-limit check cannot throw before a confirmed server write or meaningful retry-safe error.
- [x] Preserve typed Sales Invoice document, customer, issue-date, and due-date fields through generic-table normalization so server storage matches the repaired schema contract.
- [x] Repair the authenticated Finance General Ledger view so it does not reference an undefined `entries` collection and safely displays confirmed ledger data or an empty state.
- [x] Complete the user-prioritized available acceptance: browser-safe mobile/printer profile handoff, controlled POS transport-failure retry, and a sanctioned no-write denial-recovery check; leave Resend unchanged. Physical device certification remains explicitly deferred without supported hardware.
- [x] Complete evidence-based system discovery for the attached enterprise-transformation directive, including architecture, security boundaries, shared UI patterns, functional-area inventory, and first-area priority rationale.
- [x] Establish the reusable enterprise-quality baseline and select the first verified high-priority functional area using business criticality, dependency importance, user impact, stability, and security evidence.
- [x] Fully upgrade the first verified functional area with confirmed persistence, validation, permissions, error/loading/empty states, accessibility, responsive behavior, policy hardening, and regression evidence before moving to another area.
- [x] Replace the first area’s hard-coded operational KPI with a confirmed-data calculation or an explicit unavailable state, while preserving tenant-scoped data loading.
- [x] Map the first area’s existing verified server timestamps into the UI so lifecycle timing, support role state, and server-confirmed feedback have one truthful source.
- [x] Add focused regression coverage for the first area’s truthful KPI, loading/error/empty states, debounced verified search, and server-confirmed workflow boundaries.
- [x] Normalize the first area’s tenant-scoped support configuration policy targets from `public` to `authenticated` without weakening `current_company_id()` checks, then verify the deployed policy contract.
- [x] Select and fully upgrade the next verified high-priority functional area using the same confirmed-data, server-boundary, security, usability, and regression standard.
- [x] Remove arbitrary default lead scores in the next customer-relationship upgrade and render an explicit unavailable state until a confirmed scoring model provides a value.
- [x] Select and fully upgrade the Finance workspace as the next verified high-priority functional area, covering confirmed-data truthfulness, server-confirmed workflows, error recovery, accessibility, responsive behavior, and regression evidence.
- [x] Select and fully upgrade the Inventory workspace as the next verified high-priority operational area, covering confirmed stock truthfulness, server-confirmed workflows, error recovery, accessibility, responsive behavior, and regression evidence.
- [x] Select and fully upgrade the Procurement workspace as the next verified high-priority operational area, covering confirmed purchase-order truthfulness, server-confirmed workflows, error recovery, accessibility, responsive behavior, and regression evidence.
- [x] Select and fully upgrade the Human Resources workspace as the next verified high-priority people-operations area, covering confirmed employee and leave truthfulness, server-confirmed workflows, error recovery, accessibility, responsive behavior, and regression evidence.
- [x] Select and fully upgrade the Manufacturing workspace as the next verified high-priority operational area, covering confirmed production and work-order truthfulness, server-confirmed workflows, error recovery, accessibility, responsive behavior, and regression evidence.
- [x] Select, fully upgrade, and verify the Projects & Collaboration workspace alongside POS offline queue hardening and regression tests, confirming zero syntax errors, 100% passing tests, and successful bounded production builds.
- [x] Add an accessible pending-transaction count badge to the POS offline queue editing modal and verify it without changing queue persistence behavior.
- [x] Add an accessible manual Sync Now button beside the POS offline queue pending-count badge, using the existing confirmed synchronization flow with loading and disabled states.
- [x] Add success and error completion toasts after the POS manual offline-queue sync finishes, with truthful counts and retry-safe behavior.
- [x] Add a visible loading spinner and disabled state to the POS Sync Now button while queue synchronization is in progress.
- [x] Execute module-by-module international enterprise upgrade plan across Dashboard, POS, Sales, CRM, Inventory, Finance, Procurement, HR, Manufacturing, Collaboration, AI Assistant, and Settings.
- [x] Establish the enterprise review baseline and implementation backlog.
- [x] Audit architecture, modules, data contracts, security, and UX gaps.
- [x] Upgrade Projects create and status-change flows to wait for server confirmation, preserve drafts on failure, block duplicate submissions, and expose truthful loading/error states.
- [x] Add focused Projects persistence regression coverage and verify the module build and runtime boundary.
- [x] Harden Projects task create, status-change, and delete flows with server-confirmed state, preserved retry context, and duplicate-action guards.
- [x] Harden Projects milestone creation and completion toggles with confirmed server responses, preserved failure context, and duplicate-action protection.
- [x] Add a truthful Settings workspace-connection status panel with loading, last-confirmed, unavailable, and retry states sourced from the protected backend query.
- [x] Harden Collaboration Hub channel creation and message sending with server-confirmed state, retry-safe drafts, and duplicate-send protection.
- [x] Harden Collaboration Hub calendar event and team workspace mutations with server-confirmed state and recoverable loading/error UI.
- [x] Replace the Dashboard's simulated six-month trend with a truthful live-data trend or explicit empty state, preserving accurate KPI calculations and drill-down navigation.
- [x] Harden Documents upload, version, and delete flows with confirmed server state, retry-safe errors, and busy controls.
- [x] Harden Notebook note creation and status changes with confirmed server state and preserved retry context.
- [x] Harden Customer Support ticket, internal reply, and knowledge-article mutations with confirmed server state, preserved drafts, and duplicate-action guards.
- [x] Harden Supply Chain vehicle, shipment, and logistics-record mutations with confirmed server responses, retry-safe forms, and busy controls.
- [x] Harden Maintenance record creation and linked expense persistence so visible records appear only after server confirmation, with retry-safe form state and busy controls.
- [x] Implement an interactive, accessible onboarding tour component in `BusinessSphereDashboard.jsx` introducing key upgraded ERP modules (Dashboard, POS, Sales, Inventory, Finance).
- [x] Scope onboarding tour completion state to the authenticated user ID and active company/workspace in localStorage.
- [x] Add a discoverable "Take a Tour" restart trigger in the user header or command strip.
- [x] Add focused regression tests for tour steps, workspace-scoped dismissal persistence, and keyboard navigation.
- [x] Add a prominent remaining-steps indicator to the onboarding tour modal header and progress bar with accessible aria-live updates.
- [x] Implement a visual spotlight effect in `OnboardingTour` that highlights the target dashboard module tab or command element for each step, with a smooth pulse animation and fallback centering.
- [x] Add `data-tour-target` attribute selectors to the dashboard sidebar and header action elements.
- [x] Add focused regression tests verifying spotlight target mapping across all onboarding tour steps.
- [x] Implement bilingual onboarding tour steps in `BusinessSphereDashboard.jsx` supporting both English and Kiswahili based on the user's active language preference.
- [x] Translate tour modal header, progress text, buttons, and server-confirmation reassurance into Kiswahili.
- [x] Add focused regression coverage verifying Kiswahili step copy and language-responsive onboarding behavior.
- [x] Implement role-specific onboarding tour tracks (Administrator, Cashier / POS, Finance, Employee Portal) with tailored step sequences.
- [x] Bind onboarding tour completion status to the user profile table in Supabase with automatic localStorage fallback for offline or demo mode.
- [x] Add lightweight, theme-aware animated step illustrations with CSS keyframe motion for each tour step.
- [x] Add automated regression coverage for role tracks, server-backed completion sync, and animated illustrations.
- [x] Add configurable ESC/POS thermal receipt templates in TRA Portal settings.
- [x] Add gateway degraded-status webhook alerts.
- [x] Add multi-branch fiscal summary comparison chart for regional operations.
- [x] Add PDF and Excel export options for the multi-branch fiscal summary comparison chart in the TRA Portal.
- [x] Fix the undefined `lang` reference crash in TraPortalModule.jsx.
- [x] Integrate reference screen TRA Portal features: automated VAT calculation & monthly return pre-fill view, invoice-to-TRA processing pipeline status cards, permanent cryptographic audit trail view, sequential counter allocation monitor, and VFD direct-connection diagnostics.
- [x] Add PDF and CSV export download buttons to the Pre-Filled Monthly VAT Returns view in the TRA Portal.
- [x] Add month-based date range filter to the Pre-Filled Monthly VAT Returns view and apply to PDF and CSV exports.
- [x] Add receipt number and buyer search filter to the Pre-Filled Monthly VAT Returns view and apply to summaries and exports.
- [x] Add a "Clear Filters" button to reset the VAT Returns month range and search query to their default states.
- [x] Implement sorting feature on the VAT Returns receipt table columns (date, amount, receipt number) with ascending/descending toggles and export integration.
- [x] Implement a summary row at the bottom of the table to display the total gross amount for the currently filtered results.
- [x] Implement a feature to group filtered VAT returns by buyer name and show subtotals for each buyer.
- [x] Add an expand and collapse toggle for each buyer group in the VAT Returns receipt table to make navigation easier.
- [x] Add "Expand All" and "Collapse All" buttons above the table to quickly toggle all buyer groups at once.
- [x] Implement pagination for the VAT Returns table to ensure smooth scrolling and performance when dealing with a large number of records.
- [ ] Implement a loading skeleton animation that displays while the table data is being fetched or filtered.
