# Subscription Billing & HarakaPay Readiness Validation

**Date:** 22 August 2026  
**Scope:** Smart Manager tenant subscription, billing, invoice, payment, audit, and HarakaPay server-integration implementation.

> **Release assessment:** The subscription billing module is structurally ready and has been applied to the live Supabase schema. A real payment collection remains deliberately disabled until a valid HarakaPay deployment secret, provider collection URL, and public callback URL are configured. No credential was placed in source control or the client bundle.

| Validation area | Result | Evidence |
| --- | --- | --- |
| Tenant billing schema | Passed | Live migrations `20260822_023` through `20260822_027` applied successfully. |
| Live persistence readiness | Passed | Verified all seven billing tables and seven protected database functions in the active Supabase project. |
| Authorization and isolation | Passed | Snapshot, plan/profile changes, and intent creation require a verified Supabase workspace session and billing-manager role; database functions derive the company from `current_company_id()`. |
| Anonymous function access | Passed | Live privilege audit verified that `anon` cannot execute snapshot, profile, plan, payment-intent, provider-dispatch, provider-status, or audit functions. |
| Provider-only state changes | Passed | The `authenticated` role cannot execute `billing_apply_provider_status`; this transition is limited to the server service role. |
| Security advisor | Passed for new module | Final advisor review contains no anonymous billing-function warnings. Older project-wide advisor findings remain outside this module. |
| Foreign-key performance support | Passed | Indexes were added for subscription plan/source payment, payment subscription/plan, invoice subscription, and event subscription/payment foreign keys. The performance advisor reports only inherited non-billing foreign-key INFO findings in its reviewed output. |
| Type validation | Passed | `pnpm check` completed without TypeScript errors. |
| Client production build | Passed with existing warnings | `pnpm exec vite build` successfully bundled 2,659 modules. Existing analytics-placeholder and large legacy dashboard chunk warnings remain. |
| Billing regression contracts | Passed | `server/subscriptionBillingContracts.test.ts`: 7/7 tests passed. |
| Whole-repository regression suite | Not release-green | `pnpm test`: 153 passed, 16 failed, 5 skipped files; 577 passed, 78 failed, 8 skipped tests. Failures are pre-existing shared authentication-fixture and stale lexical-component assertions previously recorded in system-health work, not billing-contract failures. |

## Security and payment controls

The implementation creates a payment intent before requesting the provider USSD push and requires a tenant-scoped idempotency key. It allows only one pending request per tenant and records the internal reference, expected amount, billing cycle, and server-side provider response. A subscription becomes active only after the backend checks the provider status, confirms the provider order ID and expected amount, and writes the payment, subscription, invoice, and audit event in the protected database workflow.

The browser receives only payment status information. The HarakaPay key, collection URL, balance endpoint calls, and status verification remain in the server process. Incoming webhook payloads are not trusted as proof of payment: the handler retrieves the provider status independently before applying any lifecycle transition.

## Required deployment configuration

The following server-side deployment variables are documented in `.env.example` and must be set before live USSD collection can be enabled:

| Variable | Purpose |
| --- | --- |
| `HARAKAPAY_API_KEY` | Secret provider API credential; never use a `VITE_` prefix. |
| `HARAKAPAY_COLLECT_URL` | Official provider collection URL. The user-supplied contract did not specify its provider-side path, so the application does not guess it. |
| `HARAKAPAY_WEBHOOK_URL` | Public HTTPS callback registered with HarakaPay. |
| `SUPABASE_SECRET_KEY` | Server-only key used for provider-dispatch and verified payment-state persistence. |

No live charge, payment reversal, or subscriber-data mutation was executed during validation because the required live provider configuration is intentionally absent.

## Remaining non-billing work

The global regression suite remains non-green because legacy tests need fixture and assertion modernization. The observed failures are concentrated in authenticated-workspace mock setup and tests that assert obsolete inline JSX component markers rather than the current modular dashboard design. These failures were not expanded by the new billing test contract, which passes independently.
