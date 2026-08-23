# Supabase Migration Execution Log

| Timestamp (UTC) | Project | Migration | Status | Scope |
|---|---|---|---|---|
| 2026-08-13 03:39 | `rlhngsrihahhyxnjxrxm` | `20260812_001_complete_erp_schema_baseline.sql` | Succeeded in the authenticated Supabase SQL Editor (`Success. No rows returned`). | Additive repair for `public.audit_log.updated_at` only. |

The migration contains no table drops, truncation, or data deletion. Its execution is followed by a protected PostgREST contract audit before this release is marked complete.

The protected PostgREST verifier completed successfully at `2026-08-13T03:40:18.656Z`: all 110 dashboard-referenced tables were exposed by the live API and no tenant ownership or timestamp contract exceptions remained.

The authenticated SQL workspace was restored at `2026-08-13 03:46 UTC` to perform the remaining read-only RLS policy inventory.

A read-only inventory query covering RLS enablement and policy presence for every public table with a `company_id` column was submitted at `2026-08-13 03:47 UTC`; results are recorded after completion.

The first inventory statement returned PostgreSQL syntax error `42601` before execution. It was read-only and made no data, schema, or policy changes; a simplified equivalent query is being used for the verification retry.

The retry uses fully qualified PostgreSQL catalog names and remains read-only; the displayed syntax message at preparation time was the prior query result, not an execution result for the corrected statement.

The corrected read-only policy listing succeeded at `2026-08-13 03:49 UTC`. The first 100 returned tenant-scoped rows were all RLS-enabled and each showed a corresponding `*_tenant` policy, including `audit_log_tenant`. A separate zero-row exception query is used to confirm this across the complete set without relying on a display limit.

The zero-row exception query was submitted at `2026-08-13 03:50 UTC`; it returns only company-scoped public tables with disabled RLS or no associated policy.

The zero-row exception query completed successfully at `2026-08-13 03:50 UTC` with `Success. No rows returned`. No public company-scoped table lacks RLS or an associated policy.

| 2026-08-23 13:04 | `rlhngsrihahhyxnjxrxm` | `profile_identity_center` | Succeeded through the connected Supabase migration operation (`success: true`; version `20260823130430`). | Additive profile identity/preference columns, scoped avatar references, and authenticated self-service RPCs; no table drops or data deletion. |

The post-apply migration inventory confirmed `profile_identity_center` is recorded in the project. The complete verbose public-table inventory contained 475 tables, all reported RLS-enabled, and the repository comparison found zero missing referenced tables. The profile row now has the added identity columns required by the Profile Identity Center.
