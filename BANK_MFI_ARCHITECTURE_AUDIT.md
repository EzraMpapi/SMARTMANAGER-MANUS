# Bank & MFI Architecture Audit

## Scope

This audit precedes the Bank & MFI implementation and records the existing project boundaries so the new capability can extend the current system rather than replace it.

## Existing application architecture

The project is a React 19 + Vite 7 client with a large preserved `BusinessSphereDashboard.jsx` module shell. The server is Express 4 with tRPC 11, and the project uses Supabase PostgREST for the ERP business tables while retaining Drizzle/MySQL tables for selected platform services such as users, schedules, and audit logs. The client already has a hand-rolled Supabase request builder and `useCompanyTable` hook. The hook loads tenant-scoped rows, preserves last confirmed rows during refresh, exposes loading/error/unavailable states, and reconciles mutations from the project mutation bus.

Authentication uses Supabase access tokens for business-table access and Manus session cookies for tRPC authentication. Existing verified-profile services resolve the Supabase user, load the `profiles` row, and enforce `company_id` and role checks server-side. Existing approval services provide a maker-checker pattern using `approval_signatures`; existing audit services persist company-scoped actions into `audit_logs`.

## Existing Banking/MFI surface

The current dashboard contains a `BankingMFIModule` with tabs for dashboard, accounts, members/KYC, loan portfolio, applications, teller, loan calculator, PAR/risk, and MIS reports. The module currently reads `bnk_accounts`, `bnk_loans`, `bnk_members`, `bnk_applications`, and `bnk_transactions` through `useCompanyTable`. The current module contains seeded fallback rows and several local-only or placeholder actions. It also calculates figures in the browser and previously generated synthetic application scores. These behaviors are not sufficient for a production-grade financial system and will be replaced or guarded by confirmed persistent procedures.

The deployed Supabase contract already includes `bank_accounts`, `bank_transactions`, `bnk_accounts`, `bnk_loans`, `bnk_members`, `bnk_applications`, `mfi_clients`, `mfi_loans`, `loan_repayments`, and `journal_entries`, but the existing audit does not establish that those legacy tables support all required banking invariants. Additive Bank & MFI tables should therefore be versioned separately, use explicit `company_id` ownership, and be safe to introduce without deleting or mutating legacy records.

## Required implementation boundary

The implementation will add a cohesive Bank & MFI domain layer with institution/branch setup, customer/KYC, accounts and products, financial transactions, ledger postings, cash operations, loan lifecycle, approvals, arrears, collections, reconciliation, AML/fraud events, audit events, notifications, and operational aggregates. Each critical mutation will be server-mediated through typed tRPC procedures, verify the authenticated Supabase profile, enforce the tenant boundary, require an idempotency key, and create an audit event. Money will be represented in integer minor units (TZS cents where configured) or exact decimal strings at the database boundary; no floating-point balance mutation will be used.

Database constraints and transactional SQL functions will be the source of truth for double-entry posting, available-balance checks, idempotency, and concurrency protection. The client will consume confirmed representations and will display `Insufficient confirmed data` when a metric has no confirmed rows rather than using seeds or random values.

## Integration contracts

The Bank & MFI module will interoperate with existing `companies`, `branches`, `profiles`, `audit_log`, `journal_entries`, `finance_expenses`, `notification_log`, `approval_signatures`, and existing dashboard navigation. The module will use the existing workspace `company_id` and current role string conventions. Tanzania configuration will default to TZS, Africa/Dar_es_Salaam display, NIDA/TIN identifiers, configurable fees and interest, and payment-channel metadata for mobile-money workflows without falsely claiming live provider connectivity.

Automated repayment accrual, standing orders, arrears aging, AML scans, and reconciliation reminders will be implemented as deterministic server jobs that are idempotent and replay-safe. External mobile-money or core-banking integrations will be represented as explicit pending/confirmed/failed states and provider reference fields until credentials and provider endpoints are configured.

## Validation requirements

The test plan must cover tenant isolation, role restrictions, maker-checker separation, idempotency replay, duplicate transaction rejection, insufficient funds, balanced journal entries, concurrent account mutation protection, loan schedule arithmetic, arrears/PAR classification, reconciliation differences, audit coverage, and end-to-end customer/KYC → account → transaction → loan → repayment → reconciliation flow. Existing project tests and the production build must remain green.

## Explicit non-goals

No legacy tables will be dropped. No existing dashboard routes will be replaced. No business figures will be fabricated. No provider credentials will be embedded in source. No production migration will be claimed as applied until it is actually run against the connected Supabase database and verified.
