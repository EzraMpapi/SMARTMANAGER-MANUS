# BusinessSphere ERP — Supabase Production Schema Inventory

**Audit date:** 12 August 2026 (UTC)  
**Source of truth:** The protected PostgREST OpenAPI document exposed by the connected Supabase project, compared with every `sb("table")` reference in `BusinessSphereDashboard.jsx`. PostgREST’s root endpoint exposes an OpenAPI description of database endpoints, which makes this a useful non-destructive deployment-contract check.[1]

> This inventory is a schema and API-contract audit. It does not manufacture operational data, delete tables, or alter existing business records.

## Audit outcome

The dashboard requires **110 distinct Supabase business tables**. The connected project exposes **152 table endpoints** and every one of the 110 referenced tables is present. Consequently, there are **no missing dashboard tables to create**. The only verified contract variance was that `public.audit_log` lacked `updated_at`; the additive and idempotent repair in [`supabase/migrations/20260812_001_complete_erp_schema_baseline.sql`](./supabase/migrations/20260812_001_complete_erp_schema_baseline.sql) has been successfully applied and verified.

| Audit dimension | Result | Evidence and action |
|---|---:|---|
| Dashboard table references | 110 | Extracted directly from the preserved ERP dashboard source. |
| Deployed PostgREST table endpoints | 152 | Enumerated from the protected OpenAPI document. |
| Missing referenced tables | 0 | Every dashboard reference has a deployed table endpoint. |
| Tenant ownership/timestamp contract exceptions | 0 | The applied repair added and backfilled `audit_log.updated_at`; the live verifier reports no remaining exceptions. |
| Destructive database operations | 0 | The migration contains no `DROP TABLE`, no truncate, and no data deletion. |

## Functional table coverage

| Domain | Deployed table contract used by the dashboard |
|---|---|
| Platform, governance, and workflow | `approval_signatures`, `audit_log`, `branches`, `calendar_events`, `companies`, `company_modules`, `custom_kpis`, `departments`, `digital_signatures`, `documents`, `emails`, `integration_connections`, `notification_channels`, `notification_log`, `notification_rules`, `profiles`, `resource_bookings`, `scheduled_reports`, `signatures`, `workflow_marketplace_templates`, `workflows`, `workspaces` |
| Collaboration and communications | `collab_channels`, `collab_messages`, `community_groups`, `kb_articles`, `notebook_notes`, `sms_group_members`, `sms_groups`, `sms_templates`, `support_call_log`, `support_chat_messages`, `support_ticket_messages`, `support_tickets`, `whatsapp_messages` |
| Finance, banking, and debt | `bank_accounts`, `bank_transactions`, `bnk_applications`, `bnk_accounts`, `bnk_loans`, `bnk_members`, `bnk_transactions`, `business_loans`, `expense_budgets`, `finance_assets`, `finance_expenses`, `financial_benchmarks`, `journal_entries`, `loan_repayments`, `other_debtors`, `other_income`, `period_closes` |
| CRM, marketing, sales, and commerce | `competitors`, `crm_contacts`, `crm_interactions`, `crm_leads`, `customer_feedback`, `ecommerce_orders`, `ecommerce_products`, `marketing_campaigns`, `sales_invoice_items`, `sales_invoices`, `sales_order_return_items`, `sales_order_returns`, `sales_payments`, `sales_subscriptions` |
| Inventory, procurement, manufacturing, and supply chain | `inventory_batches`, `inventory_items`, `inventory_stock_movements`, `inventory_suppliers`, `inventory_transfers`, `inventory_warehouses`, `manufacturing_bom_components`, `manufacturing_boms`, `manufacturing_machines`, `manufacturing_maintenance`, `manufacturing_qc_inspections`, `manufacturing_work_orders`, `procurement_contracts`, `procurement_purchase_orders`, `purchase_order_items`, `scm_shipments`, `scm_vehicles`, `stock_audit_items`, `stock_audits` |
| Human resources and project operations | `hr_attendance`, `hr_benefits`, `hr_candidates`, `hr_duties`, `hr_employees`, `hr_invite_codes`, `hr_leave_requests`, `hr_payroll_runs`, `hr_training`, `project_expenses`, `project_milestones`, `project_tasks`, `projects` |
| Point of sale and sector workspaces | `pos_cash_movements`, `pos_return_items`, `pos_returns`, `pos_shifts`, `pos_transaction_items`, `pos_transactions`, `hc_appointments`, `hc_doctors`, `hc_patients`, `hc_vitals`, `mfi_clients`, `mfi_loans`, `network_profiles`, `network_rfqs`, `phm_drugs`, `sch_students`, `vicoba_loans`, `vicoba_members` |

## Tenant isolation and persistence guardrails

All dashboard business reads and writes use company-scoped filters and payloads. The live verifier treats `id`, `company_id`, `created_at`, and `updated_at` as the required contract for tenant-scoped data tables, with `companies`, `profiles`, and `workspaces` handled as global identity or workspace entities. Row Level Security is the database enforcement layer: Supabase recommends enabling RLS on exposed tables and enforcing access through policies rather than relying on client filtering alone.[2]

The inventory deliberately does not recreate or replace deployed RLS policies. Replacing an existing policy based on incomplete metadata could reduce access protection or interrupt valid workflow permissions. Instead, the additive migration preserved the existing `audit_log` ownership model while repairing the single timestamp gap. A production catalog query verified that every public table carrying `company_id` has RLS enabled and at least one associated policy; its zero-row exception check found no gaps. The continuous verifier reports any future table absence or required-column variance as a failing release check.

## Applying and verifying the additive migration

The migration was applied through the authenticated Supabase SQL Editor on 13 August 2026. It is idempotent, preserves all existing audit rows, and is safe to re-run if required. Do **not** run the platform’s Drizzle migration command for this file, because Drizzle targets the separate MySQL/TiDB platform database rather than the Supabase ERP database.

```bash
pnpm verify:supabase-schema
```

The command fetches the live protected OpenAPI document, dynamically extracts the dashboard’s current table references, and exits non-zero if a table is missing or a tenant-scoped table lacks one of the required ownership/audit columns. It uses only environment-managed Supabase credentials and contains no copied credential values.

## References

[1]: https://docs.postgrest.org/en/v12/references/api/openapi.html "PostgREST OpenAPI reference"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security guide"
