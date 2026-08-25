# Fixed Deposit Workflow — Database Schema and Server-Side RPC Contract

**Status:** Design draft; not applied to Supabase and not committed.
**Prepared:** 2026-08-25
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Target workflow:** Legacy Banking **New Fixed Deposit** control, migrated to the verified Bank & MFI server boundary.

## 1. Design position

The existing legacy Banking module renders fixed deposits from the generic `bank_fixed_deposits` table and the `New FD` button currently emits a notification only. The live table exists, but it has no typed fixed-deposit columns or discovered fixed-deposit RPC. The safe implementation is therefore an **additive typed extension** of `bank_fixed_deposits`, plus a product table and immutable lifecycle-event table. The client must call server-owned RPCs; it must not insert directly into the generic table.

The design follows the repository’s existing patterns: `company_id` is derived from `public.current_company_id()`, the actor is derived from `auth.uid()`, customer/account ownership is checked inside the RPC, financial mutations lock affected rows, all externally retried mutations carry an idempotency key, balanced journal batches are written for money movements, and `bank_audit_events` records the outcome. The existing account and ledger conventions are defined in the Bank & MFI migration [1].

> **Important:** This document is a contract draft, not authorization to apply DDL or create live functions. The migration should be reviewed by the product owner, finance owner, and security owner before application.

## 2. Scope and lifecycle

The workflow has five explicit stages:

| Stage | State transition | Money movement | Authorized actor |
|---|---|---|---|
| Quote | No persisted state | None | Any authenticated Banking user allowed to view products |
| Create | `NULL → PENDING_APPROVAL` | None | Customer Service, Teller, Branch Manager, Bank Manager, Admin |
| Approve and fund | `PENDING_APPROVAL → ACTIVE` | Debit customer source account; credit fixed-deposit liability | Branch Manager, Bank Manager, CFO, Admin; maker-checker separation required |
| Maturity processing | `ACTIVE → MATURED/CLOSED` or `ACTIVE → ACTIVE` on renewal | Pay principal, interest, tax, and penalties according to instruction | Authorized Banking Manager/CFO/Admin or controlled scheduled job |
| Early withdrawal/cancellation | `PENDING_APPROVAL → CANCELLED` or `ACTIVE → EARLY_WITHDRAWN` | Pending cancellation has no movement; early withdrawal posts configured penalty and payout | Branch Manager, Bank Manager, CFO, Admin; customer-facing request should be approval-based |

The design intentionally separates **creation** from **funding**. A button click must not silently debit a customer account. The approval RPC is the accounting boundary.

## 3. Database schema

### 3.1 Existing table extension

The live `bank_fixed_deposits` table currently uses the generic envelope (`name`, `status`, `amount`, `notes`, `data`). The following additive migration preserves those columns and existing rows while adding typed fields. All values affecting financial behavior are server-derived from the selected product or verified related records; the client cannot choose a company or override the approved product rate.

```sql
BEGIN;

ALTER TABLE public.bank_fixed_deposits
  ADD COLUMN IF NOT EXISTS company_id uuid DEFAULT public.current_company_id(),
  ADD COLUMN IF NOT EXISTS deposit_number text,
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS source_account_id uuid,
  ADD COLUMN IF NOT EXISTS payout_account_id uuid,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS principal numeric(20,2),
  ADD COLUMN IF NOT EXISTS annual_interest_rate numeric(12,6),
  ADD COLUMN IF NOT EXISTS term_days integer,
  ADD COLUMN IF NOT EXISTS day_count_basis integer NOT NULL DEFAULT 365,
  ADD COLUMN IF NOT EXISTS interest_method text NOT NULL DEFAULT 'SIMPLE_365',
  ADD COLUMN IF NOT EXISTS compounding_frequency text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS maturity_date date,
  ADD COLUMN IF NOT EXISTS maturity_instruction text NOT NULL DEFAULT 'PAYOUT_TO_ACCOUNT',
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS renewal_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accrued_interest numeric(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_interest numeric(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withheld_tax numeric(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_withdrawal_penalty numeric(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maturity_amount numeric(20,2),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'PENDING_APPROVAL',
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS matured_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS closure_reason text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;

ALTER TABLE public.bank_fixed_deposits
  ADD CONSTRAINT bank_fixed_deposits_principal_positive
    CHECK (principal IS NULL OR principal > 0),
  ADD CONSTRAINT bank_fixed_deposits_rate_nonnegative
    CHECK (annual_interest_rate IS NULL OR annual_interest_rate >= 0),
  ADD CONSTRAINT bank_fixed_deposits_term_positive
    CHECK (term_days IS NULL OR term_days > 0),
  ADD CONSTRAINT bank_fixed_deposits_day_count_valid
    CHECK (day_count_basis IN (360, 365)),
  ADD CONSTRAINT bank_fixed_deposits_interest_method_valid
    CHECK (interest_method IN ('SIMPLE_365', 'SIMPLE_360', 'COMPOUND_MONTHLY', 'COMPOUND_DAILY')),
  ADD CONSTRAINT bank_fixed_deposits_instruction_valid
    CHECK (maturity_instruction IN ('PAYOUT_TO_ACCOUNT', 'RENEW_PRINCIPAL', 'RENEW_PRINCIPAL_AND_INTEREST')),
  ADD CONSTRAINT bank_fixed_deposits_amounts_nonnegative
    CHECK (accrued_interest >= 0 AND paid_interest >= 0 AND withheld_tax >= 0 AND early_withdrawal_penalty >= 0),
  ADD CONSTRAINT bank_fixed_deposits_dates_valid
    CHECK (maturity_date IS NULL OR start_date IS NULL OR maturity_date > start_date),
  ADD CONSTRAINT bank_fixed_deposits_renewal_nonnegative
    CHECK (renewal_count >= 0),
  ADD CONSTRAINT bank_fixed_deposits_version_nonnegative
    CHECK (version >= 0);

-- These FKs are intentionally added only after existing legacy rows are reconciled.
-- Use NOT VALID first in a deployment, repair any legacy violations, then validate.
ALTER TABLE public.bank_fixed_deposits
  ADD CONSTRAINT bank_fixed_deposits_product_fk
    FOREIGN KEY (product_id) REFERENCES public.bank_fixed_deposit_products(id) NOT VALID,
  ADD CONSTRAINT bank_fixed_deposits_customer_fk
    FOREIGN KEY (customer_id) REFERENCES public.bank_customers(id) ON DELETE RESTRICT NOT VALID,
  ADD CONSTRAINT bank_fixed_deposits_source_account_fk
    FOREIGN KEY (source_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT NOT VALID,
  ADD CONSTRAINT bank_fixed_deposits_payout_account_fk
    FOREIGN KEY (payout_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT NOT VALID;

COMMIT;
```

The final migration must use idempotent `ADD COLUMN IF NOT EXISTS` guards and must not add duplicate constraints if the table has already received a partial rollout. The `bank_fixed_deposit_products` table below must be created before validating the product foreign key. If the current generic table already contains incompatible data, keep the legacy rows readable in `data` and populate typed fields only for newly created records; do not fabricate historical customer or account relationships.

### 3.2 Fixed-deposit product configuration

Product configuration is separated from individual deposits so that rates, terms, tax treatment, accounting codes, and early-withdrawal rules are not trusted from browser input.

```sql
CREATE TABLE IF NOT EXISTS public.bank_fixed_deposit_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'TZS',
  minimum_principal numeric(20,2) NOT NULL DEFAULT 0
    CHECK (minimum_principal >= 0),
  maximum_principal numeric(20,2)
    CHECK (maximum_principal IS NULL OR maximum_principal >= minimum_principal),
  minimum_term_days integer NOT NULL DEFAULT 30
    CHECK (minimum_term_days > 0),
  maximum_term_days integer NOT NULL
    CHECK (maximum_term_days >= minimum_term_days),
  annual_interest_rate numeric(12,6) NOT NULL
    CHECK (annual_interest_rate >= 0),
  interest_method text NOT NULL DEFAULT 'SIMPLE_365'
    CHECK (interest_method IN ('SIMPLE_365', 'SIMPLE_360', 'COMPOUND_MONTHLY', 'COMPOUND_DAILY')),
  compounding_frequency text
    CHECK (compounding_frequency IS NULL OR compounding_frequency IN ('MONTHLY', 'DAILY', 'AT_MATURITY')),
  withholding_tax_rate numeric(7,4) NOT NULL DEFAULT 0
    CHECK (withholding_tax_rate >= 0 AND withholding_tax_rate <= 100),
  early_withdrawal_allowed boolean NOT NULL DEFAULT false,
  early_withdrawal_penalty_rate numeric(7,4) NOT NULL DEFAULT 0
    CHECK (early_withdrawal_penalty_rate >= 0 AND early_withdrawal_penalty_rate <= 100),
  default_maturity_instruction text NOT NULL DEFAULT 'PAYOUT_TO_ACCOUNT'
    CHECK (default_maturity_instruction IN ('PAYOUT_TO_ACCOUNT', 'RENEW_PRINCIPAL', 'RENEW_PRINCIPAL_AND_INTEREST')),
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'RETIRED')),
  principal_liability_gl_code text NOT NULL DEFAULT 'CUSTOMER-FIXED-DEPOSIT',
  interest_expense_gl_code text NOT NULL DEFAULT 'FIXED-DEPOSIT-INTEREST-EXPENSE',
  withholding_tax_gl_code text NOT NULL DEFAULT 'WITHHOLDING-TAX-PAYABLE',
  cash_or_clearing_gl_code text NOT NULL DEFAULT 'CASH_OR_CLEARING',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

ALTER TABLE public.bank_fixed_deposit_products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS bank_fixed_deposit_products_company_status_idx
  ON public.bank_fixed_deposit_products(company_id, status, code);
```

**Tax policy note:** The draft deliberately defaults the withholding rate to `0` and makes it product-configurable. A statutory rate must be supplied by the institution’s approved Tanzania tax configuration; it should not be hardcoded from an unverified assumption.

### 3.3 Immutable lifecycle events

The event table provides an auditable history independent of the mutable current-state row. Events must be append-only; correction is represented by a compensating event, not an update or delete.

```sql
CREATE TABLE IF NOT EXISTS public.bank_fixed_deposit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,
  fixed_deposit_id uuid NOT NULL
    REFERENCES public.bank_fixed_deposits(id) ON DELETE RESTRICT,
  event_type text NOT NULL
    CHECK (event_type IN (
      'CREATED', 'APPROVED', 'FUNDED', 'INTEREST_ACCRUED',
      'MATURED', 'PAYOUT_POSTED', 'RENEWED', 'EARLY_WITHDRAWN',
      'CANCELLED', 'TAX_WITHHELD', 'CLOSED', 'REVERSED'
    )),
  event_at timestamptz NOT NULL DEFAULT now(),
  principal_delta numeric(20,2) NOT NULL DEFAULT 0,
  interest_delta numeric(20,2) NOT NULL DEFAULT 0,
  tax_delta numeric(20,2) NOT NULL DEFAULT 0,
  penalty_delta numeric(20,2) NOT NULL DEFAULT 0,
  amount numeric(20,2),
  currency text NOT NULL DEFAULT 'TZS',
  journal_batch_id uuid REFERENCES public.bank_journal_batches(id) ON DELETE RESTRICT,
  transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE RESTRICT,
  actor_id uuid DEFAULT auth.uid(),
  idempotency_key text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (principal_delta >= -999999999999999999.99),
  CHECK (interest_delta >= -999999999999999999.99),
  CHECK (tax_delta >= -999999999999999999.99),
  CHECK (penalty_delta >= -999999999999999999.99)
);

CREATE INDEX IF NOT EXISTS bank_fixed_deposit_events_company_deposit_time_idx
  ON public.bank_fixed_deposit_events(company_id, fixed_deposit_id, event_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS bank_fixed_deposit_events_company_idempotency_idx
  ON public.bank_fixed_deposit_events(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

### 3.4 Deposit indexes and uniqueness

```sql
CREATE UNIQUE INDEX IF NOT EXISTS bank_fixed_deposits_company_deposit_number_idx
  ON public.bank_fixed_deposits(company_id, deposit_number)
  WHERE deposit_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bank_fixed_deposits_company_idempotency_idx
  ON public.bank_fixed_deposits(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS bank_fixed_deposits_company_status_maturity_idx
  ON public.bank_fixed_deposits(company_id, status, maturity_date);
CREATE INDEX IF NOT EXISTS bank_fixed_deposits_company_customer_idx
  ON public.bank_fixed_deposits(company_id, customer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS bank_fixed_deposits_company_source_account_idx
  ON public.bank_fixed_deposits(company_id, source_account_id, status);
```

### 3.5 RLS and direct-write posture

The existing generic fixed-deposit policy is tenant-scoped but does not provide the full Banking/MFI role contract. The proposed design should allow tenant-scoped reads while routing writes through RPCs. Before rollout, inspect existing policy names and grants; do not blindly create duplicates.

```sql
ALTER TABLE public.bank_fixed_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_fixed_deposit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bank_fixed_deposits_tenant ON public.bank_fixed_deposits;
CREATE POLICY bank_fixed_deposits_tenant_select
  ON public.bank_fixed_deposits FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY bank_fixed_deposits_tenant_write
  ON public.bank_fixed_deposits FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.bank_is_privileged())
  WITH CHECK (company_id = public.current_company_id() AND public.bank_is_privileged());

CREATE POLICY bank_fixed_deposit_events_tenant_select
  ON public.bank_fixed_deposit_events FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY bank_fixed_deposit_events_tenant_write
  ON public.bank_fixed_deposit_events FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND public.bank_is_privileged());
```

The RPCs should be `SECURITY DEFINER`, explicitly set `search_path = public, auth`, verify `auth.uid() IS NOT NULL`, and be granted only to `authenticated`. The deployment must also review table grants so direct `INSERT`, `UPDATE`, and `DELETE` cannot bypass the RPC’s maker-checker and accounting logic. Because the current project has generic compatibility policies, policy consolidation should be a separately reviewed security change.

### 3.6 Append-only event protection

```sql
CREATE OR REPLACE FUNCTION public.bank_fixed_deposit_events_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RAISE EXCEPTION 'Fixed deposit lifecycle events are immutable.' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS bank_fixed_deposit_events_no_update ON public.bank_fixed_deposit_events;
CREATE TRIGGER bank_fixed_deposit_events_no_update
  BEFORE UPDATE OR DELETE ON public.bank_fixed_deposit_events
  FOR EACH ROW EXECUTE FUNCTION public.bank_fixed_deposit_events_immutable();
```

The trigger is defense in depth. Table grants and RLS must still be reviewed because a privileged database owner can bypass ordinary RLS semantics.

## 4. Financial and state invariants

The following rules are mandatory, not UI suggestions.

| Invariant | Enforcement point |
|---|---|
| `company_id` always comes from `current_company_id()` | RPC; default; RLS; tenant-scoped foreign-key lookups |
| Customer belongs to the current company and has `kyc_status IN ('VERIFIED','ENHANCED_REVIEW')` | Create and approve RPCs |
| Source and payout accounts belong to the same company and customer; both are active and currency-compatible | Create/approve/maturity RPCs |
| Product is active and its configured rate, term, currency, and limits are copied into the deposit | Create RPC; never trust browser rate/term policy |
| Principal is positive and within product limits | Create RPC and table check |
| Maturity date is derived server-side from start date plus term | Approve/fund RPC |
| Approval cannot be performed by the creator | Approve RPC; maker-checker |
| Funding is one-time and idempotent | Unique key, row lock, status check, journal idempotency |
| Every money movement has a balanced journal batch | Same transaction as state mutation; deferred balance trigger |
| Maturity payout cannot exceed principal plus calculated interest less tax and penalty | Maturity RPC; row lock |
| Renewal creates a new cycle through an event and updates the same deposit only under a locked state transition | Maturity RPC |
| Lifecycle events are append-only | Trigger, RLS, grants |
| Client-visible state changes only after the RPC returns a confirmed representation | UI mutation boundary |

### 4.1 Interest formulas

The product’s `interest_method` determines the formula. The server must calculate and persist the result using `numeric(20,2)` and must not rely on JavaScript floating-point math.

```text
SIMPLE_365:
  interest = round(principal × annual_rate_percent / 100 × term_days / 365, 2)

SIMPLE_360:
  interest = round(principal × annual_rate_percent / 100 × term_days / 360, 2)

COMPOUND_MONTHLY:
  periods = floor(term_days / 30)
  interest = round(principal × ((1 + annual_rate_percent / 100 / 12)^periods - 1), 2)

COMPOUND_DAILY:
  interest = round(principal × ((1 + annual_rate_percent / 100 / 365)^term_days - 1), 2)
```

Any institution that needs a different day-count or compounding convention should add a product-supported method and regression tests rather than silently changing an existing product. The final product approval screen should display the formula basis, term dates, gross interest, configured tax, penalty, and expected net amount.

## 5. RPC contract

### 5.1 Common conventions

All mutation RPCs receive `p_payload jsonb` except where a UUID identifier is more appropriate. The server derives the actor and company from the verified session. The JSON payload may contain a client-generated `idempotencyKey`; it must not contain an authoritative `companyId`, `annualInterestRate`, GL code, or final maturity date.

Common response fields:

```json
{
  "fixedDepositId": "uuid",
  "depositNumber": "FD-20260825-000001",
  "status": "PENDING_APPROVAL | ACTIVE | MATURED | CLOSED | ...",
  "replayed": false,
  "journalBatchId": "uuid or null",
  "eventId": "uuid or null"
}
```

A replay with the same company, operation, and idempotency key returns the original confirmed result with `replayed: true`. Reusing the key with a different request hash raises a conflict and performs no mutation.

### 5.2 Product-management RPCs

The product table must be managed through server procedures rather than direct browser writes. A product used by an existing `ACTIVE` deposit is immutable for financial terms; changes require a new product version or a new product code. Only approved configuration roles may create, activate, suspend, or retire products.

```sql
CREATE OR REPLACE FUNCTION public.bank_create_fixed_deposit_product(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_update_fixed_deposit_product(
  p_product_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_set_fixed_deposit_product_status(
  p_product_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
```

`bank_create_fixed_deposit_product` accepts the typed product fields in section 3.2 and an idempotency key. It requires `Bank Manager`, `CFO`, or `Admin`, enforces unique company/code, validates all rates, terms, tax, and GL codes, and writes `FIXED_DEPOSIT_PRODUCT_CREATED` to the bank audit log. `bank_update_fixed_deposit_product` may update descriptive fields and future-effective rules only when no active deposit references the product; otherwise it must reject financial-term changes with a conflict. `bank_set_fixed_deposit_product_status` supports only `DRAFT → ACTIVE`, `ACTIVE → SUSPENDED`, and `SUSPENDED → RETIRED`, with an audit event for each transition.

### 5.3 Common error and idempotency contract

All public procedures return structured JSON only on success and raise SQLSTATE-compatible errors on failure. The server adapter maps them to stable tRPC errors without exposing raw SQL, stack traces, or another tenant’s identifiers.

| Condition | SQLSTATE | Public meaning | Mutation guarantee |
|---|---|---|---|
| Missing/invalid session | `42501` | `UNAUTHORIZED` | No mutation |
| Role not permitted | `42501` | `FORBIDDEN` | No mutation |
| Referenced record is outside tenant | `42501` | `FORBIDDEN` or `NOT_FOUND` | No mutation; do not disclose existence |
| Invalid amount, term, enum, date, or payload | `22023` | `BAD_REQUEST` | No mutation |
| Insufficient source-account available balance | `22003` | `PRECONDITION_FAILED` | Full transaction rollback |
| Source/payout account inactive or currency mismatch | `P0001` | `PRECONDITION_FAILED` | Full transaction rollback |
| Illegal lifecycle transition or already processed maturity | `40901` | `CONFLICT` | No mutation |
| Same idempotency key with a different request hash | `23505` or explicit `40902` | `CONFLICT` | No mutation |
| Same idempotency key with the same request hash | None | Original success with `replayed: true` | No duplicate movement |
| Journal imbalance or accounting invariant failure | `23514` | `INTERNAL_SERVER_ERROR` | Full transaction rollback |

The request hash must be calculated from canonicalized, server-accepted input fields, excluding transport metadata. A retry must not create a second deposit, transaction, journal batch, event, payout, tax entry, or renewal.

### 5.4 `bank_quote_fixed_deposit(p_payload jsonb)`

**Purpose:** Read-only server calculation for the New FD form. It does not create a deposit or reserve funds.

**Input:**

```json
{
  "productId": "uuid",
  "principal": 500000,
  "termDays": 180,
  "startDate": "2026-09-01",
  "maturityInstruction": "PAYOUT_TO_ACCOUNT"
}
```

**Server rules:** Verify the product belongs to the current company and is `ACTIVE`; validate principal and term against product limits; derive the rate, interest method, day-count basis, tax rate, and maturity date from the product; calculate gross interest, configured tax, penalty `0`, and net maturity amount. The supplied `startDate` may be previewed but the final activation date is still server-controlled.

**Output:**

```json
{
  "currency": "TZS",
  "principal": 500000.00,
  "annualInterestRate": 8.5,
  "interestMethod": "SIMPLE_365",
  "dayCountBasis": 365,
  "termDays": 180,
  "startDate": "2026-09-01",
  "maturityDate": "2027-02-28",
  "grossInterest": 20958.90,
  "withholdingTaxRate": 0,
  "withheldTax": 0,
  "earlyWithdrawalPenalty": 0,
  "netMaturityAmount": 520958.90
}
```

The sample numbers above are illustrative contract shape only; the implementation must calculate them from the verified product configuration and must not hardcode the values.

### 5.3 `bank_create_fixed_deposit(p_payload jsonb)`

**Purpose:** Create a pending deposit instruction without moving money.

**Input schema:**

```json
{
  "productId": "uuid",
  "customerId": "uuid",
  "sourceAccountId": "uuid",
  "payoutAccountId": "uuid",
  "principal": 500000.00,
  "termDays": 180,
  "maturityInstruction": "PAYOUT_TO_ACCOUNT",
  "autoRenew": false,
  "idempotencyKey": "client-generated-key-at-least-12-chars",
  "data": {
    "origin": "legacy-banking-new-fd"
  }
}
```

**Server behavior:**

1. Require a verified session and one of `Customer Service`, `Teller`, `Branch Manager`, `Bank Manager`, or `Admin`.
2. Validate the idempotency key and replay/hash contract.
3. Lock and verify the current-company customer, active KYC, source account, payout account, and active product.
4. Verify source and payout accounts belong to the selected customer and have compatible currency.
5. Validate principal and term against the product; copy rate, method, day-count, tax rate, and product rule snapshot into `data.productSnapshot`.
6. Derive the deposit number, status `PENDING_APPROVAL`, and requested maturity policy.
7. Insert the deposit and a `CREATED` event in one transaction; do not change balances.
8. Write `FIXED_DEPOSIT_CREATED` to `bank_audit_events`.

**Output:**

```json
{
  "fixedDepositId": "uuid",
  "depositNumber": "FD-20260825-000001",
  "status": "PENDING_APPROVAL",
  "replayed": false,
  "eventId": "uuid"
}
```

### 5.4 `bank_approve_fixed_deposit(p_fixed_deposit_id uuid, p_payload jsonb)`

**Purpose:** Approve and fund a pending deposit. This is the only initial activation boundary.

**Input:**

```json
{
  "idempotencyKey": "approval-key-at-least-12-chars",
  "approvalNote": "Reviewed against customer instruction"
}
```

**Server behavior:**

1. Require `Branch Manager`, `Bank Manager`, `CFO`, or `Admin` and a verified session.
2. Lock the deposit by ID within `current_company_id()` and require `PENDING_APPROVAL`.
3. Reject if `created_by = auth.uid()` to enforce maker-checker separation.
4. Lock the source account; require `ACTIVE`, same customer, same currency, and `available_balance >= principal`.
5. Set `start_date = current_date`, derive `maturity_date`, and calculate the product-snapshot interest basis.
6. Debit the source account’s ledger and available balance; increment its version.
7. Insert a `bank_transactions` record for the funding movement with a unique idempotency key and link it to the journal batch.
8. Insert a balanced journal batch with at least these lines:

```text
Debit  CUSTOMER-DEPOSIT on source account       principal
Credit CUSTOMER-FIXED-DEPOSIT liability         principal
```

9. Update the deposit to `ACTIVE`, set `approved_by`, `approved_at`, `activated_at`, `version + 1`, and link transaction/journal IDs in `data`.
10. Insert `APPROVED` and `FUNDED` events and write `FIXED_DEPOSIT_FUNDED` to `bank_audit_events`.
11. Return the confirmed deposit and journal references. Any failure rolls back the account balance, deposit, event, transaction, and journal changes together.

**Output:**

```json
{
  "fixedDepositId": "uuid",
  "depositNumber": "FD-20260825-000001",
  "status": "ACTIVE",
  "startDate": "2026-09-01",
  "maturityDate": "2027-02-28",
  "principal": 500000.00,
  "journalBatchId": "uuid",
  "fundingTransactionId": "uuid",
  "replayed": false
}
```

### 5.5 `bank_process_fixed_deposit_maturity(p_fixed_deposit_id uuid, p_payload jsonb)`

**Purpose:** Process one deposit that has reached its maturity date. A scheduled daily control may call the same logic in a separate batch function.

**Input:**

```json
{
  "idempotencyKey": "maturity-key-at-least-12-chars",
  "asOfDate": "2027-02-28"
}
```

`asOfDate` is optional for an authorized controlled job and must not permit processing before the actual maturity date. The normal user path uses `current_date`.

**Server behavior:**

1. Require `Bank Manager`, `Branch Manager`, `CFO`, `Admin`, or a narrowly scoped scheduled-job identity.
2. Lock the deposit and require `ACTIVE` and `maturity_date <= current_date`.
3. Calculate gross interest from the stored product snapshot, not today’s rate.
4. Calculate configured withholding tax and net amount. Tax rate is the stored approved product value; no browser-supplied tax is accepted.
5. Lock the payout account and verify it is active, owned by the same customer, and currency-compatible.
6. For `PAYOUT_TO_ACCOUNT`, post a balanced journal:

```text
Debit  CUSTOMER-FIXED-DEPOSIT liability       principal
Debit  FIXED-DEPOSIT-INTEREST-EXPENSE         gross interest
Credit CUSTOMER-DEPOSIT on payout account     net amount
Credit WITHHOLDING-TAX-PAYABLE                withheld tax
```

7. Create a linked transaction and update the deposit to `MATURED` then `CLOSED` in the same transaction, with amounts and timestamps recorded.
8. For `RENEW_PRINCIPAL`, pay only the net interest to the payout account and create the next cycle in the same locked operation. The principal remains in the fixed-deposit liability and `renewal_count` increments.
9. For `RENEW_PRINCIPAL_AND_INTEREST`, carry the net maturity amount into the next cycle and reset the cycle’s accrued/paid fields, preserving the prior cycle in `bank_fixed_deposit_events`.
10. Insert `INTEREST_ACCRUED`, `TAX_WITHHELD`, `MATURED`, and `PAYOUT_POSTED` or `RENEWED` events as applicable, plus a bank audit record.
11. Replay returns the original result; partial payout or renewal is rolled back.

**Output:**

```json
{
  "fixedDepositId": "uuid",
  "depositNumber": "FD-20260825-000001",
  "status": "CLOSED",
  "principal": 500000.00,
  "grossInterest": 20958.90,
  "withheldTax": 0,
  "netPaid": 520958.90,
  "journalBatchId": "uuid",
  "payoutTransactionId": "uuid",
  "replayed": false
}
```

### 5.6 `bank_request_fixed_deposit_early_withdrawal(p_fixed_deposit_id uuid, p_payload jsonb)`

**Purpose:** Request or approve an early withdrawal under product rules. A product that disallows early withdrawal must reject the request.

The recommended implementation is two-step: a customer-facing request changes `ACTIVE → EARLY_WITHDRAWAL_PENDING`; a privileged approval RPC posts the money movement. If the institution deliberately allows one-step approval, the same maker-checker and product-rule checks remain mandatory.

**Request input:**

```json
{
  "reason": "Customer written instruction",
  "idempotencyKey": "early-withdrawal-request-key"
}
```

**Approval input:**

```json
{
  "idempotencyKey": "early-withdrawal-approval-key",
  "approvalNote": "Reviewed and approved"
}
```

The approval RPC locks the deposit, applies the configured early-withdrawal penalty, calculates payable interest according to the product’s approved early-withdrawal policy, posts a balanced journal, writes a payout transaction, marks `EARLY_WITHDRAWN` then `CLOSED`, and appends `EARLY_WITHDRAWN` and `CLOSED` events. The payout account must be the verified customer account; the client cannot redirect funds to an unrelated account.

### 5.7 `bank_cancel_fixed_deposit(p_fixed_deposit_id uuid, p_payload jsonb)`

**Purpose:** Cancel only a `PENDING_APPROVAL` deposit before funding.

**Rules:** Require an authorized Banking role, lock the row, reject any active or funded deposit, require a reason, set `CANCELLED`, set `cancelled_at`, append a `CANCELLED` event, and write a bank audit event. No account balance or journal is changed.

### 5.8 `bank_run_fixed_deposit_maturities(p_payload jsonb)`

**Purpose:** Controlled batch operation for daily processing.

**Input:**

```json
{
  "asOfDate": "2027-02-28",
  "limit": 100,
  "idempotencyKey": "daily-fixed-deposit-run-key"
}
```

The batch must select only current-company `ACTIVE` deposits with `maturity_date <= asOfDate`, order by maturity date and ID, lock rows safely, and invoke the same internal settlement routine as the single-deposit RPC. It returns counts and per-deposit result references; it must not report success for a deposit whose settlement rolled back. The scheduled job must be auditable and rate-limited.

## 6. PL/pgSQL implementation skeleton

The implementation should keep the public RPC thin and place shared money-moving logic in a private function. The following signatures define the intended server boundary; the body must be completed and reviewed against the existing journal helper before application.

```sql
CREATE OR REPLACE FUNCTION public.bank_quote_fixed_deposit(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_create_fixed_deposit(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_approve_fixed_deposit(
  p_fixed_deposit_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_process_fixed_deposit_maturity(
  p_fixed_deposit_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_request_fixed_deposit_early_withdrawal(
  p_fixed_deposit_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_approve_fixed_deposit_early_withdrawal(
  p_fixed_deposit_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_cancel_fixed_deposit(
  p_fixed_deposit_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.bank_run_fixed_deposit_maturities(
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;
```

Every function must finish with explicit execute hardening:

```sql
REVOKE ALL ON FUNCTION public.bank_quote_fixed_deposit(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_create_fixed_deposit(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_approve_fixed_deposit(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_process_fixed_deposit_maturity(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_request_fixed_deposit_early_withdrawal(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_approve_fixed_deposit_early_withdrawal(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_cancel_fixed_deposit(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_run_fixed_deposit_maturities(jsonb) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.bank_quote_fixed_deposit(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_fixed_deposit(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_approve_fixed_deposit(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_process_fixed_deposit_maturity(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_request_fixed_deposit_early_withdrawal(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_approve_fixed_deposit_early_withdrawal(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_cancel_fixed_deposit(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_fixed_deposit_maturities(jsonb) TO authenticated;
```

The implementation should use explicit role arrays consistent with the existing `bank_has_role` helper [1]. Suggested role sets are:

| RPC | Suggested `bank_has_role` roles |
|---|---|
| Quote | `Bank Manager`, `Branch Manager`, `Customer Service`, `Teller`, `CFO`, `Finance Manager`, `Admin` |
| Create | `Customer Service`, `Teller`, `Branch Manager`, `Bank Manager`, `Admin` |
| Approve/fund | `Branch Manager`, `Bank Manager`, `CFO`, `Admin` |
| Maturity/renewal | `Branch Manager`, `Bank Manager`, `CFO`, `Admin` or a controlled job identity |
| Early-withdrawal request | `Customer Service`, `Teller`, `Branch Manager`, `Bank Manager`, `Admin` |
| Early-withdrawal approval | `Branch Manager`, `Bank Manager`, `CFO`, `Admin` |
| Cancel pending | `Customer Service`, `Teller`, `Branch Manager`, `Bank Manager`, `Admin` |
| Batch maturity run | `Bank Manager`, `CFO`, `Admin` or a controlled job identity |

## 7. tRPC/server adapter contract

The existing server adapter should expose typed procedures that call the RPCs with a verified request context, matching the style of `server/bankMfiOperations.ts` [2]. The client should never receive a Supabase service key.

```ts
export const fixedDepositQuoteInput = z.object({
  productId: z.string().uuid(),
  principal: z.number().finite().positive(),
  termDays: z.number().int().positive().max(3650),
  startDate: z.string().date().optional(),
  maturityInstruction: z.enum([
    "PAYOUT_TO_ACCOUNT",
    "RENEW_PRINCIPAL",
    "RENEW_PRINCIPAL_AND_INTEREST",
  ]).optional(),
});

export const fixedDepositCreateInput = z.object({
  productId: z.string().uuid(),
  customerId: z.string().uuid(),
  sourceAccountId: z.string().uuid(),
  payoutAccountId: z.string().uuid(),
  principal: z.number().finite().positive(),
  termDays: z.number().int().positive().max(3650),
  maturityInstruction: z.enum([
    "PAYOUT_TO_ACCOUNT",
    "RENEW_PRINCIPAL",
    "RENEW_PRINCIPAL_AND_INTEREST",
  ]),
  autoRenew: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(12).max(160),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const fixedDepositApprovalInput = z.object({
  fixedDepositId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(12).max(160),
  approvalNote: z.string().trim().max(1000).optional(),
});

export const fixedDepositMaturityInput = z.object({
  fixedDepositId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(12).max(160),
  asOfDate: z.string().date().optional(),
});

export async function quoteFixedDeposit(req, payload: unknown) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_quote_fixed_deposit", { p_payload: payload });
}

export async function createFixedDeposit(req, payload: unknown) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_fixed_deposit", { p_payload: payload });
}
```

The router additions should remain protected procedures and should validate IDs, date strings, enum values, and numeric bounds before the request reaches Supabase. The database remains authoritative for company, role, KYC, account ownership, product rules, rate, dates, balances, and journal results.

## 8. UI integration contract for the legacy `New FD` button

The legacy button should open a form, not call `notify()` and not write directly to `bank_fixed_deposits`. Required fields are:

| UI field | Server value |
|---|---|
| Customer | `customerId`; selectable only from verified current-company customers |
| Source account | `sourceAccountId`; selectable only from the selected customer’s active accounts |
| Payout account | `payoutAccountId`; selectable only from the same customer’s active compatible accounts |
| Fixed-deposit product | `productId`; active product list from confirmed server data |
| Principal | Positive TZS amount within product limits |
| Term | Days or approved product term option |
| Maturity instruction | Payout or approved renewal option |
| Auto-renew | Explicit boolean, reconciled with the instruction |

The form should call the quote procedure as inputs change, display server-calculated dates and amounts, then call `createFixedDeposit`. The UI may add the returned pending row only after the RPC returns a confirmed representation. Approval should be a separate action visible only to authorized approvers. Errors must leave the local list unchanged and surface the server message without claiming that money moved.

## 9. Required test contract before implementation is accepted

| Test area | Required assertions |
|---|---|
| Schema | Table columns, product constraints, event append-only trigger, indexes, RLS, and function execute grants are present. |
| Quote | Product rate and formula are server-derived; invalid product, term, currency, and principal are rejected. |
| Create | Unverified/customer-cross-tenant/source-account mismatch is rejected; successful creation has no balance or journal movement; replay is stable. |
| Approve/fund | Maker-checker is enforced; source balance is locked and reduced once; journal debits equal credits; failure rolls back all writes. |
| Maturity | Stored product snapshot is used; payout and renewal instructions produce correct balances and events; replay is stable. |
| Early withdrawal | Product policy and approval rules are enforced; penalty and payout are auditable. |
| Tenant isolation | Cross-company IDs return authorization/not-found behavior and never disclose another tenant’s row. |
| UI | `New FD` no longer calls notification-only code; local state changes only after confirmed RPC response; duplicate submit is prevented. |
| Regression | Existing generic rows remain readable and existing Bank/MFI snapshot tests remain green. |

## 10. Deployment sequence and open decisions

The implementation should be deployed in additive phases: first inventory and reconcile existing `bank_fixed_deposits` rows, then create product/event tables, then add typed columns and validated constraints, then add RPCs and execute hardening, then add server adapters and tests, and only afterward connect the legacy button. Any existing broad direct-write policy must be reviewed before enabling the UI.

The following decisions require explicit approval before migration authoring: whether fixed deposits are funded only from a customer account or may also be funded from cash/clearing; which approved Tanzania tax configuration supplies `withholding_tax_rate`; whether rates are simple or compound by product; whether early withdrawal is permitted and how its interest penalty is calculated; whether renewal stays on the same deposit ID or creates a new cycle row; and which chart-of-account codes are institution-configurable.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/supabase/migrations/20260823_015_bank_mfi_core.sql — Existing Bank & MFI tables, tenant helpers, journal constraints, and financial RPC conventions.
[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/bankMfiOperations.ts — Existing verified-profile server adapter and Banking/MFI RPC wrappers.
[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/client/src/dashboardExtractedModules.jsx — Legacy Banking module and the notification-only New FD control.
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/client/src/components/BankMfiWorkspace.jsx — Existing modern Bank & MFI workspace patterns for confirmed server mutations.
