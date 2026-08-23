# Subscription Platform Access Implementation

## Scope

Smart Manager now treats subscription and billing as a **company-level platform capability**, not as a normal ERP operating module. The existing database-driven billing architecture was reused; no duplicate subscription or payment tables were introduced. The billing center remains available to authorized billing administrators through the account menu, Organization Settings, onboarding recovery messaging, and the restricted-access shell.

The operating principle is fail-closed: the browser may render a status indicator or request a destination, but it cannot grant subscription access. The server resolves the authenticated Supabase session, the database derives the company subscription state and module entitlements, and provider confirmation remains the only path that can activate a paid subscription.

## Existing schema reused

The platform contract reads the live `billing_plans`, `billing_profiles`, `tenant_subscriptions`, `subscription_payments`, `subscription_invoices`, `subscription_usage`, and `subscription_events` architecture. Official plan pricing and entitlements remain database-owned, including TWIGA, TEMBO, SIMBA, SIMBA SC, YANGA SC, and AZAM FC. The existing trial RPC continues to create one company-scoped trial with the configured plan’s trial duration, currently 30 days.

| Capability | Authoritative source | Application behavior |
|---|---|---|
| Plan names, prices, limits and entitlements | `billing_plans` | Onboarding and billing cards read the existing catalog; no client price is authoritative. |
| Trial creation and one-time company trial | `billing_start_trial(text)` and `tenant_subscriptions` | The selected catalog plan is passed to the server after company creation. |
| Paid activation | Existing HarakaPay payment lifecycle and verified provider status | Browser state never changes a subscription to active. |
| Current access state | `billing_access_snapshot()` | The shell receives only the minimum company-scoped status and entitlement payload. |
| Billing administration | Verified profile role plus existing `billing_is_manager()` gate | Only billing managers can open plan, payment, invoice, profile, or plan-admin controls. |
| Expiration behavior | Server-derived subscription status and dates | Operational access pauses without deleting company, profile, or business records. |

## Versioned database changes

Migration `20260823_047_rls_policy_helper_execute_grants.sql` repairs the narrowly reviewed SECURITY DEFINER helpers that are directly called by authenticated RLS policies. It pins their search path to `pg_catalog, public, auth`, revokes anonymous and public execution, and grants execution only to `authenticated`. The migration does not broaden table access and does not change protected Property Management or Money Agent credential restrictions.

Migration `20260823_048_subscription_access_snapshot.sql` adds only the `billing_access_snapshot()` RPC. It reads the existing profile, subscription, and plan rows; returns server-derived `Trial`, `Active`, `Grace`, `Pending`, `Expired`, or `Required` state; includes the billing-admin capability returned by the existing manager helper; and returns the plan’s database-owned module entitlement list. It grants execution only to `authenticated` and pins the function search path. No table is created, dropped, truncated, or copied by this migration.

## Shell and navigation behavior

`Subscription Billing` was removed from the regular `MODULES` catalog and therefore no longer appears as a normal ERP sidebar or mobile module. The shell still recognizes the `billing` destination, but its navigation handler rejects non-billing administrators. The profile identity center exposes `Subscription & Billing` only when the verified role is billing-manager eligible, and Organization Settings exposes the same destination under the same UI hint. The existing `SubscriptionBillingWorkspace` was retained and reframed as the platform subscription control center rather than rebuilt as a second billing implementation.

The authenticated shell calls `/api/billing/access`, which forwards the verified session to `billing_access_snapshot()`. During live configured operation, unknown or unavailable access state pauses operational rendering. `Trial`, `Active`, and server-defined `Grace` state can proceed, while `Pending`, `Expired`, `Required`, and unconfirmed state remain restricted. Profile, support, notifications, and settings remain recovery destinations; billing remains available from the restricted shell only for an authorized billing administrator.

Operational module visibility is the intersection of the existing company module configuration, the verified role’s allowed modules, and the database-returned plan entitlements. The adapter has no `localStorage` or `sessionStorage` subscription authority. The only bypass is the explicit `MODE=e2e` isolated browser fixture used by the repository’s deterministic tests; that path does not contact a real Supabase tenant and is not production behavior.

## Live verification evidence

The connected Supabase project is `rlhngsrihahhyxnjxrxm`. Migration history records `rls_policy_helper_execute_grants` at version `20260823135435` and `subscription_access_snapshot` at version `20260823142807`. A live ACL query confirmed that `billing_access_snapshot()` and all six reviewed RLS helpers have `authenticated` execution, deny `anon` execution, and use `search_path=pg_catalog, public, auth`.

The post-047 transaction-scoped authenticated read sweep covered **511 company-scoped tables**. **473** completed without execution errors and no cross-tenant rows were observed. The remaining **38** errors were the intentionally direct-denied `money_agent_pin_credentials` table and **37** intentionally locked Property Management tables. No reviewed SECURITY DEFINER helper permission error remained, and the sweep rolled back its temporary probe data.

A separate transaction-scoped authenticated call to `billing_access_snapshot()` using the existing RLS audit fixture returned `state=required`, `allowed=false`, no plan, no subscription, and `canManageBilling=true` for the fixture owner. This is the expected fail-closed result for a company that has not been granted a trial or confirmed payment; the probe rolled back and created no subscription.

## Validation

| Check | Result |
|---|---|
| Focused platform and helper contract tests | Passed: 11 tests |
| Full Vitest suite | Passed: 193 files, 783 tests; 5 files and 13 tests skipped by existing suite rules |
| TypeScript check | Passed with `pnpm check` |
| Production dependency audit | Passed at high severity threshold |
| Configured production build | Passed with Vercel mode; schema verification was correctly skipped because no server-only schema credential is present in the local Vercel build environment |
| Browser regression suite | Passed: 23 scenarios |

The tests verify the platform navigation boundary, billing-admin visibility, server-only access normalization, provider-pending and expired fail-closed behavior, onboarding catalog/trial wiring, and the least-privilege helper migration. A real payment provider settlement and a production deployment were not claimed or invoked in this validation because authorized provider and deployment credentials were not supplied for this session.
