# Smart Manager Subscription Trial & Official Plan Catalog — Release Validation

**Validation date:** 22 August 2026  
**Scope:** Official TZS package catalog, one-time 30-day trials, onboarding selection, trial expiry controls, billing administration, HarakaPay payment safeguards, and responsive billing experience.

## Release outcome

> **Release status: validated and publishable.** The trial enhancement is live in the Smart Manager Supabase schema and the repository is release-green. The payment service remains deliberately server-only; no HarakaPay secret, customer payment credential, or live charge was introduced during validation.

| Validation area | Result | Evidence |
| --- | --- | --- |
| Official package catalog | Passed | Six global, active TZS plans were verified in the live billing table. |
| One-time trial enforcement | Passed | A partial unique index permits only one subscription with a recorded `trial_started_at` per company. |
| Trial duration and state | Passed | Each official package has a 30-day trial; `trial_started_at` and `trial_ends_at` are persisted on the tenant subscription. |
| Expiry and notifications | Passed | Server reconciliation changes due trials to `Expired` and writes deduplicated 7/3/1-day and expiry in-app notifications. |
| Onboarding activation | Passed by source contract and type validation | Both password and OAuth company-creation paths select a database catalog package then call the authenticated `billing_start_trial` RPC after workspace confirmation. |
| Package changes during trial | Passed by source contract | Authenticated billing administrators can select a different official package during an active trial without changing the original expiry date. |
| Paid conversion | Passed by inherited payment contract | HarakaPay remains a server-only USSD flow; paid activation is limited to provider order, amount, and status verification. |
| Billing plan administration | Passed | Prices, limits, feature flags, module entitlements, themes, categories, and trial days are exposed only via audited, role-checked procedures. |
| Anonymous function access | Passed | Live privilege audit returned `false` for all anonymous catalog/trial/reconciliation function execution paths. |
| Type validation | Passed | `pnpm check` completed without errors. |
| Production client build | Passed | `pnpm exec vite build` transformed 2,662 modules successfully. |
| Full regression suite | Passed | 169 test files passed, 5 skipped; 660 tests passed, 8 skipped. |

## Live official catalog

| Section | Code | Package | Monthly price | Currency | Trial |
| --- | --- | --- | ---: | --- | --- |
| Business Plans | `TWIGA` | TWIGA | 5,000 | TZS | 30 days |
| Business Plans | `TEMBO` | TEMBO | 10,000 | TZS | 30 days |
| Business Plans | `SIMBA` | SIMBA | 15,000 | TZS | 30 days |
| Football Fans Special | `SIMBA_SC` | SIMBA SC SPECIAL | 4,500 | TZS | 30 days |
| Football Fans Special | `YANGA_SC` | YANGA SC SPECIAL | 9,000 | TZS | 30 days |
| Football Fans Special | `AZAM_FC` | AZAM FC SPECIAL | 7,000 | TZS | 30 days |

The customer-facing workspace separates **SMART MANAGER BUSINESS PLANS** from **FOOTBALL FANS SPECIAL** and uses abstract red, green, and sky styling only; no club logos or protected assets are included. Every card presents the real TZS monthly price from the protected catalog, the 30-day trial message, limits, feature flags, and the correct state-aware action.

## Security and lifecycle controls

The implementation is tenant-scoped, RLS-protected, and uses `current_company_id()` for persisted subscription objects. `billing_start_trial` requires a verified workspace billing administrator and refuses a repeat entitlement. `billing_select_trial_plan` is limited to an active trial and retains the original trial end time. `billing_reconcile_trial_expiry` is restricted to the service role; it is invoked before secure billing snapshots and is also available through the cron-authenticated `/api/scheduled/subscriptionTrialLifecycle` route.

| Role or surface | Permitted action |
| --- | --- |
| Anonymous browser / PostgREST RPC | No direct billing catalog, trial-start, trial-selection, or reconciliation execution. |
| Server catalog endpoint | Returns the curated official catalog through the server-side Supabase role. |
| Authenticated billing administrator | Starts one trial, chooses a trial package, reads billing state, and manages company plans. |
| Platform administrator | May edit global official packages through the audited plan procedure. |
| Service role / cron-authenticated lifecycle endpoint | Reconciles trial warning and expiry states only; it cannot initiate a charge. |

> **Scheduler deployment note:** The application route is implemented and cron-authenticated. The production deployment should invoke `POST /api/scheduled/subscriptionTrialLifecycle` once daily using the existing scheduled-task mechanism so 7/3/1-day notifications are proactive even when no administrator opens Billing. Snapshot refresh also reconciles the current company on access.

## Files and live migrations

The release contains the official catalog and trial lifecycle migration `20260822_028_subscription_trials_and_official_catalog.sql`, explicit anonymous-execution hardening in `20260822_029_subscription_trial_function_execute_hardening.sql`, and audited plan-administration controls in `20260822_030_subscription_plan_admin_controls.sql`. It also updates the billing server routes, the cron lifecycle handler, both onboarding paths, the subscription workspace, and the subscription billing contracts.

## Known non-blocking warnings

The standalone Vite build continues to report pre-existing non-blocking analytics placeholder and large legacy dashboard chunk warnings. The final security advisor still identifies older unrelated anonymous `SECURITY DEFINER` functions in legacy booking and workspace areas. The advisor no longer reports any function introduced by this subscription trial release.
