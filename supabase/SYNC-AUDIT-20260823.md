# SMARTMANAGER-MANUS Repository–Supabase Synchronization Audit

**Date:** 23 August 2026  
**Status:** Synchronized; no new database migration was required or applied in this pass.  
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`  
**Database:** Connected production Supabase project, PostgreSQL 17.6.1

## Executive result

The latest GitHub `main` branch was fetched and rebased before inspection. The repository is now clean and synchronized with `origin/main` at commit `cb88a02` (`test: align CI browser workflow contract`). The repository contains 72 versioned SQL migration files. The live Supabase migration ledger contains 125 entries because it retains historical migrations from earlier project iterations; those filename differences were not treated as missing migrations.

A complete object-level comparison found that the current project SQL effects are already present in Supabase. No table, migration-declared column, repository-declared index, function name, trigger name, explicit constraint, or application-referenced table was missing. The one dynamic-policy parser exception (`fleet_read_%1$s`) was verified directly in the live catalog: 19 generated policies exist across 19 fleet tables. Because no safe additive gap was identified, no `apply_migration` call was made. This avoids replaying already-applied SQL and protects existing production data from duplicate or incompatible DDL.

## Live schema parity

| Control | Live result | Reconciliation result |
|---|---:|---|
| Public tables | 518 | All repository table declarations present |
| Public columns | 6,129 | No migration-declared column gap found |
| Public foreign-key constraints | 1,097 | Live relationships present; all explicit repository constraints found |
| Public indexes | 1,189 | All 180 repository-declared index names present |
| Public functions | 203 | All 179 repository-declared function names present |
| Public policies | 719 | All 518 public tables have at least one policy |
| Public triggers | 397 non-internal catalog triggers | All 43 repository-declared trigger names present |
| Tables with RLS enabled | 518 of 518 | No RLS-disabled public table |
| Tables with primary keys | 518 of 518 | No public table without a primary key |
| Source-referenced persistence tables | 247 | Zero missing frontend/protected-backend tables |
| Contract-manifest issues | 0 | Required columns present; no forbidden contract fields found |

The table inventory reported 461 public tables with zero rows. This is an inventory observation, not a request to seed fake business records. Existing production data was not modified.

## RLS, storage, and grants

The live RLS coverage query returned **518 RLS-enabled tables, 518 policy-bearing tables, zero tables without policies, and zero unrestricted `USING (true)` or `WITH CHECK (true)` policies**. The current policy-role query returned 631 policies targeting `authenticated` and zero policies targeting the `public` role. This is a current live result and supersedes older snapshots that counted public-role policies before later migrations.

Storage remains configured with three buckets: `avatars`, `company-logos`, and `documents`. The live storage catalog contains three policies: company-scoped authenticated read/write behavior for `documents`, public reads limited to company logos and avatars, and authenticated company-path-scoped writes for those public-read buckets. No anonymous or authenticated role has `CREATE` on the `public`, `auth`, or `storage` schemas; the roles retain only the expected `USAGE` privileges.

## Advisor status

The refreshed live Security Advisor returned **117 WARN findings**: six intentionally anonymous SECURITY DEFINER booking/hold routines, 110 authenticated SECURITY DEFINER execution notices, and one leaked-password-protection configuration notice. The latter is an Auth configuration task, not a SQL migration, and remains explicitly unresolved.

The refreshed Performance Advisor returned **855 findings**: 632 unindexed foreign keys, 152 multiple-permissive-policy findings, 61 unused-index findings, and 10 RLS init-plan findings. These are remediation backlog signals. No broad index creation, index drop, policy consolidation, privilege revocation, or SECURITY DEFINER search-path rewrite was performed during synchronization.

## Verification chain

| Layer | Verification | Result |
|---|---|---|
| Project source | Repository table-reference extraction | 247 references; zero missing live tables |
| Schema SQL | Static migration object inventory | 284 table declarations, 180 index declarations, 179 function declarations, 43 trigger declarations; all live by name |
| Supabase | Read-only catalog and verbose public-table inventory | 518 public tables; all RLS-enabled and primary-key-backed |
| RLS | Policy coverage and unrestricted-predicate check | 518/518 tables covered; zero unrestricted true predicates |
| Storage | Bucket, policy, and schema-privilege inventory | Three buckets; three storage policies; no role `CREATE` on exposed schemas |
| Backend type safety | `pnpm run check` | Passed |
| Unit/integration tests | `pnpm test` | 206 files passed; 846 tests passed; 5 files and 13 tests skipped by suite configuration |
| Production bundle | `VERCEL=1 pnpm run build` | Passed; Vite and both backend bundles built |
| Browser E2E | `pnpm test:browser` | 23 of 23 tests passed |
| Local production smoke | Built server root route | HTTP 200 HTML response |
| Local public-config smoke | Built server `/api/config/public` route | HTTP 503 because local shell lacks deployment runtime configuration; no credential was exposed. Prior production verification remains separate evidence. |

The normal local `pnpm run build` prebuild guard could not run because this sandbox shell does not contain the server-only `SUPABASE_SECRET_KEY`. The build was therefore run in the repository’s documented `VERCEL=1` mode, which intentionally skips that server-only guard for managed deployment builds. The live Supabase contract was independently verified through the connected catalog audits above.

## Changes made

No database DDL or DML was required. No production rows, tables, policies, privileges, indexes, functions, triggers, or storage configuration were changed. The only repository addition in this audit is this synchronization report. Generated Playwright result artifacts were removed before final status verification.

The GitHub worktree is clean and aligned with the remote branch after the report was added; the report itself should be committed and pushed as a documentation-only audit record. No schema migration should be applied unless a later review identifies a specific, reproducible drift item.
