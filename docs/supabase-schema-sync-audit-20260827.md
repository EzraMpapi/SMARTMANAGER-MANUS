# Supabase Schema Synchronization Audit

**Project:** `rlhngsrihahhyxnjxrxm`
**Audit date:** 27 August 2026
**Method:** Repository migration inventory plus read-only Supabase catalog, migration ledger, security advisor, performance advisor, and existing schema-contract verifier.

## Decision

No schema migration was applied during this audit. The repository's 201 live persistence-table references were all found in the deployed API schema, and the verifier reported no missing table, tenant-column, or critical schema-contract issue. The two newest repository migrations were already present in the Supabase migration ledger, and their catalog objects—the `sm_schema_health` role and `bank_fixed_deposit_products_company_code_idx`—both exist.

Applying a broad `CREATE TABLE`, `ALTER TABLE`, policy, or index catch-up script would therefore duplicate existing objects or widen security exposure without a demonstrated requirement. No production data, existing table, column, relationship, function, trigger, storage configuration, RLS policy, or grant was changed.

## Read-only catalog evidence

| Area | Result |
|---|---:|
| Public base tables | 555 |
| Public columns | 6,709 |
| Foreign-key constraints | 1,138 |
| Indexes | 1,489 |
| Public routines | 249 |
| RLS-enabled public tables | 555 |
| RLS policies | 748 |
| Repository references resolved | 201 / 201 |
| Missing references, tenant contracts, critical contracts | 0 / 0 / 0 |

The schema verifier's API-path total is 556 because it includes an exposed non-table API path; the PostgreSQL catalog count of base tables is 555. This is a measurement difference, not a missing table.

## Security and performance findings

The 12 advisor notices for RLS-enabled tables without policies were assessed before any change. These tables remain RLS-protected. Several are intentionally service-only/deny-by-default tables, while four control/monitoring tables have grants but no policy; RLS still denies role access without a matching policy. Adding a blanket policy to silence the notice would broaden access, so no policy was added without an application-specific authorization contract.

The advisor also reports a performance backlog of 506 unindexed foreign-key notices and 397 unused-index notices. Those are not evidence of missing tables or broken current application contracts. They require workload-aware, table-by-table query-plan review and cannot safely be remediated by a mass index operation in a production synchronization pass.

## Migration-ledger alignment

| Repository migration | Supabase ledger / catalog verification |
|---|---|
| `20260827_001_schema_health_readonly_role.sql` | `schema_health_readonly_role` recorded; `sm_schema_health` role exists. |
| `20260827_002_fixed_deposit_product_code_index_repair.sql` | `fixed_deposit_product_code_index_repair` recorded; unique index exists. |

This result is deliberately **no-op** for production DDL/DML: schema synchronization is confirmed, not inferred from a risky recreate operation.
