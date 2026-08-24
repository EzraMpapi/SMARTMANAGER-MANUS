## Mobile Visual E2E, Email Link Check & Touch Telemetry
- [x] Audit signup visual test conventions, Collaboration Hub email links, and touch/error telemetry boundaries.
- [x] Implement mobile signup visual end-to-end test spec.
- [x] Implement automated link-check spec for Collaboration Hub email templates and attachments.
- [x] Integrate touch-interaction context into privacy-safe client runtime telemetry.
- [x] Run focused test suite, full regression suite, type/build checks, and save published checkpoint.

## Collaboration Hub Email Live Template Preview
- [x] Audit Collaboration Hub email composer, templates, dynamic fields, and send boundaries.
- [x] Implement live email-template preview toggle and responsive rendered view with placeholder interpolation.
- [x] Add regression test spec covering email template preview rendering and send isolation.
- [x] Run test suite, low-memory production build, and save published checkpoint.

## Branded Signatures, PDF Attachment Previews & Rich-Text Styling
- [x] Audit current email preview, company branding fields, attachment state, and rich-text/template boundaries.
- [x] Implement tenant-branded signature banner with logo and contact details in live email preview.
- [x] Implement local PDF attachment drop/upload simulation and preview pane in Collaboration Hub.
- [x] Implement rich-text formatting helper controls (bold, italic, list) and automated test coverage.
- [x] Run focused tests, full regression suite, production build, and save published checkpoint.

## Collaboration Hub Workflow Alerts, Signature Logo & Link Validation
- [x] Audit existing email draft/export actions, notification delivery boundaries, tenant branding persistence, and rich-text link handling.
- [x] Implement tenant-isolated dispatch webhook alert contracts for branded email template saves and exports, with disabled/unconfigured states handled safely.
- [x] Add administrator-facing controls and status feedback for template workflow alert configuration without exposing secrets in the browser.
- [x] Extend workspace branding with a dedicated signature logo upload, validation, storage reference, preview, replacement, and removal flow.
- [x] Add hyperlink validation for rich-text template links, including safe protocols, malformed URL feedback, and preview/send boundary protection.
- [x] Add focused Vitest coverage for webhook event contracts, signature logo validation/storage, and rich-text hyperlink validation.
- [x] Run focused tests, full regression suite, and low-memory production build.
- [x] Complete authenticated responsive Collaboration Hub Email verification.
- [x] Review this checklist and save the published checkpoint.

## Collaboration Hub Email Runtime Follow-up
- [x] Investigate and fix the newly surfaced `showCont is not defined` crash when opening the Email tab in the published deployment.
- [x] Add a mounted EmailCenter regression test and re-run focused/full tests.
- [x] Capture authenticated Collaboration Hub Email screenshots at desktop and mobile sizes after the published runtime is corrected.
- [x] Mark the complete verification and checkpoint items after the affected flow is validated.

## Published Authentication Bootstrap Follow-up
- [x] Diagnose why the latest published `/app` remains on `Preparing Smart Manager` instead of resolving the authenticated workspace gateway.
- [x] Correct the bootstrap/auth loading boundary without weakening tenant or session security.
- [x] Add regression coverage for the bootstrap failure mode and re-run focused/full tests and build verification.
- [x] Publish and re-verify live Collaboration Hub Email at desktop and mobile sizes after the bootstrap fix.

## Finance Payable Save Failure Follow-up
- [x] Trace the mobile Record Expense form, Finance persistence procedure, generated schema, and database schema-cache mismatch.
- [x] Document the incident and choose a tenant-safe correction for the missing `finance_expenses.data` column.
- [x] Apply the database/schema compatibility correction and harden the expense save boundary without destructive data changes.
- [x] Add focused regression coverage for expense recording and schema compatibility.
- [x] Run focused/full tests, TypeScript checks, and low-memory production build.
- [x] Re-verify the authenticated published Payables submission after publishing this schema-envelope fix.
- [x] Review todo.md, save the final published checkpoint, and deliver the fix.
- [x] Remove the unsupported `finance_expenses.cost_center` field from the live Payables insert payload, add regression coverage, republish, and re-run the authenticated save verification.
- [x] Remove the unsupported `finance_expenses.department` field from the live Payables insert payload and form, extend regression coverage, republish, and repeat live verification.

## Server-Side Supabase Schema Drift Gate
- [x] Implement a server-side schema contract validator (`server/schemaDriftChecker.ts`) that inspects critical tables (`finance_expenses`, `sales_invoices`, `inventory_items`, `crm_leads`) and rejects unsupported column payloads or missing required relational columns.
- [x] Add comprehensive automated Vitest coverage for schema contract validation (`server/schemaDriftChecker.test.ts`).
- [x] Integrate the schema contract check into the automated build/prepublish validation flow.
- [x] Run full test suite, verify TypeScript type safety, and save the final published checkpoint with schema-drift protection enabled.
- [x] Fix the schema validator’s TypeScript downlevel compatibility issue, then rerun the full suite, check, build, and publish verification.

## Active Server-Side Drift Rejection & Expanded Coverage
- [x] Wire `assertPayloadContract` into server-side persistence procedures (e.g., finance expense recording, sales document mutation, and inventory inserts) so drifted payloads are actively rejected at the API boundary.
- [x] Expand `server/schemaDriftChecker.test.ts` to comprehensively cover all four critical tables (`finance_expenses`, `sales_invoices`, `inventory_items`, `crm_leads`), unknown table handling, and additive-column warning/pass behavior.
- [x] Run full test suite, verify TypeScript type safety, and save the final published checkpoint with active drift rejection enabled.
- [x] Fix the Zod 4 router input schema compatibility error, then rerun the full suite, TypeScript check, build gate, and publication verification.

## Direct Server Mutation Boundary Wiring
- [x] Inspect and wrap server-side query/mutation helpers in `server/db.ts` or persistence modules with `assertPayloadContract` for `finance_expenses`, `sales_invoices`, `inventory_items`, and `crm_leads`.
- [x] Add explicit unit tests verifying that real server mutation helpers reject drifted payloads before hitting the database or network.
- [x] Run full regression suite, TypeScript check, pre-build verification, and publish the final protected checkpoint.

## Production Persistence Routing & Live Mutation Verification
- [x] Connect the client-side Finance Record Expense form and other critical ERP insert mutations to `persistSupabaseCriticalRow` so client writes automatically benefit from schema contract rejection.
- [x] Add explicit integration tests proving valid client-submitted payloads succeed while drifted client-submitted payloads are rejected by the guarded server boundary.
- [x] Save checkpoint, publish, and perform live end-to-end verification of the guarded persistence path.
- [x] Update stale Finance integration fixtures that still include the removed department field, then rerun focused/full tests and build verification.
- [x] Fix production packaging so the server-side schema validator does not depend on an unbundled runtime JSON file, then republish and verify startup.

## Complete Guarded Write Routing & Runtime Server Integration
- [x] Ensure all direct `sb(...).insert` calls for critical tables (`finance_expenses`, `sales_invoices`, `inventory_items`, `crm_leads`) in `BusinessSphereDashboard.jsx` route through the guarded client helper.
- [x] Implement a runtime tRPC integration test using `appRouter.createCaller` to prove valid payloads pass and drifted payloads are rejected across all four critical tables.
- [x] Save checkpoint, publish, and perform live verification of the guarded persistence path.

## Bulk-Safe Guarded Inserts & All-Table Runtime Caller Coverage
- [x] Upgrade `sb(...).insert` builder to support bulk array payloads safely through guarded server mutations.
- [x] Expand `server/guardedServerBoundary.test.ts` to cover `finance_expenses`, `sales_invoices`, `inventory_items`, and `crm_leads` with both valid and drifted payloads.
- [x] Add a regression test proving a guarded multi-row `crm_leads` insert preserves and submits every row.

## Live CRM Bulk Contract Correction
- [x] Reproduce the published CRM two-row import failure and capture the server contract report showing raw relational keys bypassed normalization.
- [x] Normalize generic critical insert rows before routing them through the tenant-scoped guarded server mutation.
- [x] Restore the generic `crm_leads` contract manifest and add regression coverage for generic and relational-shaped bulk rows.
- [x] Re-run focused/full tests, the Supabase OpenAPI gate, TypeScript validation, and the low-memory production build.
- [x] Publish the correction and re-verify Finance and CRM guarded writes in the live workspace.

## Signup Flow Persistence and Automated Progression Coverage
- [x] Audit the signup wizard state and identify safe non-secret fields for session-scoped recovery.
- [x] Persist and restore incomplete account, company, branch, and selected-module data without retaining passwords, confirmations, logo files, or company join codes.
- [x] Add automated three-step signup progression coverage for account, company, and module-selection states.
- [x] Run focused/full tests, schema verification, type checks, production build, and responsive signup verification.

## Signup Interaction Coverage, Draft Control, and Loading Performance
- [x] Inspect the public signup runtime, test tooling, and production bundle boundaries.
- [x] Add browser-driven interaction coverage for completing each valid signup step without creating a real account.
- [x] Add an accessible user-controlled action to discard a saved onboarding draft and reset the setup form.
- [x] Code-split safe application boundaries to reduce the initial JavaScript payload without changing protected workspace behavior.
- [x] Run focused/full tests, TypeScript and schema gates, optimized build analysis, responsive browser verification, and publish the checkpoint.

## Isolated Signup Completion, Feature Loading, and CI
- [x] Inspect existing signup completion boundaries, high-cost module mounting points, and the configured GitHub repository state.
- [x] Add an opt-in isolated test mode that proves successful post-signup completion without allowing a browser test to contact the production tenant.
- [x] Add authenticated browser coverage for the isolated post-signup completion state and tenant-safety controls.
- [x] Move selected high-cost dashboard workspaces behind feature-level lazy boundaries while preserving navigation and loading feedback.
- [x] Create a GitHub Actions workflow that runs unit tests, type checks, schema verification, production build, and the browser journey.
- [x] Run complete local quality gates, verify CI configuration, review responsive behavior, and publish the checkpoint.

## Final Isolated Session and Lazy-Workspace Verification
- [x] Add a tenant-safe authenticated-session browser contract for the completed signup state without external authentication or production tenant writes.
- [x] Extract one additional high-cost dashboard workspace behind a dedicated lazy boundary and visible loading fallback.
- [x] Capture responsive verification for the final signup success state and the added workspace fallback.
- [x] Re-run quality gates, save the final checkpoint, and synchronize the CI workflow to the requested GitHub repository.

## Visible Lazy Workspace Completion
- [x] Extract an additional high-cost workspace module behind a `lazy()` boundary with a visible loading fallback.
- [x] Add desktop and mobile browser verification for the new workspace loading fallback.

## Smart Manager Launch Session Recovery
- [x] Trace the erroneous “Your session has expired” launch error through stored-token refresh and company-join handling.
- [x] Fix the launch boundary so a recoverable session is refreshed or routed truthfully without creating cross-tenant access.
- [x] Add regression coverage for valid refresh recovery, terminal expiry, and company-join error mapping.
- [x] Run focused/full tests, schema and type checks, production build, browser launch verification, and publish the correction.

## Launch Session Recovery Completion
- [x] Add direct user-facing company-join error mapping coverage for invalid codes, cross-company membership, and terminal session expiry.
- [x] Add browser verification for the Smart Manager launch/session-recovery path without exposing or using a production tenant session.
- [x] Publish the corrected launch-session checkpoint after the additional verification.

## Launch Session Recovery Publication
- [x] Save and publish the verified Smart Manager launch-session recovery correction.

## Session Recovery Experience
- [x] Inspect current launch recovery states and privacy-safe telemetry boundaries.
- [x] Add an in-app retry action for recoverable session launch failures without changing tenant scope.
- [x] Add short, non-sensitive diagnostic codes only for terminal session failures.
- [x] Record refresh success, retryable failure, and terminal failure outcomes without credentials, tokens, email addresses, or tenant identifiers.
- [x] Add focused and browser regressions; run complete quality gates and publish the improvement.

## Terminal Diagnostic Publication
- [x] Restrict user-facing diagnostic code display to terminal sign-in/session expiry states.
- [x] Re-run targeted verification and publish the finalized session recovery experience checkpoint.

## Session Recovery Experience Publication
- [x] Save and publish the completed terminal-only diagnostic and privacy-safe session recovery experience release.

## Healthcare Module Rebuild
- [x] Inventory the existing healthcare workspace, routes, data contracts, and supplied visual references.
- [x] Define tenant-safe clinical data and role access boundaries for patient, clinical, and financial workflows.
- [x] Rebuild the healthcare navigation, operational dashboard, and responsive design system to match the supplied references.
- [x] Connect patient registration, appointment, doctor, clinical record, vitals, diagnosis, and prescription CRUD workflows.
- [x] Connect laboratory, pharmacy, billing, insurance, reports, notifications, and role-aware actions.
- [x] Add accessible validation, search/filtering, loading, empty, error, and success states across healthcare workflows.
- [x] Add unit and browser coverage, run production quality gates, review responsive layouts, and publish the integrated Healthcare Module.
- [x] Route all Healthcare Clinic reads and writes through the verified tenant-safe healthcare server routes rather than direct or local-only mutations.
- [x] Apply role-aware UI gating and safe permission-error handling for front desk, clinician, laboratory, pharmacy, billing, and clinic-administrator actions.
- [x] Add integration and browser coverage that proves cross-company and unauthorized healthcare actions are rejected without exposing clinical data.
- [x] Add confirmed archive workflows for patients, appointments, clinical visits, vitals, and prescriptions with protected tenant-scoped persistence and recovery states.
- [x] Add focused create, read, update, and archive coverage for each patient-care workflow, including permission-denied and record-not-found behavior.
- [x] Add a complete tenant-safe insurance claim workflow with status transitions, claim actions, and validation.
- [x] Add healthcare-specific notification workflows and visible states for clinical, laboratory, pharmacy, billing, and insurance events.
- [x] Complete and test role-aware healthcare action gating and permission-denied recovery for reception, clinical, laboratory, pharmacy, billing, and clinic administration.
- [x] Add direct protected-router integration plus isolated mocked browser UX coverage across diagnostics, pharmacy, billing, insurance, reports, and clinical notifications.
- [x] Add explicit clinician-directory and diagnosis workflow coverage proving create, read, update, and archive behavior end-to-end.
- [x] Add focused permission-denied browser or integration coverage for clinician, laboratory, pharmacy, billing, and clinic-administrator healthcare boundaries.
- [x] Add protected healthcare-router integration coverage for diagnostics, pharmacy, billing, insurance claims, reports, and notifications without relying on browser response mocks.
- [x] Add a protected-router cross-company healthcare access test that proves no foreign-company record is returned or mutated.
- [x] Add protected healthcare record-not-found coverage for update and archive actions, plus patient-care permission-denied assertions where applicable.
- [x] Distinguish isolated mocked browser UX coverage from direct protected-router integration coverage in the Healthcare release checklist.
- [x] Add an explicit clinic-administrator allowed-workflow integration test to document the administrator boundary.
- [x] Add per-workflow record-not-found coverage for patient, appointment, visit/diagnosis, vital, prescription, and clinician routes.
- [x] Add per-workflow archive not-found coverage for patient, appointment, visit/diagnosis, vital, prescription, and clinician routes.
- [x] Add per-workflow read, update, or archive permission-denied coverage for patient-care roles beyond create-path denials.
- [x] Restore the direct Playwright test-runner dependency required by Healthcare browser regression coverage.
- [x] Save and publish a dedicated Healthcare Module release checkpoint after the completed quality gates.

## Healthcare Interoperability, Reminders, and Analytics
- [x] Inventory existing clinical export utilities, reminder delivery boundaries, appointment data, and clinician analytics inputs.
- [x] Define a tenant-safe FHIR export profile and clinical-resource mapping for Healthcare records.
- [x] Implement permission-gated FHIR-compatible clinical exports with validation and download flows.
- [x] Build responsive clinician workload and patient wait-time analytics with clear filters and operational drill-downs.
- [x] Add tenant-safe appointment-reminder configuration, consent-aware delivery records, and an approved SMS provider boundary.
- [x] Add an idempotent scheduled reminder dispatch handler with retry-safe records and delivery status recovery.
- [x] Add unit, integration, and browser coverage for FHIR exports, clinician analytics, and appointment reminder workflows.
- [x] Run full production quality gates, validate responsive views, and publish the healthcare enhancements.
- [x] Register reminder settings and delivery tables in the Healthcare permission registry and Supabase schema contract.
- [x] Implement an administrator-controlled reminder configuration UI with clear provider-unconfigured, consent, lead-time, and delivery-history states.
- [x] Implement a tenant-scoped idempotent dispatch boundary that never attempts an SMS delivery without approved provider credentials.
- [x] Add protected router and browser coverage for reminder access, configuration, delivery-history visibility, and inactive-provider safety.

## Healthcare SMS Consent and Delivery Monitoring
- [x] Add patient-level SMS consent status, capture timestamp, method, and revocation fields to the tenant-safe patient contract and registration workflow.
- [x] Add provider-adapter readiness, delivery webhook authentication, idempotent status processing, and tenant-safe delivery-status persistence boundaries.
- [x] Add consent and delivery-status visibility to the Healthcare workspace without exposing phone numbers, message content, or provider secrets.
- [x] Add unit, protected-router, and browser coverage for consent capture, consent-gated delivery eligibility, webhook idempotency, and inactive-provider safety.
- [x] Run complete quality gates and publish the verified Healthcare SMS-consent enhancement.

## Patient Self-Service SMS Consent Settings
- [x] Verify the authenticated patient-to-clinical-record linkage and define a fail-closed self-service access rule.
- [x] Add protected self-service consent view, grant, update, and revoke procedures with tenant isolation and audit-safe timestamps.
- [x] Build a responsive patient-facing SMS preference settings page with clear inactive-provider disclosure and revocation feedback.
- [x] Add unit, protected-route, and browser coverage for self-service consent access, updates, revocation, and unauthorized-record denial.
- [x] Run complete quality gates and publish the verified patient consent settings page.

## Clinic Portal Reference Reconciliation
- [x] Define clinic-staff authorization, safe candidate data, and fail-closed matching rules for patient portal reference resolution.
- [x] Add protected tenant-scoped search, unlinked-patient list, portal-reference link, and clear-reference procedures with audit-safe actions.
- [x] Build a responsive clinic staff dashboard for searching patients, viewing unlinked records, linking a portal reference, and safely clearing an incorrect reference.
- [x] Add unit, protected-router, and browser coverage for staff authorization, tenant isolation, link, clear, and unlinked-state behavior.
- [x] Run complete quality gates and publish the verified clinic portal-reference reconciliation dashboard.

## Clinic Reconciliation Import, Approval, and Daily Summary
- [x] Confirm the daily summary delivery approach and keep automated scheduling inactive until its recipient and activation choice are approved.
- [x] Add tenant-safe CSV parsing, row validation, duplicate detection, staged import review, and explicit apply actions for vetted portal references.
- [x] Add supervisor approval requests for portal-reference replacements, with protected approval, rejection, and immutable audit-safe status transitions.
- [x] Build the staff import-review and supervisor approval controls plus clinic-administrator reconciliation summary visibility.
- [x] Add unit, protected-router, and browser coverage for CSV validation, staged apply, approval isolation, and summary authorization.
- [x] Run complete quality gates, publish the reconciliation enhancements, and activate a daily schedule only after the delivery approach is confirmed.

## Clinic Reconciliation Error Export, Audit Search, and Daily Email
- [x] Confirm approved recipient scope, local delivery time, and user authorization before activating daily reconciliation email delivery.
- [x] Support both automatic role-based recipients and an administrator-managed approved recipient list while keeping delivery disabled until final confirmation.
- [x] Add privacy-safe CSV export of rejected or invalid staged import rows with row number, MRN, status, and validation reason only.
- [x] Add supervisor decision notes and tenant-safe reconciliation audit search across staged import and approval outcomes.
- [x] Build the export and searchable audit controls in the clinic reconciliation workspace.
- [x] Add unit, protected-router, and browser coverage for error export, decision-note persistence, audit isolation, and recipient authorization.
- [x] Run complete quality gates and publish the improvements while retaining the inactive email schedule until explicit user approval.

## Daily Reconciliation Email Activation
- [x] Inspect the persisted recipient settings, active-clinic recipient resolution, and existing scheduled-email delivery contracts.
- [x] Add an idempotent tenant-safe daily reconciliation email dispatch handler and persisted schedule lifecycle state.
- [x] Add clinic-administrator schedule status, next-run, and privacy-safe delivery-history visibility.
- [x] Add unit, protected-router, and browser coverage for authorized schedule activation, idempotent delivery, recipient isolation, and failure recovery.
- [x] Run complete quality gates, publish the callback implementation, and activate the approved 10:38 Africa/Dar_es_Salaam daily schedule.

## Published Workspace Server Error Follow-up
- [x] Diagnose and correct the server error reported while accessing the published workspace.
- [x] Add regression coverage for the identified failure and re-verify the affected published workflow.

## Production Microfinance Module
- [x] Audit the current Microfinance workspace, backend contracts, persisted data, role model, calculations, and navigation boundaries.
- [x] Define tenant-safe borrower, KYC, group, loan, savings, repayment, collections, cash, commission, receipt, notification, reporting, and audit data contracts.
- [x] Implement protected microfinance APIs, calculations, validations, approvals, transaction workflows, and tenant-scoped persistence.
- [x] Build responsive connected dashboards and CRUD interfaces for borrower, loan, savings, collections, cash-management, staff-agent, report, and notification workflows.
- [x] Add Tanzania-ready TZS, local-date, mobile-money-ready integration boundaries, statements, receipts, PAR/overdue analytics, and role-aware operational controls.
- [x] Add unit, protected-router integration, and browser coverage for critical microfinance customer-to-repayment workflows and permission isolation.
- [x] Run full quality gates, publish the integrated Microfinance Module, and complete the final checklist.

## Microfinance Credit Scoring and Daily Escalations
- [x] Audit microfinance borrower, application, collections, notification, role, email, and scheduling contracts.
- [x] Define tenant-safe configurable credit-scoring rules, scorecards, approval thresholds, escalation recipients, and schedule delivery rules.
- [x] Implement protected scoring evaluation, administrator rule management, daily PAR and collections escalation dispatch, and idempotent delivery telemetry.
- [x] Build administrator scoring and escalation settings plus scorecard, schedule-state, and delivery-history visibility in the Microfinance workspace.
- [x] Add unit, protected-router, and browser coverage; run full quality gates.
- [x] Publish the verified implementation and activate the approved daily schedule after local time and recipient confirmation.
- [x] Configure the confirmed daily 12:00 Africa/Dar_es_Salaam escalation with Company Administrator and Collections Officer recipient roles.
- [x] Verify the active production schedule binding and aggregate-only email safeguards, then publish the activation record.
- [x] Make role-based escalation recipients explicitly selectable so delivery is limited to the confirmed Company Administrator and Collections Officer roles.
- [x] Map the selected Company Administrator escalation role safely to the tenant's existing owner-profile designation without broadening Collections Officer delivery.

## Microfinance Escalation Operational Follow-up
- [x] Audit tenant Collections Officer profile readiness and current active escalation thresholds without exposing email addresses.
- [x] Apply an approved Collections Officer recipient assignment only after an eligible active account or explicit recipient email is confirmed.
- [x] Review first-run aggregate delivery telemetry after the daily schedule executes and record any required operational adjustment. The 22 August 2026 run failed at the provider-acceptance boundary with no manual resend or schedule change; the aggregate-only follow-up is recorded in `microfinance_first_run_review.md`.
- [x] Evaluate the approved ezrampapi@gmail.com profile safely and use managed-recipient routing rather than altering its existing cross-tenant ownership or permissions.
- [x] Preserve the approved address's existing cross-tenant owner profile and obtain authorization before adding it as a managed recipient to the active Microfinance escalation.
- [x] Add the user-approved ezrampapi@gmail.com address as a managed recipient without modifying its existing tenant profile or permissions.
- [x] Schedule a one-time privacy-safe first-run delivery review for 12:10 Africa/Dar_es_Salaam on 22 August 2026.
- [x] Correct the one-time review schedule using an exact delay to the verified 12:10 Africa/Dar_es_Salaam execution time on 22 August 2026.

## Pharmacy Module
- [x] Audit existing Healthcare, Inventory, POS, Finance, permissions, data contracts, and browser-test conventions for pharmacy integration.
- [x] Define tenant-safe Pharmacy domain models, role permissions, clinical safeguards, stock accounting boundaries, and Tanzania-ready tax/payment rules.
- [x] Apply RLS-protected Supabase schema for medicines, suppliers, purchasing, batches, stock, prescriptions, dispensing, sales, payments, adjustments, notifications, and audit records.
- [x] Implement protected pharmacy service workflows for catalog, suppliers, purchasing, barcode and batch intake, expiry, controlled medicines, stock movements, and alerts.
- [x] Implement clinical prescription, dispensing, patient, doctor, insurance, sales/POS, returns, transfers, payment, invoice, receipt, and supplier-balance workflows.
- [x] Build the responsive Pharmacy Command Center with connected dashboards, forms, tables, reports, accessible validation, loading, empty, and recovery states.
- [x] Add navigation, role-aware access, Healthcare/Inventory/Finance cross-links, and privacy-safe notification and audit visibility.
- [x] Add unit, protected-router, schema-drift, browser, TypeScript, and production-build coverage; fix regressions; publish the completed Pharmacy Module.

## School Management Module
- [x] Audit the existing ERP architecture, reusable workspace patterns, permissions, and cross-module contracts for school integration.
- [x] Define tenant-safe School Management domain models, academic configuration, role permissions, audit rules, and Tanzania-ready finance and date boundaries.
- [x] Deploy RLS-protected database schema and protected backend workflows for admissions, learner profiles, guardians, academics, and staff teaching assignments.
- [x] Implement connected admissions, student records, classes, streams, subjects, timetables, attendance, examinations, assessments, grading, report cards, and assignments.
- [x] Implement fees, invoices, payments, scholarships, transport, hostel, library, school inventory, disciplinary records, documents, and linked Finance/HR/Payroll workflows.
- [x] Implement protected parent, teacher, and student portal workflows; announcements, communication, approval, notification, search, bulk, dashboard, report, and audit experiences.
- [x] Build the responsive School Management Command Center with real loading, empty, error, validation, permission, and cross-module navigation states.
- [x] Add unit, protected-router, schema-drift, calculation, browser, TypeScript, and production-build verification; fix regressions and publish the completed module.

## GitHub Synchronization and Vercel Deployment Review
- [x] Inspect the requested GitHub repository remote, local unpushed commits, repository protections, and Vercel integration availability.
- [x] Commit and push all verified BusinessSphere ERP changes that are not yet present in `EzraMpapi/SMARTMANAGER-MANUS`.
- [x] Diagnose the Vercel deployment block and apply any safe repository-level configuration correction that makes the synchronized changes deployable.
- [x] Verify the pushed commit and deployment status, then document any Vercel account-level action that cannot be completed from the repository.
- [x] Make the Vercel build schema check skip safely only when server-only Supabase credentials are unavailable, while retaining the verified managed-deployment schema gate.

## Live Vercel and School Management Verification
- [x] Confirm the latest Vercel Production deployment and public application availability.
- [x] Verify the live School Management Module navigation, access controls, and non-destructive operational views.
- [x] Run safe regression checks and report the verified live deployment outcome.
- [x] Diagnose and correct the Vercel output routing defect that currently serves the server bundle source at the public application root.
- [x] Redeploy and confirm the Vercel public root renders the browser application before continuing School Management validation.
- [x] Diagnose and correct the live owner-role denial that prevents authorized workspace owners from opening School Management.

## Repository-Based Change Tracking
- [x] Verify the requested repository remote, branch state, and non-destructive synchronization baseline.
- [x] Document the per-change tracking and GitHub synchronization workflow in the project repository.
- [x] Verify the tracking record is committed and pushed to the requested repository at `fef5e28`.

## GitHub Quality Visibility and Release Notes
- [x] Inspect current GitHub Actions workflow names, repository README, and available branch-protection controls. The GitHub API confirms that required branch protection needs GitHub Pro or a public repository for this private repository.
- [x] Add a GitHub Actions status badge for the primary quality workflow.
- [x] Add automated release-note generation from merged commit history and document how to use it.
- [x] Preserve the repository as private rather than changing visibility or billing; document that GitHub does not permit required-check enforcement for this repository plan, while CI remains active as a visible merge-quality gate.
- [x] Document the private-repository main-branch quality policy and the exact future required-check configuration to apply if GitHub branch protections become available.
- [x] Scope schema verification and the production-build precheck to the protected GitHub environment without exposing credential values.
- [x] Align the GitHub job named Browser Signup Journey with the isolated signup specification and verify its end-to-end run. GitHub run `32658438400` passed the full quality gate and isolated browser journey.
- [x] Verify the active GitHub Actions workflow registration, commit the CI remediation record, push it to the requested repository, and publish the completed quality improvements.

## Managed Asset Publication Recovery
- [x] Verify the uploaded managed-storage asset locations and identify all active code references to blocked local media.
- [x] Replace active brand media references with managed-storage URLs and retain the original asset names in the storage record. The managed application configuration already uses storage-hosted branding; no local source reference required replacement.
- [x] Remove only confirmed duplicate local media from the project, validate deployment readiness, and save the recovered publication checkpoint. Verified the exact 22 deletions, clean diff, TypeScript check, and focused merged subscription contracts; the broader suite was memory-terminated before completion, so it was not treated as a passing result.

## Header Logo Rendering Follow-up
- [x] Diagnose the broken header-logo image observed after managed asset cleanup and identify a storage-backed replacement that preserves deployment limits.
- [x] Apply the smallest safe logo rendering correction, verify the landing page at desktop and mobile widths, and publish the correction to GitHub and managed hosting. The shared logo component, document shell metadata, and managed application logo configuration all use the uploaded storage paths; desktop and mobile headers render correctly.

## Remote Merge Asset Regression Follow-up
- [x] Re-remove only the two already-approved oversized local brand PNG duplicates reintroduced by concurrent GitHub history, then re-verify the managed storage references and checkpoint readiness.

## Concurrent Global Admin Regression Follow-up
- [x] Register the merged protected Global Admin tRPC procedures in the application router, preserve its authorization boundaries, and make its focused contract tests pass. Verified with the focused Global Admin and managed-logo suites (6 tests) plus TypeScript.

## Post-Publication Global Admin and Release Readiness
- [ ] Complete the final browser-level Global Admin control-center review after the provisioned account uses a verified sign-in recovery, passkey, or linked identity-provider flow. The protected server snapshot now verifies the Platform Administrator role, but the supplied browser credential was rejected.
- [x] Verify or run the available full validation workflow in CI and record its outcome without changing the CI runner configuration. The user-approved GitHub-hosted full quality-gate rerun passed, including the production build and Browser Signup Journey.
- [x] Document release-tag readiness and retain the release tag until explicit stakeholder acceptance is provided. No release tag has been created.

## Secure Platform Administrator Sign-In Review
- [x] Attempt the user-supplied account only in the active browser session and preserve the no-storage boundary. Authentication was rejected; the password was not stored, retried, or written to Supabase, project configuration, or logs.

## Owner-Authorized Platform Administrator Provisioning
- [x] Inspect the existing account and approved Platform Administrator authorization model, then grant only the minimal audited server-side role assignment after eligibility verification; no password was stored or written.
- [x] Verify the provisioned account can enter the protected Global Admin server boundary, document the outcome, and retain release-tag creation until stakeholder acceptance is explicit. The snapshot guard returned the Platform Administrator viewer role in a rolled-back verification transaction.
- [x] Align the profiles role constraint with the existing Global Admin guard and add a service-role-only, audit-recording initial Platform Administrator provisioning function; no tenant membership, password, subscription, or unrelated user data was altered.

## Vercel Global Admin Review
- [x] Review the specified `menejajanja.vercel.com` deployment in read-only mode and record whether its static hosting configuration can reach the protected Global Admin data path. The address returned Vercel `DEPLOYMENT_NOT_FOUND`, so no application or protected Global Admin path is available there.
- [x] Review the corrected `menejajanja.vercel.app` deployment in read-only mode and record whether its static hosting configuration can reach the protected Global Admin data path. The landing and `/app` routes loaded, while an unauthenticated protected Global Admin tRPC request returned 401 as expected.

## Concurrent Subscription Activation Regression Follow-up
- [x] Restore the migration artifact expected by the merged subscription activation contract, validate the focused activation and billing suites, and preserve the intended database safety boundary. The repair replaces only the affected functions and privileges; it creates no tables or test data.
- [x] Add the required safe subscription-update browser event listener so access state refreshes after Free-plan activation without relying on local storage. Verified with 26 focused tests across activation, billing, Global Admin, and managed-logo contracts plus TypeScript.
