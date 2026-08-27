# E-Commerce Validation Addendum: Skipped Tests and Dashboard Bundle Optimization

**Date:** 26 August 2026

## Executive result

The authoritative full Vitest suite completed successfully with **1,108 passed tests**, **15 skipped tests**, and **7 skipped test files** across **270 files**. The skipped cases are explicit environment gates, not silent assertion failures. The checkout/payment/shipping addition is covered by four offline-only passing tests. The dashboard optimization now has both a first chunking baseline and a wrapper/core measurement; these must not be conflated.

## Complete skipped-test inventory

| Source file | Count | Exact coverage | Gate and verification status |
|---|---:|---|---|
| `server/communityGroupsRlsPenetration.test.ts` | 5 | Tenant A cannot read tenant B data; cross-tenant inserts and relationship forgery fail; direct `company_id` tampering fails; forged audit actors/history mutation fails; non-privileged tenant users cannot approve or disburse tenant B loans. | Requires two dedicated real tenant JWTs, a live Supabase URL, and a publishable key. With no `SUPABASE_RLS_TEST_JWT_A/B` variables present, enabling this suite would not be a valid test. The gate is explicit through `describe.skipIf(!runLive)`. |
| `server/dashboard.persistence.test.ts` | 2 | Resolves a persisted report schedule by task UID; handles an orphaned report schedule task UID safely. | Requires `RUN_REMOTE_INTEGRATION_TESTS=true` and a provisioned remote tenant. It is explicitly disabled in repository-only CI to avoid synthetic production writes. |
| `server/liveTenantWorkflow.integration.test.ts` | 1 | Executes the live tenant workflow with approved staging credentials. | Permanently skipped in the repository-only environment until a provisioned staging tenant and approved credentials are supplied. |
| `server/resendSenderConfiguration.test.ts` | 1 | Authenticates with Resend and confirms the configured sender domain can send. | Requires configured sender credentials and an approved provider environment. No sender credentials were present. |
| `server/smartAssistant.live.test.ts` | 1 | Returns a structured response for a minimal non-sensitive live AI prompt. | Requires the explicit live integration flag and provider configuration. It is not promoted using a mock response because the test is intended to verify the real provider boundary. |
| `server/supabase.authRls.test.ts` | 2 | Resolves each real JWT subject to its profile/company; verifies tenant isolation for a company-scoped ERP table without client-supplied company filters. | Requires two dedicated real JWTs and live Supabase credentials. No JWT variables were present, so the test remains safely gated. |
| `server/supabase.config.test.ts` | 1 | Authenticates a lightweight Supabase Auth settings request. | Requires `RUN_REMOTE_INTEGRATION_TESTS=true`, a configured Supabase URL, and an anon key. No such variables were present. |
| `server/supabase.credentials.test.ts` | 1 | Performs a read-only `companies` query using server credentials. | Requires `RUN_REMOTE_INTEGRATION_TESTS=true`, a Supabase URL, and the service key. It intentionally cannot run without explicit credentials. |
| `server/supabaseBuildCredentials.test.ts` | 1 | Authenticates against the lightweight PostgREST root endpoint during a build credential check. | Requires `RUN_LIVE_SUPABASE_CREDENTIAL_CHECK=true` plus server credentials. The flag is off and no credentials are present. |

The environment audit found only `OPENAI_API_BASE`, `OPENAI_API_KEY`, and `OPENAI_BASE_URL` variables; no Supabase, RLS-JWT, Resend, live-tenant, remote-integration, or E2E-real-auth variables were present. Therefore, no skipped test was safely promotable in this execution. The correct remediation is to provision a non-production staging tenant, two least-privileged test identities, provider sandbox credentials, and explicit CI secret scopes, then run the remote suites in an isolated workflow.

## Dashboard bundle optimization

The first optimization baseline was **4,524,618 bytes** and the first manual-chunk result was **3,931,514 bytes**, a reduction of **593,104 bytes or 13.00%**. The stronger wrapper/core measurement from a fresh direct Vite build is:

| Emitted asset | Size | Interpretation |
|---|---:|---|
| `BusinessSphereDashboard-*.js` | 1,661 bytes | Thin route entry wrapper |
| `BusinessSphereDashboardCore-*.js` | 3,995,364 bytes | Core fetched immediately by the wrapper |
| `dashboard-community-modules-*.js` | 438,013 bytes | Lazy Community Groups and Employee Portal factory |
| `dashboard-additional-modules-*.js` | 93,497 bytes | Additional extracted module bundle |
| `dashboard-static-data-*.js` | 56,257 bytes | Static/configuration data bundle |

The wrapper filename is below 500 kB, but the practical initial dashboard payload is **not** below 500 kB because the wrapper immediately loads the approximately **4.00 MB** core. The build still reports the configured 2,500 kB warning. The next safe performance wave must extract whole route-specific workspaces behind true dynamic imports rather than raising the warning limit or claiming success from the wrapper alone.

## Offline commerce simulation evidence

`server/commerceCheckoutSimulation.test.ts` passed **4 tests**. The deterministic model produced a TZS 50,000 subtotal, TZS 9,000 tax, TZS 5,000 shipping charge, and TZS 64,000 grand total; moved the simulated checkout to `COMPLETED`, the payment to `SUCCEEDED`, the reservation to `CONSUMED`, and the shipment to `DELIVERED`; ignored a duplicate provider event; and rejected oversell, empty, and invalid lines. This is a local state-machine test only. It did not call a provider, collect money, mutate Supabase, or deliver a shipment. The future design-only schema/RPC contract remains unapproved and unapplied.

## Recommended next actions

The skipped remote suites should be executed only in a dedicated staging workflow with short-lived or least-privileged credentials, explicit tenant fixtures, and read-only defaults wherever possible. The dashboard should next be decomposed at workspace boundaries, prioritizing the remaining inline legacy modules and the 3.1 MB dashboard source file. Any extraction must preserve the existing `go(...)` subscription gate, company-scoped adapter, resume-location behavior, and fallback loading states.
