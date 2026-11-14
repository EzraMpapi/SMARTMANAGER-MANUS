# Website Feedback Implementation — 2026-08-26

## Delivered

The public SMART MANAGER landing page now exposes a **Feedback** action in the header and a dedicated “Help us improve Smart Manager” invitation section. Both open the existing visual feedback modal without changing the surrounding landing-page architecture.

The modal now submits through the public tRPC procedure `publicFeedback` instead of using a simulated timeout. It supports bug reports, feature requests, UI/UX suggestions, and general feedback, with optional name and email fields, the current page path, client-side required/minimum/maximum validation, a honeypot field, loading state, safe error state, success state, and accessible dialog labels.

## Persistence and security

An additive Supabase migration created `public.website_feedback_submissions`. The table stores the category, message, optional contact information, originating page path, source, review status, optional administrative review metadata, and UTC creation time. Database checks enforce supported categories and field lengths. Indexes support status/created-time review queues.

RLS is enabled. Direct `anon` and `authenticated` SELECT and INSERT privileges are both **false**. The server-side tRPC operation writes using the server-only Supabase secret key. A bounded in-process request throttle permits at most three non-honeypot submissions per hashed connection identity within ten minutes. Honeypot submissions are accepted at the UI boundary but not persisted.

## Live migration verification

The migration was applied through the connected Supabase migration operation as `website_feedback_submissions_20260826`. Live verification confirmed all expected columns, RLS enabled, FORCE RLS unchanged, and no direct client-role access.

The repository’s separate synchronized ERP schema SQL was also reconciled against the live database. Its proposed tables were already present; no duplicate or speculative tables were created.

## Validation

- `pnpm check` — passed.
- `pnpm exec vitest run server/feedbackOperations.test.ts` — **3/3 tests passed**.
- `VERCEL=1 pnpm build` — passed.
- Browser smoke check at 390×844 and 1440×900 — both passed with the feedback dialog, native validation, responsive bounds, and successful mocked tRPC response.

The browser success-path smoke check mocked the network response to avoid inserting test data. Live persistence was verified separately through the applied migration and server implementation; a production-style submission test should use an explicitly approved disposable feedback record if required.
