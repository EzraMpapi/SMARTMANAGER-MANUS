# SMART MANAGER — Live RLS Audit and Tenant-Isolation Test Breakdown

**Audit date:** 25 August 2026  
**Live Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Method:** Read-only catalog, policy, grant, migration-ledger, advisor, schema-contract, and automated test inspection.

## Executive result

The live public schema contains **535 tables**, and all **535 have RLS enabled**. The authoritative repository schema verifier completed at `2026-08-25T20:57:13.059Z` with **201 referenced tables**, **536 OpenAPI-exposed deployed tables**, **zero missing tables**, **zero tenant-column issues**, and **zero critical contract issues**. Therefore, no new table, column, function, trigger, policy, or grant is justified by this audit.

The security posture is not represented as risk-free: the Supabase security advisor reports **139 findings**. These are classified as six policyless-RLS informational notices, six anonymous SECURITY DEFINER execute warnings, 126 authenticated SECURITY DEFINER execute warnings, and one leaked-password-protection configuration warning. They require staged signature- and workflow-specific remediation; the audit did not make blanket policy, grant, or function-security changes.

## Live RLS policy and grant posture

| Measure | Live result | Interpretation |
|---|---:|---|
| Public tables | 535 | Catalog tables inspected through PostgreSQL metadata |
| Tables with RLS enabled | 535 | RLS is enabled across the public schema |
| Tables with RLS disabled | 0 | No public-table RLS disablement found |
| RLS tables with zero policies | 6 | Verified backend-only deny-by-default surfaces; detailed below |
| Tables with `anon` grants | 128 | Requires policy and endpoint-specific review; not a standalone exposure finding |
| Tables with `authenticated` grants | 526 | Expected for application workflows and constrained by RLS policies |

The live policy inventory includes 290 permissive `ALL` policies for `authenticated`, 88 permissive `ALL` policies for `public`, one permissive `ALL` policy for `service_role`, one restrictive `ALL` policy for `public`, and authenticated policies for 29 `DELETE`, 32 `INSERT`, 260 `SELECT`, and 33 `UPDATE` operations. These totals are policy records, not a proof that each policy is equally broad; policy predicates and SECURITY DEFINER call paths must remain the next review layer.

### RLS-enabled tables with zero policies

All six policyless tables are owned by `postgres`, keep RLS enabled, have no listed `anon` or `authenticated` grant, and list full privileges only for `service_role`.

| Table | Policy count | Ordinary role grants | Service-role posture | Decision |
|---|---:|---|---|---|
| `bank_provider_webhook_account_controls` | 0 | none | full operational access | Intentional backend/webhook control surface |
| `bank_provider_webhook_drain_approvals` | 0 | none | full operational access | Intentional backend/webhook control surface |
| `bank_provider_webhook_drain_runs` | 0 | none | full operational access | Intentional backend/webhook control surface |
| `bank_provider_webhook_remediation` | 0 | none | full operational access | Intentional backend/webhook control surface |
| `platform_admin_actions` | 0 | none | full operational access | Intentional platform-administration control surface |
| `subscription_trial_expiry_notices` | 0 | none | full operational access | Intentional backend notification-control surface |

> These six advisor notices are consistent with deny-by-default RLS, not evidence that a generic authenticated policy should be added. No policy was added or broadened.

## Security advisor breakdown

| Advisor category | Count | Audit disposition |
|---|---:|---|
| `rls_enabled_no_policy` | 6 INFO | Verified as service-role-only control surfaces |
| `anon_security_definer_function_executable` | 6 WARN | Preserve until public booking/workflow contracts are reviewed signature by signature |
| `authenticated_security_definer_function_executable` | 126 WARN | Preserve until domain authorization, search path, execute grant, and tenant checks are reviewed signature by signature |
| `auth_leaked_password_protection` | 1 WARN | Owner-controlled Supabase Auth dashboard setting; not safely changed by database migration |

## Tenant-isolation suite: 63 passed tests

The focused suite completed with **63 passed tests** in seven files. The 63 tests are grouped below by their exercised security property.

| Test file | Passed | Environment-gated skips | Coverage |
|---|---:|---:|---|
| `healthcareRouter.integration.test.ts` | 48 | 0 | Active-company healthcare routes, role limits, foreign-company blocking, safe not-found behavior, clinical export/reconciliation controls |
| `communityGroupsRlsPenetration.test.ts` | 1 | 5 | Live-penetration prerequisite enforcement |
| `microfinanceRouter.integration.test.ts` | 5 | 0 | Tenant-scoped loan products, credit rules, and escalation authority |
| `supabase.authRls.test.ts` | 1 | 2 | Dedicated two-JWT live-test gating |
| `rlsSchemaReconciliationContracts.test.ts` | 2 | 0 | Public versus auth-schema RLS interpretation |
| `supabaseSecurityHardening.test.ts` | 3 | 0 | Trigger-function search paths, PIN credential deny-by-default, grant preservation |
| `tenantAuditViewer.test.ts` | 3 | 0 | Tenant-scoped audit history and non-durable local-event protection |

### Healthcare: 48 passed tests

The healthcare integration contract confirms authenticated company-route persistence for diagnostics, pharmacy, billing, claims, reports, and notifications. It also verifies receptionist claim denial before writes; active-company update/archive paths; foreign-company read/mutation denial; safe not-found results for patient, appointment, visit, vital, prescription, and doctor records; clinic administrator, clinic supervisor, front-desk, clinician, laboratory, pharmacy, and billing-role boundaries; tenant-scoped portal-reference and decision-audit workflows; protected daily reconciliation configuration; FHIR export scoping; clinician analytics scoping; and role-by-record deny tests for patient-care creates, updates, archives, and reads.

### Community Groups: 1 passed test and 5 controlled skips

The passed test verifies that a true live penetration run requires two tenant JWTs plus isolated tenant-A and tenant-B fixtures. The five skipped tests are intentionally withheld until that controlled environment exists: cross-tenant group/child-row reads; cross-tenant inserts and relationship forgery; cross-tenant update/delete and company-id tampering; forged audit actors/history mutation; and unauthorized approval/disbursement of tenant-B loans.

### Microfinance: 5 passed tests

The microfinance contract verifies that loan products are created through an authenticated tenant route, non-microfinance staff are denied before a write is attempted, approved credit rules persist only through that route, unapproved roles cannot load or modify credit rules, and administrator-selected escalation recipients do not broaden delivery.

### Supabase JWT/RLS: 1 passed test and 2 controlled skips

The passed test verifies that live claim checks remain disabled without both dedicated test JWTs. The skipped tests are the actual live two-user checks: resolving each JWT subject to its own profile/company and proving a company-scoped table cannot be read using an arbitrary client-supplied company filter. Skipping these without controlled JWTs is an isolation safeguard, not a passing result.

### Schema, hardening, and audit-viewer tests: 8 passed tests

The remaining tests confirm documented public/auth RLS interpretation, safe trigger-function search paths, PIN credential RLS direct-access denial, preservation of protected workflow functions and grants, tenant-scoped audit history loading/filtering, and avoidance of presenting an unconfirmed client-side audit event as durable history.

## Schema and migration decision

The current schema verifier found no missing referenced table and no critical mismatch. The live migration ledger includes `healthcare_lab_categories_schema_20260825`, corresponding to the current healthcare laboratory category migration. **No new table was created during this audit** because no authoritative code/schema check demonstrated a missing object. Creating speculative tables would risk duplicate data structures and weaken the project’s schema governance.

## Remaining verification boundary

The seven skips require two controlled authenticated test identities, tenant-A/tenant-B fixtures, and approved cleanup authority. They are the remaining evidence needed to claim direct live cross-tenant penetration proof. Until those inputs are provisioned, the audit supports source-level and controlled integration-contract assurance, not a claim of live production user-to-user penetration testing.

## References

[1]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[3]: https://supabase.com/docs/guides/database/database-advisors "Supabase Database Advisors"  
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS "SMART MANAGER GitHub repository"
