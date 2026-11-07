# Reference-Directed Dashboard: Schema Verification Record

## Scope and method

The dashboard rebuild was compared with the authorized live Supabase public-schema metadata on 27 August 2026. The review was deliberately **read-only**: it inspected the table inventory and core column metadata only, queried no business records, and performed no DDL or DML.

## Dashboard data-contract outcome

| Dashboard source | Verified live table | Required dashboard fields or payload surface | Outcome |
| --- | --- | --- | --- |
| Sales-document counts, collections, receivables, and activity | `sales_invoices` | `company_id`, `status`, `amount`, `amount_paid`, `customer`, `issue_date`, `due_date`, `data` | Existing tenant-scoped table supports the established client adapter. |
| Recorded-expense summary and trend | `finance_expenses` | `company_id`, `amount`, `category`, `expense_date`, `status`, `vendor` | Existing tenant-scoped table supports the established client adapter. |
| Inventory summary and low-stock attention | `inventory_items` | `company_id`, `name`, `status`, `amount`, `data` | Existing tenant-scoped table supports the established client adapter; item detail remains interpreted by the established payload adapter. |
| Pipeline count and value | `crm_leads` | `company_id`, `name`, `status`, `amount`, `data` | Existing tenant-scoped table supports the established client adapter. |
| Approval panel | `hr_leave_requests` | `company_id`, `status`, `employee_id`, `start_date`, `end_date`, `data` | Existing tenant-scoped table supports the established client adapter. |
| Production attention signal | `manufacturing_work_orders` | `company_id`, `status`, `data` | Existing tenant-scoped table supports the established client adapter; the dashboard does not expand Manufacturing feature scope. |

## Decision

**No SQL migration was applied.** The redesigned dashboard consumes the existing Sales, Finance, Inventory, CRM, HR, and Manufacturing hook contracts and introduces no new persistent entity, column, view, RPC, write path, or cross-tenant query. All sampled dashboard tables were present with RLS enabled in the live inventory. The client continues to rely on the application’s established session-bound company scope and does not send a user-supplied company identifier as a filter.

## Boundaries retained

The dashboard’s financial cards are current-view calculations from confirmed rows. They are not bank balances, forecasts, payment-settlement confirmation, reconciliation outcomes, or audit determinations. Empty and error states remain explicit rather than fabricating values or operational activity.
