# Supabase Foreign-Key and Index Optimization Audit

**Project:** `rlhngsrihahhyxnjxrxm`
**Schema audited:** `public`
**Audit date:** 23 August 2026
**Author:** Manus AI
**Mode:** Read-only; no production DDL, index creation, index removal, or constraint changes were performed.

## Executive conclusion

The production database has a broad relationship and indexing surface: 513 public tables, 1,082 foreign-key constraints, and 1,173 valid public indexes. The database is currently sparsely populated, so the raw count of missing foreign-key indexes is materially larger than the immediately actionable performance risk. The authoritative Supabase performance advisor reports **622 unindexed-foreign-key findings across 284 tables** and **59 unused-index informational findings**.[1] A corrected catalog audit found **630 foreign-key relationships without a valid non-partial leading-column index across 289 tables**. The eight-row difference is documented below and must be reconciled per constraint before generating bulk DDL.

The most important recommendation is **not** to create hundreds of indexes blindly. The current workload statistics show that only two affected tables have estimated row counts above 100: `workforce_role_permissions` with 469 live rows and `workforce_permissions` with 140. Most other affected tables are empty or nearly empty. The recommended approach is therefore workload-led: add narrow indexes for proven hot paths and tenant isolation, then expand coverage as tables accumulate data and query plans demonstrate a need.

## Production inventory

| Area | Live result | Interpretation |
|---|---:|---|
| Public tables | 513 | The production schema is materially larger than the current repository’s 279 distinct declared tables because it includes historical and supporting objects. |
| Repository SQL migration files | 66 | The current checkout contains the latest committed migration set. |
| Repository-declared public tables missing from production | 0 | No table should be invented or recreated as part of this audit. |
| Foreign-key constraints | 1,082 | Relationship integrity exists broadly across the public schema. |
| Valid public indexes | 1,173 | No invalid indexes were found in the audited catalog. |
| Non-primary indexes | 660 | These include supporting, unique, partial, and workload-specific indexes. |
| Exact duplicate index-definition groups | 0 | No exact duplicates were detected by normalized table/index-definition comparison. |
| Non-primary indexes with `idx_scan = 0` | 264 | A review signal only; not a safe deletion list because the workload is sparse and statistics are cumulative. |
| Left-prefix subsumption candidates | 22 | Candidate consolidation opportunities; each requires workload and uniqueness review. |

The repository-to-production reconciliation found zero missing repository-declared tables. Migration filename stems are not a complete deployment ledger because 60 of 66 current stems match live ledger names exactly and the remaining entries reflect historical or logical naming differences. A migration must therefore be reconciled against the Supabase migration ledger before application.[2]

## Foreign-key coverage findings

The first catalog query used a one-based array slice against PostgreSQL’s zero-based `pg_index.indkey` vector. A representative check on `workforce_role_permissions` demonstrated that existing indexes such as `(company_id, id)` were incorrectly missed. The query was corrected to compare `indkey[0:cardinality(conkey)-1]`, and all counts below use the corrected predicate.

| Metric | Corrected catalog audit | Supabase performance advisor |
|---|---:|---:|
| Foreign-key findings | 630 | 622 `unindexed_foreign_keys` lints |
| Affected tables | 289 | 284 |
| Company-scoped FK findings | 174 | Included in the 622 lints |
| Composite FK findings | 47 | Included in the 622 lints |
| Tables with estimated rows >= 100 | 2 | Not exposed as an advisor severity distinction |

The catalog-only set contains eight relationships not currently reported by the Supabase advisor: `fleet_driver_assignments.driver_id`, `fleet_driver_assignments.vehicle_id`, `mfi_loan_products.company_id`, `pos_shift_sessions(company_id, register_id)`, `sch_enrollments.company_id`, `sch_fee_invoices.company_id`, `sch_library_loans.company_id`, and `sch_subjects.company_id`. These should be reviewed individually rather than automatically converted into indexes because the discrepancy may reflect advisor filtering or coverage semantics.

Tenant-oriented classification provides a more useful remediation lens. There are **127 single-column `company_id` foreign keys without any leading `company_id` index**, **40 composite company-scoped foreign keys that have a leading `company_id` index but lack the full composite relationship index**, and **8 `tenant_id` columns without a leading index**. No `workspace_id` or `organization_id` gaps were found. A single-column tenant index and a composite relationship index serve different access patterns; one must not be treated as a substitute for the other.

## Highest-priority relationship gaps

The following tables are the first candidates for plan validation and targeted index design. The prioritization combines current row estimates, domain criticality, tenant isolation, write-path sensitivity, and the number of uncovered relationships.

| Priority | Table or domain | Current signal | Recommended action |
|---|---|---|---|
| P0 | `workforce_role_permissions` | 469 live rows; 3 uncovered FKs remain, including `(company_id, approval_request_id)` and audit actor columns `granted_by` and `revoked_by`; 473 index scans. | Validate the approval lookup and actor-history queries with `EXPLAIN`. Add only the composite approval index and actor indexes that match observed plans. This is the clearest immediate candidate. |
| P0 | `workforce_permissions` | 140 live rows; 2 uncovered actor FKs, `created_by` and `updated_by`; 1,161 index scans and 10,239 index tuple fetches. | Inspect permission-management and audit queries. Add actor indexes if history joins or profile deletion/update checks are present. |
| P1 | `pos_return_headers`, `pos_sale_adjustments`, `pos_sale_headers`, `pos_shift_sessions` | Empty or near-empty now, but high relationship fan-out and transactional write importance; 10, 8, 7, and 6 uncovered relationships respectively. | Design indexes around sale, return, register, shift, journal, and approval lookup patterns. Do not bulk-index every audit actor FK before the POS workload is exercised. |
| P1 | Community Groups transaction tables | Many `company_id`, `group_id`, and `member_id` relationships lack leading indexes while the current tables are mostly empty. | Prioritize `(company_id, group_id)` or `(company_id, member_id)` only where list, contribution, savings, loan, attendance, or notification queries filter by those pairs. Verify tenant isolation plans simultaneously. |
| P1 | Property and Hospitality transaction tables | Repeated missing company, tenant, property, reservation, guest, room, and folio relationship indexes; current live row counts are negligible. | Use endpoint query traces to select compound indexes such as `(company_id, property_id)` or `(company_id, reservation_id)` rather than creating one index per FK column. |
| P2 | Bank/MFI, Fleet, School, Pharmacy, and legacy tables | Numerous advisor findings but generally zero or very low live rows. | Maintain a backlog. Add indexes before data-loading or feature activation, with the migration tied to the owning module and tested against representative data volumes. |
| P2 | Audit and notification tables | Frequent `company_id` and actor relationships, but most are append-only and currently small. | Favor query-specific indexes such as `(company_id, created_at DESC)` when retention/reporting queries require them; avoid indexing every actor column by default. |

## Index redundancy and unused-index findings

No exact duplicate index definitions were found. However, 22 left-prefix candidates were identified where a narrower B-tree index is subsumed by a wider index on the same table. These are **review candidates, not deletion candidates**. Four smaller indexes are actively used even though a wider index exists, including `fin_approval_entity_idx`, `fin_posting_links_source_idx`, `profiles_company_idx`, and `bank_accounts_company_idx`. Dropping them could change planner behavior, uniqueness semantics, or performance for queries that only constrain the prefix.

The Supabase advisor reports 59 `unused_index` INFO findings, while the catalog reports 264 non-primary indexes with zero scans. This difference is expected because the platform advisor and local catalog query apply different filters and time windows. More importantly, zero scans are weak evidence in this environment: many tables are empty, the schema is recently assembled, and statistics are cumulative rather than a controlled production observation window. An index should not be removed unless it has been unused during a representative workload window, is not required for uniqueness or referential maintenance, and its removal has a rollback path.[3]

| Candidate pattern | Example | Decision at this stage |
|---|---|---|
| Narrow active prefix plus wider unique index | `fin_approval_entity_idx` versus `fin_approval_entity_action_key_unique` | Retain pending query-plan review; the narrow index has observed scans. |
| Tenant-only index plus tenant/status index | `profiles_company_idx` versus `profiles_company_active_idx` | Retain; the narrower index is actively used and the wider index serves a different predicate. |
| Tenant-only index plus multiple tenant compound indexes | `bank_accounts_company_idx` versus branch/customer variants | Retain until query fingerprints show the narrow index is unnecessary. |
| Empty-table index with zero scans | Many POS, Community Groups, Hospitality, and School indexes | Do not drop; establish a meaningful workload window first. |

## Workload evidence

Current table statistics are useful for triage but do not prove that a query is optimally indexed. The strongest observed candidates are `workforce_role_permissions`, `workforce_permissions`, `inventory_items`, `company_modules`, and `audit_log`. `profiles` has only nine live rows but a high cumulative sequential-scan count of 23,203; this is more likely to reflect repeated small-table scans than a missing index requiring immediate action.

| Table | Live rows | Sequential scans | Index scans | Interpretation |
|---|---:|---:|---:|---|
| `workforce_role_permissions` | 469 | 7 | 473 | Real populated authorization table; validate uncovered approval and actor relationships first. |
| `workforce_permissions` | 140 | 7 | 1,161 | Real populated permission table; investigate actor-history joins and approval lookups. |
| `inventory_items` | 81 | 9 | 605 | Active inventory path; inspect tenant/item/warehouse query plans before adding gaps. |
| `company_modules` | 62 | 127 | 355 | High sequential-scan activity relative to size; verify module-list and company filters. |
| `audit_log` | 51 | 10 | 74 | Reporting and tenant-history candidate; consider `(company_id, created_at DESC)` if confirmed by query plans. |
| `profiles` | 9 | 23,203 | 686 | Small table; high scan count alone is not evidence for more indexes. |

## Related advisor findings outside this audit’s index scope

The same performance-advisor snapshot contains 843 total lints. The index-specific categories are 622 `unindexed_foreign_keys` and 59 `unused_index`. The remaining findings are separate workstreams: 152 `multiple_permissive_policies` warnings and 10 `auth_rls_initplan` warnings. Those RLS findings should be remediated independently so index changes do not obscure authorization regressions.

## Recommended remediation program

### Wave 1: Establish a controlled measurement window

Before creating or dropping indexes, run `ANALYZE` on the populated P0 tables and capture baseline query plans for authorization, tenant filtering, approval, audit-history, inventory, and module-list endpoints. Record `pg_stat_user_tables` and `pg_stat_user_indexes` snapshots, then exercise representative read, write, update, and delete workflows. Supabase’s unindexed-FK linter should be used as a validation signal, not as the sole index-design engine.[1]

### Wave 2: Remediate populated P0 relationships

Design and test narrow indexes for `workforce_role_permissions` and `workforce_permissions`. The likely candidates are the composite approval relationship `(company_id, approval_request_id)` and actor-history columns, but the final DDL should be driven by confirmed query shapes. Validate that authorization queries remain tenant-scoped and that approval workflows do not regress.

### Wave 3: Remediate transactional and tenant hot paths

Address POS, inventory, audit, Community Groups, Property, Hospitality, and other module tables in domain batches. Prefer compound indexes that match actual predicates, for example `(company_id, group_id)`, `(company_id, member_id)`, `(company_id, property_id)`, or `(company_id, reservation_id)`, rather than adding independent indexes for every foreign-key column. For large production tables, use an operationally safe concurrent-index procedure where supported; a transaction-wrapped migration must not be used for `CREATE INDEX CONCURRENTLY`.[4]

### Wave 4: Review unused and left-prefix candidates

After a representative observation period, review the 59 advisor-unused indexes and the 22 left-prefix candidates. Preserve primary and unique indexes, indexes required by constraints, indexes used by security-sensitive tenant queries, and indexes that support low-frequency but high-impact operational workflows. Remove only individually approved indexes, one migration at a time, with post-drop plan checks and rollback DDL prepared.

### Wave 5: Reconcile advisor results and institutionalize checks

Re-run the Supabase performance advisor, compare it with the catalog query, and track any remaining advisor-only or catalog-only differences. Add a CI contract that prevents new tenant-bearing tables from shipping without a deliberate index decision and that flags new unindexed composite foreign keys for review. Keep RLS policy lints as a separate security gate.

## Release gates for any future DDL

| Gate | Pass condition |
|---|---|
| Schema safety | The target table and columns exist in the live migration ledger and no duplicate index name or definition is introduced. |
| Query evidence | At least one representative production-shaped query shows a measurable plan benefit or prevents a known FK maintenance scan. |
| Tenant safety | RLS behavior and tenant predicates are unchanged; cross-company test cases remain denied. |
| Write-path safety | Insert, update, delete, approval, reconciliation, and idempotency workflows pass before and after the index change. |
| Operational safety | Large-table indexes use an approved non-blocking procedure; locks and build duration are monitored. |
| Advisor verification | Targeted `unindexed_foreign_keys` findings decrease without introducing new RLS or integrity lints. |
| Rollback | Every dropped index has restoration DDL and every added index can be removed safely if plans regress. |

## Final audit boundary

This audit did not modify production. It found no missing repository-declared tables and no invalid indexes. The immediate work is to validate the two populated authorization tables and the active inventory/module/audit paths with representative `EXPLAIN` plans, then remediate in small, reversible domain migrations. Bulk creation of 630 catalog-derived indexes or deletion of 264 zero-scan indexes would be unsafe and is explicitly not recommended.

## References

[1]: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys "Supabase Database Linter: Unindexed foreign keys"

[2]: https://supabase.com/docs/guides/deployment/database-migrations "Supabase database migrations"

[3]: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index "Supabase Database Linter: Unused indexes"

[4]: https://www.postgresql.org/docs/current/sql-createindex.html "PostgreSQL CREATE INDEX documentation"

[5]: https://www.postgresql.org/docs/current/monitoring-stats.html "PostgreSQL monitoring statistics"
