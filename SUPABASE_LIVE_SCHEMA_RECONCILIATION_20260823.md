# SMART MANAGER Live Supabase Schema Reconciliation

**Project:** `rlhngsrihahhyxnjxrxm`
**Inspection date:** 23 August 2026
**Scope:** Existing authentication/tenant tables, project module tables, additive finance/POS/workforce tables, RLS, policies, foreign keys, triggers, functions, and migration history.

## Decision

No new table migration was created from this audit. The live project already contains the Supabase-managed authentication tables (`auth.users`, `auth.identities`, `auth.sessions`, and `auth.refresh_tokens`), the application identity and tenancy tables (`profiles`, `companies`, `company_memberships`, `workspaces`, and `company_modules`), the existing Bank/MFI, Microfinance, VICOBA/community, HR, POS, Finance, Pharmacy, School, Healthcare, Hospitality, Restaurant, Fleet, Property, Money Agent, and other module tables, and the newly applied finance/POS/workforce structures.

Creating another authentication table or duplicating an existing business table would violate the attachment’s requirement to preserve the current architecture and avoid duplicate structures. The correct next work for the authentication prompt is application-level centralization and controlled policy remediation, not another identity schema.

## Live evidence

The live migration ledger contains the prior project migrations through the existing modules, the remote security hardening migrations, and the additive slices `fin_foundation`, `fin_journal_core`, `fin_reconciliation_core`, `pos_register_control`, `pos_register_control_hardening`, `pos_sales_returns`, `pos_pricing_loyalty`, `workforce_authorization`, `workforce_role_assignment_approval`, `new_routine_privilege_hardening`, and `workforce_permission_seed`.

The scoped RLS inspection returned RLS enabled for all returned public base tables, including all finance, POS, and workforce tables. The authentication/tenant audit confirmed existing columns and relationships for `profiles.company_id`, `company_memberships.company_id`, `company_modules.company_id`, `workspaces.company_id`, and HR employee tenancy.

The permission seed is present with six required active system roles, twenty required active permission codes, and three active separation-of-duty conflicts. The live counts are cumulative: 42 roles, 140 permissions, 469 role-permission grants, and 21 conflict records. `workforce_member_roles` remains empty by design; the seed did not assign production users or alter legacy profile roles.

The live privilege regression check confirmed anonymous execution is disabled for the inspected POS and workforce routines, while authenticated execution is enabled for the intended callable routines. The rollback-only smoke test inserted temporary relational fixtures, verified tenant-scoped foreign-key rejection, one-open-shift uniqueness, and the direct POS sync-sequence guard, then rolled back the entire transaction.

## Policy follow-up

Representative older module tables sometimes retain legacy `public`-role policies in addition to newer `authenticated` policies. Their predicates are tenant-scoped, but the policies should be reviewed module-by-module before any blanket change. No blanket policy rewrite was applied because doing so without an operation-specific review could break existing workflows or alter access semantics. The newly migrated finance, POS, and workforce authorization policies were left protected and were not weakened.

The local schema verifier could not run through its direct HTTP path in this session because the server-only `SUPABASE_URL` and `SUPABASE_SECRET_KEY` environment variables were not available. The connected Supabase management channel was therefore used for the live catalog, RLS, policy, function, foreign-key, trigger, and migration-history checks documented above.

## Safe conclusion

The database is ahead of the local Git branch for the newly applied additive migrations, but no additional missing table was justified by the live audit. The required action is to commit the exact local migration source and reviewed application adapters, then run deployment-level authenticated tests against a controlled staging fixture before enabling any production feature flag.
