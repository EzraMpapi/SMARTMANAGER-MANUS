# Supabase Advisor Findings — 2026-08-23

## Summary

A post-migration Supabase advisor scan was run against project `rlhngsrihahhyxnjxrxm` after applying the additive `auth_identity_snapshot()` migration. The scan found **117 security warnings** and **855 performance findings**. These findings are documented here and are not presented as evidence that the identity migration failed.

## Security findings

| Finding | Count | Severity | Classification |
|---|---:|---|---|
| Authenticated users can execute `SECURITY DEFINER` functions | 110 | Warning | Many are intentional protected RPC entry points. Each function requires separate review of its authentication, tenant, and permission boundary. The new identity snapshot is included because signed-in users must call it. |
| Anonymous users can execute `SECURITY DEFINER` functions | 6 | Warning | Affected routines are `cancel_booking`, `extend_hold`, `get_booking`, `hold_seats`, `release_hold`, and `seat_availability`. These may support intended public booking flows, so no blanket revoke was applied without product confirmation. |
| Leaked-password protection disabled | 1 | Warning | Supabase Auth recommends enabling HaveIBeenPwned.org compromised-password checks. This is an Auth project setting, not a SQL migration, and requires an environment-owner decision. |

The new `auth_identity_snapshot()` routine is not anonymously executable. The live catalog verifies `anon_execute = false` and `authenticated_execute = true`. An unauthenticated invocation raises SQLSTATE `42501`.

## Performance findings

| Finding | Count | Severity |
|---|---:|---|
| Unindexed foreign keys | 632 | Informational |
| Multiple permissive policies | 152 | Warning |
| Unused indexes | 61 | Informational |
| Auth RLS init-plan advisories | 10 | Warning |

The unindexed foreign-key findings span many historical modules, including banking/MFI, cooperative groups, finance, fleet, healthcare, hospitality, POS, school, subscription billing, and workforce. A blanket index migration was not generated because it would create a large cross-module DDL change and could introduce avoidable write-lock and maintenance overhead. Each candidate should be reviewed against workload, existing composite indexes, and retention requirements.

The multiple-permissive-policy and auth-init-plan findings also require policy-by-policy review. Merging policies or rewriting auth expressions globally could change tenant visibility. No RLS policy was disabled or rewritten during this scan.

## Decision record

The schema synchronization pass applied only the verified additive identity snapshot migration. It did not revoke existing public RPC privileges, enable the leaked-password setting, add hundreds of performance indexes, or alter RLS policies without an explicit module-level control review. This preserves existing functionality and avoids unverified behavior changes.

## Recommended next actions

Review the six anonymous booking/seat routines first, confirm whether each is intentionally public, and create a narrowly scoped privilege migration for any routine that is not. Enable breached-password protection in the non-production Auth project first, then production after confirmation. Prioritize foreign-key indexes from measured high-volume paths rather than applying every advisor recommendation. Finally, review multiple permissive policies and auth-init-plan warnings module by module with authenticated tenant fixtures.
