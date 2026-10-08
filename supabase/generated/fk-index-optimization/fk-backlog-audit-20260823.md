# Supabase FK Backlog Audit and P0 Review — 2026-08-23

> Read-only audit and planning record. No Supabase table or index DDL was executed.

The fresh production catalog snapshot contains **1,097 foreign keys** across **510 source tables**: **457 covered** and **640 uncovered**. The current performance-advisor response contains **632 unindexed-FK notices**. The earlier repository allowlist contained 622 entries and is retained only as historical context; it is not the current source of truth.

## Full remaining-backlog classification

| Tier | Relationships | Share | Action |
|---|---:|---:|---|
| P0_POPULATED_OR_HOT | 5 | 0.8% | Five statements retained for explicit P0 review; not applied. |
| P1_ADVISOR_TRANSACTION | 19 | 3.0% | Current advisor-confirmed, populated transaction/workforce candidates; external concurrent plan only. |
| P2_REVIEW_BACKLOG | 616 | 96.3% | Full manifest backlog; no executable SQL emitted. |

The uncovered set includes **25 populated relationships**, **47 composite relationships**, **170 company-leading relationships**, and **8 tenant-leading relationships**.

## P1 audit — all current candidates

| Source table | Constraint | Columns | Estimated rows | Relation bytes | Seq scans | Index scans | Advisor |
|---|---|---|---:|---:|---:|---:|---|
| workforce_roles | workforce_roles_created_by_fkey | created_by | 42 | n/a | n/a | n/a | yes |
| workforce_roles | workforce_roles_updated_by_fkey | updated_by | 42 | n/a | n/a | n/a | yes |
| workforce_permission_conflicts | workforce_permission_conflicts_company_id_permission_a_id_fkey | company_id, permission_a_id | 21 | n/a | n/a | n/a | yes |
| workforce_permission_conflicts | workforce_permission_conflicts_company_id_permission_b_id_fkey | company_id, permission_b_id | 21 | n/a | n/a | n/a | yes |
| workforce_permission_conflicts | workforce_permission_conflicts_created_by_fkey | created_by | 21 | n/a | n/a | n/a | yes |
| workforce_permission_conflicts | workforce_permission_conflicts_updated_by_fkey | updated_by | 21 | n/a | n/a | n/a | yes |
| billing_plan_audit_log | billing_plan_audit_log_company_id_fkey | company_id | 13 | n/a | n/a | n/a | yes |
| sales_payments | sales_payments_invoice_fkey | invoice_id, company_id | 12 | n/a | n/a | n/a | yes |
| pos_transaction_commits | pos_transaction_commits_created_by_fkey | created_by | 5 | n/a | n/a | n/a | yes |
| pos_transaction_commits | pos_transaction_commits_transaction_id_fkey | transaction_id | 5 | n/a | n/a | n/a | yes |
| pos_sync_events | pos_sync_events_created_by_fkey | created_by | 4 | n/a | n/a | n/a | yes |
| pos_sync_events | pos_sync_events_transaction_id_fkey | transaction_id | 4 | n/a | n/a | n/a | yes |
| community_group_audit_log | community_group_audit_log_company_id_fkey | company_id | 3 | n/a | n/a | n/a | yes |
| hospitality_audit_log | hospitality_audit_log_company_id_fkey | company_id | 3 | n/a | n/a | n/a | yes |
| pos_return_commits | pos_return_commits_created_by_fkey | created_by | 2 | n/a | n/a | n/a | yes |
| pos_return_commits | pos_return_commits_return_id_fkey | return_id | 2 | n/a | n/a | n/a | yes |
| sales_invoice_items | sales_invoice_items_header_fkey | invoice_id, company_id | 2 | n/a | n/a | n/a | yes |
| sales_invoices | sales_invoices_order_fkey | order_id, company_id | 1 | n/a | n/a | n/a | yes |
| sales_quotation_items | sales_quotation_items_header_fkey | quotation_id, company_id | 1 | n/a | n/a | n/a | yes |

## P2 audit summary

All 616 P2 relationships are included in `fk-index-plan.json`; the most concentrated source tables are shown below. This is a prioritization backlog, not permission to create every index.

| Source table | Uncovered relationships |
|---|---:|
| pos_return_headers | 10 |
| pos_sale_adjustments | 8 |
| pos_sale_headers | 7 |
| pos_loyalty_redemptions | 7 |
| pos_shift_sessions | 6 |
| workforce_member_roles | 6 |
| restaurant_orders | 6 |
| workforce_approval_limits | 5 |
| pos_shift_cash_movements | 5 |
| money_agent_transactions | 5 |
| pos_discount_rules | 5 |
| pos_tax_rules | 5 |
| fleet_maintenance_jobs | 5 |
| fleet_trips | 5 |
| fleet_incidents | 5 |
| workforce_permission_conflicts | 4 |
| pos_registers | 4 |
| workforce_data_scopes | 4 |
| workforce_module_access | 4 |
| hospitality_reservations | 4 |
| fin_approval_requests | 4 |
| fin_journal_batches | 4 |
| hospitality_orders | 4 |
| pos_sale_lines | 4 |
| money_agent_agents | 4 |
| pos_sale_tax_lines | 4 |
| fleet_driver_assignments | 4 |
| hospitality_housekeeping_tasks | 4 |
| money_agent_settlements | 4 |
| pos_loyalty_programs | 4 |

## P0 statement impact review

The five P0 indexes are still absent from production, so an actual before/after speedup cannot be claimed. Read-only evidence shows the two source tables are active but small: `workforce_role_permissions` has 469 estimated rows, 376,832 relation bytes, 480 index scans, and 471 inserts; `workforce_permissions` has 140 estimated rows, 147,456 relation bytes, 1,168 index scans, and 142 inserts. Existing indexes cover company/id, company/code, company/module, role/status, and primary keys, but not the proposed FK vectors. The expected benefit is cheaper parent update/delete and FK validation probing; the cost is write maintenance and storage. After explicit approval, validate representative query shapes with `EXPLAIN (ANALYZE, BUFFERS)` and inspect index usage.

## Safety boundary

The migration-safe SQL contains exactly five ordinary `CREATE INDEX IF NOT EXISTS` statements and no drops. The external plan contains 24 bounded P0/P1 concurrent statements because the current P1 tier has 19 candidates; P2 emits no executable SQL. No `apply_migration` call was made.
