# Attached Dashboard Directive and Supabase Schema Audit

**Date:** 2026-08-25  
**Scope:** Verified, non-destructive review of `pasted_content.txt`, repository schema sources, and the authorized Supabase project `rlhngsrihahhyxnjxrxm`.

## Executive conclusion

The attached directive requires the dashboard to use only existing functionality and real authorized data, preserve authentication, subscriptions, modules, RLS, RBAC, tenant isolation, and existing workflows, and create database objects only when a verified source requires them. The current live schema already contains all repository-declared table names identified by the comparison. No missing table was verified, so no new table DDL was applied.

## Live schema evidence

The authorized Supabase project is active and healthy. The live public schema inventory contains **532 tables**, and the inventory reports **RLS enabled on all 532 tables**. The repository comparison identified **299 repository-declared table names** and **zero repository-declared names missing from live Supabase**. The remaining live tables are existing database objects not declared by the narrow repository regex or are legacy/extended module objects; they were not altered.

The critical dashboard sources were verified directly in `information_schema.columns`. `companies`, `profiles`, `crm_leads`, `finance_expenses`, `sales_invoices`, `inventory_items`, `hr_employees`, and `workspaces` all exist with their expected identity, tenant, status, timestamp, and module-specific fields. The critical tables also have authenticated policies in `pg_policies`, including tenant policies for CRM, Finance, Inventory, Sales, and Workspaces; self/profile policies; company policies; and employee portal policies.

## Migration state

The live migration history includes the previously recorded dashboard, subscription, property-management, workspace-recovery, RLS, foreign-key-index, and storage-related migrations through `team_invitations_supabase_storage_20260825`. Repository migration files were compared with this applied history and no verified unapplied table migration was identified from the current repository state.

## Safety decision

No `CREATE TABLE`, `ALTER TABLE`, destructive DDL, seed data, policy replacement, or production-data mutation was performed. This is intentional: creating speculative tables would violate the attached directive’s requirement to avoid duplicate objects and to ground metrics and workflows in existing functionality.

## Findings requiring follow-up

The Supabase advisor still reports security notices for selected intentionally restricted tables with RLS enabled but no policies, and for several exposed `SECURITY DEFINER` functions. These are separate hardening items and were not changed in this task because the current request was to verify missing schema required by the attached dashboard directive, not to perform broad privilege or function-security rewrites. Any remediation must be signature-specific, reviewed against existing callers, and applied as a separate migration.

The local Supabase credential test remains blocked by HTTP 401, and the local E2E preview build was terminated during Vite chunk rendering under sandbox resource pressure. These blockers do not invalidate the live Supabase connector audit; they prevent claiming a clean local production build or full regression run.

## Validation status

| Area | Result |
|---|---|
| Attachment reviewed | Complete |
| Repository schema/migration inventory | Complete |
| Live Supabase table inventory | Complete; 532 tables, all RLS enabled |
| Critical dashboard columns | Verified present |
| Critical dashboard policies | Verified present for inspected tables |
| Missing tables requiring creation | None verified |
| Production data mutation | None |
| Local Supabase credential test | Blocked by HTTP 401 |
| Local E2E bundle/build | Interrupted during Vite rendering under resource pressure |
