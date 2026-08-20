# Verification Notes

## Signup route — 2026-08-20

The public signup route at `/app?auth=signup` initially displays the accessible `Preparing Smart Manager` lazy-loading fallback and then resolves to the three-step onboarding form. The desktop browser review confirmed visible account inputs, the required consent checkbox, and the “Continue to company setup” action without a runtime exception.

Using non-production test details, the browser accepted valid account inputs, consent, and a click on “Continue to company setup.” The route advanced to the workspace step, rendering company, country, currency, industry, branding, and “Continue to modules” controls without the prior undefined industry-options runtime error.

After entering a valid company name, “Continue to modules” advanced to the final module-selection step. The browser rendered the enabled module cards and the final launch action. The launch action was intentionally not invoked, so no real account or workspace was created during verification.

The dedicated Playwright production-preview journey now passes. It fills and advances through valid account and workspace steps, verifies the module-selection screen, and deliberately stops before the account-creation action. During implementation, this test exposed a temporal-dead-zone error in an overly aggressive chart-library chunk; the unsafe boundary was removed before verification. The remaining stable vendor chunks reduce the dashboard bundle from 6.91 MB (1.22 MB gzip) to 6.03 MB (0.94 MB gzip), while preserving working production startup.
