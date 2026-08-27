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
- [x] Enable required checks for pull requests into `main` and verify the effective branch-protection configuration: one approval, stale-review dismissal, administrator enforcement, conversation resolution, no force pushes/deletions, and the current unit/build plus browser preference checks are required.
- [x] Run relevant workflow validation, commit, push, and publish the completed repository-quality improvements. Local checks are green and the workflow files trigger correctly; hosted jobs still terminate before runner execution because of the separate GitHub Actions account constraint.

## User-Approved Public Repository and Quality Gate Activation
- [x] Run a final tracked-file secret and signing-key scan before changing repository visibility; environment files contain placeholders only and flagged code values are explicit non-production test fixtures, with no tracked private key or credential token detected.
- [x] Change `EzraMpapi/SMARTMANAGER-MANUS` to public visibility as explicitly approved by the repository owner.
- [x] Configure available `main` pull-request protection with the verified CI quality check and preserve administrator safety.
- [x] Update the credential-free production-smoke target to the verified `menejajanja.vercel.app` alias and add a regression assertion.
- [x] Trigger and verify hosted quality workflows now that the public-repository Actions allowance applies. Both required CI checks passed on pull request #21; unrelated Vercel projects on the account reported deployment rate limits, while the linked `menejajanja` deployment completed.
- [x] Obtain one independent approval from a reviewer with repository write access for protected pull request #21, then merge the passing release branch into `main`; this was superseded by the repository owner’s explicit zero-approval exception after both required checks passed, and PR #21 was merged at `63d1496`.
- [x] Update the release record, synchronize changes, and save the resulting managed checkpoint. Public quality-gate activation is recorded in `verification/public_quality_gate_activation_2026-08-27.md`; PR #21 merged at `63d1496`, PR #22 merged at `a494047`, and checkpoint `a4940474` was saved.

## Owner-Approved Zero-Approval Merge Exception
- [x] Change only the `main` approval-count requirement from one to zero for the passing release branch, while retaining strict required checks, administrator enforcement, stale-review dismissal, conversation resolution, and force-push/deletion blocks.
- [x] Merge pull request #21 after confirming both required CI checks remain successful and verify the exact resulting `main` revision: `63d1496228bad497eabfebb48390f13aa788fbea`.
- [x] Record the exception, synchronize the release status, and save the managed checkpoint. The exception record merged through PR #22 and is included in checkpoint `a4940474`.

## Responsive Top Bar and Sidebar Review
- [ ] Capture desktop, tablet, and mobile dashboard navigation layouts and inspect for overflow, hidden controls, stacking, touch-target, and readability defects.
- [ ] Apply only demonstrated top-bar or sidebar refinements while preserving module grouping, tenant-aware navigation, and the body-level onboarding tour overlay.
- [ ] Run focused responsive-navigation tests, TypeScript, and production build; save the verified checkpoint and document the review outcome.

## Tenant-Scoped Dashboard Customization
- [x] Audit the existing dashboard-preference model, workspace settings entry points, and role/module/tenant enforcement before extending user controls.
- [x] Add authorized controls for top-bar density, permitted navigation-group visibility, menu presentation, dashboard-widget visibility, and dashboard content order without allowing access expansion.
- [x] Persist and restore each user’s preferences within their authorized company scope, with safe defaults and an accessible reset action.
- [x] Add regression coverage for preference validation, role/module guard preservation, onboarding-tour layering, and responsive layout behavior.
- [x] Run focused/full tests, TypeScript, schema verification, production build, responsive validation, and save the verified release checkpoint. Focused coverage passed 12 assertions; broader dashboard coverage passed 76 assertions; the full quality gate, schema verifier, TypeScript, build, and desktop/mobile route checks passed. Checkpoint `e46d180` was created; authenticated visual interaction remains intentionally user-controlled.

## Dashboard Customization Cross-Role Verification
- [x] Map representative administrator, operational manager, employee, and external-user roles to authorized navigation and customization behavior.
- [x] Add regression coverage proving personalization can hide only already-authorized presentation groups and cannot add role-, subscription-, or tenant-restricted destinations.
- [ ] Run focused/full authorization checks, TypeScript, schema verification, and production build; document the result and save the verification checkpoint.

## Reported Page-Not-Found Routing Follow-up
- [x] Reproduce the reported missing-page route across the production alias, preview, and authentication return path without submitting forms or changing user data. Both `/app` origins returned 200 and reached the intended authentication gateway; no missing route was reproduced.
- [x] Correct only the verified route/rewrite/navigation defect and add a regression assertion for the restored application entry point. The existing SPA rewrite was retained and regression coverage now protects the direct `/app` entry route.
- [x] Revalidate the live route and responsive dashboard navigation, then save the verified release checkpoint. Published and managed-preview `/app` checks returned 200 and rendered the responsive secure gateway; the protected dashboard was not accessed without a user-authorized session.

## Platform Administrator Executive Control Center
- [x] Inspect the restored Platform Administrator and Global Admin implementation, shared dashboard patterns, and current Supabase platform tables before extending the UI.
- [x] Define a least-privilege Platform Administrator metric and operational-control data model, with server-side role verification and no tenant subscription bypass for ordinary users.
- [x] Implement an executive dashboard with concise KPI cards, tenant health, operational queues, activity trends, accessible navigation, loading and error states, and action-safe controls inspired by the supplied reference.
- [x] Apply the reviewed platform schema and configuration records through the Supabase connector, without fabricating customer reviews, ratings, or tenant financial transactions.
- [x] Add focused contract and interface coverage; validate responsive behavior; synchronize GitHub and save the managed checkpoint. Focused platform contracts passed 11 assertions; the full suite passed 264 files and 1,079 tests; TypeScript and production build passed.

## Live Server Disconnection and Blank-Load Follow-up
- [x] Diagnose the reported live server-disconnection and blank-load state across the authenticated Vercel route and current-main preview without weakening authentication or tenant isolation.
- [x] Implement the narrowest verified repair, add regression coverage, validate the deployed runtime, and synchronize the fix safely; the current Vercel production deployment is READY and `https://menejajanja.vercel.app/app` returns the expected HTML shell with HTTP 200.

## Android APK and Production URL Readiness
- [x] Inspect the existing Android APK/TWA package, trusted-web-activity configuration, and production web routing for `https://menejajanja.vercel.app`.
- [x] Align the Android package and full-stack web configuration to the verified production URL without exposing secrets or weakening authentication, tenant isolation, or role controls.
- [x] Correct the production PWA/Android icon path so the Vercel origin returns an image rather than the application shell.
- [x] Replace the Vercel-unserved managed-storage icon URL with a production-deployable PWA/Android icon source and revise the regression contract.
- [x] Validate the production web contract and Android packaging configuration, then synchronize the verified changes safely.
- [x] Update the pre-existing Vercel routing contract test for the narrowly scoped same-origin logo rewrite, then rerun the affected CI gate.
- [x] Reconcile the remote Android TWA guide with the verified Vercel-origin source and rerun CI after the detected stale-document regression.
- [x] Diagnose and remove the safe Vercel deployment pipeline or configuration block preventing the synchronized Android/PWA source from reaching production; the current synchronized production deployment is READY and serves `https://menejajanja.vercel.app/app` with HTTP 200.
- [x] Restore the TWA template if concurrent main-branch changes regress it away from `https://menejajanja.vercel.app`, then rerun its contract validation.
- [x] Restore the Android packaging contract if concurrent main-branch changes assert a managed-host origin instead of `https://menejajanja.vercel.app`.
- [x] Resolve or obtain approval for the GitHub Actions billing/spending-limit blocker that prevents the quality gate from starting. After the approved public transition, the required CI quality and browser dashboard preference jobs both completed successfully.
- [x] Reconcile the readiness evidence note with the current successful live Vercel route probes while documenting the stale blocked deployment record honestly.
- [x] Reconcile the latest concurrent Android commit that reverted the TWA template to the managed origin, then revalidate the Vercel target from the resulting main branch.
- [x] Replace the live login-shell favicon, social image, and BrandLogo references that still use unserved same-origin managed-storage paths, while preserving valid server-side storage URLs for authenticated uploads.
- [x] Synchronize the login-shell same-origin branding fix and its updated regression assertions to the private repository without changing repository privacy or history.

## PWA Offline Fallback
- [x] Add a branded offline fallback page with clear reconnect and retry actions.
- [x] Add a cache-first service worker for the offline shell without caching authenticated API or mutation responses.
- [x] Register the service worker only in production and add regression coverage for offline fallback boundaries.
- [x] Run focused tests, TypeScript checks, production build, and responsive browser verification.
- [x] Synchronize the verified offline fallback changes to the private repository and preserve deployment/signing gates.

## Cross-Browser Offline Fallback Verification
- [x] Test desktop Chromium rendering, retry action, and online recovery behavior.
- [x] Test mobile Chromium rendering at narrow and tall touch-oriented viewports.
- [x] Review console/network evidence and document browser-environment limitations without changing production data.
- [x] Synchronize the cross-browser offline-fallback verification note to the private repository without changing deployment or billing settings.

## Continuous PWA Offline E2E Coverage
- [x] Add Playwright configuration and deterministic offline-fallback test scripts.
- [x] Cover service-worker registration, failed navigation recovery, retry behavior, online recovery, and API/mutation cache exclusions.
- [x] Add a repeatable package-script command and CI workflow entry without requiring production credentials.
- [x] Run the E2E suite plus existing TypeScript/build checks, document browser prerequisites, and synchronize the verified tests.

## Complete Reference Dashboard Attachment Reconciliation
- [x] Audit every requirement in the supplied dashboard reconstruction attachment against the current command-center, shell, navigation, preferences, real data sources, and current migration ledger.
- [x] Produce a requirement-to-component and tenant-scoped source matrix, explicitly recording any request that cannot be represented without fabricating a financial or operational measure.
- [x] Implement every demonstrated visual, responsive, accessibility, drill-down, quick-action, chart, and state-handling gap using the existing ERP architecture; the remaining shell visibility and tour-layering gap was completed in the docked grouped navigation release.
- [x] Inspect live Supabase migrations, tables, relationships, policies, views, and functions; apply only proven missing additive schema objects through the connected project. The live schema gate confirmed no missing objects, so no DDL was applied.
- [x] Run focused and full regression, TypeScript, schema, and build-readiness validation; document evidence and synchronize verified changes to GitHub main.

## PWA Offline Fallback Verification Presentation
- [x] Prepare an executive presentation summarizing verified offline behavior, automated coverage, deployment status, and remaining blockers.
- [x] Generate and review the presentation deck for readable evidence, accurate figures, and clear next actions.
- [x] Deliver the final presentation deck with the supporting verification notes.


## Resume Where You Left Off
- [x] Audit the existing Supabase auth restoration, route handling, workspace selection, and module UI-state architecture.
- [x] Define a session-aware persistence contract that excludes passwords, tokens, secrets, payment data, and transient states.
- [x] Implement last-location restoration with route, query, filters, pagination, sorting, tabs, and workspace context validation.
- [x] Implement safe UI preference and non-sensitive long-form draft persistence with explicit draft-versus-saved status.
- [x] Implement network interruption handling that preserves context, avoids false login redirects, and reports unconfirmed saves honestly.
- [x] Add restoration and tenant/RBAC safety tests across major module refresh flows and run the full quality gates.
- [x] Synchronize the verified implementation and documentation to the authorized private repository.


## Resume Session Isolation Hardening
- [x] Expand callback and authentication parameter filtering in resumeSession URL and hash sanitization.
- [x] Make resume-location normalization and writes fail closed for malformed URL input.
- [x] Enforce bounded TTL retention for saved resume locations and clean expired records.
- [x] Add tenant/user-scoped draft keys with recursive sensitive-field removal or explicit safe-field handling.
- [x] Extend regression coverage, run full quality gates, update verification documentation, and synchronize the hardening release.


## Supabase Schema Reconciliation
- [x] Inspect the checked-in Drizzle schema, existing migrations, live Supabase catalog, and connector configuration.
- [x] Generate a non-destructive additive migration for missing tables, columns, indexes, constraints, and RLS policies only.
- [x] Apply the migration through the authorized Supabase connector and verify the resulting catalog and tenant isolation.
- [x] Update migration and verification evidence, run TypeScript/tests/build, and synchronize all changes to the private GitHub repository.

## Dashboard Shell and Profile Interaction Refinement
- [x] Inspect current sidebar, profile overlay, top-bar, dashboard shell, console logs, and reusable layout components
- [x] Implement a professional persistent left sidebar with responsive mobile navigation while preserving RBAC and routes
- [x] Replace the blocking profile overlay with a contained accessible profile menu and repair verified dashboard interaction defects
- [x] Refine the top bar, validate desktop/mobile dashboard rendering, and run regression/type checks
- [x] Verify the live schema for demonstrated missing objects only, commit intentional changes, and push GitHub main

## Sidebar and Profile Menu Visual Simulation
- [x] Confirm local preview availability and Git baseline
- [x] Inspect desktop, tablet, and mobile dashboard entry states for sidebar and profile-menu behavior
- [x] Verify Git remote synchronization and recent commit history
- [x] Record the visual simulation findings and any authentication-gated limitations

## Mobile Command Bar and Authenticated Interaction Validation
- [x] Inspect current mobile top-bar styles, component inventory, available authenticated-session tests, and Git baseline
- [x] Refine mobile command-bar spacing and responsive control density without changing routes or RBAC
- [x] Generate a comprehensive dashboard component report with interaction and responsive responsibilities
- [x] Run safe authenticated-session sidebar/profile interaction coverage and record any credential-gated limitation
- [x] Run regression and live schema verification, create only proven missing objects, commit intentional changes, and push GitHub main

## Desktop, Laptop, and Widescreen Command Workspace Refinement
- [x] Audit desktop/laptop/widescreen shell geometry, all bars, navigation grouping, reusable components, and Git baseline
- [x] Implement a clearer flatter role-aware desktop navigation model without changing routes, RBAC, or data flows
- [x] Polish desktop command bars, workspace geometry, focus states, and large-screen responsive behavior
- [x] Run desktop/laptop/widescreen visual simulation, regression, type, and tenant-safety validation
- [x] Verify live Supabase schema through the connector, create only proven missing objects, commit intentional changes, and push GitHub main

## Sidebar Ordering and Command-Bar Redesign
- [x] Inspect current sidebar order derivation, top-bar markup/styles, responsive behavior, logs, and Git baseline
- [x] Implement clear persistent role-priority and alphabetical sidebar ordering modes without changing visibility or RBAC
- [x] Redesign and repair the desktop/mobile command bar for hierarchy, spacing, safe touch targets, and responsive overflow handling
- [x] Run sidebar interaction, responsive layout, regression, type, and tenant-safety validation
- [x] Commit and push intentional interface changes to GitHub main

## Live Supabase Missing-Schema Reconciliation
- [x] Inspect current Git state, repository schema contracts, migrations, and Supabase connector readiness
- [x] Compare all required tables and relevant schema contracts with the live Supabase catalog
- [x] Generate and apply only proven missing idempotent tenant-safe tables or schema objects through the Supabase connector (no missing object was demonstrated; no SQL applied)
- [x] Re-verify schema completeness, RLS/tenant posture, and migration ledger
- [x] Commit and push intentional migration or verification evidence to GitHub main

## Attached Premium Dashboard Reconstruction Requirements
- [x] Complete attachment review and audit repository dashboard, shell, modules, data contracts, states, and Git baseline
- [x] Map actual dashboard metrics and widgets to real Supabase data, tenant scope, RLS, and UI loading/empty/error behavior
- [x] Define and implement verified premium command-center layout, sidebar, header, dashboard-header, KPI, analytics, and operational-widget refinements
- [x] Refine tables, quick actions, state handling, role-aware navigation, desktop/laptop/mobile responsiveness, and accessibility without mock production data
- [x] Compare live Supabase contracts, create only demonstrated missing idempotent tenant-safe objects, validate, document, and push GitHub main

## Reference-aligned Dashboard Reconstruction and Schema-first Audit
- [x] Audit the supplied visual reference against the current role-aware dashboard composition and identify only verified design gaps
- [x] Inspect the connected Supabase catalog, relationships, RLS policies, views, and RPC functions against every data-dependent dashboard component (completed 2026-08-26 through the connected project; no additive dashboard schema object was demonstrated)
- [x] Map reference KPI, chart, product, cash-flow, activity, health, and quick-action surfaces to real tenant-scoped sources or truthful unavailable states
- [x] Implement reference-aligned dashboard composition and responsive styling through reusable current components without mock production metrics or duplicate preferences
- [x] Extend contracts and validate full regression, TypeScript, live schema, responsive behavior, and build readiness; document and push GitHub main

## Uploaded Banking and AI Assistant Error Evidence
- [x] Reproduce and fix the Banking/MFI `Coins is not defined` runtime error shown at `/app?module=banking`
- [x] Audit the unavailable `paymentInstructions` Banking/MFI dependency and account-opening type options against live-safe schema contracts without fabricating financial data
- [x] Diagnose the AI Assistant reachability failure and ensure the user-facing recovery state is actionable without exposing tenant data or secrets
- [x] Add regression coverage, validate type/schema contracts, document the fixes, and push verified changes to GitHub main

## Reference Dashboard Responsive Completion and Live Migration Review
- [x] Compare the current command-center composition and shared shell with the supplied reference without replacing verified real-data widgets
- [x] Verify desktop, tablet, and mobile panel reflow, sidebar behavior, command controls, and accessible interaction states
- [x] Inspect the live Supabase migration ledger and relevant dashboard table contracts; apply only a demonstrated missing additive migration (none was demonstrated, so no SQL was applied)
- [x] Add any required responsive/source-contract coverage, validate, document, and push the final verified result to GitHub main

## Complete Reference Dashboard Attachment Reconciliation
- [x] Audit every requirement in the supplied dashboard reconstruction attachment against the current command-center, shell, navigation, preferences, real data sources, and current migration ledger.
- [x] Produce a requirement-to-component and tenant-scoped source matrix, explicitly recording any request that cannot be represented without fabricating a financial or operational measure.
- [x] Implement every demonstrated visual, responsive, accessibility, drill-down, quick-action, chart, and state-handling gap using the existing ERP architecture.
- [x] Inspect live Supabase migrations, tables, relationships, policies, views, and functions; apply only proven missing additive schema objects through the connected project (none was demonstrated, so no SQL was applied).
- [x] Run focused and full regression, TypeScript, schema, and build-readiness validation; document evidence and synchronize verified changes to GitHub main.

## Dashboard Build Memory and Isolated Visual Validation
- [x] Profile the Vite production bundling phase and implement only a behavior-preserving mitigation for the chunk-rendering memory termination.
- [x] Run automated dashboard layout-preference browser verification in a disposable isolated tenant/session without reading or mutating production tenant data.
- [x] Create an evidence-based slide deck summarizing the saved layout-preference feature, real-data/RLS boundaries, validation results, and remaining limitations.
- [x] Re-run appropriate quality gates, document results, and synchronize any verified implementation changes to GitHub main.

## Swahili SMART MANAGER ERP Training Production
- [x] Audit the complete attached 8–9 hour training-production brief and inventory every approved image, 3D concept, UI evidence capture, and repository-supported module.
- [x] Produce a truthful Kiswahili course architecture, chapter timing plan, asset-provenance register, and production constraint register using only real SMART MANAGER capabilities.
- [x] Create the first verified chapter-level visual, narration, storyboard, and reusable production assets without using production credentials, fabricated workflows, or unapproved customer data.
- [x] Validate the delivered chapter assets for instructional coverage, asset provenance, accessibility, security boundaries, and version-control suitability.
- [x] Package documentation and verified reusable deliverables, then synchronize intentional repository changes to GitHub main.
- [x] Create controlled redacted KMKM training-capture plans for approved dashboard, Finance, Inventory, and Sales surfaces without preserving record-level data.
- [x] Produce reusable Kiswahili chapter assets that pair approved redacted UI framing with the registered 3D concepts and training characters.
- [x] Validate approved-KMKM redaction coverage and synchronize the updated controlled-capture production package to GitHub main.

## Swahili Training Chapters 07–09 and Foundation Deck
- [x] Review verified Sales, POS, and CRM feature-status boundaries and approved safe visual evidence before writing Chapter 07–09 packs.
- [x] Produce privacy-gated, time-coded Kiswahili production packs for Chapter 07 Sales, Chapter 08 POS, and Chapter 09 CRM, including storyboards, narration, VTT cues, asset lists, QA, Ulichojifunza, and Kinachofuata.
- [x] Add and run regression contracts that preserve the Chapter 07–09 instructional and privacy requirements.
- [x] Prepare the Chapters 01–06 course-foundation presentation content with only approved conceptual and redacted evidence.
- [x] Generate and present the evidence-based Chapters 01–06 training-foundation slide deck.
- [x] Validate, commit, and push the reviewed Chapters 07–09 and presentation package to GitHub main.

## Swahili Training Chapters 10–12, Terminology Review, and Deck Narration
- [x] Review verified Inventory, Stock Control, and Reports scope boundaries plus approved visual-evidence availability.
- [x] Produce privacy-gated, time-coded Kiswahili production packs for Chapter 10 Inventory, Chapter 11 Stock Control, and Chapter 12 Reports with scripts, VTT cues, asset lists, QA, Ulichojifunza, and Kinachofuata.
- [x] Run a full Kiswahili translation and terminology consistency review across Chapters 07–09, record corrections, and add regression coverage where appropriate.
- [x] Write the presenter narration and presentation script for all ten slides in the Chapters 01–06 foundation deck.
- [x] Run documentation/regression validation and synchronize the reviewed chapter, terminology, and narration package to GitHub main.

## Swahili Training Chapters 13–15, Full Terminology Audit, and Commercial Deck
- [x] Review verified Procurement, Supply Chain, and Manufacturing scope boundaries plus approved visual-evidence availability.
- [x] Produce privacy-gated, time-coded Kiswahili production packs for Chapter 13 Procurement, Chapter 14 Supply Chain, and Chapter 15 Manufacturing with scripts, VTT cues, asset lists, QA, Ulichojifunza, and Kinachofuata.
- [x] Run a comprehensive Kiswahili terminology audit across Chapters 01–12, record corrections, and add regression coverage where appropriate.
- [x] Prepare the Chapters 07–09 presentation narrative and slide-aligned Kiswahili presenter script with approved conceptual/redacted evidence only.
- [x] Generate and present the evidence-based Chapters 07–09 commercial-foundation slide deck.
- [x] Run final validation and synchronize the reviewed Chapter 13–15, terminology-audit, and commercial-deck package to GitHub main.

## Post-Migration Integrity and Performance Audit
- [x] Run read-only structural, relational, data-quality, and RLS-policy checks across the 17 newly created Supabase tables.
- [x] Run bounded performance probes and query-plan checks for representative tenant-scoped access paths.
- [x] Document live evidence, update the checklist, and report any actionable findings without modifying the database.


## Post-Migration Integrity and Performance Audit — Completed
- [x] Run read-only structural catalog checks across all 17 newly created Supabase tables: all tables present, RLS enabled, primary keys present, and expected policy/index metadata returned.
- [x] Verify tenant-isolation policies: all 14 tenant-scoped tables expose authenticated ALL policies constrained by `company_id = current_company_id()` for both `USING` and `WITH CHECK`.
- [x] Verify platform-only tables (`users`, `schema_drift_monitors`, `schema_drift_runs`) retain RLS with no client-facing policies, preserving deny-by-default access.
- [x] Run bounded data-quality and relational checks: all 17 audited tables currently contain zero rows; no null tenant keys or orphan rows were present in the live audit window.
- [x] Run representative tenant-scoped EXPLAIN probes for `audit_logs` and `tra_z_report_archives`; both selected company-scoped indexes, with the archive query using the composite company/created index for reverse chronological access.
- [x] Run full local quality gates after the audit: 220 test files passed, 896 tests passed, 6 test files and 14 tests skipped, TypeScript passed, schema verification reported no missing/tenant/critical table issues, and the production build completed.
- [x] Re-check Vercel production deployment and GitHub Actions after the external Hobby quota/billing windows reset; Vercel is READY and the live app route returns HTTP 200, while GitHub Actions still terminates before runner allocation. No deployment or billing settings were changed.
- [x] Review covering indexes for unrelated legacy foreign-key advisor findings. The migrated-table review found existing tenant/query indexes and only unused-index notices on currently empty audit/archive tables, so no speculative index DDL was applied.


## Requested Supabase Schema Application and GitHub Synchronization
- [x] Verify the additive migration contains only intended non-destructive schema changes and confirm Supabase connector/project state.
- [x] Apply the additive migration through the authorized Supabase connector without inserting seed or test data.
- [x] Re-run bounded live table, RLS, policy, foreign-key, and schema-parity checks after application.
- [x] Run relevant tests, TypeScript, schema verification, and production build gates.
- [x] Commit and push all pending project changes to the private `EzraMpapi/SMARTMANAGER-MANUS` repository on `main`, preserving privacy and excluding secrets/signing keys.

## Remote-Main Merge Regression Follow-up
- [x] Update stale contract assertions exposed by the latest remote-main merge, then rerun TypeScript, tests, and production build before pushing.

## Checkpoint Asset Size Remediation
- [x] Resize the two oversized branding PNGs in place without replacing their visual content, verify they are below the checkpoint threshold, and retry the managed checkpoint.

## Dashboard Shell Redesign and Layering Fix
- [x] Audit the current dashboard top bar, sidebar, module navigation, tour overlay, and desktop/mobile stacking behavior.
- [x] Re-group project modules into a clearer navigation hierarchy with accessible labels and visible desktop menu affordances.
- [x] Redesign the top bar and left sidebar while preserving existing navigation, auth, tenant, and entitlement behavior.
- [x] Fix tour and overlay z-index, positioning, focus, and responsive visibility so the tour never sits behind dashboard features.
- [x] Add or update regression coverage, verify desktop/tablet/mobile screenshots, run TypeScript/tests/build, and save the redesigned checkpoint.

## Dashboard Release Synchronization and Schema Parity
- [x] Inspect the current GitHub remote state, pending dashboard changes, and Supabase schema contract results.
- [x] Apply only missing, additive Supabase schema changes after confirming they are safe and required; the live schema gate found no missing tables, tenant columns, or critical contract issues, so no DDL was applied.
- [x] Re-run targeted schema parity and dashboard quality checks after the live audit and rebase: schema gate, full test suite, TypeScript, production build, and whitespace check passed.
- [x] Commit and push all verified dashboard release changes to the private GitHub `main` branch without including secrets.
- [x] Save the managed release checkpoint and report the exact synchronization and schema outcome.

## Swahili Training Chapters 16–18, Operations Deck, and Animation Foundation
- [x] Review verified Financial Management, Accounting, Payroll, and approved animation-source boundaries.
- [x] Produce privacy-gated, time-coded Kiswahili production packs for Chapter 16 Financial Management, Chapter 17 Accounting, and Chapter 18 Payroll with scripts, VTT cues, asset lists, QA, Ulichojifunza, and Kinachofuata.
- [x] Run a comprehensive Kiswahili terminology audit across Chapters 01–15, record targeted Kiswahili-first corrections, and add regression coverage.
- [x] Prepare the Chapters 10–12 presentation narrative and slide-aligned Kiswahili presenter script with approved conceptual/redacted evidence only.
- [x] Generate and present the evidence-based Chapters 10–12 operations-foundation slide deck.
- [x] Create and validate a reviewable Chapters 01–15 animation assembly plan, subtitle/audio ledger, and pilot asset package without claiming a complete master video.
- [ ] Run final validation and synchronize the reviewed Chapter 16–18, terminology, operations-deck, and animation-foundation package to GitHub main.

## Protected Main-Branch Reconciliation for Training Package
- [x] Reconcile the stale required `Browser Dashboard Preference Journey` status check with the current repository CI checks while preserving protected-branch review and validation requirements.
- [x] Merge the validated Chapters 16–18, operations deck, and animation-foundation pull request through the protected-branch workflow.
- [x] Verify the final `main` branch state and record the completed training-package synchronization.

## Chapters 16–18 Animation Continuation Pilot
- [ ] Review the existing fictional animation pilot, Finance concept visual, and Chapter 16–18 privacy boundaries before extending the motion package.
- [ ] Generate a text-free fictional animation continuation for Financial Management, Accounting, and Payroll using only conceptual props and characters.
- [ ] Verify the continuation media integrity, record its external-only use and editorial QA boundary, and confirm it is not a complete chapter sequence or master video.
- [ ] Run the focused documentation contract and synchronize the reviewed continuation package to GitHub main through the protected-branch workflow.

## Reference-Directed Responsive Dashboard Rebuild
- [x] Inspect current dashboard routes, layout, live-data contracts, navigation, reusable UI components, and existing responsive tests without modifying production data.
- [x] Rebuild the dashboard shell and overview in the supplied dark-sidebar, compact-command-bar, KPI/analytics, and quick-action visual direction while retaining real application behavior and truthful empty/loading/error states.
- [x] Standardize responsive desktop, tablet, and mobile layout behavior, keyboard access, and interaction layering without deleting unrelated working routes or backend logic.
- [x] Inspect the connected Supabase schema against the dashboard’s actual data contracts and apply only verified non-destructive SQL additions if any are required.
- [x] Add or update dashboard regression tests, run full responsive/build validation, and capture desktop/mobile verification evidence.
- [ ] Commit, publish through the protected-branch workflow, merge the reviewed dashboard package, and report the exact schema and GitHub outcome.
