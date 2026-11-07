# SMART MANAGER POS and VICOBA/SACCOS Zero-Downtime Migration Runbook

**Scope:** Deploy the normalized POS and VICOBA/SACCOS schema additively alongside the existing SMART MANAGER schema.
**Important count correction:** the previously listed objects enumerate **55 proposed tables**, not 54. The explicit table list is authoritative: 9 shared-finance/control tables, 11 POS tables, 32 cooperative tables, 2 provider tables, and 1 report-run table.
**No-downtime target:** existing modules remain available throughout; no table drop, rename, destructive rewrite, or direct cutover is required.
**Current status:** planning only. Do not apply these migrations until implementation is explicitly approved.

## 1. Zero-downtime invariants

The migration must follow an **expand → migrate → verify → cut over → contract** pattern. Existing generic POS tables, Community Groups tables, legacy VICOBA envelopes, Bank/MFI tables, and working routes continue serving current users while the new schema is introduced. New tables are initially dark: they are created, secured, and tested before any production workflow depends on them.

The deployment is not considered zero-downtime merely because PostgreSQL accepts DDL while the application is online. It is zero-downtime only if every deployed application version can operate against the schema currently available, every new write is idempotent, no request depends on an uncommitted migration, and a failed cutover can be disabled without deleting or mutating posted financial history.

| Invariant | Required behavior |
|---|---|
| Compatibility | Old application code can continue using existing tables and RPCs after every expand migration. |
| Tenant safety | Every new table has `company_id`; every parent-child relationship validates tenant equality; RLS is enabled before exposure. |
| Money safety | New monetary writes use server-side posting RPCs and balanced journal batches; no client balance update is accepted. |
| History safety | Posted, settled, reconciled, and audit rows are immutable; corrections are reversals or adjustments. |
| Rollback safety | Application flags can be turned off; database data is retained; financial recovery is performed by compensating postings, not deletes. |
| Operational safety | Migrations are small, observable, lock-time-bounded, and rehearsed against a production-like database before production. |

## 2. Preflight before the first production migration

### 2.1 Source and environment checks

First fetch the latest `origin/main`, inspect remote-only commits, and rebase any implementation branch before writing migrations. Confirm that the working tree changes contain only the intended migration and server/test work; prior UI/UX artifacts must not be staged accidentally. Record the exact production application SHA, Supabase project ref `rlhngsrihahhyxnjxrxm`, latest applied migration, and current feature-flag state.

Run the existing POS contract tests, Community Groups security tests, Bank/MFI tests, type-check, and production build on the branch that will be deployed. This establishes the baseline that must remain green after each application release.

### 2.2 Database readiness checks

Confirm that Supabase backups and point-in-time recovery are available, and capture a schema-only and row-count inventory for all existing POS, inventory, sales, finance, Bank/MFI, Community Groups, and legacy VICOBA tables. Record current counts and checksums for `pos_transactions`, `pos_transaction_items`, `pos_returns`, `pos_return_items`, `pos_shifts`, `pos_cash_movements`, `sales_payments`, `community_groups`, `community_group_members`, `community_group_savings`, `community_group_loans`, `vicoba_members`, `vicoba_loans`, and `vicoba_meetings`.

The preflight must also verify that `public.current_company_id()` and server-side profile resolution work for the production JWT path; that the planned capability functions do not trust a client-provided company ID; and that no existing migration is pending or partially applied.

### 2.3 Lock and load controls

Every migration session should set a bounded `lock_timeout` and `statement_timeout`, use a dedicated deployment connection, and abort rather than wait indefinitely behind an active POS or Bank/MFI transaction. New indexes on populated existing tables must use `CREATE INDEX CONCURRENTLY` in separate non-transactional steps. Foreign keys added to existing tables should be created `NOT VALID`, then validated separately after observing lock and query impact. Do not add a heavy default or rewrite to an existing large table during business hours.

## 3. Exact table migration order

The following names are the exact 55-table order. Each numbered migration creates only the tables in its row, plus their indexes, RLS policies, tenant-safe keys, and nonfinancial metadata triggers. Posting functions are deployed only after all tables they reference exist.

| Migration | Tables | Count | Why this order |
|---|---|---:|---|
| `20260824_050_fin_foundation.sql` | `fin_periods`, `fin_accounts`, `fin_idempotency_keys`, `fin_approval_requests` | 4 | No new business tables depend on these controls; they establish periods, chart of accounts, replay protection, and maker-checker records. |
| `20260824_051_fin_journal_core.sql` | `fin_journal_batches`, `fin_journal_lines`, `fin_posting_links` | 3 | Depends on periods/accounts and becomes the common target for all POS/cooperative posting. |
| `20260824_052_fin_reconciliation_core.sql` | `fin_reconciliation_batches`, `fin_reconciliation_items` | 2 | Depends conceptually on postings but has no hard table dependency beyond shared controls. |
| `20260824_053_pos_register_control.sql` | `pos_registers`, `pos_terminals`, `pos_shift_sessions`, `pos_shift_cash_movements`, `pos_sync_devices` | 5 | Establishes till ownership, terminal identity, shift cash, and device identity before sale records. |
| `20260824_054_pos_sales_returns.sql` | `pos_sale_headers`, `pos_sale_lines`, `pos_sale_tenders`, `pos_return_headers`, `pos_return_lines` | 5 | Depends on registers/shifts, inventory/CRM references, and journal links. |
| `20260824_055_pos_sync_queue.sql` | `pos_sync_queue` | 1 | Depends on sync devices and the normalized sale/return aggregates. |
| `20260824_056_coop_identity_governance.sql` | `coop_profiles`, `coop_branches`, `coop_groups`, `coop_members`, `coop_memberships`, `coop_kyc_documents`, `coop_meetings`, `coop_meeting_attendance`, `coop_resolutions`, `coop_resolution_votes`, `coop_tellers` | 11 | Establishes cooperative identity, tenant/group/member ownership, KYC, governance evidence, and teller ownership. |
| `20260824_057_coop_products_accounts.sql` | `coop_share_classes`, `coop_share_holdings`, `coop_products`, `coop_accounts`, `coop_contribution_plans`, `coop_contributions`, `coop_welfare_funds`, `coop_welfare_claims` | 8 | Depends on members, groups, products, accounts, approval requests, and the journal core. |
| `20260824_058_coop_lending.sql` | `coop_loan_products`, `coop_loan_applications`, `coop_loan_guarantors`, `coop_collateral`, `coop_loans`, `coop_loan_schedule_lines`, `coop_loan_repayments`, `coop_loan_restructures`, `coop_loan_writeoffs` | 9 | Depends on cooperative identity, products/accounts, approvals, and journal links. |
| `20260824_059_coop_dividend_cash.sql` | `coop_dividend_runs`, `coop_dividend_allocations`, `coop_cash_sessions`, `coop_cash_movements` | 4 | Depends on members/accounts, tellers, periods, reconciliation, and journal core. |
| `20260824_060_provider_integration.sql` | `integration_provider_transactions`, `integration_provider_events` | 2 | Depends on idempotency and reconciliation controls; it does not imply that any provider is connected or settled. |
| `20260824_061_report_runs.sql` | `report_runs` | 1 | Depends on the source tables and is safe to deploy before report UI activation. |
| **Total** | **All proposed tables** | **55** | The explicit table inventory is the migration source of truth. |

A migration may contain multiple `CREATE TABLE` statements in one transaction when all are new and small, but production rollout is safer when the rows above are separate deployable units. The application should not reference a later migration’s table before that migration is confirmed applied.

## 4. Expand phase: create schema without changing behavior

### Step 1 — Apply `050` through `052`

Apply the finance foundation, journal core, and reconciliation tables with RLS enabled in the same deployment unit as their policies. Create tenant-safe composite unique keys such as `UNIQUE(company_id, id)` on every parent used by composite foreign keys. Add immutable-history triggers in a later controlled migration only after table creation succeeds.

Seed only nonfinancial configuration that is explicitly approved, such as account-code templates or Tanzania defaults. Do not seed member balances, loan balances, provider settlement, or journal history from assumptions. If a chart of accounts is seeded, use a deterministic `(company_id, account_code)` upsert and record the seed version.

### Step 2 — Apply `053` through `055`

Create POS register, terminal, shift, cash movement, sale, return, and sync-device tables. Existing `pos_shifts`, `pos_cash_movements`, `pos_transactions`, `pos_transaction_items`, `pos_returns`, `pos_return_items`, `pos_transaction_commits`, `pos_return_commits`, and `pos_sync_events` remain untouched and continue serving the current client.

Create compatibility views or server adapters only after the new tables are present. Do not replace `complete_pos_sale`, `complete_pos_return`, or `record_pos_sync_event` in this step. First prove that the new tables can be written by an isolated test tenant and that RLS prevents access from another tenant.

### Step 3 — Apply `056` through `059`

Create cooperative identity/governance, products/accounts, lending, dividend, and cash tables. Existing Community Groups direct table behavior remains available. Do not convert old `community_group_savings`, `community_group_loans`, or `vicoba_*` rows into posted cooperative balances automatically. A legacy row can be mapped as a source reference, but a monetary balance must be reconstructed only from verifiable transaction evidence.

At the end of the expand phase, the application still reads and writes its existing paths. The new schema is present but not yet user-facing.

### Step 4 — Apply `060` and `061`

Create provider transaction/event and report-run tables. Provider rows represent intent and evidence, not settlement. The application must show `Pending`, `Failed`, or `Unknown` until a verified provider response exists. Report runs remain disabled until their queries are validated against controlled test data.

## 5. Deploy database controls and posting routines

After all 55 tables are present, deploy a separate routine migration, for example `20260824_062_financial_controls_and_rpcs.sql`. It should create or replace only the new functions and triggers, set `search_path TO public, pg_temp`, revoke public execution, and grant execution to `authenticated` as appropriate.

The routine deployment order is:

| Routine layer | Required functions or triggers | Dependency |
|---|---|---|
| Identity/capability | Current-company checks, POS capability checks, cooperative maker/checker/approve/disburse checks | Existing verified profile and role model |
| Validation | Tenant-safe relationship assertions, amount/total checks, product/period checks, state-transition checks | New tables and RLS |
| Posting primitive | Balanced batch creation, line insertion, posting-link insertion, period check, reversal guard | Journal tables and chart of accounts |
| POS posting | Open shift, post sale, post return, close shift, sync queue replay | POS tables, inventory, CRM, journal primitive |
| Cooperative posting | Register member, post account transaction, submit/decide/disburse loan, repayment, restructure, write-off, dividend calculation/posting | Cooperative tables, approvals, journal primitive |
| Integration/reconciliation | Provider event ingestion, reconciliation import, match, exception approval | Provider/reconciliation tables and approvals |
| Immutability | Block direct updates/deletes to posted source, journal, provider, reconciliation, and audit rows | All controlled tables |

The existing POS RPCs should remain callable during the transition. The safest compatibility implementation is to keep their signatures and response shape, then route new transactions through the normalized posting service internally while still writing the existing legacy compatibility rows required by the current UI. Do not change an existing function’s result shape in the same release as the database cutover.

## 6. Application release sequence

### Release A — Schema-aware but feature-off

Deploy server code that can detect whether migrations `050`–`062` are present, validates inputs, exposes read-only health checks, and contains feature flags without activating new writes. The server must continue to use `resolveVerifiedProfile(req)` and the existing Supabase JWT path. Add no UI entry point yet. This release proves that old code and new code can coexist.

Recommended flags are tenant-scoped and server-controlled:

```text
pos_normalized_reads = false
pos_normalized_writes = false
coop_normalized_reads = false
coop_normalized_writes = false
provider_callbacks = false
reconciliation_v2 = false
```

### Release B — Shadow reads and consistency checks

Enable normalized reads for internal operators only, without changing user-visible values. For POS, compare legacy and normalized transaction counts, totals, tender totals, stock movement references, and shift totals. For cooperative data, compare only records that were intentionally created by the new routines; do not compare inferred legacy balances as if they were authoritative.

Shadow checks must be read-only, bounded by company and date, and run outside the request path if the dataset is large. Any mismatch creates an observable diagnostic record or alert; it must not auto-correct money.

### Release C — POS canary write path

Select one internal test tenant or controlled register. Route new POS sales, returns, shift cash movements, and offline sync through the normalized routines. Continue writing the existing generic POS rows required for compatibility. The operation must commit the normalized source, legacy mirror, inventory movement, journal batch, posting links, receipt, audit, and idempotency result atomically.

The current `complete_pos_sale` and `complete_pos_return` signatures must continue working for old clients. New clients may call `pos_post_sale` and `pos_post_return`, but both paths must converge to the same server-side posting implementation so the system cannot create two accounting behaviors.

### Release D — POS tenant rollout

Expand normalized POS writes by tenant or register cohort, not by an uncontrolled global switch. Keep normalized reads behind a separate flag until a canary has passed at least one shift open, sale, split tender, customer credit sale, return, offline replay, shift close, and reconciliation cycle.

If a canary fails, turn off normalized POS writes and return to the existing compatible path. Retain any normalized rows already written; resolve their state through idempotent replay or an approved reversal. Do not delete them and do not re-use their idempotency keys for a different request.

### Release E — VICOBA/SACCOS master and governance rollout

Activate cooperative profile, branch, group, member, KYC, meeting, attendance, resolution, committee, and teller screens through the dedicated tRPC router. Existing Community Groups remains available. New member activation requires the server-side KYC/approval path; old generic group rows do not become active cooperative members merely because they exist.

### Release F — VICOBA/SACCOS financial canary

For one controlled cooperative group, activate share purchase, savings deposit/withdrawal, contribution, welfare approval/payment, loan application, approval, disbursement, repayment, arrears, dividend calculation, cash session, and statement workflows. Every money operation must produce a balanced journal batch and a receipt. Use a test provider or explicit `Pending` provider status; never simulate `Settled` in production.

### Release G — Reporting and reconciliation activation

Activate member statements, trial balance, POS shift reports, loan aging/PAR, dividend allocation reports, reconciliation work queues, and provider exception reports only after the underlying posting links and journal controls reconcile. Reports must read from normalized source and journal views, with legacy data clearly labeled where it remains a compatibility source.

## 7. Backfill and historical data strategy

Backfill is an online data operation, not part of the blocking DDL transaction. Use small batches ordered by stable primary key, for example 500–2,000 rows, with a resumable checkpoint. Each batch should use a short transaction and avoid locking the entire tenant. A worker may use `FOR UPDATE SKIP LOCKED` only on a dedicated backfill queue or source rows where that lock is safe; it must not lock active POS or teller rows for long periods.

Backfill only deterministic master data first: group-to-cooperative mapping, member identity, KYC document references, product metadata, register/terminal metadata, and source references. For financial history, choose one of three explicit outcomes:

| Historical record condition | Safe treatment |
|---|---|
| Complete source evidence and exact monetary components exist | Create a normalized imported source record with legacy references and a controlled journal import approved by Finance. |
| Source record exists but components or ownership are incomplete | Keep it in the legacy read model; create a review queue, not a guessed balance. |
| Data is only a static balance or mock/seed fallback | Do not import as a transaction or journal. Mark it as unavailable until evidence is supplied. |

Do not backfill by setting `coop_accounts.ledger_balance`, `available_balance`, `coop_loans.outstanding_principal`, or any other projection directly. Projections are recalculated by a server routine from posted evidence. Any imported opening balance must be an approved opening journal in an open period, with a source reference and audit record.

## 8. Cutover gates

A cohort can move from compatibility writes to normalized writes only when all gates below pass:

| Gate | Pass condition |
|---|---|
| Schema | All migrations through `062` are applied; RLS is enabled; no invalid tenant-safe FK remains. |
| Code | Type-check, focused tests, full tests, and production build pass. |
| Security | Cross-tenant read/write, direct posted-row mutation, maker-self-approval, and provider-forged-settlement tests fail as intended. |
| Accounting | Trial balance balances; every new source has one posting link; journal totals equal source totals. |
| POS | Sale/return/tender/stock/shift/offline replay and close workflows agree with legacy compatibility results. |
| Cooperative | Membership, account, loan, repayment, dividend, cash, and statement workflows pass against controlled fixtures. |
| Reconciliation | Duplicate, unmatched, failed, pending, and exception records remain visible and do not alter balances without approval. |
| Operations | Error rate, lock waits, query latency, queue depth, and provider callback health remain within agreed thresholds for the observation window. |
| Business approval | Finance/cooperative owner signs off the canary and the rollback decision owner is identified. |

## 9. Rollback and failure handling

### Before normalized writes

If an expand migration fails before new tables contain business data, stop the rollout, diagnose the migration, and fix forward or revert the isolated migration in the test environment. In production, do not drop shared objects casually; if a new table is unused and a reviewed rollback is safe, it must be performed as a separate approved change.

### After normalized writes begin

Rollback means disabling the feature flag and routing new requests to the compatibility implementation, not deleting normalized rows. Already-posted normalized records remain authoritative evidence. If a routine defect created a valid but unwanted posting, reverse it through a new approved reversal transaction. If a request is ambiguous, leave it `Needs Attention` and reconcile it; never blindly replay with a new key.

### During provider uncertainty

If the provider response is delayed or unavailable, leave the provider transaction `Pending` or `Unknown`. Do not roll back a database transaction in a way that permits a later provider callback to create a duplicate. Callback ingestion remains idempotent by `(company_id, provider, provider_event_id)` and must reconcile against the original client reference.

### During application rollback

An older application binary must remain able to read legacy tables and tolerate the presence of new tables. Do not deploy an older binary that assumes a removed column or changed RPC response. This is why the compatibility wrapper is retained until the contract phase is explicitly approved.

## 10. Contract phase after stable operation

Only after at least one agreed reporting period of stable normalized operation should the team consider stopping compatibility mirrors for new POS transactions. First freeze the legacy write path behind the server, then observe that all active clients have upgraded. Keep legacy reads and historical data available.

The contract phase should be separate from the expand/cutover deployment. It may remove obsolete compatibility writes, but it should not drop existing tables, delete old records, or rewrite financial history. Any eventual deprecation must have a data-retention decision, export, reconciliation sign-off, and a separately reviewed migration.

## 11. Recommended deployment checklist

1. Fetch and rebase the latest main branch; record the source SHA and production SHA.
2. Confirm backups, point-in-time recovery, migration history, RLS helpers, and current tenant/profile resolution.
3. Run baseline POS, Community Groups, Bank/MFI, type-check, full-test, and build suites.
4. Apply `050`–`052`; verify RLS, ownership, idempotency, approval, journal, and reconciliation tables.
5. Apply `053`–`055`; verify POS control tables and compatibility with existing POS tables/RPCs.
6. Validate offline queue constraints after `055`; then apply `056`–`059` for cooperative identity, products, lending, dividends, and cash.
7. Apply `060`–`061`; verify provider event deduplication and report-run storage.
8. Apply `062` for capability helpers, posting primitives, RPCs, and immutable-history controls.
9. Deploy Release A with all feature flags off.
10. Run shadow reads and tenant-scoped consistency checks.
11. Canary normalized POS writes, then expand by register/tenant cohort.
12. Canary cooperative master and governance workflows, then cooperative financial workflows.
13. Activate reports and reconciliation only after accounting and source-link checks pass.
14. Monitor, document exceptions, and obtain business sign-off.
15. Keep compatibility reads and rollback flags; defer contract/deprecation to a later approved release.

## 12. Final warning

The earlier blueprint was described as 54 tables, but its explicit list contains 55. The deployment plan above corrects that arithmetic before implementation. The table list, not the earlier total, must be used to generate migration files, tests, schema contracts, and release checklists.
