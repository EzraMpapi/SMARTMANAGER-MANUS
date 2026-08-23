# Subscription API, Security, and Migration Review

**Date:** 2026-08-23 UTC
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Supabase project:** `rlhngsrihahhyxnjxrxm`
**Author:** Manus AI

## Executive conclusion

The live Supabase subscription contract is correct and remains aligned with the approved commercial model. Supabase currently returns exactly seven official packages: `FREE_15` for 15 days at TZS 0, and six paid monthly packages with one paid month plus one promotional bonus month, for two calendar months of access. The database enforces Monthly-only billing on both payment and tenant-subscription records, and the subscription routines retain pinned search paths and deliberate role boundaries.

The API verification exposed a deployment/configuration problem rather than a Supabase schema failure. The exact `smatimeneja.vercel.app` host returned a catalog configuration error and did not expose the Free-start route. The latest READY Vercel deployment discovered for the linked `menejajanja` project exposed the routes, but its catalog response was incorrectly shaped because the server parser converted a successful top-level JSON array into an object with a `message` field. The parser has now been corrected in source and covered by a regression test. The fix must be present in the deployment that serves the customer-facing alias before a complete authenticated live checkout can be certified.

No authenticated customer session was available in the connected browser, and no real phone, provider charge, production subscription row, invoice, or payment record was created during this review.

## API verification results

### Deployed HTTP smoke checks

The checks below used non-authenticated requests and therefore could not create data or trigger a provider charge. They verify routing and protected-boundary behavior only.

| Target | Request | Observed result | Interpretation |
|---|---|---:|---|
| `https://smatimeneja.vercel.app` | `GET /api/billing/catalog` | **503** — `Billing server verification is not configured.` | The customer-facing alias is missing a server-side billing configuration or is serving a mismatched deployment. |
| `https://smatimeneja.vercel.app` | `POST /api/billing/free/start` with `FREE_15` | **404** — `Cannot POST /api/billing/free/start` | The alias does not currently expose the expected Free-15 route. |
| `https://smatimeneja.vercel.app` | `POST /api/payments/harakapay/collect` | **401** — current workspace session required | The checkout route is protected and rejected before database/provider work. |
| Latest READY `menejajanja` deployment | `GET /api/billing/catalog` | **200**, but `plans` was an object containing `message` rather than the expected array | The deployment exposed the route but revealed the top-level-array parser defect. |
| Latest READY `menejajanja` deployment | `POST /api/billing/free/start` | **401** — current workspace session required | The route exists and enforces the verified-session boundary. |
| Latest READY `menejajanja` deployment | `POST /api/payments/harakapay/collect` | **401** — current workspace session required | The route exists and rejects unauthenticated checkout before any write or provider call. |

Vercel reported the latest READY linked deployment as `dpl_tywT2YyCoyChoW59WUubahd1Ftqi`, with URL `menejajanja-anyqucph7-ezra-mpapi.vercel.app`, target `production`, and Git SHA `cda9d3de1be5e8486c273b3aa30a5c2dadfa994c`. The deployment aliases returned by Vercel were `menejajanja.vercel.app`, `menejajanja-ezra-mpapi.vercel.app`, and `menejajanja-git-main-ezra-mpapi.vercel.app`; the exact `smatimeneja.vercel.app` alias was not returned by that lookup. The current repository HEAD before this follow-up fix was `ea6efa50783baba2e9738084798f4bace3a8528f`, so deployment alignment must be verified before relying on customer-facing behavior.

### Actual handler-level end-to-end test

An ephemeral HTTP harness exercised the repository’s actual Express handlers with only the session, Supabase RPC, and HarakaPay provider boundaries stubbed. This avoided real customer writes and provider charges while verifying the complete request choreography.

| Flow | Assertions | Result |
|---|---|---|
| Free-15 activation | A client request attempting to submit `SIMBA_SC` was normalized to `p_plan_code: FREE_15`; the verified session token was forwarded to Supabase; the handler returned the simulated Active Free subscription. | **Passed** |
| Paid checkout | A client-supplied Annual cycle and incorrect amount were ignored; the handler sent `p_billing_cycle: Monthly`, used the server-returned SIMBA SC amount of TZS 4,500, preserved the idempotency key, sent the provider order, and recorded the dispatch. | **Passed** |
| Catalog response regression | A successful top-level JSON array from `billing_public_plan_catalog` is now preserved as `plans: [...]` instead of becoming `plans: { message: ... }`. | **Passed** |

The parser correction is limited to response-shape handling. Error responses still use structured `message` extraction, and object-shaped provider payloads remain explicitly typed.

## Live Supabase catalog and constraints

A fresh read-only call to `public.billing_public_plan_catalog()` returned exactly these seven active packages:

| Code | Display name | Price | Fixed duration | Paid months | Bonus months | Total months | Category |
|---|---|---:|---:|---:|---:|---:|---|
| `FREE_15` | FREE | TZS 0 | 15 days | 0 | 0 | 0 | Business |
| `TWIGA` | TWIGA | TZS 5,000/month | Calendar months | 1 | 1 | 2 | Business |
| `TEMBO` | TEMBO | TZS 10,000/month | Calendar months | 1 | 1 | 2 | Business |
| `SIMBA` | SIMBA | TZS 15,000/month | Calendar months | 1 | 1 | 2 | Business |
| `SIMBA_SC` | SIMBA SC | TZS 4,500/month | Calendar months | 1 | 1 | 2 | Football |
| `YANGA_SC` | YANGA SC | TZS 9,000/month | Calendar months | 1 | 1 | 2 | Football |
| `AZAM_FC` | AZAM FC | TZS 7,000/month | Calendar months | 1 | 1 | 2 | Football |

The live constraints are consistent with the contract. `subscription_payments_billing_cycle_check` requires `billing_cycle = 'Monthly'`, and `tenant_subscriptions_billing_cycle_check` applies the same requirement to tenant entitlements. Payment amounts must be greater than zero; tenant-subscription amounts may be zero for `FREE_15`. Valid payment statuses are `Pending`, `Completed`, `Failed`, `Cancelled`, and `VerificationRequired`. Valid tenant-subscription statuses include `Pending`, `Active`, `Grace`, `Expired`, `RequiresPlan`, `Cancelled`, and `Superseded`.

The routine privilege check returned the following boundaries:

| Routine | Authenticated | Service role | Search path |
|---|---:|---:|---|
| `billing_public_plan_catalog` | No | Yes | `pg_catalog, public, auth` |
| `billing_start_free_plan` | Yes | No | `pg_catalog, public, auth` |
| `billing_reconcile_free_plan_expiry` | No | Yes | `pg_catalog, public, auth` |
| `billing_apply_provider_status` | No | Yes | `pg_catalog, public, auth` |
| `billing_create_payment_intent` | Yes | Yes | `pg_catalog, public, auth` |
| `billing_snapshot` | Yes | Yes | `pg_catalog, public, auth` |

## Migration review

The Supabase migration ledger contains both new migrations with the expected versions and names.

| Migration | Live version | Scope | Result |
|---|---:|---|---|
| `subscription_free_plan_model` | `20260823193058` | Added paid/bonus/total-month and Free-duration columns; normalized the seven-package catalog; replaced retired trial RPCs; added Free activation and expiry reconciliation; enforced paid-package amount and duration checks; preserved tenant/RLS/payment idempotency controls. | **Succeeded** |
| `subscription_monthly_constraint_correction` | `20260823193854` | Tightened `tenant_subscriptions.billing_cycle` to Monthly and removed the unnecessary service-role execution grant from `billing_start_free_plan`. | **Succeeded** |

The first migration removed the live trial columns and functions and uses `make_interval(months => v_plan.total_months)` for paid expiry, so paid access is calendar-month based rather than a fixed 60-day approximation. The second migration closes the inherited tenant-subscription constraint gap. The applied migration history retains earlier trial-era files as immutable migration history; the corresponding live runtime objects, routes, and active UI references have been removed.

The repository evidence is recorded in `supabase/MIGRATION_EXECUTION_LOG.md`, `supabase/SUBSCRIPTION-MODEL-20260823.md`, and the two source migrations under `supabase/migrations/`.

## Security Advisor and policy coverage

The current Security Advisor payload contains **119 findings**: **118 WARN** and **one INFO**. The lint-family breakdown is as follows.

| Finding family | Count | Current interpretation |
|---|---:|---|
| Public can execute SECURITY DEFINER function | 6 WARN | SafariTiketi booking/seat functions are intentionally public-facing but require endpoint-specific abuse and input review. |
| Signed-in users can execute SECURITY DEFINER function | 111 WARN | A global inventory of authenticated RPCs requiring endpoint-by-endpoint privilege and body review; not suitable for blanket revocation. |
| Leaked password protection disabled | 1 WARN | Supabase Auth configuration item; enable HaveIBeenPwned-backed leaked-password protection in Auth settings. |
| RLS enabled with no policy | 1 INFO | `public.platform_admin_actions` has RLS enabled but no policy. Direct access is therefore fail-closed, but the intended administrative access model should be made explicit. |

Seven of the authenticated SECURITY DEFINER warnings are subscription-related: `billing_access_snapshot`, `billing_create_payment_intent`, `billing_is_manager`, `billing_snapshot`, `billing_start_free_plan`, `billing_upsert_plan`, and `billing_upsert_profile`. These are intentionally exposed to authenticated application flows and should be reviewed individually. The Free-start function cannot simply be revoked because onboarding depends on it; it already requires a verified billing-manager role and is authenticated-only. Service-only provider status, reconciliation, and catalog paths are not granted to authenticated users.

The fresh policy-coverage query found **519 public tables and 719 policies**. All 519 tables have RLS enabled, no public table is RLS-disabled, and no public table is policyless except `platform_admin_actions`. No unrestricted `USING (true)` or `WITH CHECK (true)` policy was found. Subscription table policies are scoped by `current_company_id()` and, for company-operational tables, `billing_is_manager()`:

| Table | Read policy boundary |
|---|---|
| `billing_plans` | Active plans where `company_id IS NULL` or matches `current_company_id()`. |
| `billing_profiles`, `tenant_subscriptions`, `subscription_payments`, `subscription_invoices`, `subscription_usage`, `subscription_events` | Matching `current_company_id()` and `billing_is_manager()`. |

The policyless `platform_admin_actions` table contains actor identity, actor role, action, target type/id, mandatory reason and confirmation text, JSON details, and creation time. It should be remediated by either a narrowly scoped platform-administrator policy or relocation to a non-exposed/private schema with a controlled append/read interface. A blanket `USING (true)` policy would contradict the current security posture and is not recommended.

## Prioritized remediation plan

| Priority | Action | Rationale and acceptance criterion |
|---|---|---|
| P0 | Align the customer-facing Vercel alias with the repository’s current `main` deployment. | Confirm the alias serves the intended Git SHA, then verify `GET /api/billing/catalog` returns an array of seven plans and `POST /api/billing/free/start` returns a protected 401 when unauthenticated rather than 404/503. |
| P0 | Verify server-side Vercel environment configuration. | The catalog 503 indicates missing billing verification configuration on the observed alias. Confirm `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY`; confirm HarakaPay server variables before live paid checkout. Never expose secret values to the browser or logs. |
| P1 | Deploy and smoke-test the parser correction. | The source now accepts top-level JSON arrays while retaining object error parsing. After deployment, assert the exact response shape and seven catalog values through the customer-facing alias. |
| P1 | Review the 111 authenticated SECURITY DEFINER warnings by endpoint family. | For each function, choose one of: retain authenticated execution with a documented tenant/role contract and pinned search path; replace with a narrower invoker/wrapper; or revoke execution. Start with billing, banking, identity, and other write-capable routines. |
| P1 | Decide the policy for `platform_admin_actions`. | Confirm whether the table is an append-only platform audit sink. Add a policy limited to platform administrators or move it behind a private schema/RPC boundary, then rerun the policyless-table advisor check. |
| P2 | Review the six public SafariTiketi SECURITY DEFINER routines. | Preserve only the public contract that is required. Add strict locator/surname/service-key validation, abuse controls, bounded TTLs, and rate limiting at the public boundary; otherwise revoke anonymous execution or move the operation behind a controlled service endpoint. |
| P2 | Enable leaked-password protection in Supabase Auth. | This is a dashboard/Auth configuration change, not a subscription migration. Re-run Security Advisor and confirm the warning disappears. |

## Verification commands and results

The focused subscription suites passed **19 tests across four files**, including the new catalog-response regression test. `pnpm check` passed. The full Vitest run passed **208 test files**, with **5 skipped files**, and **848 tests passed**, with **13 skipped tests**. `VERCEL=1 pnpm build` passed; the existing large BusinessSphereDashboard chunk advisory remains the only build warning. The browser suite had previously passed **23/23** before this server-only parser correction; it was not rerun because the correction does not modify browser UI or navigation.

The earlier Supabase temporary-table CRUD integration probe also remains valid: create/read/update/delete, Free expiry transition, payment completion, and invoice linkage all passed and the transaction rolled back. Because development branching is unavailable on the connected Supabase plan, no persistent test branch or real production business write was used.

## References

[1]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase database linter: authenticated SECURITY DEFINER execution"

[2]: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable "Supabase database linter: anonymous SECURITY DEFINER execution"

[3]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase Auth password strength and leaked-password protection"
