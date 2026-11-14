# Smart Manager Tenant-Scoped Billing Administrator Permission Audit

**Audit date:** 22 August 2026
**Scope:** Read-only production audit of active workspace billing-administrator assignments, membership boundaries, billing record scope, RLS policies, and billing function execution privileges.
**Identity handling:** This report uses aggregate counts only. No names, email addresses, phone numbers, tenant names, billing data, payment data, or other personal information were retrieved or displayed.

## Executive assessment

> **Current assignment posture: no active tenant-scoping anomalies were detected.** All seven active workspaces have exactly one active billing administrator, and the reviewed active permission records did not show inactive administrators, cross-workspace membership administrator assignments, multi-workspace billing administrators, role mismatches, missing billing administrators, or cross-tenant subscription plan references.

The live RLS policies for subscription, payment, invoice, usage, event, notification, profile, and audit data correctly bind reads to `current_company_id()` and `billing_is_manager()`.

A **preventive hardening finding** remains: `billing_is_manager()` does not explicitly check `profiles.is_active`. There are currently no inactive-profile administrator assignments, so this is not an active-access incident. Nevertheless, a future deactivation that leaves a valid auth account and qualifying membership/profile role could retain billing authority until the user’s session or role is separately revoked. This should be remediated in a controlled follow-up change.

| Metric | Result | Assessment |
| --- | ---: | --- |
| Active workspaces in scope | 7 | Audited |
| Billing-administrator assignments | 7 | Expected one-per-workspace baseline |
| Distinct billing-administrator users | 7 | No shared administrator identity detected |
| Active workspaces without a billing administrator | 0 | Pass |
| Active workspaces with multiple billing administrators | 0 | Pass against current baseline |
| Inactive profile billing-administrator assignments | 0 | Pass |
| Inactive or missing-profile membership administrator assignments | 0 | Pass |
| Cross-workspace membership administrator assignments | 0 | Pass |
| Multi-workspace billing-administrator users | 0 | Pass |
| Same-workspace profile/membership billing-role mismatches | 0 | Pass |
| Subscriptions referencing another tenant’s plan | 0 | Pass |
| Tenant plans missing creator audit reference | 0 | Pass |

## Tenant-scope controls reviewed

| Control | Live result | Assessment |
| --- | --- | --- |
| Subscription/payment/invoice/usage/event/profile RLS | `company_id = current_company_id()` and `billing_is_manager()` | Tenant-scoped read boundary is present |
| Notification and plan-audit RLS | Same current-company and billing-manager boundary | Tenant-scoped audit/notification visibility is present |
| Billing administrator role sources | Profile role and company membership role | Expected dual-source authorization model |
| Official package catalog | Global plans are separated from company-specific plans | Plan scope is explicit |
| Subscription plan reference | No active subscription references a different tenant’s company-scoped plan | No cross-tenant plan linkage found |
| Platform catalog management | Global catalog edits require platform-admin check | Privileged catalog change boundary is present |

## Billing function privilege matrix

Direct anonymous execution is denied for every callable billing control function, including catalog access, billing snapshots, trial start/selection, profile and plan management, payment intent creation, provider dispatch, payment-state application, and trial reconciliation.

| Function group | Anonymous execution | Authenticated execution | Service execution | Assessment |
| --- | --- | --- | --- | --- |
| Customer/administrator actions: snapshot, profile, plan, payment intent, trial start/select | Denied | Granted | Granted | Function-level authorization performs role and tenant checks |
| Provider-only actions: dispatch, failure, apply provider status, reconciliation | Denied | Denied | Granted | Correct server-only boundary |
| Catalog function | Denied | Denied | Granted | Correct server-proxy boundary |
| Internal trigger helpers: `billing_touch_updated_at`, `billing_audit_plan_change` | Reported executable by roles, but return trigger types | Not a direct tenant-data route; harden as defence in depth | Low-priority hardening |

## Findings and recommendations

| Priority | Finding | Current impact | Recommendation |
| --- | --- | --- | --- |
| Medium | `billing_is_manager()` does not include an explicit `profiles.is_active` condition. | No current affected assignment was found; a future deactivation can become a latent entitlement risk if a valid auth session and billing membership/role remain. | Add `coalesce(p.is_active, true)` for profile-role authorization and require a linked active profile for membership-role authorization; then regression-test deactivated users. |
| Low | Trigger-return billing helper functions show executable role privileges in PostgreSQL privilege inspection. | Trigger return types make them non-routable as normal billing RPCs; no current tenant exposure was observed. | Explicitly revoke `PUBLIC`, `anon`, and `authenticated` execution from `billing_touch_updated_at()` and `billing_audit_plan_change()` while retaining trigger invocation. |
| Operational | The audit found one administrator per active workspace. | This matches the present state but creates no redundancy for absences or offboarding. | Consider assigning a second, independently verified billing administrator per workspace after confirming the desired segregation-of-duties policy. |

## Conclusion

The audit found **no current cross-tenant billing access anomaly** and **no unauthorized active billing administrator assignment** across the seven active workspaces. Subscription and financial billing records are protected by current-company RLS policies and manager-gated functions, while provider and reconciliation actions remain service-only.

No production records, permissions, roles, subscriptions, plans, payments, or policies were modified during this audit.
