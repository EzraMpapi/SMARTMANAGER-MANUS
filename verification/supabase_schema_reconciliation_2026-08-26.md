# Supabase Schema Reconciliation — 2026-08-26

## Scope

The checked-in Drizzle schema declared 18 tables. The live Supabase `public` catalog contained 535 tables before reconciliation, with `team_invitations` already present and 17 declared tables absent. No existing table was dropped, renamed, or truncated.

## Migration

Applied migration: `add_missing_erp_tables_20260826`.

The migration was additive and dependency ordered. It created the 17 missing tables, including the user, reporting, audit, webhook, schema-drift, TRA archive, gateway-alert, VAT-anomaly, BOT/DSE market, and provider-monitoring tables. It also created the declared indexes, uniqueness constraints, check constraints, the `schema_drift_runs.monitor_id` foreign key, and enabled row-level security.

Tenant-scoped tables use the existing `public.current_company_id()` UUID context in `USING` and `WITH CHECK` policies. Platform-level `users`, `schema_drift_monitors`, and `schema_drift_runs` are RLS-enabled without broad public policies, leaving access to explicitly authorized server/service-role paths.

## Verification

A bounded catalog query confirmed all 17 target tables exist. All 14 tenant-scoped tables have RLS enabled and one tenant-isolation policy each. The three platform-level tables have RLS enabled and zero public policies. The migration returned `success: true`.

The repository quality gate completed successfully: TypeScript validation passed, the full Vitest suite passed, the Supabase schema guard reported 201 referenced tables, 553 deployed tables, zero missing tables, zero tenant-table issues, and zero critical-table issues, and the production build completed successfully. The existing large dashboard bundle-size warning remains non-blocking.

## Safety notes

This migration intentionally does not seed data, modify customer records, store credentials, or create provider API keys. Sensitive provider credential columns are nullable storage fields only; application access must continue to use server-side authorization and tenant policy boundaries.

## Source artifacts

- `supabase/20260826_add_missing_erp_tables.sql`
- `drizzle/schema.ts`
- `verification/verify_missing_erp_tables.json`
- `verification/apply_missing_erp_tables.json`
- `todo.md`
