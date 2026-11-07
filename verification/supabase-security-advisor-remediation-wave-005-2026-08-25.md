# SMART MANAGER — Supabase Security Advisor Remediation Report, Wave 005

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)

## Executive conclusion

A fresh Supabase Security Advisor scan was performed after FK-index remediation wave 005. The scan returned **139 findings: 133 WARN and 6 INFO**. The security findings remain concentrated in four areas: six anonymous-executable `SECURITY DEFINER` functions, 126 authenticated-executable `SECURITY DEFINER` functions, one Auth leaked-password-protection recommendation, and six RLS-enabled public tables without direct policies.

No security-definer function, grant, RLS policy, table privilege, table, constraint, or business row was changed during this pass. This is intentional. The flagged functions include identity, tenant/workspace, financial, POS, banking, HR, public booking, and administrative workflows. Blanket `REVOKE`, blanket `SECURITY INVOKER` conversion, or generic RLS policy creation could break legitimate workflows or weaken tenant isolation.

## Current live security posture

The following counts were collected from the live public PostgreSQL catalog and current advisor responses.

| Object or control | Live result | Interpretation |
|---|---:|---|
| Public tables | 532 | Current public relational table inventory. |
| Public columns | 6,414 | Current column inventory. |
| Foreign-key constraints | 1,130 | Constraint count is independent of index coverage. |
| Primary-key constraints | 532 | Every inventoried public table has a primary key in the connector inventory. |
| Unique constraints | 278 | Constraint-backed uniqueness remains unchanged by FK waves. |
| Public indexes | 1,397 | Includes the 25 wave-005 indexes and pre-existing indexes. |
| Non-internal triggers | 451 | Current trigger inventory. |
| Public functions/procedures | 246 | `pg_proc` routines in the public schema. |
| `SECURITY DEFINER` functions | 203 | Elevated execution remains subject to signature-by-signature review. |
| Definer functions with `search_path` pinning | 203 | The catalog check found all 203 with a pinned search path. |
| Public tables with RLS enabled | 532 | No public table is left with RLS disabled. |
| Public RLS policies | 731 | Policy predicates remain unchanged in this pass. |
| RLS-enabled tables without direct policies | 6 | Procedure-only access candidates requiring intentional review. |

## Advisor finding inventory

| Advisor finding | Severity | Count | Status |
|---|---|---:|---|
| `anon_security_definer_function_executable` | WARN | 6 | Retained pending public-booking threat-model and least-privilege review. |
| `authenticated_security_definer_function_executable` | WARN | 126 | Retained pending function-by-function caller, tenant, role, and grant review. |
| `auth_leaked_password_protection` | WARN | 1 | Requires owner/admin enablement in Supabase Auth settings. |
| `rls_enabled_no_policy` | INFO | 6 | Retained as intentional procedure-only candidates pending controlled verification. |
| **Total** |  | **139** | **No blanket remediation applied.** |

The six anonymous-executable functions are `cancel_booking`, `extend_hold`, `get_booking`, `hold_seats`, `release_hold`, and `seat_availability`. These form the public booking and seat-hold surface and require the highest-priority threat-model review.

The six RLS-enabled/no-direct-policy tables are `bank_provider_webhook_account_controls`, `bank_provider_webhook_drain_approvals`, `bank_provider_webhook_drain_runs`, `bank_provider_webhook_remediation`, `platform_admin_actions`, and `subscription_trial_expiry_notices`. Their absence of direct policies is not evidence that a generic policy should be added; access may be intentionally routed through guarded procedures, service controls, or administrative paths.

## Execute-grant census

A bounded read-only `information_schema.routine_privileges` check reported the following distinct routine grant counts. These counts are a grant census and are not interchangeable with the advisor’s overloaded-function finding count.

| Grantee | Distinct public routines with `EXECUTE` |
|---|---:|
| `PUBLIC` | 10 |
| `anon` | 17 |
| `authenticated` | 141 |
| `postgres` | 246 |
| `service_role` | 243 |

The presence of an execute grant must be reviewed together with the exact routine signature, function body, caller validation, tenant checks, and intended workflow. The security advisor’s 126 authenticated findings identify security-definer routines callable by the signed-in role; they do not authorize revoking all 141 authenticated routine grants.

## Remaining policy-performance findings

The Performance Advisor currently reports **150 `multiple_permissive_policies` findings**. Multiple permissive policies for the same role and command combine with OR semantics; they are therefore both a performance consideration and an authorization-equivalence concern. A bounded live `pg_policies` inspection identified repeated permissive groups including:

| Table | Command | Role | Policy count returned |
|---|---|---|---:|
| `bank_accounts` | `ALL` | `authenticated` | 2 |
| `bank_loans` | `ALL` | `authenticated` | 2 |
| `bank_transactions` | `ALL` | `authenticated` | 2 |
| `community_group_approvals` | `UPDATE` | `authenticated` | 2 |
| `hr_payroll_runs` | `ALL` | `authenticated` | 2 |

The safe remediation sequence is to export the exact `USING` and `WITH CHECK` predicates, prove predicate equivalence for every role and command, compare authorized and denied row sets under representative tenants, and only then replace policies in a controlled migration. No policy was merged, dropped, or rewritten here.

## Security-definer review contract

Before changing any of the 126 authenticated or six anonymous findings, each routine should be evaluated against the following contract:

1. The routine validates `auth.uid()` or an equivalent authenticated identity before reading or writing protected data.
2. Caller-supplied company, tenant, branch, employee, or member identifiers are checked against the caller’s effective membership and role; they are never trusted as authority.
3. A `SECURITY DEFINER` routine uses a pinned `search_path`, and relation and function references are schema-qualified when appropriate.
4. The routine returns only the minimum columns and accepts only the minimum parameters required by its workflow.
5. Financial, administrative, maker-checker, and webhook operations enforce authorization, idempotency, expected-version/concurrency, and audit requirements inside the database transaction.
6. `EXECUTE` is granted to the narrowest required role and exact signature. Anonymous execution is retained only for documented public booking behavior.
7. Any change is tested with allowed and denied identities across at least two controlled tenants, including cross-tenant negative cases.

## Recommended remediation order

| Priority | Workstream | Safe next action |
|---|---|---|
| P0 | Anonymous security-definer functions | Document each public booking contract; test locator secrecy, rate limits, hold-token entropy/TTL, ownership of release/extension, and cross-tenant non-disclosure. Revoke `anon` only for functions proven unnecessary. |
| P0 | Leaked-password protection | Enable the Supabase Auth setting in the project dashboard, then perform a controlled password-reset/sign-in validation. This is an owner/admin configuration action, not a database migration. |
| P1 | Authenticated security-definer functions | Review by domain: identity/workspace, finance, POS, banking/MFI, HR, hospitality/restaurant/fleet, and platform administration. Make only signature-specific privilege or security-mode changes with caller tests. |
| P1 | RLS-enabled/no-policy tables | Verify exact table grants, procedure guards, service-role boundaries, and audit behavior with controlled identities. Do not add a generic authenticated policy. |
| P2 | Multiple permissive policies | Consolidate only after predicate equivalence, tenant-boundary proof, and row-set comparison in staging or a disposable fixture. |

## Controls deliberately not performed

This review did not revoke execute grants, change `SECURITY DEFINER` to `SECURITY INVOKER`, rewrite or merge RLS policies, add generic policies, disable RLS, read credentials, expose secrets, modify authentication data, or alter business rows. Those omissions are production-safety controls.

## References

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Database Advisors"  
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[3]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[4]: https://supabase.com/docs/guides/auth/password-security "Supabase Password Security"  
[5]: https://www.postgresql.org/docs/current/sql-createfunction.html "PostgreSQL CREATE FUNCTION"
