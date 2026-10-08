# SMART MANAGER Subscription Activation Repair

## Scope

This repair addresses the supplied production screenshot and the attached activation requirements. The visible failure was PostgreSQL `missing FROM-clause entry for table "e"` in the billing workspace. Source tracing identified the deployed `public.billing_snapshot()` definition in the published Free-15 migration: its `events` aggregate selected the derived table as `e` while ordering and serializing through an out-of-scope alias in the surrounding query shape.

The repair also completes the activation contract. Free activation remains on the existing `billing_start_free_plan(text)` RPC and now serializes repeated attempts per tenant with a transaction-scoped advisory lock. Paid activation remains provider-confirmed through `billing_apply_provider_status`; a successful verified payment creates the Active tenant subscription and invoice in the existing transaction path. No duplicate subscription tables or parallel entitlements architecture was introduced.

## Changes prepared

| Area | Change |
| --- | --- |
| Supabase migration | `20260824_061_subscription_activation_flow_repair.sql` replaces `billing_snapshot()` with explicit derived-row aliases and replaces `billing_start_free_plan()` with an idempotent, locked implementation. |
| Free activation | Existing `FREE_15` plan is validated as zero-cost and duration-configured; the RPC creates one Active tenant subscription, notification, and audit event, and returns the existing record for repeated attempts. |
| Paid activation | Existing server provider verification and `billing_apply_provider_status` path are preserved. Successful verification remains the only paid activation path. |
| Entitlement refresh | `subscriptionAccess.js` listens for a server-confirmed subscription update and refetches `/api/billing/access` with `cache: no-store`. |
| Redirects | Billing returns to the dashboard only after an Active/Grace Free record or Completed paid payment is confirmed. Pending, failed, cancelled, expired, and RequiresPlan states remain actionable and do not silently grant access. |
| Regression tests | Added `subscriptionActivationContracts.test.ts` and updated stale subscription contract assertions to the current Free-15 architecture. |

## Schema decision

The live source and migration inventory already contain `billing_plans`, `tenant_subscriptions`, `subscription_payments`, `subscription_invoices`, `subscription_events`, `subscription_notifications`, plan entitlements, tenant relationships, RLS policies, and the existing activation/payment RPCs. Therefore no new tables are required for this repair. The migration is forward-only and does not seed duplicate data or weaken RLS.

## Local validation

- Focused subscription contracts: 24 passed.
- Full repository suite: 864 passed, 13 skipped across 211 passed test files and 5 skipped files.
- TypeScript check: passed.
- Vite frontend production compiler: passed.
- Server production bundle: passed.
- The repository `pnpm build` wrapper remains deployment-environment guarded because `verify:supabase-schema` requires `SUPABASE_URL`/`VITE_SUPABASE_URL` and `SUPABASE_SECRET_KEY`, which are not present in the sandbox. Direct frontend and server compilation passed.

## Live Supabase status

The forward-only migration was applied successfully through the Supabase connector after the maintenance window cleared. The migration registry records version `20260824030201` with name `subscription_activation_flow_repair_20260824`.

A bounded live verification confirmed that `billing_plans`, `tenant_subscriptions`, `subscription_payments`, `subscription_invoices`, `subscription_events`, and `subscription_notifications` all exist and have RLS enabled. The deployed `billing_snapshot()` and `billing_start_free_plan(text)` functions are executable by `authenticated`; `billing_apply_provider_status` remains service-bound and is not directly executable by ordinary authenticated clients, which preserves the provider-verification boundary. The deployed definitions show explicit `event_row`/`payment_row`/`invoice_row` aliases and the tenant-scoped advisory transaction lock for Free-plan activation.

An authenticated end-to-end user transaction was not simulated with a service-role credential. The remaining production verification is to exercise Free activation and provider-confirmed paid activation with a real authorized test account when an authenticated test session is available.

## Security posture

The repair derives workspace scope from the authenticated session through `current_company_id()`. It preserves the existing manager guard, `SECURITY DEFINER` functions with an explicit search path, authenticated-only execution grants, provider verification, tenant RLS, and server-authoritative entitlement checks. The browser cannot activate paid access, choose another tenant, or use local storage as an entitlement source.
