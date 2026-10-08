# Supabase Schema Reconciliation — 2026-08-23

> Read-only reconciliation record. No table or index DDL was applied by this audit.

The production Supabase project `rlhngsrihahhyxnjxrxm` was checked through the Supabase connector after the latest repository update. The current repository contains **73 SQL migration files** that declare **284 distinct tables**. The live `public` inventory contains **519 tables**, and every repository-declared table is present. Therefore, there are **zero missing repository-declared tables** requiring `CREATE TABLE` or replay of an unapplied migration.

| Measure | Current result |
|---|---:|
| Repository SQL migration files | 73 |
| Repository-declared tables | 284 |
| Live public tables | 519 |
| Missing repository-declared tables | 0 |
| Duplicate repository declarations | 0 |
| Live migration-ledger entries | 129 |
| Latest live migration | `global_admin_control_center_20260823` (`20260823195156`) |

The local migration directory contains seven names not present in the live ledger. These are not automatically applied because table reconciliation already proves that no required table is missing, and some names are historical naming variants or review-only artifacts. In particular, `fk_index_optimization_p0_review` is intentionally a review-only index artifact, not an authorization to execute DDL. Applying migrations solely because their filenames are absent from the ledger could duplicate existing objects or alter live policies and privileges.

The correct database action is therefore **no-op for table creation**. Any future migration application should be individually reviewed against the live ledger, object existence, dependencies, and the intended schema delta.
