# SMART MANAGER — Supabase Security Advisor Remediation Report

**Date:** 25 August 2026  
**Project:** `rlhngsrihahhyxnjxrxm`  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)

## Executive conclusion

A fresh Supabase Security Advisor scan was performed after FK remediation wave 003. The scan reports **133 WARN findings and 2 INFO findings**. The findings are concentrated in four categories: six anonymous-executable `SECURITY DEFINER` functions, 126 authenticated-executable `SECURITY DEFINER` functions, one Auth leaked-password-protection recommendation, and two RLS-enabled tables without direct policies.

No security-definer function, grant, RLS policy, or table privilege was changed during this pass. That is intentional. These findings are not safe for blanket remediation: several functions implement tenant selection, identity hydration, financial posting, POS completion, public booking/seat holds, or administrative controls. A mass `REVOKE`, mass `SECURITY INVOKER` conversion, or generic RLS policy could break legitimate workflows or weaken tenant isolation.

## Live security posture

A read-only catalog verification was run alongside the advisor scan.

| Object or control | Live count | Interpretation |
|---|---:|---|
| Public functions | 236 | Functions exposed in the `public` schema; exposure must be reviewed by signature and caller role. |
| `SECURITY DEFINER` functions | 203 | Elevated execution is used broadly and requires function-by-function review. |
| Security-definer functions with pinned `search_path` | 203 | The catalog verification found pinned search-path configuration for all 203. Function-body qualification and grants still require review. |
| Security-definer functions executable by `anon` | 6 | These are the public-workflow threat-model scope. |
| Security-definer functions executable by `authenticated` | 126 | These are the authenticated least-privilege review scope. |
| Public tables with RLS enabled | 525 | RLS is enabled across the public table inventory. |
| RLS-enabled public tables without direct policies | 2 | These require intentional procedure-only access review, not a generic allow policy. |
| Permissive policy table/command groups with more than one policy | 15 catalog groups | The advisor emits 150 policy findings across the affected policy definitions. |

## Finding inventory

| Advisor finding | Severity | Count | Current status |
|---|---|---:|---|
| `anon_security_definer_function_executable` | WARN | 6 | Deferred for public booking/seat-hold threat-model and privilege review. |
| `authenticated_security_definer_function_executable` | WARN | 126 | Deferred for function-by-function least-privilege review. |
| `auth_leaked_password_protection` | WARN | 1 | Requires enabling the Supabase Auth setting and owner verification. |
| `rls_enabled_no_policy` | INFO | 2 | Procedure-only access needs explicit review; no generic policy added. |

The findings are advisor warnings, not evidence that every function is vulnerable. The correct remediation is least privilege: retain `SECURITY DEFINER` only where required, pin the search path, qualify relations, validate the caller and tenant inside the function, and grant execution only to the roles and signatures that need it.

## Anonymous security-definer scope

The six anonymous-executable functions must be reviewed first because they are reachable without an authenticated user. The observed public workflow family includes booking lookup/seat availability and seat-hold operations. The review should verify locator secrecy, surname matching, service-key enumeration resistance, hold-token entropy, TTL bounds, ownership checks on release/extension, rate limiting, and whether any function can read or modify tenant-owned data outside the intended public booking boundary.

No anonymous execution grant was revoked in this pass because the application’s public booking workflow may depend on these functions. The recommended next action is to document each function’s exact input/output contract and prove that it cannot expose internal customer, company, payment, or operational records.

## Authenticated security-definer scope

The 126 authenticated-executable functions span several security-sensitive domains, including:

| Domain | Examples of function families requiring review |
|---|---|
| Identity and workspaces | `current_company_id`, profile identity, company switching, workspace membership, company creation, and employee linkage. |
| Financial and accounting controls | Finance permission checks, journal posting, approvals, reconciliation, and transaction workflows. |
| POS and inventory | Sale completion, shift/cash movement, sync sequence acceptance, and POS operational checks. |
| Banking, MFI, and agent operations | Customer/account workflows, loan operations, cash/settlement operations, and risk controls. |
| HR and employee portal | Payroll calculations, employee access checks, portal actions, and profile linkage. |
| Property, hospitality, restaurant, fleet, school, and pharmacy | Tenant-scoped action/snapshot functions and operational controls. |
| Platform administration | Executive snapshots and recorded administrative actions. |

Each function should be reviewed against the following contract before any grant is changed:

1. The function must validate `auth.uid()` or an equivalent authenticated identity before reading or writing protected data.
2. Tenant/company IDs supplied by callers must be checked against the authenticated user’s effective membership and role; caller-supplied tenant IDs must never be trusted alone.
3. `SECURITY DEFINER` functions must use a pinned `search_path`, and relation/function references should be schema-qualified when the path is empty.
4. The function should expose the minimum return columns and accept the minimum parameters needed for its workflow.
5. Financial, administrative, and maker-checker operations must enforce authorization, idempotency, expected-version/concurrency, and audit requirements inside the database transaction.
6. Execute privileges should be granted to the narrowest required role. Public and anonymous execution should be revoked unless the function is part of a documented public workflow.

## RLS policy findings

The live database has 728 public RLS policies and RLS enabled on all 525 public tables. The performance advisor reports 150 multiple-permissive-policy findings, while the catalog groups these into 15 table/command combinations with more than one permissive policy.

Permissive policies combine with OR semantics for the same command and role. This means a row may be admitted by any matching policy. The affected groups include intentional combinations such as tenant access plus privileged operational access, and some legacy tenant/portal policy pairs. They must not be merged or dropped without proving equivalence for every role, command, `USING` predicate, and `WITH CHECK` predicate.

The safe remediation sequence is to export each affected table’s policy definitions, construct an equivalent boolean predicate, validate it in a staging copy with representative roles and tenants, compare authorized and denied row sets, and only then replace policies in a controlled migration. No policy changes were made in this report’s pass.

## RLS-enabled tables without direct policies

The two tables reported by the advisor are:

- `public.platform_admin_actions`
- `public.subscription_trial_expiry_notices`

The live design revokes broad direct access and routes these records through restricted procedures and administrative paths. Adding a generic `authenticated` policy would be unsafe because it could expose audit or subscription-notice data across tenants. The correct follow-up is to verify the exact table grants, procedure guards, admin role checks, and audit behavior with controlled authenticated test identities.

## Leaked-password protection

The advisor recommends enabling Supabase Auth leaked-password protection. This is an Auth configuration control rather than a table migration. It should be enabled in the Supabase Auth settings by the project owner, followed by a controlled password-reset/sign-in validation. No password data was read or changed during this audit.

## Verification after FK wave 003

The database verification summary reported:

| Verification | Result |
|---|---:|
| Public tables | 525 |
| Public columns | 6,301 |
| Foreign-key constraints | 1,116 |
| Primary-key constraints | 525 |
| Unique constraints | 278 |
| Public indexes | 1,292 |
| Public triggers | 510 |
| Public functions | 236 |
| Public views | 0 |
| RLS-enabled public tables | 525 |
| Public RLS policies | 728 |
| Storage buckets | 3 |
| Storage policies | 3 |

The live migration ledger contains `fk_index_remediation_wave_001_20260825`, `fk_index_remediation_wave_002_20260825`, and `fk_index_remediation_wave_003_20260825`. Wave 003 reduced the exact catalog’s missing FK coverages from 587 to 562 and reduced the performance advisor’s unindexed-FK findings from 579 to 554. The FK work does not alter RLS or security-definer behavior.

## Recommended remediation order

| Priority | Workstream | Safe next action |
|---|---|---|
| P0 | Anonymous security-definer functions | Threat-model the six public functions, then revoke anonymous execution for any function not required by documented booking behavior. |
| P0 | Auth leaked-password protection | Enable the Supabase Auth setting and validate password recovery/sign-in behavior. |
| P1 | Authenticated security-definer functions | Review the 126 signatures by domain; verify caller, tenant, role, search path, return shape, and grants. |
| P1 | RLS enabled without policy | Verify restricted table grants and procedure guards for the two tables using controlled identities. |
| P2 | Multiple permissive policies | Consolidate only after predicate equivalence and row-set comparison in staging. |

## Controls not performed

This pass did not revoke grants, change function security modes, rewrite RLS policies, add generic policies, disable RLS, read user credentials, or alter business data. Those omissions are safety controls, not incomplete execution.

## References

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Performance and Security Advisors"  
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[3]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[4]: https://www.postgresql.org/docs/current/sql-createfunction.html "PostgreSQL CREATE FUNCTION"
