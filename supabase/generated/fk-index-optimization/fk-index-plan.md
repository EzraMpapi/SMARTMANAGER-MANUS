# Supabase Foreign-Key Index Optimization Plan

> Review-only artifact. No Supabase DDL was executed by this generator.

The latest read-only catalog snapshot contains **1097 validated foreign keys**. Of these, **640** lack a valid non-partial leading-column index and **457** have valid leading-column coverage. The audit also reports 170 company-leading, 8 tenant-leading, and 47 composite uncovered relationships.

The current Supabase performance-advisor snapshot contains 632 unindexed-FK notices. The older repository allowlist contained 622 entries; that historical count is retained only for comparison. The current plan is driven by the catalog artifact, while the advisor flag is used only for prioritization.

## Priority policy

| Tier | Count | Treatment |
|---|---:|---|
| P0_POPULATED_OR_HOT | 5 | Included in the bounded, non-concurrent migration-safe SQL. Current evidence is the five populated workforce relationships (469/140 estimated rows). |
| P1_ADVISOR_TRANSACTION | 19 | Included only in the separate external CONCURRENTLY review plan. Requires approval and operational preflight. |
| P2_REVIEW_BACKLOG | 616 | Manifest-only backlog. No executable SQL is emitted for this tier. |

The generator intentionally does not emit an all-640 executable batch. It creates no drops, does not modify constraints or RLS, and treats `CREATE INDEX CONCURRENTLY` as external operational SQL rather than transaction-managed migration SQL.

## Highest-priority candidates

| Tier | Source table | Columns | Estimated rows | Advisor | Index name |
|---|---|---|---:|---|---|
| P0_POPULATED_OR_HOT | workforce_role_permissions | company_id, approval_request_id | 469 | yes | `ix_workforce_role_permissions_company_id_approval_request_id_fk` |
| P0_POPULATED_OR_HOT | workforce_role_permissions | granted_by | 469 | yes | `ix_workforce_role_permissions_granted_by_fk` |
| P0_POPULATED_OR_HOT | workforce_role_permissions | revoked_by | 469 | yes | `ix_workforce_role_permissions_revoked_by_fk` |
| P0_POPULATED_OR_HOT | workforce_permissions | created_by | 140 | yes | `ix_workforce_permissions_created_by_fk` |
| P0_POPULATED_OR_HOT | workforce_permissions | updated_by | 140 | yes | `ix_workforce_permissions_updated_by_fk` |
| P1_ADVISOR_TRANSACTION | workforce_roles | created_by | 42 | yes | `ix_workforce_roles_created_by_fk` |
| P1_ADVISOR_TRANSACTION | workforce_roles | updated_by | 42 | yes | `ix_workforce_roles_updated_by_fk` |
| P1_ADVISOR_TRANSACTION | workforce_permission_conflicts | company_id, permission_a_id | 21 | yes | `ix_workforce_permission_conflicts_company_id_permission_a_id_fk` |
| P1_ADVISOR_TRANSACTION | workforce_permission_conflicts | company_id, permission_b_id | 21 | yes | `ix_workforce_permission_conflicts_company_id_permission_b_id_fk` |
| P1_ADVISOR_TRANSACTION | workforce_permission_conflicts | created_by | 21 | yes | `ix_workforce_permission_conflicts_created_by_fk` |
| P1_ADVISOR_TRANSACTION | workforce_permission_conflicts | updated_by | 21 | yes | `ix_workforce_permission_conflicts_updated_by_fk` |
| P1_ADVISOR_TRANSACTION | billing_plan_audit_log | company_id | 13 | yes | `ix_billing_plan_audit_log_company_id_fk` |
| P1_ADVISOR_TRANSACTION | sales_payments | invoice_id, company_id | 12 | yes | `ix_sales_payments_invoice_id_company_id_fk` |
| P1_ADVISOR_TRANSACTION | pos_transaction_commits | created_by | 5 | yes | `ix_pos_transaction_commits_created_by_fk` |
| P1_ADVISOR_TRANSACTION | pos_transaction_commits | transaction_id | 5 | yes | `ix_pos_transaction_commits_transaction_id_fk` |
| P1_ADVISOR_TRANSACTION | pos_sync_events | created_by | 4 | yes | `ix_pos_sync_events_created_by_fk` |
| P1_ADVISOR_TRANSACTION | pos_sync_events | transaction_id | 4 | yes | `ix_pos_sync_events_transaction_id_fk` |
| P1_ADVISOR_TRANSACTION | community_group_audit_log | company_id | 3 | yes | `ix_community_group_audit_log_company_id_fk` |
| P1_ADVISOR_TRANSACTION | hospitality_audit_log | company_id | 3 | yes | `ix_hospitality_audit_log_company_id_fk` |
| P1_ADVISOR_TRANSACTION | pos_return_commits | created_by | 2 | yes | `ix_pos_return_commits_created_by_fk` |
| P1_ADVISOR_TRANSACTION | pos_return_commits | return_id | 2 | yes | `ix_pos_return_commits_return_id_fk` |
| P1_ADVISOR_TRANSACTION | sales_invoice_items | invoice_id, company_id | 2 | yes | `ix_sales_invoice_items_invoice_id_company_id_fk` |
| P1_ADVISOR_TRANSACTION | sales_invoices | order_id, company_id | 1 | yes | `ix_sales_invoices_order_id_company_id_fk` |
| P1_ADVISOR_TRANSACTION | sales_quotation_items | quotation_id, company_id | 1 | yes | `ix_sales_quotation_items_quotation_id_company_id_fk` |

## Review sequence

1. Re-run the read-only catalog audit immediately before approval so row estimates and existing-index coverage are current.
2. Review the generated P0 migration and the external P1 concurrent plan with the database owner, including storage and lock budget.
3. Validate representative query plans with `EXPLAIN (ANALYZE, BUFFERS)` and inspect index usage after deployment.
4. Apply only an approved batch; do not use this artifact as authorization to run DDL.
