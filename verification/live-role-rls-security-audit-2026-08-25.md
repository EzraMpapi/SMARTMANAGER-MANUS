# SMART MANAGER — Live Roles, Grants, and RLS Security Audit

**Date:** 25 August 2026  
**Supabase project:** `rlhngsrihahhyxnjxrxm`  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)  
**Audit type:** Read-only live catalog, privilege, RLS, policy, and advisor review

## Executive conclusion

The live database has strong baseline controls: all **533 public tables have RLS enabled**, all **203 security-definer functions have a pinned `search_path`**, and the live Security Advisor reports **zero unpinned security-definer functions**. No production data, RLS policy, grant, role, function, or table was changed during this audit.

The audit did identify security work that should remain open. The most important items are the six anonymous-executable `SECURITY DEFINER` booking functions, 126 authenticated-executable security-definer functions requiring least-privilege review, one disabled leaked-password-protection control, six intentionally procedure-only RLS tables, broad direct DML grants to the `anon` role that are currently constrained by RLS, and five table/command combinations with multiple permissive policies. These findings require controlled, function-by-function and policy-by-policy remediation; blanket revocations or generic policies would be unsafe.

## Current advisor baseline

| Security Advisor finding | Severity | Count | Status |
|---|---:|---:|---|
| Anonymous-executable `SECURITY DEFINER` functions | WARN | 6 | P0 threat-model and exact-signature privilege review |
| Authenticated-executable `SECURITY DEFINER` functions | WARN | 126 | P1 least-privilege and caller/tenant contract review |
| Leaked-password protection disabled | WARN | 1 | Owner/admin configuration action in Supabase Auth |
| RLS enabled without a direct policy | INFO | 6 | Intentional procedure-only candidates; verify guards and grants |
| **Total advisor findings** |  | **139** | 133 WARN, 6 INFO |

The six RLS-enabled tables without direct policies are `bank_provider_webhook_account_controls`, `bank_provider_webhook_drain_approvals`, `bank_provider_webhook_drain_runs`, `bank_provider_webhook_remediation`, `platform_admin_actions`, and `subscription_trial_expiry_notices`. They should not receive a generic authenticated policy: the first four are control-plane/recovery records, while the latter two contain administrative audit and subscription-notice state. A targeted live grant query confirmed that each of these six tables has direct grants only for `service_role` and `postgres` among the audited roles; neither `anon` nor `authenticated` has direct table access, and each has zero policies. This supports the intended restricted procedure/service path, while still requiring controlled procedure authorization tests before this design is treated as complete.

## Role posture

The live role catalog returned the following relevant flags:

| Role | Login | Superuser | Bypass RLS | Create role / DB | Interpretation |
|---|---:|---:|---:|---:|---|
| `anon` | No | No | No | No / No | Public request role; should remain least privileged. |
| `authenticated` | No | No | No | No / No | End-user request role; access must be policy and function bounded. |
| `service_role` | No | No | Yes | No / No | Server-side trusted role; never expose its key to clients. |
| `authenticator` | Yes | No | No | No / No | PostgREST role-switching bridge; membership grants are platform-managed. |
| `postgres` | Yes | No | Yes | Yes / Yes | Bypass-capable owner/platform role; not an application end-user role. |
| `supabase_admin` | Yes | Yes | Yes | Yes / Yes | Managed platform administrator; outside application authorization. |
| `dashboard_user` | No | No | No | Yes / Yes | Managed dashboard role; not an application API role. |

The membership graph shows `authenticator` can assume `anon`, `authenticated`, and `service_role`, while `postgres` has administrative membership relationships. These are expected managed-platform boundaries. They must not be treated as application role-grant templates.

## Table privileges and RLS

The live public schema contains **533 tables**, all with RLS enabled. The catalog counted **732 policies across 527 tables**, of which **731 are permissive** and one is restrictive. No direct table privileges were granted to `PUBLIC` in the audited table-privilege result. `FORCE ROW LEVEL SECURITY` is enabled on zero public tables; this is expected to leave owner and bypass-role behavior under platform/database administration rather than end-user control, but it reinforces the requirement that application paths use non-owner roles and tightly guarded procedures.

The `anon` role has direct table privileges on 120 tables and `authenticated` has direct privileges on 524 tables for at least some operations. The important risk interpretation is:

| Check | Result |
|---|---:|
| Tables with `anon` write privileges | 120 |
| Those tables with RLS enabled | 120 |
| Those tables with RLS disabled | 0 |
| Those tables with no policies | 0 |
| Those tables with public/anon policies | 0 |
| Tables protected only by authenticated tenant/policy boundaries | 120 |

Thus the audit did **not** find an anonymous write path through a disabled-RLS or public-policy table. Nevertheless, direct `anon` DML grants are broader than necessary and should be treated as a **P1 least-privilege cleanup candidate**. Removal must be staged by workflow, because some public booking functions and trigger behavior may rely on the surrounding grants. Do not revoke them in bulk.

## Routine execution grants

The live routine census returned:

| Grantee | `EXECUTE` grants |
|---|---:|
| `PUBLIC` | 10 |
| `anon` | 17 |
| `authenticated` | 141 |
| `service_role` | 243 |
| `postgres` | 246 |

The 10 `PUBLIC` routines are trigger functions and are `INVOKER`, not security-definer functions. The 17 anonymous grants include six public-booking security-definer functions plus invoker trigger helpers and the invoker `profile_identity_payload` routine. The six booking functions remain the primary anonymous exposure scope:

- `cancel_booking(p_locator text, p_surname text, p_refund_minor bigint, p_refund_pct smallint)`
- `extend_hold(p_hold_token uuid, p_ttl_seconds integer)`
- `get_booking(p_locator text, p_surname text)`
- `hold_seats(p_service_key text, p_seats smallint[], p_ttl_seconds integer)`
- `release_hold(p_hold_token uuid)`
- `seat_availability(p_service_key text, p_capacity smallint)`

Each function requires an exact public-workflow threat model. Review must verify locator/surname matching, hold-token entropy and ownership, TTL bounds, capacity authority, refund recomputation, enumeration resistance, rate limiting, and minimum disclosure. Do not convert or revoke these functions without testing the public booking workflow and its rollback path.

## Security-definer function posture

The live catalog reports **246 public functions**, including **203 `SECURITY DEFINER` functions**. All 203 have a pinned `search_path`; the audit found **zero unpinned security-definer functions**. This is a positive boundary check, not a certification that every function body is correct.

The 126 authenticated-executable definer functions span identity/workspace, banking/MFI, finance, POS, HR, hospitality, property, community groups, healthcare, fleet, and subscription workflows. Each should be reviewed for five controls before any grant or security-mode change:

1. The function derives identity from `auth.uid()` or a trusted server context.
2. Tenant/company identifiers are verified against the authenticated membership and are never trusted from the client alone.
3. Search paths and relation/function references are safe against object-shadowing and search-path manipulation.
4. Financial, administrative, and maker-checker operations enforce idempotency, expected versions, authorization, and audit writes within the transaction.
5. Execution is granted only to the narrowest required role and exact signature.

## Multiple permissive policies

The security-detail catalog groups five table/command combinations with more than one permissive policy:

| Table | Command | Policies |
|---|---|---|
| `bank_accounts` | `ALL` | `bank_accounts_tenant`, `bank_accounts_tenant_write` |
| `bank_loans` | `ALL` | `bank_loans_tenant`, `bank_loans_tenant_write` |
| `bank_transactions` | `ALL` | `bank_transactions_tenant`, `bank_transactions_tenant_write` |
| `community_group_approvals` | `UPDATE` | `community_group_approvals_approve_update`, `community_group_approvals_operate_update` |
| `hr_payroll_runs` | `ALL` | `hr_payroll_runs_portal_write`, `hr_payroll_runs_tenant` |

The Performance Advisor may report more findings because it counts individual policy-level conditions rather than only these grouped combinations. Permissive policies combine with OR semantics for the same role and command. They should be consolidated only after proving equivalence of `USING`, `WITH CHECK`, role, command, and intended maker-checker behavior using representative tenants and negative tests.

## Priority remediation order

| Priority | Workstream | Safe next action |
|---|---|---|
| P0 | Anonymous booking security-definers | Complete the six-function threat model; harden inputs/outputs; then change exact grants only where public access is not required. |
| P0 | Leaked-password protection | Enable the Supabase Auth control in the owner dashboard and validate sign-in/password recovery. |
| P1 | Direct `anon` table DML grants | Build an exact table/operation workflow map; remove only demonstrably unnecessary grants in small migrations. |
| P1 | Authenticated security-definers | Review the 126 functions by domain, with caller, tenant, privilege, search-path, and audit contracts. |
| P1 | Procedure-only RLS tables | Verify service-role/procedure access and deny direct client access with controlled identities. |
| P2 | Multiple permissive RLS policies | Compare row sets in staging and consolidate only with predicate-equivalence proof. |

## Schema synchronization result

The repository was fast-forwarded to the current GitHub `main`. The live Supabase migration ledger already contains the reviewed schema and data-table migrations, including the invitation and standing-order webhook objects. A fresh connector inventory after the GitHub fast-forward returned **533 public tables**, with **zero tables lacking RLS**. The ledger tail still ends at `team_invitations_duplicate_index_cleanup_20260825`; no new repository migration requiring application was identified. No additional required data table was identified, so **no schema migration was applied during this audit**.

## Safety boundary and references

No tables, rows, constraints, indexes, roles, grants, RLS policies, function bodies, or security settings were modified. The audit was read-only. The owner must enable leaked-password protection in the Supabase Auth dashboard; this cannot safely be substituted with a SQL migration.

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Database Advisors"  
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"  
[3]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"  
[4]: https://www.postgresql.org/docs/current/ddl-priv.html "PostgreSQL Privileges"  
[5]: https://www.postgresql.org/docs/current/ddl-rowsecurity.html "PostgreSQL Row Security Policies"
