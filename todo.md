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
