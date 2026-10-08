# SMART MANAGER POS and VICOBA/SACCOS Database Schema Blueprint

**Author:** Manus AI
**Status:** Design blueprint only; no migration was applied and no application source was changed.
**Workspace:** `EzraMpapi/SMARTMANAGER-MANUS`
**Reference date:** 23 August 2026 (Africa/Dar_es_Salaam context; timestamps remain UTC in storage).

## 1. Purpose and design decision

This document converts the 18 critical workflow diagrams into a database contract for the existing SMART MANAGER application. It is deliberately **additive**: it preserves the existing React/Vite dashboard, Express/tRPC server, Supabase/PostgreSQL tenancy model, POS tables, Bank/MFI tables, Community Groups tables, and existing module routes. It does not claim that a production VICOBA/SACCOS financial subsystem is already implemented.

The implementation target is a relational transaction core with server-side posting procedures. Client screens may collect intent, but they must not assign balances, approve their own requests, settle a provider, or write posted financial history directly. Every monetary operation must create an immutable source record, a balanced journal batch, an audit event, and an idempotency result in one PostgreSQL transaction.

The design uses `numeric(20,2)` for TZS amounts, UTC `timestamptz` for event timestamps, `date` for business dates, UUID primary keys, and `company_id` as a first-class tenant key. Tanzania defaults are `currency = 'TZS'`, `timezone = 'Africa/Dar_es_Salaam'`, `country = 'Tanzania'`, `id_type = 'NIDA'`; all are configurable at the cooperative or company level. The API should exchange monetary values as decimal strings, not JavaScript floating-point numbers.

## 2. Evidence inventory and workflow coverage

The workflow sources are the 18 Mermaid definitions exported to the repository trace file.[1] The POS transaction engine, return engine, credit wrapper, and sync event migration were read directly.[2] [3] [4] [5] The Community Groups schema, contract repair, and relationship/security guards were also reviewed.[6] [7] [8] The live Supabase catalog confirms that the deployed system contains generic POS envelopes, legacy `vicoba_members`, `vicoba_loans`, and `vicoba_meetings`, and the Community Groups family, but not a normalized cooperative accounting core.[9]

| Diagram | Current business meaning | Required persistence implication |
|---|---|---|
| 01 Login / onboarding | Identity, company selection, entitled workspace | Resolve `auth.uid()` to a server-verified `profiles.company_id`; never accept tenant identity from the browser. |
| 02 Customer creation | Identity validation and duplicate risk | Reuse `crm_contacts`; add normalized KYC/duplicate references only where POS credit requires them. |
| 03 Sales to receipt | Quotation/order, stock/tax/terms, payment, fiscal evidence | Preserve existing Sales tables; POS source records must link to inventory movement, tender, receipt/fiscal evidence, journal batch, and audit. |
| 04 Procurement | Requisition, approval, receiving, payable evidence | POS inventory valuation must reference existing inventory and procurement, not create a second stock universe. |
| 05 Inventory movement | Source/destination, quantity validation, posting | Lock stock rows and create immutable movement records; never accept a client-computed post-movement balance. |
| 06 POS transaction | Open till, scan, validate, confirm, receipt, shift/ledger update | Add register/terminal/shift ownership, normalized sale header/lines/tenders, posting links, and reconciliation. |
| 07 Loan lifecycle | Member/borrower, application, score, guarantors/collateral, approval, disbursement, schedule, arrears | Add cooperative loan application, approval, disbursement, schedule, repayment, arrears, restructuring, and write-off tables with maker-checker controls. |
| 08 Payment reconciliation | Import/record, idempotency, match, exception approval, reconciled balance | Add provider events, reconciliation batches/items, matching status, exception decisions, and journal linkage. |
| 09 Employee onboarding | Employee identity, contract, role, notification | No new POS/VICOBA table is required; roles/capabilities are consumed from the existing profile/RBAC boundary. |
| 10 Healthcare | Patient encounter, consent, orders, billing | No new POS/VICOBA table; generic accounting integration must remain reusable. |
| 11 School admission | Application, validation, approval, fee plan | No new POS/VICOBA table; finance posting contract must not be module-specific. |
| 12 Hotel reservation | Reservation, deposit, folio, settlement | Restaurant/hospitality POS can use the same sale/tender/journal contract with source-module references. |
| 13 Restaurant order | Table, order, kitchen, bill, stock | Add optional POS service/order references; kitchen status is operational, while billing is posted through the POS sale. |
| 14 Fleet trip | Assignment, compliance, dispatch, fuel/odometer/POD, reconciliation | No POS/VICOBA master table; expenses and settlement must use the shared posting/reconciliation bridge. |
| 15 Property rental | Lease, billing, rent receipt, statement | No POS/VICOBA master table; receipt and ledger evidence use the same shared financial contract. |
| 16 Money agent transaction | KYC, limits, idempotency, maker-checker, provider pending/settled state | Link POS/cooperative cash and mobile-money channels to provider transaction and reconciliation records; never fabricate settlement. |
| 17 VICOBA/SACCOS transaction | Meeting/member context, share/savings/contribution, decision, cooperative ledger | Require membership validity, meeting/resolution where applicable, server-side validation, balanced posting, receipt, member statement, and audit. |
| 18 Reports/settings | Permission/value validation, persistence, audit, generated report | Store versioned module configuration and report runs; report queries read journal/subledger views, not editable balance fields. |

## 3. Existing schema: preserve, reuse, and contain

### 3.1 Existing POS objects

The deployed POS core is intentionally retained for compatibility. `complete_pos_sale(...)` validates the authenticated tenant, locks a company/idempotency key, locks inventory rows, writes `pos_transactions`, `pos_transaction_items`, `inventory_stock_movements`, `sales_payments`, `audit_log`, and `pos_transaction_commits`.[2] The return routine similarly locks the original completed sale and inventory, validates unreturned quantity and refund total, writes `pos_returns`, `pos_return_items`, stock-in, refund payment, audit, and `pos_return_commits`.[3] Customer credit is an overloaded wrapper around the sale routine and verifies that a selected customer exists in tenant-scoped `crm_contacts`.[4] Offline sync currently records a tenant-scoped `pos_sync_events` row keyed by idempotency key.[5]

| Existing object | Status | Compatibility rule |
|---|---|---|
| `pos_shifts` | Existing generic envelope; used by the cashier UI | Keep reads and existing inserts working. New shift routines should write a normalized shift row and optionally mirror a compatibility payload until cutover. |
| `pos_cash_movements` | Existing generic envelope | Preserve as a legacy read surface; new cash movement posting must also create a normalized journal-linked movement. |
| `pos_transactions` | Existing generic envelope; current sale header | Do not delete or rewrite history. Add a source link from a normalized sale header to this row, or dual-write only inside a server procedure. |
| `pos_transaction_items` | Existing generic envelope; item details are in `data` | Preserve for historical records. New sale lines are typed and authoritative for new postings. |
| `pos_returns`, `pos_return_items` | Existing generic envelopes | Preserve and link new return headers/lines to the original sale and existing return where present. |
| `pos_transaction_commits` | Existing idempotency boundary | Keep unique `(company_id, idempotency_key)` and use it as a compatibility replay boundary during migration. |
| `pos_return_commits` | Existing return idempotency boundary | Keep unique `(company_id, idempotency_key)`; new return routine must remain replay-safe. |
| `pos_sync_events` | Existing sync outcome log | Preserve `synced` and `needs_attention`; add device/queue/reconciliation detail in additive tables. |
| `inventory_items`, `inventory_stock_movements`, `sales_payments` | Existing shared ERP envelopes | Continue to update through server-side routines; do not let normalized POS or VICOBA code create a parallel inventory balance or payment universe. |
| `crm_contacts` | Existing customer master | POS customer credit must reference the tenant-owned contact; a future cooperative member may have a linked contact, not a duplicate customer identity. |

The principal gap is not that these tables are absent; it is that many business fields are stored in `data jsonb`, balances are exposed as generic numeric fields, and POS posting does not yet produce a canonical shared double-entry batch. The target layer therefore adds typed records and posting links rather than silently replacing these tables.

### 3.2 Existing Community Groups and legacy VICOBA objects

`community_groups` and its related family already provides persistent group, member, committee, meeting, attendance, contribution, savings, welfare, loan, guarantor, repayment, penalty, voting, approvals, documents, notifications, and audit envelopes with tenant RLS.[6] The hardening migration adds role gates, relationship assertions, creator stamping, sensitive update protection, and append-only audit behavior.[7] The contract migration mainly repairs timestamp columns and triggers.[8]

The live catalog also contains generic `vicoba_members`, `vicoba_loans`, and `vicoba_meetings` rows. They are legacy envelopes with `id`, `company_id`, `name`, `status`, `amount`, `notes`, `data`, `created_at`, and `updated_at`; they do not form a normalized member-account, share, schedule, journal, dividend, reconciliation, or provider-settlement model.[9] They must remain readable during transition, but they are not the target of new production postings.

| Capability | Existing foundation | Missing for production VICOBA/SACCOS |
|---|---|---|
| Cooperative registration and branches | Company plus `community_groups` location fields | A cooperative profile, registration/licence fields, branch/teller ownership, and configurable accounting/product rules. |
| Groups and members | `community_groups`, `community_group_members`, committees | A canonical cooperative member identity, membership lifecycle, member-number uniqueness, KYC documents, account ownership, and cross-group rules. |
| Shares and share capital | Community `savings` can carry generic transactions | Share classes, holdings, issuance/redemption controls, share limits, effective dates, and capital journal mapping. |
| Savings and deposits | Community `savings` envelope | Product/account master, available/ledger balance derived from postings, withdrawal limits, holds, receipts, reversals, and statements. |
| Contributions and welfare | Contributions and welfare claims exist | Contribution plans, due periods, arrears/waivers, dedicated welfare funds, approvals, and journalized disbursement. |
| Meetings and governance | Meetings, attendance, votes, committees, approvals exist | Resolutions that can be referenced by financial transactions, quorum/decision evidence, immutable vote results, and separation of proposer/approver. |
| Loans | Community loan, guarantor, repayment, penalty envelopes exist | Product versioning, application snapshots, credit decision, multi-step approval, controlled disbursement, schedule lines, allocation, arrears, restructure, write-off, and balance derived from journal/subledger. |
| Cash, tellers, agents | Existing Bank/MFI cash/agent structures can be integrated | Cooperative-owned cash sessions, till assignment, cash count, settlement references, and cross-module reconciliation. |
| Accounting and reporting | Bank/MFI journal structures and generic ERP finance tables exist | One explicit posting contract, balanced journal enforcement, source links, reversal policy, period close, and member-level statement views. |

## 4. Cross-cutting schema contract

Every new table below uses the following mandatory ownership/audit block unless a table is explicitly marked immutable or append-only:

```sql
id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
company_id  uuid        NOT NULL DEFAULT public.current_company_id()
                        REFERENCES public.companies(id) ON DELETE RESTRICT,
created_by  uuid        NOT NULL DEFAULT auth.uid()
                        REFERENCES auth.users(id) ON DELETE RESTRICT,
created_at  timestamptz NOT NULL DEFAULT now(),
updated_by  uuid        REFERENCES auth.users(id) ON DELETE RESTRICT,
updated_at  timestamptz NOT NULL DEFAULT now(),
version     bigint      NOT NULL DEFAULT 0 CHECK (version >= 0),
metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb
```

For every parent/child relation, add a unique `(company_id, id)` key on the parent and a **composite tenant-safe foreign key** `(company_id, parent_id) REFERENCES parent(company_id, id)`. A plain foreign key on an ID is not sufficient protection against accidental cross-tenant references. Business identifiers such as receipt numbers, loan numbers, member numbers, account numbers, batch numbers, and device keys are unique within `company_id`, never globally.

All financial source and posting tables are append-only after `Posted` or `Settled`. Corrections are new reversal or adjustment transactions. No client update can set `balance`, `outstanding_principal`, `status = 'Approved'`, `status = 'Disbursed'`, `provider_status = 'Settled'`, or `journal_batch_id`.

## 5. Shared financial and control schema

This is the canonical posting layer for new POS and VICOBA/SACCOS transactions. Existing Bank/MFI routines remain intact; adapters may link existing bank journal rows to this layer during an incremental migration rather than rewriting them.

### 5.1 `fin_periods`

`id uuid PK`; common block; `period_start date NOT NULL`; `period_end date NOT NULL`; `status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Soft Closed','Closed'))`; `timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam'`; `closed_by uuid NULL`; `closed_at timestamptz NULL`; `UNIQUE(company_id, period_start, period_end)`; check `period_start <= period_end`; index `(company_id, period_start, period_end, status)`. A posted batch must fall in an open period; closing is maker-checker controlled.

### 5.2 `fin_accounts`

`id uuid PK`; common block; `account_code text NOT NULL`; `account_name text NOT NULL`; `account_type text NOT NULL CHECK (account_type IN ('Asset','Liability','Equity','Income','Expense','Contra Asset','Contra Liability'))`; `normal_side text NOT NULL CHECK (normal_side IN ('Debit','Credit'))`; `parent_id uuid NULL`; `is_postable boolean NOT NULL DEFAULT true`; `is_cash boolean NOT NULL DEFAULT false`; `currency text NOT NULL DEFAULT 'TZS'`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive'))`; `UNIQUE(company_id, account_code)`; self-parent check; indexes on `(company_id, account_type, status)` and `(company_id, parent_id)`.

### 5.3 `fin_journal_batches`

`id uuid PK`; common block; `batch_number text NOT NULL`; `source_module text NOT NULL CHECK (source_module IN ('POS','VICOBA','SACCOS','BANK_MFI','MONEY_AGENT','SALES','INVENTORY','PROCUREMENT','PROPERTY','HOSPITALITY','FLEET','MANUAL'))`; `source_type text NOT NULL`; `source_id uuid NULL`; `business_date date NOT NULL`; `currency text NOT NULL DEFAULT 'TZS'`; `status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Pending Approval','Posted','Reversed','Rejected'))`; `debit_total numeric(20,2) NOT NULL DEFAULT 0`; `credit_total numeric(20,2) NOT NULL DEFAULT 0`; `posted_at timestamptz NULL`; `posted_by uuid NULL`; `reversal_of_batch_id uuid NULL`; `narration text NOT NULL`; `UNIQUE(company_id, batch_number)`; check totals are non-negative and `status <> 'Posted' OR debit_total = credit_total`; indexes on `(company_id, business_date, status)`, `(company_id, source_module, source_type, source_id)`.

### 5.4 `fin_journal_lines`

`id uuid PK`; common block; `journal_batch_id uuid NOT NULL`; `line_no integer NOT NULL CHECK (line_no > 0)`; `business_date date NOT NULL`; `account_id uuid NOT NULL`; `debit numeric(20,2) NOT NULL DEFAULT 0 CHECK (debit >= 0)`; `credit numeric(20,2) NOT NULL DEFAULT 0 CHECK (credit >= 0)`; `currency text NOT NULL DEFAULT 'TZS'`; `branch_id uuid NULL`; `member_id uuid NULL`; `customer_id uuid NULL`; `description text`; `UNIQUE(company_id, journal_batch_id, line_no)`; check exactly one side is positive (`(debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)`); indexes on `(company_id, account_id, business_date)`, `(company_id, member_id, business_date)`, and `(company_id, branch_id, business_date)`. A trigger or posting procedure copies `business_date` from the parent batch and rejects a mismatch. The posting routine verifies sum of lines rather than trusting batch totals.

### 5.5 `fin_posting_links`

`id uuid PK`; common block; `journal_batch_id uuid NOT NULL`; `source_table text NOT NULL`; `source_id uuid NOT NULL`; `link_role text NOT NULL CHECK (link_role IN ('Primary','Inventory','Tender','Receivable','Payable','Member Account','Loan','Cash','Provider','Reversal'))`; `UNIQUE(company_id, source_table, source_id, link_role)`; indexes on `(company_id, source_table, source_id)` and `(company_id, journal_batch_id)`.

### 5.6 `fin_approval_requests`

`id uuid PK`; common block; `entity_type text NOT NULL`; `entity_id uuid NOT NULL`; `action text NOT NULL`; `requested_by uuid NOT NULL`; `status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Returned','Cancelled'))`; `required_approvals smallint NOT NULL DEFAULT 1 CHECK (required_approvals > 0)`; `decided_by uuid NULL`; `decided_at timestamptz NULL`; `decision_note text NULL`; `maker_checker_key text NOT NULL`; `UNIQUE(company_id, entity_type, entity_id, action, maker_checker_key)`; check `decided_by <> requested_by` when approved. Approval signatures can be stored in the existing approval-signature family or an additive child table if multiple signatures are required.

### 5.7 `fin_idempotency_keys`

`id uuid PK`; common block; `scope text NOT NULL`; `idempotency_key text NOT NULL`; `request_hash text NOT NULL`; `response jsonb NULL`; `status text NOT NULL DEFAULT 'Started' CHECK (status IN ('Started','Succeeded','Failed'))`; `expires_at timestamptz NULL`; `UNIQUE(company_id, scope, idempotency_key)`; index `(company_id, scope, created_at DESC)`. Replays with a different request hash must fail with conflict rather than return the original response.

### 5.8 Reconciliation tables

`fin_reconciliation_batches`: `id uuid PK`; common block; `account_scope text NOT NULL`; `external_source text NOT NULL`; `statement_date date NOT NULL`; `opening_balance numeric(20,2) NOT NULL`; `closing_balance numeric(20,2) NOT NULL`; `status text NOT NULL DEFAULT 'Imported' CHECK (status IN ('Imported','Matching','Exception','Approved','Closed','Cancelled'))`; `file_reference text NULL`; `import_hash text NULL`; `created_by` and `approved_by`; `UNIQUE(company_id, external_source, import_hash)` when hash is not null; indexes by company/date/status.

`fin_reconciliation_items`: `id uuid PK`; common block; `batch_id uuid NOT NULL`; `external_reference text NOT NULL`; `external_date timestamptz NOT NULL`; `amount numeric(20,2) NOT NULL CHECK (amount <> 0)`; `direction text NOT NULL CHECK (direction IN ('Credit','Debit'))`; `provider text NULL`; `provider_status text NULL`; `matched_source_table text NULL`; `matched_source_id uuid NULL`; `match_status text NOT NULL DEFAULT 'Unmatched' CHECK (match_status IN ('Unmatched','Matched','Duplicate','Exception','Approved'))`; `exception_reason text NULL`; `resolved_by uuid NULL`; `resolved_at timestamptz NULL`; `UNIQUE(company_id, batch_id, external_reference)`; index `(company_id, match_status, external_date)`.

## 6. Additive POS schema

The normalized POS layer is authoritative for new transactions. Existing generic tables remain compatibility/history surfaces until a later, separately approved cutover.

### 6.1 Master and till control tables

`pos_registers`: common block; `register_code text NOT NULL`; `name text NOT NULL`; `branch_id uuid NULL`; `warehouse_id uuid NULL`; `default_currency text NOT NULL DEFAULT 'TZS'`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive'))`; `UNIQUE(company_id, register_code)`; indexes by company/status and branch.

`pos_terminals`: common block; `register_id uuid NOT NULL`; `device_key text NOT NULL`; `device_label text NOT NULL`; `app_version text NULL`; `last_seen_at timestamptz NULL`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Pending','Active','Suspended','Retired'))`; `UNIQUE(company_id, device_key)`; index `(company_id, register_id, status)`; no printer secrets or provider credentials.

`pos_shift_sessions`: common block; `register_id uuid NOT NULL`; `terminal_id uuid NULL`; `cashier_id uuid NOT NULL`; `opened_at timestamptz NOT NULL DEFAULT now()`; `business_date date NOT NULL`; `opening_float numeric(20,2) NOT NULL CHECK (opening_float >= 0)`; `expected_cash numeric(20,2) NOT NULL DEFAULT 0`; `counted_cash numeric(20,2) NULL`; `variance numeric(20,2) NULL`; `status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Pending Close','Closed','Exception','Cancelled'))`; `closed_at timestamptz NULL`; `closed_by uuid NULL`; `UNIQUE(company_id, register_id) WHERE status = 'Open'`; index `(company_id, business_date, status)` and `(company_id, cashier_id, opened_at DESC)`. This enforces one open drawer per register.

`pos_shift_cash_movements`: common block; `shift_id uuid NOT NULL`; `movement_type text NOT NULL CHECK (movement_type IN ('Opening Float','Cash In','Cash Out','Paid Out','Cash Drop','Closing Count','Adjustment'))`; `amount numeric(20,2) NOT NULL CHECK (amount > 0)`; `reference text NULL`; `approval_request_id uuid NULL`; `journal_batch_id uuid NULL`; `status text NOT NULL DEFAULT 'Posted' CHECK (status IN ('Pending Approval','Posted','Reversed'))`; `occurred_at timestamptz NOT NULL DEFAULT now()`; index `(company_id, shift_id, occurred_at)`.

### 6.2 Sale, tender, return, and sync tables

`pos_sale_headers`: common block; `sale_number text NOT NULL`; `register_id uuid NOT NULL`; `shift_id uuid NOT NULL`; `terminal_id uuid NULL`; `customer_id uuid NULL`; `sale_channel text NOT NULL DEFAULT 'Counter' CHECK (sale_channel IN ('Counter','Restaurant','Hotel','Ecommerce','Service'))`; `business_date date NOT NULL`; `currency text NOT NULL DEFAULT 'TZS'`; `subtotal numeric(20,2) NOT NULL CHECK (subtotal >= 0)`; `discount_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0)`; `tax_total numeric(20,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0)`; `total numeric(20,2) NOT NULL CHECK (total >= 0)`; `status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Validated','Pending Approval','Posted','Voided','Reversed'))`; `receipt_number text NULL`; `journal_batch_id uuid NULL`; `legacy_pos_transaction_id uuid NULL`; `idempotency_key text NOT NULL`; `UNIQUE(company_id, sale_number)`, `UNIQUE(company_id, idempotency_key)`, optional unique receipt; checks `total = subtotal - discount_total + tax_total` within exact numeric equality after server rounding; indexes by company/business date/status, customer/date, shift/status.

`pos_sale_lines`: common block; `sale_id uuid NOT NULL`; `line_no integer NOT NULL CHECK (line_no > 0)`; `inventory_item_id uuid NOT NULL`; `sku text NOT NULL`; `description text NOT NULL`; `quantity numeric(20,3) NOT NULL CHECK (quantity > 0)`; `unit_price numeric(20,2) NOT NULL CHECK (unit_price >= 0)`; `discount_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0)`; `tax_rate numeric(9,6) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 1)`; `tax_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0)`; `line_total numeric(20,2) NOT NULL CHECK (line_total >= 0)`; `cost_amount numeric(20,2) NULL`; `UNIQUE(company_id, sale_id, line_no)`; index `(company_id, inventory_item_id, created_at)`.

`pos_sale_tenders`: common block; `sale_id uuid NOT NULL`; `tender_no smallint NOT NULL`; `method text NOT NULL CHECK (method IN ('Cash','Card','Mobile Money','Bank Transfer','Customer Credit','Voucher','Other'))`; `requested_amount numeric(20,2) NOT NULL CHECK (requested_amount > 0)`; `settled_amount numeric(20,2) NULL`; `currency text NOT NULL DEFAULT 'TZS'`; `provider text NULL`; `provider_transaction_id text NULL`; `status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Authorized','Settled','Failed','Reversed','Needs Attention'))`; `change_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (change_amount >= 0)`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, sale_id, tender_no)`; partial unique provider reference where non-null; index by provider/status/date.

`pos_return_headers`: common block; `return_number text NOT NULL`; `original_sale_id uuid NOT NULL`; `shift_id uuid NULL`; `reason text NOT NULL`; `refund_total numeric(20,2) NOT NULL CHECK (refund_total > 0)`; `refund_method text NOT NULL`; `status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Pending Approval','Posted','Rejected','Reversed'))`; `journal_batch_id uuid NULL`; `idempotency_key text NOT NULL`; `UNIQUE(company_id, return_number)`, `UNIQUE(company_id, idempotency_key)`; index by original sale/status.

`pos_return_lines`: common block; `return_id uuid NOT NULL`; `sale_line_id uuid NOT NULL`; `quantity numeric(20,3) NOT NULL CHECK (quantity > 0)`; `unit_price numeric(20,2) NOT NULL CHECK (unit_price >= 0)`; `tax_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0)`; `line_total numeric(20,2) NOT NULL CHECK (line_total > 0)`; `UNIQUE(company_id, return_id, sale_line_id)`; server routine locks original sale lines and computes unreturned quantity.

`pos_sync_devices`: common block; `device_key text NOT NULL`; `terminal_id uuid NULL`; `last_sequence bigint NOT NULL DEFAULT 0`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Pending','Active','Suspended','Retired'))`; `UNIQUE(company_id, device_key)`.

`pos_sync_queue`: common block; `device_id uuid NOT NULL`; `client_sequence bigint NOT NULL CHECK (client_sequence > 0)`; `operation_type text NOT NULL CHECK (operation_type IN ('Sale','Return','Cash Movement','Shift Close'))`; `idempotency_key text NOT NULL`; `request_hash text NOT NULL`; `payload jsonb NOT NULL`; `status text NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued','Processing','Synced','Needs Attention','Rejected'))`; `server_entity_id uuid NULL`; `error_code text NULL`; `error_message text NULL`; `received_at timestamptz NOT NULL DEFAULT now()`; `processed_at timestamptz NULL`; `UNIQUE(company_id, device_id, client_sequence)`, `UNIQUE(company_id, operation_type, idempotency_key)`; index `(company_id, device_id, status, client_sequence)`.

## 7. Additive VICOBA/SACCOS schema

The target cooperative model treats `community_groups` as a legacy/group-operations foundation and introduces a canonical `coop_*` financial identity. A controlled mapping table can connect an existing community group to a cooperative group without copying member balances.

### 7.1 Institution, branches, groups, membership, and KYC

`coop_profiles`: one row per company/cooperative; common block; `legal_name text NOT NULL`; `trading_name text NULL`; `cooperative_type text NOT NULL CHECK (cooperative_type IN ('VICOBA','SACCOS','Chama','MFI Group'))`; `registration_number text NULL`; `tin text NULL`; `regulator_reference text NULL`; `country text NOT NULL DEFAULT 'Tanzania'`; `timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam'`; `default_currency text NOT NULL DEFAULT 'TZS'`; `fiscal_year_start_month smallint NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12)`; `status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Active','Suspended','Closed'))`; `UNIQUE(company_id)`.

`coop_branches`: common block; `branch_code text NOT NULL`; `name text NOT NULL`; `region text NULL`; `district text NULL`; `ward text NULL`; `village text NULL`; `address text NULL`; `phone text NULL`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive'))`; `UNIQUE(company_id, branch_code)`; index company/status.

`coop_groups`: common block; `branch_id uuid NULL`; `legacy_community_group_id uuid NULL`; `group_number text NOT NULL`; `name text NOT NULL`; `group_type text NOT NULL CHECK (group_type IN ('VICOBA','SACCOS Group','Chama','Solidarity Group'))`; `registration_number text NULL`; `meeting_frequency text NOT NULL DEFAULT 'Monthly'`; `contribution_frequency text NOT NULL DEFAULT 'Monthly'`; `default_contribution_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (default_contribution_amount >= 0)`; `currency text NOT NULL DEFAULT 'TZS'`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft','Active','Suspended','Closed'))`; `UNIQUE(company_id, group_number)`; index by branch/status.

`coop_members`: common block; `member_number text NOT NULL`; `contact_id uuid NULL`; `full_name text NOT NULL`; `phone text NULL`; `email text NULL`; `national_id text NULL`; `id_type text NOT NULL DEFAULT 'NIDA'`; `gender text NULL`; `date_of_birth date NULL`; `address text NULL`; `occupation text NULL`; `next_of_kin text NULL`; `next_of_kin_phone text NULL`; `kyc_status text NOT NULL DEFAULT 'Pending' CHECK (kyc_status IN ('Pending','Verified','Rejected','Expired'))`; `member_status text NOT NULL DEFAULT 'Pending' CHECK (member_status IN ('Pending','Active','Suspended','Exited','Deceased'))`; `joined_on date NOT NULL DEFAULT current_date`; `exited_on date NULL`; `UNIQUE(company_id, member_number)`; partial unique `(company_id, national_id)` where national_id is not null; indexes on phone/status and normalized name.

`coop_memberships`: common block; `member_id uuid NOT NULL`; `group_id uuid NOT NULL`; `branch_id uuid NULL`; `membership_number text NOT NULL`; `role text NOT NULL DEFAULT 'Member'`; `joined_on date NOT NULL`; `left_on date NULL`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Pending','Active','Suspended','Exited'))`; `UNIQUE(company_id, membership_number)`; partial unique active membership `(company_id, member_id, group_id)`; checks left date is not before joined date; index group/status and member/status.

`coop_kyc_documents`: common block; `member_id uuid NOT NULL`; `document_type text NOT NULL CHECK (document_type IN ('NIDA','TIN','Passport','Driver Licence','Proof of Address','Photo','Other'))`; `document_number text NULL`; `file_key text NULL`; `file_url text NULL`; `issued_on date NULL`; `expires_on date NULL`; `verification_status text NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Pending','Verified','Rejected','Expired'))`; `verified_by uuid NULL`; `verified_at timestamptz NULL`; `UNIQUE(company_id, member_id, document_type, document_number)`; store object references only, never raw document bytes in PostgreSQL.

### 7.2 Shares, savings, contributions, and welfare

`coop_share_classes`: common block; `code text NOT NULL`; `name text NOT NULL`; `nominal_value numeric(20,2) NOT NULL CHECK (nominal_value > 0)`; `minimum_shares integer NOT NULL DEFAULT 1 CHECK (minimum_shares > 0)`; `maximum_shares integer NULL`; `transferable boolean NOT NULL DEFAULT false`; `redeemable boolean NOT NULL DEFAULT true`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive'))`; `UNIQUE(company_id, code)`; check max >= min when set.

`coop_share_holdings`: common block; `member_id uuid NOT NULL`; `share_class_id uuid NOT NULL`; `quantity integer NOT NULL CHECK (quantity > 0)`; `unit_value numeric(20,2) NOT NULL CHECK (unit_value > 0)`; `acquired_on date NOT NULL`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Pending','Active','Redeemed','Transferred'))`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, member_id, share_class_id, acquired_on, id)`; index member/class/status. Redemptions are new rows or reversal-linked transactions; quantities are not overwritten on posted history.

`coop_products`: common block; `product_code text NOT NULL`; `product_type text NOT NULL CHECK (product_type IN ('Savings','Share Capital','Welfare','Contribution','Loan'))`; `name text NOT NULL`; `currency text NOT NULL DEFAULT 'TZS'`; `minimum_opening_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (minimum_opening_amount >= 0)`; `minimum_balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (minimum_balance >= 0)`; `withdrawal_allowed boolean NOT NULL DEFAULT true`; `interest_rate numeric(9,6) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0)`; `interest_method text NULL`; `fee_rules jsonb NOT NULL DEFAULT '{}'::jsonb`; `gl_account_id uuid NULL`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft','Active','Inactive'))`; `UNIQUE(company_id, product_code)`; version product changes by new row/effective date, not mutation of historical terms.

`coop_accounts`: common block; `account_number text NOT NULL`; `member_id uuid NOT NULL`; `product_id uuid NOT NULL`; `group_id uuid NULL`; `branch_id uuid NULL`; `opened_on date NOT NULL DEFAULT current_date`; `closed_on date NULL`; `ledger_balance numeric(20,2) NOT NULL DEFAULT 0`; `available_balance numeric(20,2) NOT NULL DEFAULT 0`; `hold_amount numeric(20,2) NOT NULL DEFAULT 0`; `status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Active','Frozen','Closed'))`; `version bigint NOT NULL DEFAULT 0`; `UNIQUE(company_id, account_number)`; index member/product/status. The balance columns are server-maintained projections and may only change inside posting procedures; statements derive from `fin_journal_lines` and account-entry links.

`coop_contribution_plans`: common block; `group_id uuid NOT NULL`; `product_id uuid NOT NULL`; `plan_name text NOT NULL`; `frequency text NOT NULL CHECK (frequency IN ('Weekly','Fortnightly','Monthly','Quarterly','Annual','Ad Hoc'))`; `amount numeric(20,2) NOT NULL CHECK (amount > 0)`; `grace_days integer NOT NULL DEFAULT 0 CHECK (grace_days >= 0)`; `effective_from date NOT NULL`; `effective_to date NULL`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft','Active','Inactive'))`; index group/effective status.

`coop_contributions`: common block; `contribution_number text NOT NULL`; `plan_id uuid NULL`; `member_id uuid NOT NULL`; `group_id uuid NOT NULL`; `due_on date NULL`; `paid_on date NULL`; `amount_due numeric(20,2) NOT NULL CHECK (amount_due > 0)`; `amount_paid numeric(20,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0)`; `contribution_type text NOT NULL CHECK (contribution_type IN ('Regular','Welfare','Emergency','Project','Other'))`; `payment_method text NULL`; `provider text NULL`; `provider_reference text NULL`; `status text NOT NULL DEFAULT 'Due' CHECK (status IN ('Due','Part Paid','Paid','Waived','Reversed'))`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, contribution_number)`; indexes member/group/status/due date and provider reference.

`coop_welfare_funds`: common block; `group_id uuid NOT NULL`; `fund_code text NOT NULL`; `name text NOT NULL`; `minimum_reserve numeric(20,2) NOT NULL DEFAULT 0 CHECK (minimum_reserve >= 0)`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Frozen','Closed'))`; `UNIQUE(company_id, fund_code)`.

`coop_welfare_claims`: common block; `fund_id uuid NOT NULL`; `member_id uuid NOT NULL`; `claim_number text NOT NULL`; `event_type text NOT NULL`; `description text NOT NULL`; `amount_requested numeric(20,2) NOT NULL CHECK (amount_requested > 0)`; `amount_approved numeric(20,2) NULL`; `status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Paid','Reversed'))`; `approval_request_id uuid NULL`; `paid_on date NULL`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, claim_number)`; check approved amount is positive and no greater than requested.

### 7.3 Meetings, decisions, committees, and audit evidence

`coop_meetings`: common block; `group_id uuid NOT NULL`; `meeting_number text NOT NULL`; `meeting_date date NOT NULL`; `start_time time NULL`; `venue text NULL`; `agenda text NULL`; `minutes text NULL`; `chair_member_id uuid NULL`; `status text NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Held','Cancelled'))`; `UNIQUE(company_id, meeting_number)`; index group/date/status.

`coop_meeting_attendance`: common block; `meeting_id uuid NOT NULL`; `member_id uuid NOT NULL`; `status text NOT NULL CHECK (status IN ('Present','Absent','Excused'))`; `notes text NULL`; `UNIQUE(company_id, meeting_id, member_id)`.

`coop_resolutions`: common block; `meeting_id uuid NOT NULL`; `resolution_number text NOT NULL`; `title text NOT NULL`; `resolution_type text NOT NULL CHECK (resolution_type IN ('Loan Approval','Dividend','Budget','Welfare','Election','Policy','Other'))`; `proposed_by uuid NOT NULL`; `quorum_met boolean NOT NULL DEFAULT false`; `decision text NOT NULL DEFAULT 'Pending' CHECK (decision IN ('Pending','Approved','Rejected','Deferred'))`; `decided_at timestamptz NULL`; `UNIQUE(company_id, resolution_number)`; index meeting/decision.

`coop_resolution_votes`: common block; `resolution_id uuid NOT NULL`; `member_id uuid NOT NULL`; `vote text NOT NULL CHECK (vote IN ('For','Against','Abstain'))`; `cast_at timestamptz NOT NULL DEFAULT now()`; `UNIQUE(company_id, resolution_id, member_id)`.

### 7.4 Loans and credit control

`coop_loan_products`: common block; `product_code text NOT NULL`; `name text NOT NULL`; `currency text NOT NULL DEFAULT 'TZS'`; `min_principal numeric(20,2) NOT NULL CHECK (min_principal > 0)`; `max_principal numeric(20,2) NOT NULL`; `min_term_months integer NOT NULL`; `max_term_months integer NOT NULL`; `annual_interest_rate numeric(9,6) NOT NULL CHECK (annual_interest_rate >= 0)`; `interest_method text NOT NULL CHECK (interest_method IN ('Flat','Reducing Balance','Declining Balance'))`; `repayment_frequency text NOT NULL CHECK (repayment_frequency IN ('Weekly','Fortnightly','Monthly','Quarterly'))`; `grace_period_days integer NOT NULL DEFAULT 0`; `fee_rules jsonb NOT NULL DEFAULT '{}'::jsonb`; `penalty_rules jsonb NOT NULL DEFAULT '{}'::jsonb`; `guarantor_rules jsonb NOT NULL DEFAULT '{}'::jsonb`; `gl_accounts jsonb NOT NULL DEFAULT '{}'::jsonb`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft','Active','Inactive'))`; checks max >= min and max term >= min term; `UNIQUE(company_id, product_code)`.

`coop_loan_applications`: common block; `application_number text NOT NULL`; `member_id uuid NOT NULL`; `group_id uuid NULL`; `product_id uuid NOT NULL`; `requested_principal numeric(20,2) NOT NULL CHECK (requested_principal > 0)`; `purpose text NOT NULL`; `submitted_on date NOT NULL DEFAULT current_date`; `credit_score numeric(9,4) NULL`; `risk_grade text NULL`; `decision_amount numeric(20,2) NULL`; `status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Submitted','Under Review','Approved','Rejected','Cancelled','Disbursed'))`; `approval_request_id uuid NULL`; `decision_notes text NULL`; `UNIQUE(company_id, application_number)`; index member/status and group/status.

`coop_loan_guarantors`: common block; `application_id uuid NOT NULL`; `guarantor_member_id uuid NOT NULL`; `guaranteed_amount numeric(20,2) NOT NULL CHECK (guaranteed_amount > 0)`; `consent_status text NOT NULL DEFAULT 'Pending' CHECK (consent_status IN ('Pending','Accepted','Declined','Revoked'))`; `consented_at timestamptz NULL`; `UNIQUE(company_id, application_id, guarantor_member_id)`; trigger/procedure prevents self-guarantee, inactive members, duplicate active guarantees beyond configurable capacity.

`coop_collateral`: common block; `application_id uuid NULL`; `loan_id uuid NULL`; `collateral_number text NOT NULL`; `collateral_type text NOT NULL`; `description text NOT NULL`; `estimated_value numeric(20,2) NOT NULL CHECK (estimated_value > 0)`; `forced_sale_value numeric(20,2) NULL`; `document_reference text NULL`; `ownership_verified boolean NOT NULL DEFAULT false`; `status text NOT NULL DEFAULT 'Proposed' CHECK (status IN ('Proposed','Verified','Pledged','Released','Realised'))`; `UNIQUE(company_id, collateral_number)`; check either application or loan is present.

`coop_loans`: common block; `loan_number text NOT NULL`; `application_id uuid NOT NULL`; `member_id uuid NOT NULL`; `group_id uuid NULL`; `product_id uuid NOT NULL`; `approved_principal numeric(20,2) NOT NULL CHECK (approved_principal > 0)`; `disbursed_principal numeric(20,2) NOT NULL DEFAULT 0 CHECK (disbursed_principal >= 0)`; `annual_interest_rate numeric(9,6) NOT NULL`; `interest_method text NOT NULL`; `term_months integer NOT NULL CHECK (term_months > 0)`; `disbursed_on date NULL`; `maturity_on date NULL`; `status text NOT NULL DEFAULT 'Approved' CHECK (status IN ('Approved','Disbursed','Active','Closed','In Arrears','Restructured','Written Off','Rejected'))`; `outstanding_principal numeric(20,2) NOT NULL DEFAULT 0`; `outstanding_interest numeric(20,2) NOT NULL DEFAULT 0`; `outstanding_fees numeric(20,2) NOT NULL DEFAULT 0`; `outstanding_penalties numeric(20,2) NOT NULL DEFAULT 0`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, loan_number)`; indexes member/status, group/status, days past due projection if used. Outstanding values are projections updated only under row lock and cross-checked against schedules/journal.

`coop_loan_schedule_lines`: common block; `loan_id uuid NOT NULL`; `installment_no integer NOT NULL CHECK (installment_no > 0)`; `due_on date NOT NULL`; `opening_principal numeric(20,2) NOT NULL`; `principal_due numeric(20,2) NOT NULL CHECK (principal_due >= 0)`; `interest_due numeric(20,2) NOT NULL CHECK (interest_due >= 0)`; `fee_due numeric(20,2) NOT NULL DEFAULT 0`; `penalty_due numeric(20,2) NOT NULL DEFAULT 0`; `principal_paid numeric(20,2) NOT NULL DEFAULT 0`; `interest_paid numeric(20,2) NOT NULL DEFAULT 0`; `fee_paid numeric(20,2) NOT NULL DEFAULT 0`; `penalty_paid numeric(20,2) NOT NULL DEFAULT 0`; `closing_principal numeric(20,2) NOT NULL`; `status text NOT NULL DEFAULT 'Due' CHECK (status IN ('Future','Due','Part Paid','Paid','Waived','Reversed'))`; `UNIQUE(company_id, loan_id, installment_no)`; index loan/due/status.

`coop_loan_repayments`: common block; `repayment_number text NOT NULL`; `loan_id uuid NOT NULL`; `member_id uuid NOT NULL`; `received_on date NOT NULL`; `amount numeric(20,2) NOT NULL CHECK (amount > 0)`; `principal_amount numeric(20,2) NOT NULL DEFAULT 0`; `interest_amount numeric(20,2) NOT NULL DEFAULT 0`; `fee_amount numeric(20,2) NOT NULL DEFAULT 0`; `penalty_amount numeric(20,2) NOT NULL DEFAULT 0`; `payment_method text NOT NULL`; `provider text NULL`; `provider_reference text NULL`; `status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Posted','Failed','Reversed','Needs Attention'))`; `idempotency_key text NOT NULL`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, repayment_number)`, `UNIQUE(company_id, idempotency_key)`; check amount equals component sum; index loan/received/status/provider.

`coop_loan_restructures`: common block; `loan_id uuid NOT NULL`; `request_number text NOT NULL`; `reason text NOT NULL`; `old_schedule_snapshot jsonb NOT NULL`; `new_terms jsonb NOT NULL`; `approval_request_id uuid NULL`; `status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Applied','Cancelled'))`; `applied_at timestamptz NULL`; `UNIQUE(company_id, request_number)`.

`coop_loan_writeoffs`: common block; `loan_id uuid NOT NULL`; `writeoff_number text NOT NULL`; `amount numeric(20,2) NOT NULL CHECK (amount > 0)`; `reason text NOT NULL`; `approval_request_id uuid NOT NULL`; `status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Posted','Reversed'))`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, writeoff_number)`.

### 7.5 Dividends, cash, and agents

`coop_dividend_runs`: common block; `run_number text NOT NULL`; `financial_year integer NOT NULL`; `calculation_basis text NOT NULL CHECK (calculation_basis IN ('Shares','Savings','Combined','Custom'))`; `declared_rate numeric(9,6) NOT NULL CHECK (declared_rate >= 0)`; `distributable_profit numeric(20,2) NOT NULL CHECK (distributable_profit >= 0)`; `status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Calculated','Pending Approval','Approved','Posted','Reversed'))`; `approval_request_id uuid NULL`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, run_number)`, `UNIQUE(company_id, financial_year)` for one official run unless a versioning policy permits more.

`coop_dividend_allocations`: common block; `run_id uuid NOT NULL`; `member_id uuid NOT NULL`; `share_base numeric(20,2) NOT NULL DEFAULT 0`; `savings_base numeric(20,2) NOT NULL DEFAULT 0`; `allocation_amount numeric(20,2) NOT NULL CHECK (allocation_amount >= 0)`; `status text NOT NULL DEFAULT 'Calculated' CHECK (status IN ('Calculated','Approved','Posted','Reversed'))`; `member_account_id uuid NULL`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, run_id, member_id)`.

`coop_tellers`: common block; `branch_id uuid NULL`; `user_id uuid NOT NULL`; `teller_code text NOT NULL`; `status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Suspended','Inactive'))`; `UNIQUE(company_id, teller_code)`, partial unique active user.

`coop_cash_sessions`: common block; `teller_id uuid NOT NULL`; `branch_id uuid NULL`; `business_date date NOT NULL`; `opening_float numeric(20,2) NOT NULL CHECK (opening_float >= 0)`; `expected_cash numeric(20,2) NOT NULL DEFAULT 0`; `counted_cash numeric(20,2) NULL`; `variance numeric(20,2) NULL`; `status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Pending Close','Closed','Exception'))`; `opened_at timestamptz NOT NULL DEFAULT now()`; `closed_at timestamptz NULL`; `UNIQUE(company_id, teller_id) WHERE status = 'Open'`; index branch/date/status.

`coop_cash_movements`: common block; `cash_session_id uuid NOT NULL`; `member_id uuid NULL`; `account_id uuid NULL`; `movement_type text NOT NULL CHECK (movement_type IN ('Deposit','Withdrawal','Loan Disbursement','Loan Repayment','Share Purchase','Contribution','Welfare Payment','Dividend','Cash In','Cash Out'))`; `amount numeric(20,2) NOT NULL CHECK (amount > 0)`; `payment_method text NOT NULL`; `provider text NULL`; `provider_reference text NULL`; `status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Settled','Failed','Reversed','Needs Attention'))`; `idempotency_key text NOT NULL`; `journal_batch_id uuid NULL`; `UNIQUE(company_id, idempotency_key)`; provider reference index.

## 8. Provider, notification, and integration contract

Provider-facing records must distinguish the business intent from provider settlement. Add `integration_provider_transactions` with `id uuid PK`, common block, `module text`, `operation_type text`, `provider text`, `client_reference text`, `provider_reference text NULL`, `request_payload_hash text`, `status text CHECK (status IN ('Created','Submitted','Pending','Settled','Failed','Expired','Reversed','Unknown'))`, `amount numeric(20,2)`, `currency text`, `request_id text NULL`, `last_callback_at timestamptz NULL`, `failure_code text NULL`, `failure_message text NULL`, and unique `(company_id, provider, client_reference)`. Store encrypted/provider-safe references, not API secrets or PINs.

Add `integration_provider_events` with `id uuid PK`, common block, `provider text`, `provider_event_id text`, `provider_reference text NULL`, `received_at timestamptz`, `signature_verified boolean`, `payload_hash text`, `payload_redacted jsonb`, `processing_status text CHECK (processing_status IN ('Received','Processed','Duplicate','Rejected','Needs Attention'))`, `processed_at timestamptz NULL`, and unique `(company_id, provider, provider_event_id)`. A callback is accepted only after signature verification and idempotent event insertion.

Notifications can continue using the existing community and Bank/MFI notification envelopes, but any critical financial notification should reference `source_table`, `source_id`, `status`, and a delivery attempt record. Report runs should be persisted as `report_runs(id, company_id, report_code, parameters jsonb, requested_by, status, file_key, created_at, completed_at)` with a hash of parameters and no sensitive provider payload.

## 9. State machines and transition rules

| Aggregate | Allowed forward transitions | Control rule |
|---|---|---|
| POS sale | `Draft → Validated → Posted`; `Validated → Pending Approval`; `Posted → Reversed`; `Draft/Validated → Voided` | Posting validates stock, tax, tender total, open shift, customer credit eligibility, and period. A posted sale is never edited. |
| POS return | `Draft → Pending Approval → Posted`; `Posted → Reversed`; `Draft → Rejected` | Original sale is locked; returned quantity cannot exceed sold less prior returns; refund method/status must be explicit. |
| POS shift | `Open → Pending Close → Closed`; `Pending Close → Exception` | Counted cash is entered once by cashier, reviewed by another authorized role when variance exceeds policy. |
| Provider transaction | `Created → Submitted → Pending → Settled`; failure branches to `Failed`, timeout to `Unknown`, settled can only become `Reversed` through a reversal event | The application must display Pending/Unknown; it must not mark Settled because a request was sent. |
| Membership | `Pending → Active`; `Pending → Rejected`; `Active → Suspended/Exited`; `Suspended → Active` | KYC and approval capability required before Active. Exit cannot remove historical balances. |
| Savings/share transaction | `Draft → Pending Approval → Posted`; `Posted → Reversed` | Member/account ownership, product rules, session, amount, and period validated under row lock. |
| Loan application | `Draft → Submitted → Under Review → Approved/Rejected`; `Approved → Disbursed` | Maker cannot approve own application; approval stores a snapshot of amount, rate, term, guarantors, and collateral. |
| Loan | `Approved → Disbursed → Active → Closed`; `Active → In Arrears/Restructured/Written Off`; `Written Off → Reversed` only through approved reversal | Disbursement creates schedule and balanced journal atomically. |
| Loan repayment | `Pending → Posted`; `Pending → Failed/Needs Attention`; `Posted → Reversed` | Repayment allocation is server-calculated against locked schedule lines; component totals must equal receipt amount. |
| Dividend run | `Draft → Calculated → Pending Approval → Approved → Posted`; `Posted → Reversed` | Calculation inputs are snapshotted; member allocations are immutable after posting. |
| Reconciliation | `Imported → Matching → Exception/Approved → Closed` | Unmatched or duplicate entries cannot silently alter a balance; exception approval is maker-checker controlled. |

## 10. Secure RPC and tRPC contract

### 10.1 Database RPC boundary

The following PostgreSQL routines are the only write path for posted financial operations. Each is `SECURITY DEFINER`, sets `search_path TO public, pg_temp`, resolves `v_user_id = auth.uid()` and `v_company_id = public.current_company_id()`, validates capability from server-side profile/role helpers, acquires deterministic advisory locks, uses `SELECT ... FOR UPDATE` on all mutable aggregates, and returns a JSON object containing the source ID, journal batch ID, receipt/reference, status, and `idempotent_replay`.

| Routine | Input shape | Atomic effects |
|---|---|---|
| `pos_open_shift(p_request jsonb)` | register, terminal, opening float, idempotency key | Creates one open shift, validates teller/register ownership, records opening cash and audit. |
| `pos_post_sale(p_request jsonb)` | shift/register, customer, typed lines, typed tenders, totals, idempotency key | Validates/totals/tax/stock, creates sale/lines/tenders, inventory movement, journal, receipt, legacy compatibility rows, commit marker, audit. |
| `pos_post_return(p_request jsonb)` | original sale, typed return lines, reason, refund method, idempotency key | Locks original sale, validates unreturned quantity, restocks, posts refund/reversal journal, receipt and audit. |
| `pos_close_shift(p_request jsonb)` | shift, counted cash, variance reason, idempotency key | Locks shift, computes expected cash from posted movements, requires approval for policy variance, posts close evidence. |
| `pos_sync_queue_item(p_request jsonb)` | device, sequence, operation, request hash, payload | Inserts/replays queue item; mismatched hash is conflict; processing calls the corresponding posting routine. |
| `coop_register_member(p_request jsonb)` | profile/member/KYC/membership payload, idempotency key | Creates member and membership in Pending state; no activation without KYC/approval. |
| `coop_post_account_transaction(p_request jsonb)` | account, amount, operation, payment/provider reference, session, idempotency key | Locks account/session, validates product/limits, creates source and journal, updates balance projection, receipt and audit. |
| `coop_submit_loan(p_request jsonb)` | member, product, requested principal, purpose, guarantors/collateral | Validates active membership/product and capacity; creates application snapshot and approval request. |
| `coop_decide_loan(p_request jsonb)` | application, decision, approved amount/terms, note | Requires an approver different from maker; persists immutable decision snapshot. |
| `coop_disburse_loan(p_request jsonb)` | approved application, cash/account/provider route, idempotency key | Locks loan/application, creates loan, schedule, provider intent if applicable, balanced disbursement journal, receipt. |
| `coop_post_loan_repayment(p_request jsonb)` | loan, amount, method/provider, received date, idempotency key | Locks loan and oldest due schedule lines, calculates allocation, posts journal, updates projections, receipt and arrears. |
| `coop_apply_restructure(p_request jsonb)` | loan, new terms, approved request, idempotency key | Snapshots old schedule, creates approved new schedule and adjustment journal; never overwrites old lines. |
| `coop_post_writeoff(p_request jsonb)` | loan, amount, reason, approved request, idempotency key | Posts approved write-off and changes status; later recoveries are new receipts. |
| `coop_calculate_dividend_run(p_request jsonb)` | financial year, basis, rate/profit, idempotency key | Locks source period, calculates allocations from posted balances, stores calculation snapshot. |
| `coop_post_dividend_run(p_request jsonb)` | approved run, destination policy, idempotency key | Posts member allocations and reserve/expense journal; creates statements. |
| `fin_import_reconciliation(p_request jsonb)` | source, statement date, file hash, normalized lines | Idempotently imports external lines; never posts a match automatically without validation. |
| `fin_resolve_reconciliation_item(p_request jsonb)` | item, match source, decision, note | Requires capability and, for exceptions, maker-checker approval; creates a link or adjustment journal. |

Revoke public execution for all write routines and grant only to `authenticated`. Direct `INSERT/UPDATE/DELETE` grants on posted financial tables should be revoked from `authenticated`; RLS remains enabled for read paths and controlled draft operations. The Express/tRPC layer calls the RPC with the verified Supabase JWT. It may validate shape with Zod, but PostgreSQL remains the final authority for tenant, role, ownership, totals, balance, and transition checks.

### 10.2 tRPC router shape

Add a dedicated router rather than putting cooperative writes into `BusinessSphereDashboard.jsx` direct mutations:

```ts
pos: router({
  snapshot, openShift, postSale, postReturn, closeShift,
  syncQueueItem, listSales, getSale, listReconciliation
}),
coop: router({
  snapshot, registerMember, verifyKyc, openAccount,
  postAccountTransaction, submitLoan, decideLoan, disburseLoan,
  postRepayment, restructureLoan, writeOffLoan,
  calculateDividends, approveDividendRun, postDividendRun,
  listMeetings, recordAttendance, recordResolution, getStatement
}),
finance: router({
  listJournal, getTrialBalance, importReconciliation,
  resolveReconciliationItem, closePeriod
})
```

`resolveVerifiedProfile(req)` supplies `profile.id`, `profile.company_id`, `profile.role`, and `full_name`; no procedure accepts an authoritative `companyId`, actor, approval state, or balance from the browser. Read procedures must apply bounded pagination and explicit company filters. Critical mutations return typed results and invalidate caches after server confirmation rather than optimistically changing money.

## 11. RLS, roles, and audit requirements

The baseline policy is tenant isolation: `company_id = public.current_company_id()` for authenticated reads. For new tables, use separate policies instead of a blanket `FOR ALL` policy on financial tables:

| Operation | Required policy |
|---|---|
| Select | Authenticated user may read only rows with current `company_id`, subject to module entitlement/role filtering in the server. |
| Insert draft/master | Allowed only when `company_id` equals current company and creator is `auth.uid()`; relationship trigger verifies every parent belongs to the same company. |
| Update master/draft | Allowed only for allowed capability and only while status is Draft/Pending; `updated_by` is server-stamped. |
| Update posted source/journal/audit | Denied to client roles. Reversal RPC creates a new row. |
| Delete | Denied for financial source, journal, provider, reconciliation, and audit tables. Draft-only deletion may be allowed for nonfinancial configuration. |
| Approve | Server-side role gate, maker/checker separation, allowed transition, decision note, timestamp, actor. |
| Disburse / write off / post dividend | Dedicated capability, approval request in Approved state, period open, idempotency and row locks. |

Every trigger that checks a child relationship must validate both `company_id` and parent ID. Audit rows contain `company_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `before_data` or a redacted diff, `after_data` or result metadata, `request_id`, `idempotency_key`, `created_at`, and source IP/device metadata only where permitted. Audit tables are append-only; even administrators cannot update or delete audit history through the application.

## 12. Accounting entries by workflow

The journal account IDs come from `fin_accounts` configuration; the examples below show required debit/credit shape, not hard-coded account IDs.

| Operation | Debit | Credit |
|---|---|---|
| POS cash sale | Cash/tender clearing; customer receivable for credit | Sales revenue; tax payable; inventory cost/COGS against inventory asset |
| POS return | Sales returns; tax payable reversal; inventory asset | Cash/refund payable; COGS reversal |
| POS cash variance | Cash-over/short expense or income | Cash control account, according to approved variance direction |
| Member savings deposit | Cash/mobile/bank asset | Member savings liability |
| Member withdrawal | Member savings liability | Cash/mobile/bank asset |
| Share purchase | Cash/mobile/bank asset | Share capital/equity liability or equity account configured by product |
| Contribution | Cash/mobile/bank asset | Contribution/welfare fund liability or income according to cooperative rule |
| Loan disbursement | Loan principal receivable | Cash/mobile/bank asset |
| Loan repayment | Cash/mobile/bank asset | Loan principal receivable; interest income; fee income; penalty income |
| Loan write-off | Provision/write-off expense | Loan principal/interest/fee receivable or allowance account |
| Dividend posting | Dividend expense/distributable surplus | Member dividend payable or member savings liability |
| Reconciliation adjustment | Configured adjustment account | Cash/bank/clearing account, with approved reason |

A batch is posted only when the sum of debit lines equals the sum of credit lines exactly at two decimal places, all accounts are postable and active, the business date is in an open period, and every batch has one or more `fin_posting_links`. Member statements and reports aggregate journal lines by member/account/source link, not by trusting a client-calculated balance.

## 13. Migration and compatibility order

| Order | Additive migration objective | Safety gate |
|---:|---|---|
| 1 | Fetch/rebase source and verify current production migration state; create no destructive baseline changes. | Working tree clean for code changes or untracked artifacts explicitly excluded. |
| 2 | Add shared helper functions, capability checks, composite tenant-safe keys, timestamps, and `fin_periods`, `fin_accounts`, `fin_idempotency_keys`. | Apply to a Supabase branch or approved test database first; run RLS penetration tests. |
| 3 | Add journal, posting-link, approval, reconciliation, and immutable-history triggers. | Unit tests prove unbalanced batches, closed periods, direct edits, and cross-tenant FKs fail. |
| 4 | Add POS normalized masters, sale/return/sync tables and compatibility links. | Existing POS RPC tests and UI contracts remain green; historical generic rows are untouched. |
| 5 | Add cooperative profile/branch/group/member/membership/KYC and controlled mapping from `community_groups`. | No member is activated by a direct insert; duplicate NIDA/member numbers are rejected. |
| 6 | Add shares, products, accounts, contribution/welfare, meeting/resolution, teller/cash tables. | Account and cash routines post balanced journals and produce statements. |
| 7 | Add loan products/applications/guarantors/collateral/loans/schedules/repayments/restructures/write-offs. | End-to-end loan lifecycle uses locks, approval separation, schedule allocation, and reversal tests. |
| 8 | Add provider transaction/event and reconciliation integration. | Signed callback, duplicate event, pending provider, failed provider, and unknown timeout tests pass. |
| 9 | Backfill only safe master references from legacy JSON/envelopes; do not infer posted balances when source evidence is incomplete. | Each backfilled row carries `legacy_source_table`, `legacy_source_id`, and review status. |
| 10 | Introduce server tRPC adapters and dual-read reporting views. | Compare normalized and legacy totals per tenant; investigate every mismatch. |
| 11 | Cut new writes to RPCs, retain legacy read compatibility, then deprecate only after explicit approval. | Build, focused tests, migration tests, RLS tests, and live read-only verification pass. |

No migration should drop or rename existing tables, remove existing policies, or overwrite existing financial data. A future implementation must be split into reviewable migrations and follow modify → test → build → commit → fetch/rebase → push → deploy → live verify only after the user explicitly requests implementation.

## 14. Acceptance and test matrix

| Area | Acceptance test |
|---|---|
| Tenant isolation | User A cannot select, insert, update, approve, reconcile, or infer rows belonging to company B, including through child IDs. |
| Idempotency | Repeating the same request returns the original result; repeating the key with a different request hash fails with conflict; concurrent calls create one source and one journal batch. |
| POS stock | Two concurrent sales cannot oversell; sale total and tender total reconcile; inventory movement and COGS journal are created atomically. |
| POS returns | Return quantity is limited to sold minus prior returned quantity; refund total is server-calculated; return cannot target another tenant. |
| Shift control | Two open shifts cannot exist for one register; close computes expected cash from posted movements; variance requires policy approval. |
| Offline sync | Sequence replay is safe; duplicate queue items do not duplicate money; malformed or conflicting payload is `Needs Attention`, not silently accepted. |
| Membership/KYC | Inactive or unverified members cannot transact; duplicate NIDA/member number is rejected; exit preserves history. |
| Savings/shares | Account ownership, product limits, available balance, and minimum balance are checked under lock; every post has a balanced journal and receipt. |
| Loan approval | Maker cannot approve own request; approved amount/terms are snapshotted; disbursement requires approved state and creates schedule atomically. |
| Repayment | Allocation to principal/interest/fees/penalties is deterministic; total components equal receipt; oldest due schedule rows are locked and updated. |
| Arrears/write-off | Days past due and PAR are derived from schedule status/dates; write-off needs approval and posts a new journal; recovery after write-off is a new receipt. |
| Dividends | Calculation is reproducible from a frozen period and member bases; allocation totals equal distributable amount; posting is idempotent. |
| Provider settlement | A submitted request remains Pending/Unknown until verified provider evidence; callback signatures and duplicate event IDs are enforced. |
| Audit | Every create, decision, posting, reversal, exception, reconciliation, and setting change has actor, tenant, source, timestamp, and redacted detail. |
| Reporting | Trial balance balances; member statements tie to journal lines; POS shift totals tie to tender and cash movement totals; reconciliation exceptions remain visible. |
| Regression | Existing Bank/MFI, Money Agent, Community Groups, property, Settings, POS, and existing tests/build continue to pass because the design is additive. |

## 15. Proposed object inventory

**Count correction:** the explicit table list in this blueprint enumerates **55 additive tables**, not 54: 9 shared-finance/control tables, 11 normalized POS tables, 32 cooperative tables, 2 provider-integration tables, and 1 persisted report-run table. The explicit table list is the source of truth for migration planning; the earlier 54-table summary was an arithmetic error. It proposes **17 controlled write RPCs** listed in Section 10.1, plus immutable-history triggers, capability helpers, posting views, member-statement views, trial-balance views, POS shift/reconciliation views, and PAR/arrears reporting views. These counts exclude preserved legacy tables and existing Bank/MFI/Money Agent routines.

This blueprint is the exact target contract for implementation planning, not a claim of completed VICOBA/SACCOS production functionality. The current application has a functioning generic POS core and a persistent Community Groups foundation, while the normalized cooperative financial, member-account, loan-control, dividend, and shared-posting layers described here remain to be implemented. The safe next step is to approve the schema contract and migration sequence, then implement it incrementally with tests and live verification; no database migration should be applied from this design document alone.

## References

[1]: ../pos_vicoba_workflow_trace.txt "SMART MANAGER exported 18 workflow Mermaid sources"
[2]: ../supabase/migrations/20260816_004_pos_transaction_engine.sql "Existing POS transaction engine migration"
[3]: ../supabase/migrations/20260816_005_pos_return_engine.sql "Existing POS return engine migration"
[4]: ../supabase/migrations/20260816_006_pos_customer_credit.sql "Existing POS customer credit migration"
[5]: ../supabase/migrations/20260816_007_pos_sync_reconciliation.sql "Existing POS sync and reconciliation migration"
[6]: ../supabase/migrations/20260823_035_community_groups_module.sql "Existing Community Groups persistence migration"
[7]: ../supabase/migrations/20260823_036_community_groups_security_hardening.sql "Community Groups security hardening migration"
[8]: ../supabase/migrations/20260823_037_community_groups_schema_contract.sql "Community Groups schema contract migration"
[9]: ../pos_vicoba_schema_object_index.txt "Repository object index and live Supabase catalog audit references"
[10]: ../server/routers.ts "Existing Express/tRPC router composition"
[11]: ../client/src/BusinessSphereDashboard.jsx "Existing SMART MANAGER module registry and POS/Community UI contracts"
