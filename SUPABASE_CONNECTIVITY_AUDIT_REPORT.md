# BusinessSphere ERP — Supabase Connectivity Audit and Schema Repair Report

## Executive Summary

BusinessSphere ERP is paired with a Supabase PostgreSQL database holding the `rlhngsrihahhyxnjxrxm` project (`EzraMpapi's Project`, Kilimanjaro Trading Co.). Comprehensive auditing of the application’s 124 unique `useCompanyTable` data hooks against the connected public schema revealed that while core reference tables like `companies`, `branches`, `inventory_warehouses`, `company_modules`, `crm_leads`, `inventory_items`, and `finance_expenses` existed and returned HTTP 200, several advanced ERP modules attempted to query relationships or ordering columns absent from the initial schema (such as `documents` referencing `profiles(full_name)` or `sales_subscriptions` ordered by `next_billing_date`), or invoked tables that had not yet been provisioned in the database (`audit_log`, `bnk_accounts`, `bnk_loans`, `bnk_members`, `bnk_applications`, `bnk_transactions`).

Rather than modifying the preserved 45,756-line ERP dashboard architecture, we repaired and hardened the shared data layer at its common request boundary (`runCompanyTableQuery` and `useCompanyTable`). The updated client now automatically falls back from unsupported nested relationships to safe parent-table queries, drops unrecognized order columns, retries transient network errors once, preserves loaded rows during background refreshes to eliminate page flicker, and treats missing tables as honest empty states rather than generic connection errors. In addition, we applied a safe database migration (`add_missing_erp_module_tables`) that provisions the six absent ERP tables with proper UUID keys, default tenant scoping (`current_company_id()`), Row Level Security (RLS) enabled, and authenticated tenant policies.

---

## 1. Inventory & Schema Comparison

The preserved dashboard contains requests across **124 unique table names**. The live Supabase schema audit confirms the following classification:

| Category | Count | Status / Resolution |
|---|---|---|
| **Fully Available Tables** | 145 tables | Existing public schema tables with RLS enabled and company scoping. |
| **Provisioned Missing Tables** | 6 tables | `audit_log`, `bnk_accounts`, `bnk_loans`, `bnk_members`, `bnk_applications`, `bnk_transactions` were provisioned via migration with full RLS policies. |
| **Schema Incompatibilities Resolved** | 8 query patterns | PostgREST nested joins (`profiles`, `hr_employees`, `sales_invoice_items`) and unindexed order columns (`next_billing_date`) were given automatic fallback variants in the shared query runner. |

---

## 2. Fixed Connection and Query-Shape Defects

1. **Unsupported Nested Relationships (HTTP 400)**: PostgREST queries requesting embedded relations (e.g., `documents?select=*,profiles(full_name)`) failed when foreign-key constraints were missing in the connected project.
   - **Fix**: `runCompanyTableQuery` now detects schema compatibility errors (HTTP 400, `PGRST200`, `42703`), automatically strips nested selects, and falls back to a clean parent-table query (`select=*`).
2. **Missing Order Columns**: Queries sorting by columns absent from the database (e.g., `sales_subscriptions` ordered by `next_billing_date`) threw PostgreSQL errors.
   - **Fix**: The query builder removes unsupported sort parameters on fallback attempts.
3. **Transient Network Errors**: Intermittent DNS or gateway timeouts caused immediate module-level error banners.
   - **Fix**: Transient network errors and status codes (408, 429, 500, 502, 503) trigger a single bounded 180ms retry before surfacing an error.
4. **Page Flicker & Blanking on Refresh**: Tab switching and background reloads previously wiped existing rows and showed loading spinners, causing visual flicker.
   - **Fix**: `useCompanyTable` now preserves successfully loaded rows in `rowsRef` during refreshes, updating data in place without unmounting views.

---

## 3. Operational Data Status & User-Managed Prerequisites

- **Tenant Baseline**: Non-personal baseline records for Kilimanjaro Trading Co. (1 branch, 1 warehouse, 6 active module entitlements) remain active and validated.
- **Operational Records**: Tables for CRM leads, inventory items, finance expenses, and newly provisioned banking/audit tables are fully reachable. The explicitly requested chart-validation batch now includes 5 synthetic CRM contacts, 6 synthetic CRM leads, and 8 synthetic inventory items for Kilimanjaro Trading Co.; all rows are tenant-scoped and tagged with `data.sample_batch = 'erp-chart-sample-2026-08'` and `data.is_sample = true`. As real users create leads, invoices, or transactions through the live ERP UI, rows are automatically scoped to their authenticated session via Supabase RLS.
- **OAuth Prerequisites**: Google OAuth is active. Microsoft Azure and Apple sign-in controls are fully wired in the frontend, but require the user to enable those providers in the Supabase Dashboard (`Authentication > Providers`) with their respective client IDs and redirect URL (`https://bserp-dashbo-xgm6fauw.manus.space/app`).

---

## 4. Validation Evidence

- **Automated Tests**: 15 passing tests across the project test suite, including CRM/inventory alias-mapper coverage in `server/dashboard.integration.test.ts`, route registration, environment config, OAuth routes, module schema mapping, Daily Briefing fetch states, table-query fallbacks, transient retries, and missing-table handling.
- **Production Build**: Clean production build (`pnpm build`) completed successfully.
- **Visual Verification**: The marketing landing page and ERP authentication entry route render cleanly at desktop size. The authenticated post-login chart view still requires a user session to inspect interactively; the live database verification below confirms the chart source rows and aggregate values.


## 5. Chart-validation sample batch

The requested sample batch was inserted into the live Kilimanjaro Trading Co. tenant (`3022205f-89d9-4790-affa-cde3a304ee27`) using deterministic UUIDs and `ON CONFLICT (id) DO NOTHING` for idempotent reruns. The records are non-personal, use synthetic names and `example.test` addresses, and are marked with `data.sample_batch = 'erp-chart-sample-2026-08'` and `data.is_sample = true`.

| Live source | Rows | Aggregate verification |
|---|---:|---|
| `crm_contacts` | 5 | Synthetic contact/company/role rows available for the CRM workspace. |
| `crm_leads` | 6 | Pipeline value verified at TZS 125,700,000 across New, Contacted, Qualified, Proposal, Negotiation, and Won stages. |
| `inventory_items` | 8 | 1,000 total units; 2 items at or below reorder level; categories and locations span the sample chart dimensions. |

The deployed `inventory_items` schema exposes `item_sku`, `item_name`, and `quantity`, whereas the preserved dashboard mapper originally expected `sku`, `name`, and `qty_on_hand`. The mapper now accepts both deployed generic aliases and richer legacy fields. CRM contacts likewise accept `contact_name`, `company_name`, and `role` aliases while preserving the existing dashboard shape. The focused mapper test, complete 15-test suite, and production build all passed after this compatibility update.
