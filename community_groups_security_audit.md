# Community Groups Security Audit Baseline

## Confirmed findings

| ID | Severity | Finding | Impact |
|---|---|---|---|
| CG-SEC-001 | High | The migration grants every authenticated tenant user `FOR ALL` write access to every Community Groups table. The client-side `canWrite` and `canApprove` checks are not an authorization boundary because PostgREST callers can bypass them. | Any authenticated tenant member could create, alter, approve, disburse, reverse, or delete financial and governance records. |
| CG-SEC-002 | High | Child rows validate only their own `company_id`; foreign keys to groups, members, loans, meetings, committees, projects, votes, and options do not enforce that referenced rows belong to the same tenant. | A caller can create cross-tenant relationships by supplying a foreign tenant UUID while keeping the child row in the caller's tenant. |
| CG-SEC-003 | High | The audit log is covered by the generic `FOR ALL` policy, allowing tenant users to update or delete historical events and to supply arbitrary `actor_name` and `actor_id` values. | Audit history is not immutable or trustworthy. |
| CG-SEC-004 | Medium | The generic policy layout creates a tenant `FOR SELECT` policy and a tenant `FOR ALL` policy for the same table. Even where the predicates match, this makes role separation difficult to reason about and maintain. | Authorization regressions are easier to introduce and financial write access is broader than intended. |
| CG-SEC-005 | Medium | The module has no database-side role split for read, operational write, and approval actions. Client role normalization is useful for UX but insufficient for direct API access. | Privilege escalation is possible through direct REST mutations. |

## Remediation design

The hardening migration will add a security-definer role helper scoped to the current company, explicit read/operational/approval policies, same-tenant relationship triggers for all cross-table foreign keys, and an immutable audit-log policy. Audit inserts will normalize the authenticated actor and reject forged actor identity. Approval, loan disbursement, welfare/expense approval, governance updates, and audit mutations will require privileged roles at the database boundary.

The audit will also add source-level contract tests that fail if the migration reintroduces tenant-only `FOR ALL` writes, missing same-tenant assertions, or mutable audit policies.

## Remediation status

The hardening migration is implemented in `supabase/migrations/20260823_036_community_groups_security_hardening.sql`. It introduces company-scoped database role helpers, explicit read/insert/update/delete policies, relationship triggers that reject cross-tenant group/member/loan/meeting/committee/project/vote relationships, server-side creator stamping, sensitive state-transition guards, and append-only audit history with actor normalization from the authenticated session.

The client-side role checks remain useful for user experience, but database RLS and triggers now enforce the security boundary for direct REST/API callers. Anonymous access remains denied by the absence of `anon` policies and helper execution has been revoked from `PUBLIC` and `anon`.

## Validation

| Validation | Result |
|---|---:|
| Community Groups security contract tests | 5 passed |
| Full repository test suite | 177 test files passed, 5 skipped; 703 tests passed, 8 skipped |
| TypeScript check | Passed |
| Production build | Passed |
| Git whitespace validation | Passed |

Live Supabase execution was not available in the sandbox, so deployment must apply the two migrations in order and run the project’s managed schema verification/CI against a real tenant database. The static contract suite is intentionally included to prevent regression of the policy and trigger guarantees.
