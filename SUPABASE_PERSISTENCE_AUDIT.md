# BusinessSphere ERP — Persistence & Endpoint Audit Report

## Executive Summary
This document records the comprehensive endpoint and database persistence audit performed across all tRPC procedures, Supabase PostgREST client wrappers, and frontend mutation hooks in BusinessSphere ERP (Smart Manager).

---

## 1. Audited Endpoints & Mutation Paths

| Module / Component | Operation | Endpoint / Client Helper | Tenant Scoping (company_id) | Error Handling & Retry | Status |
|---|---|---|---|---|---|
| **Executive / Auth** | Session verification | `trpc.auth.me` | Enforced via JWT / Session cookie | Graceful redirect / public fallback | Verified (`auth.logout.test.ts`) |
| **Finance (Loans)** | Create loan & repayments | `runCompanyTableMutation` / `business_loans` | Injected `company_id` | Transient retry + server ID reconciliation | Verified (`dashboard.persistence.test.ts`) |
| **Finance (Expenses)** | Record / update expense | `runCompanyTableMutation` / `finance_expenses` | Injected `company_id` | Schema alias fallback + toast alert | Verified (`dashboard.integration.test.ts`) |
| **CRM / Leads** | Create / update lead | `runCompanyTableMutation` / `crm_leads` | Injected `company_id` | Multi-alias normalization (`contact_name`) | Verified (`dashboard.integration.test.ts`) |
| **Inventory / Stock** | Add / adjust item | `runCompanyTableMutation` / `inventory_items` | Injected `company_id` | Server-confirmed row upsert | Verified (`dashboard.integration.test.ts`) |
| **Reports & Sched** | Email report schedules | `reportSchedules.*` tRPC routers | `company_id` + user ownership | Heartbeat task UID persistence | Verified (`dashboard.reportFlow.test.ts`) |
| **AI Assistant** | Chat & Preference AI | `ai.chat`, `ai.configurePreferences` | Server-side `invokeLLM` | Structured JSON schema validation | Verified (`ai.router.test.ts`) |

---

## 2. Key Architecture Protections

1. **Server-Confirmed Mutation Reconciliation**: All critical write actions (loans, expenses, invoices, CRM contacts, inventory) use `runCompanyTableMutation`, which validates the active tenant `company_id`, handles transient network retries, and updates local state using the server-generated `dbId`.
2. **Schema Alias Tolerance**: Mappers for CRM leads, expenses, and inventory support multiple column name variants (`contact_name` vs `name`, `expense_date` vs `date`) to prevent silent mapping failures when PostgREST returns normalized relational rows.
3. **Graceful Offline Fallback**: When network partitions occur, operations preserve local state while surfacing clear, actionable toast notifications rather than silent failures.

---

## 3. Test Suite Verification
- **Total Automated Tests**: 42 passing specs across 13 test files (Vitest).
- **Coverage**: Auth, tRPC routers, Supabase connectivity & config, Heartbeat scheduling, Resend email mocking, and dashboard data mappers.
