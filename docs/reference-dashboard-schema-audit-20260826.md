# Reference Dashboard Schema-first Audit

**Date:** 2026-08-26
**Scope:** Read-only comparison of the supplied SMART MANAGER dashboard reference with current dashboard data sources and the connected Supabase project.

## Reference intent

The supplied visual reference calls for a compact, light-surface enterprise command center with a deep emerald navigation rail, global header, time-aware greeting, KPI strip, financial trend chart, category or channel breakdown, quick actions, activity, and operational health. The attached implementation brief requires that every data-dependent surface remain tenant-safe and truthful rather than displaying invented production statistics.

## Current architecture findings

| Area | Current source | Finding |
|---|---|---|
| Broad/default dashboard | `client/src/components/ExecutiveCommandCenter.jsx` | Role-aware command center using confirmed rows and explicit unavailable states for cash, payables, gross profit, and targets where no reliable source is exposed. |
| Executive-only dashboard | `client/src/components/EnterpriseDashboardOverview.jsx` | Existing reference-adjacent premium layout with KPI cards, responsive real-data trend controls, alerts, activity, quick actions, loading, empty, and error states. |
| Parent integration | `client/src/BusinessSphereDashboard.jsx` | Supplies authenticated tenant-scoped hook data, preserves RBAC role views, opens the existing preferences drawer, and contains shared quick-action handlers. |
| Preferences | `client/src/contexts/DashboardPreferencesContext.tsx` | Authenticated persistence flows through `trpc.dashboardPreferences`; local storage is only an isolated-preview fallback. Default timezone is `Africa/Dar_es_Salaam`; default currency is TZS. |
| Browser data client | `BusinessSphereDashboard.jsx` (`sb`, `useCompanyTable`) | Read requests use authenticated Supabase headers; no browser service-role credential is present. The hook has retry, loading, refresh, unavailable, and error behavior. |

## Frontend-to-live-table map

| Dashboard domain | Live table endpoint verified | Key columns observed through OpenAPI | Frontend mapper / behavior |
|---|---|---|---|
| Invoices and receivables | `sales_invoices` | `id`, `company_id`, `issue_date`, `due_date`, `amount_paid`, `customer`, `status`, `order_id`, `data` | `mapInvoiceRow`; nested invoice item selection supplies line values. |
| Expenses | `finance_expenses` | `id`, `company_id`, `expense_date`, `due_date`, `amount`, `category`, `vendor`, `method`, `status` | `mapExpenseRow`. |
| Inventory and low stock | `inventory_items` | `id`, `company_id`, `name`, `amount`, `status`, `data` | `mapInventoryRow` reads quantity/reorder/cost from supported fields or `data`. |
| Pipeline | `crm_leads` | `id`, `company_id`, `name`, `amount`, `status`, `data` | `mapLeadRow` normalizes stage/value/customer fields. |
| People | `hr_employees` | `id`, `company_id`, `department_id`, `manager_employee_id`, `profile_id`, status/timezone fields | `mapEmployeeRow`. |
| Leave and approvals | `hr_leave_requests` | `id`, `company_id`, `employee_id`, `leave_policy_id`, start/end/decision fields | `mapLeaveRow`; the existing embedded `hr_employees(full_name)` select relies on the deployed FK relationship. |
| POS activity | `pos_transactions` | `id`, `company_id`, `amount`, `status`, `data` | Existing tenant-scoped source for sales/order count. |
| Work-order attention | `manufacturing_work_orders` | `id`, `company_id`, `amount`, `status`, `data` | Existing tenant-scoped source for operational attention. |

All eight primary table endpoints returned successful read-only zero-row requests (HTTP 200 or 206) with an authenticated project credential. The repository’s `verify:supabase-schema` command also passed on 2026-08-26: **201 referenced tables**, **536 deployed tables**, **no missing tables**, **no tenant-column issues**, and **no critical contract issues**.

## Relationships, functions, views, and RLS

The OpenAPI contract confirms the primary table endpoints and their `company_id` columns. It also exposes **198 RPC paths**, including tenant-context functions such as `current_company_id`, `ensure_current_company`, and `switch_current_company`. No current default dashboard metric is backed by a dedicated aggregation view or dashboard-specific RPC; it derives from the existing role-scoped row hooks.

Repository mapping code documents a verified `hr_leave_requests.employee_id → hr_employees` relationship and uses PostgREST embedding to obtain employee names. The invoice mapper uses the existing nested sales invoice item relationship; no new relationship is required for the reference layout.

The Supabase connector configuration and direct MCP calls returned HTTP 403 while this audit was running, so the live policy catalog, view definitions, and routine definitions could not be enumerated through the approved connector. A direct PostgREST metadata query for `pg_policies` is correctly unavailable from the public API schema (HTTP 404). Therefore, no broad RLS interpretation, SQL, policy change, view, function, or data mutation was applied. Existing prior verifier evidence and the current authenticated browser request path support retaining the established RLS-first design pending connector recovery.

## Safe implementation decision

The supplied reference can be matched by rearranging and refining existing data-backed command-center components. The following metrics must remain unavailable or explicitly qualified until a source is proven: cash balance, supplier payables, gross profit based on COGS, and sales-target achievement. No new table or migration is presently justified.
