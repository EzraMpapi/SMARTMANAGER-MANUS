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
- [ ] Complete authenticated responsive Collaboration Hub Email verification.
- [ ] Review this checklist and save the published checkpoint.

## Collaboration Hub Email Runtime Follow-up
- [ ] Investigate and fix the newly surfaced `showCont is not defined` crash when opening the Email tab in the published deployment.
- [x] Add a mounted EmailCenter regression test and re-run focused/full tests.
- [ ] Capture authenticated Collaboration Hub Email screenshots at desktop and mobile sizes after the published runtime is corrected.
- [ ] Mark the complete verification and checkpoint items after the affected flow is validated.
