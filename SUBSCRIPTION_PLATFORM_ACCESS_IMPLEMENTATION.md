# Subscription Platform Access Implementation

## Scope

Smart Manager treats subscription and billing as a **company-level platform capability**, not as a normal ERP operating module. The existing database-driven billing architecture was reused; no duplicate subscription or payment tables were introduced. The billing center remains available to authorized billing administrators through the account menu, Organization Settings, onboarding recovery messaging, and the restricted-access shell.

The operating principle is fail-closed: the browser may render a status indicator or request a destination, but it cannot grant subscription access. The server resolves the authenticated Supabase session, the database derives the company subscription state and module entitlements, and provider confirmation remains the only path that can activate a paid subscription.

## Final commercial model

The official database catalog contains one `FREE_15` package and six paid packages. `FREE_15` costs TZS 0 and grants 15 days of introductory access without a payment request. TWIGA, TEMBO, SIMBA, SIMBA SC, YANGA SC, and AZAM FC are monthly packages: the customer pays for one calendar month and receives one promotional bonus calendar month, for two months of total access. The bonus is a promotional entitlement, not a separate access trial. TEMBO is marked `POPULAR`, and the three Football packages are returned with category `Football` for the distinct Football Fans Special section.

| Package | Code | Price | Access contract |
|---|---|---:|---|
| FREE | `FREE_15` | TZS 0 | 15 days; no payment required |
| TWIGA | `TWIGA` | TZS 5,000/month | 1 paid month + 1 bonus month = 2 months |
| TEMBO | `TEMBO` | TZS 10,000/month | 1 paid month + 1 bonus month = 2 months |
| SIMBA | `SIMBA` | TZS 15,000/month | 1 paid month + 1 bonus month = 2 months |
| SIMBA SC | `SIMBA_SC` | TZS 4,500/month | 1 paid month + 1 bonus month = 2 months |
| YANGA SC | `YANGA_SC` | TZS 9,000/month | 1 paid month + 1 bonus month = 2 months |
| AZAM FC | `AZAM_FC` | TZS 7,000/month | 1 paid month + 1 bonus month = 2 months |

## Existing schema reused

The platform contract reads the live `billing_plans`, `billing_profiles`, `tenant_subscriptions`, `subscription_payments`, `subscription_invoices`, `subscription_usage`, and `subscription_events` architecture. The final migration adds `paid_months`, `bonus_months`, `total_months`, `duration_days`, and `offer_code` where required, while preserving tenant keys, payment history, audit logs, idempotency constraints, and RLS.

| Capability | Authoritative source | Application behavior |
|---|---|---|
| Plan names, prices, limits and entitlements | `billing_plans` | Onboarding and billing cards read the database catalog; no client price is authoritative. |
| Free activation | `billing_start_free_plan(text)` | Authenticated billing managers can activate `FREE_15` once; no payment is created. |
| Paid activation | HarakaPay payment lifecycle and verified provider status | Browser state never changes a subscription to active. |
| Current access state | `billing_access_snapshot()` | The shell receives only the minimum company-scoped status and entitlement payload. |
| Billing administration | Verified profile role plus existing `billing_is_manager()` gate | Only billing managers can open package, payment, invoice, profile, or plan-admin controls. |
| Expiration behavior | `billing_reconcile_free_plan_expiry(uuid)` and server-derived dates | Free expiry transitions to `RequiresPlan`; no automatic charge or upgrade occurs. |

## Versioned database changes

Migration `20260823_062_subscription_free_plan_model.sql` adds the final package-duration fields, normalizes the seven official packages, replaces the billing catalog/access/payment RPCs, adds authenticated Free activation, adds service-role Free-expiry reconciliation, removes the retired live trial functions and columns, and preserves existing tenant/RLS/payment controls. Paid expiry uses PostgreSQL calendar-month arithmetic through `make_interval(months => v_plan.total_months)` rather than a fixed day count.

Migration `20260823_063_subscription_monthly_constraint_correction.sql` tightens the inherited `tenant_subscriptions.billing_cycle` constraint to `Monthly` and removes an unnecessary `service_role` execution grant from `billing_start_free_plan`. Both migrations are applied in Supabase and recorded in `supabase/MIGRATION_EXECUTION_LOG.md` at versions `20260823193058` and `20260823193854`.

## Shell and navigation behavior

`Subscription Billing` remains outside the regular ERP module catalog and is available through the protected billing destination. The profile identity center exposes `Subscription & Billing` only when the verified role is billing-manager eligible, and Organization Settings exposes the same destination under the same UI boundary. The existing `SubscriptionBillingWorkspace` remains the platform subscription control center.

The authenticated shell calls `/api/billing/access`, which forwards the verified session to `billing_access_snapshot()`. `Active` and server-defined `Grace` state can proceed; `Pending`, `Expired`, `RequiresPlan`, and unconfirmed state remain restricted. Profile, support, notifications, and settings remain recovery destinations. Billing is available from the restricted shell only for an authorized billing administrator.

Operational module visibility is the intersection of existing company module configuration, verified role permissions, and database-returned package entitlements. The adapter contains no browser-storage subscription authority and fails closed for unknown or unconfirmed responses. The only bypass is the explicit isolated `MODE=e2e` fixture used by deterministic tests; that path does not contact a real Supabase tenant.

## Live verification evidence

The connected Supabase project is `rlhngsrihahhyxnjxrxm`. The post-apply catalog query returned exactly seven active official packages with the final prices and duration terms above. The live database had zero `tenant_subscriptions` rows, two historical payment rows (both monthly), and zero invoices. All four billing tables retained RLS. The retired live columns and functions were absent. `billing_start_free_plan` had only authenticated execution; the public catalog and expiry reconciliation remained service-role-only. All six subscription routines reported `search_path=pg_catalog, public, auth`.

The final RLS and routine posture query reported 518 public tables, 719 policies, zero RLS-disabled public tables, zero policyless public tables, zero unrestricted `true` predicates, and 182 public SECURITY DEFINER routines. The refreshed Security Advisor reported 116 warnings: six intentionally public SafariTiketi booking routines, 109 authenticated SECURITY DEFINER endpoint notices requiring endpoint-by-endpoint review, and one Auth leaked-password-protection configuration notice. The subscription change did not mass-revoke unrelated routines or alter the six public booking contracts.

## Isolated CRUD verification

The Supabase organization does not support development branches, so no paid branch was left running. A transaction-scoped temporary-table probe exercised create, read, update, delete, Free-plan expiry transition, payment completion, and invoice linkage. Every assertion passed, and the transaction rolled back. No production business table or permanent business row was used for the probe. A live write against a real tenant was intentionally not performed because no isolated production test tenant was available.

## Validation

| Check | Result |
|---|---|
| Focused subscription contract tests | Passed: 18 tests |
| Full Vitest suite | Passed: 207 files, 847 tests; 5 files and 13 tests skipped by existing suite rules |
| TypeScript check | Passed with `pnpm check` |
| Production build | Passed with `VERCEL=1 pnpm build`; existing large-chunk advisory only |
| Browser regression suite | Passed: 23 of 23 Playwright scenarios |
| Live Supabase catalog and RLS verification | Passed; exact seven-package catalog, monthly payment history, RLS preserved |
| Temporary Supabase CRUD probe | Passed; all assertions true, transaction rolled back |

The focused tests cover the platform navigation boundary, billing-manager visibility, server-only access normalization, provider-pending and expiry fail-closed behavior, onboarding Free activation, monthly checkout, amount verification, calendar-month duration, idempotency, and absence of retired runtime terminology. A real HarakaPay settlement was not invoked because provider credentials and a production test payment authorization were not supplied.

## Scope boundaries

The implementation does not auto-charge expired users, auto-upgrade accounts, implement auto-renewal, silently destroy remaining subscription time, grant access from browser state, expose payment credentials, alter unrelated modules, or mass-revoke unrelated SECURITY DEFINER routines. Upgrade/downgrade policy remains a separate controlled product decision because it requires an explicit proration and scheduling rule.

Historical migration files that established the former model remain immutable migration history. They are not active runtime code; the live cleanup migration removed their functions and columns, active API/UI references were replaced, and current acceptance tests scan runtime files for retired subscription identifiers and terminology.
