# New Standing Order Workflow: Database Schema and RPC Contract

**Status:** Design draft for review. No migration, RPC replacement, or live database change is included.

**Scope:** This contract covers the legacy Bank & MFI `New Standing Order` workflow, the current `bank_create_standing_order(p_payload jsonb)` path, and scheduled execution through `bank_run_standing_orders()`. The design is additive and preserves the existing `public.bank_standing_orders` table and current UI payload while closing gaps in destination validation, idempotency, maker-checker control, scheduling, failure handling, mobile-money execution, auditability, and transaction safety.

## 1. Existing baseline and design decisions

The current repository already has `public.bank_standing_orders` with tenant scope, source account, optional destination account or MSISDN, amount, frequency, next run date, end date, status, last-run metadata, and timestamps. The modern Bank & MFI workspace submits `sourceAccountId`, `destinationAccountId`, `destinationMsisdn`, `amount`, `frequency`, `nextRunDate`, and an `idempotencyKey`, but the current create RPC does not yet persist or enforce the idempotency key. The current execution runner posts internal transfers and therefore does not safely execute an MSISDN-only destination.

This draft keeps the existing table name and core fields. New typed columns and child tables are additive. Existing records must remain readable, and no existing active order should be silently changed during rollout.

| Decision | Contract |
|---|---|
| Owning domain | Bank & MFI payments and account operations |
| Primary table | `public.bank_standing_orders` |
| Execution ledger | `public.bank_standing_order_runs` |
| Immutable history | `public.bank_standing_order_events` |
| Payment route | Internal account transfer, or provider-backed mobile-money instruction; never pretend an MSISDN transfer is an internal account transfer |
| Default currency | `TZS` |
| Default timezone | `Africa/Dar_es_Salaam` from the institution configuration |
| Frequency in first release | `DAILY`, `WEEKLY`, `MONTHLY` |
| Create authority | Bank Manager, Branch Manager, Finance Manager, Teller, or approved Administrator; exact role set must remain aligned with the project’s bank helper |
| Approve authority | Bank Manager, Branch Manager, Finance Manager, CFO, or Administrator; creator cannot approve their own order |
| Execute authority | Controlled service/scheduler path or approved banking operator through `bank_run_standing_orders()` |
| Client write path | Authenticated tRPC adapter to an RPC; no direct browser table writes |

An order is a payment instruction, not a transaction. A transaction is created only after a run is successfully executed and confirmed. A mobile-money instruction is created with a provider status and reference; it is not treated as settled until provider confirmation is received.

## 2. Lifecycle model

The status machine is explicit and server-controlled:

| Current status | Allowed next status | Required actor or condition |
|---|---|---|
| `DRAFT` | `PENDING_APPROVAL`, `CANCELLED` | Creator or authorized operator |
| `PENDING_APPROVAL` | `APPROVED`, `REJECTED`, `CANCELLED` | Different authorized approver for approval/rejection |
| `APPROVED` | `ACTIVE`, `CANCELLED`, `PAUSED` | Authorized operator; activation requires all validations to pass |
| `ACTIVE` | `PAUSED`, `CANCELLED`, `EXPIRED`, `COMPLETED` | Authorized operator or scheduler |
| `PAUSED` | `ACTIVE`, `CANCELLED`, `EXPIRED` | Authorized operator; resume revalidates accounts and schedule |
| `REJECTED` | `DRAFT`, `CANCELLED` | Creator/operator may revise into a new version; no silent mutation of the rejected event |
| `EXPIRED` | None | Terminal |
| `COMPLETED` | None | Terminal |
| `CANCELLED` | None | Terminal |

For a low-risk deployment, the existing UI may continue to create an `ACTIVE` order only for roles already authorized to both create and approve. If maker-checker is required for every order, the UI must evolve to show `PENDING_APPROVAL` and provide an approval action. The database contract supports both by retaining `approval_required` and `status` explicitly.

## 3. Additive schema

### 3.1 Typed extension of `bank_standing_orders`

```sql
BEGIN;

ALTER TABLE public.bank_standing_orders
  ADD COLUMN IF NOT EXISTS customer_id uuid
    REFERENCES public.bank_customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'INTERNAL_TRANSFER',
  ADD COLUMN IF NOT EXISTS narration text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  ADD COLUMN IF NOT EXISTS schedule_day integer,
  ADD COLUMN IF NOT EXISTS run_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS failure_policy text NOT NULL DEFAULT 'PAUSE_AFTER_MAX_RETRIES',
  ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_by uuid DEFAULT auth.uid();

ALTER TABLE public.bank_standing_orders
  ADD CONSTRAINT bank_standing_orders_amount_positive
    CHECK (amount > 0),
  ADD CONSTRAINT bank_standing_orders_currency_format
    CHECK (currency ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT bank_standing_orders_channel_valid
    CHECK (channel IN ('INTERNAL_TRANSFER', 'MOBILE_MONEY')),
  ADD CONSTRAINT bank_standing_orders_frequency_valid
    CHECK (upper(frequency) IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  ADD CONSTRAINT bank_standing_orders_date_range_valid
    CHECK (end_date IS NULL OR end_date >= next_run_date),
  ADD CONSTRAINT bank_standing_orders_schedule_day_valid
    CHECK (schedule_day IS NULL OR schedule_day BETWEEN 1 AND 31),
  ADD CONSTRAINT bank_standing_orders_retry_valid
    CHECK (max_retries BETWEEN 0 AND 10),
  ADD CONSTRAINT bank_standing_orders_failure_policy_valid
    CHECK (failure_policy IN ('RETRY_THEN_PAUSE', 'PAUSE_AFTER_MAX_RETRIES', 'SKIP_AND_CONTINUE', 'FAIL_CLOSED')),
  ADD CONSTRAINT bank_standing_orders_version_valid
    CHECK (version >= 0),
  ADD CONSTRAINT bank_standing_orders_destination_valid
    CHECK (
      (channel = 'INTERNAL_TRANSFER' AND destination_account_id IS NOT NULL AND destination_msisdn IS NULL)
      OR (channel = 'MOBILE_MONEY' AND destination_msisdn IS NOT NULL AND destination_account_id IS NULL)
    );

CREATE UNIQUE INDEX IF NOT EXISTS bank_standing_orders_company_idempotency_unique
  ON public.bank_standing_orders(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS bank_standing_orders_company_due_idx
  ON public.bank_standing_orders(company_id, status, next_run_date, id);

CREATE INDEX IF NOT EXISTS bank_standing_orders_source_account_idx
  ON public.bank_standing_orders(company_id, source_account_id, status);

CREATE INDEX IF NOT EXISTS bank_standing_orders_destination_account_idx
  ON public.bank_standing_orders(company_id, destination_account_id, status)
  WHERE destination_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bank_standing_orders_customer_idx
  ON public.bank_standing_orders(company_id, customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;
```

If the existing database already contains rows that violate the new destination/channel invariant, the migration must not add the constraint blindly. First run a read-only reconciliation query, place violating rows into an explicit review queue, and apply the constraint only after each row has been classified. No row should be deleted or silently rewritten.

The `schedule_day` field is interpreted as follows: it is ignored for `DAILY`; for `WEEKLY`, values 1–7 represent ISO weekday Monday–Sunday; for `MONTHLY`, values 1–31 represent the preferred day and are clamped to the last calendar day when a month is shorter. The first version may instead derive the next date from `next_run_date` and leave `schedule_day` null, but the RPC must document which behavior is active.

### 3.2 Run ledger

```sql
CREATE TABLE IF NOT EXISTS public.bank_standing_order_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,
  standing_order_id uuid NOT NULL
    REFERENCES public.bank_standing_orders(id) ON DELETE RESTRICT,
  scheduled_for date NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  attempt_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'PROCESSING',
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'TZS',
  transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  payment_instruction_id uuid REFERENCES public.bank_payment_instructions(id) ON DELETE SET NULL,
  provider text,
  provider_reference text,
  error_code text,
  error_message text,
  idempotency_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bank_standing_order_runs_status_valid
    CHECK (status IN ('PROCESSING', 'POSTED', 'SUBMITTED', 'PENDING_PROVIDER', 'FAILED', 'SKIPPED', 'CANCELLED')),
  CONSTRAINT bank_standing_order_runs_attempt_valid
    CHECK (attempt_number BETWEEN 1 AND 10),
  CONSTRAINT bank_standing_order_runs_currency_valid
    CHECK (currency ~ '^[A-Z]{3}$'),
  UNIQUE(company_id, standing_order_id, scheduled_for, attempt_number),
  UNIQUE(company_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS bank_standing_order_runs_order_time_idx
  ON public.bank_standing_order_runs(company_id, standing_order_id, scheduled_for DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS bank_standing_order_runs_status_idx
  ON public.bank_standing_order_runs(company_id, status, scheduled_for);
```

The run ledger is the idempotency boundary for scheduled execution. The deterministic key for an order/date is `SO:<standing-order-id>:<scheduled-for>`. A retry for the same scheduled occurrence must reuse the same key; it must not create a second transaction or payment instruction. If a failed attempt is retried as a separate attempt, use `SO:<standing-order-id>:<scheduled-for>:attempt:<n>` while preserving a parent occurrence key in `data`.

### 3.3 Immutable event history

```sql
CREATE TABLE IF NOT EXISTS public.bank_standing_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE CASCADE,
  standing_order_id uuid NOT NULL
    REFERENCES public.bank_standing_orders(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  previous_status text,
  next_status text,
  actor_id uuid DEFAULT auth.uid(),
  request_id text,
  idempotency_key text,
  reason text,
  before_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bank_standing_order_events_type_valid
    CHECK (event_type IN ('CREATED', 'UPDATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ACTIVATED', 'PAUSED', 'RESUMED', 'CANCELLED', 'EXPIRED', 'COMPLETED', 'RUN_POSTED', 'RUN_FAILED', 'RUN_SKIPPED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_standing_order_events_idempotency_unique
  ON public.bank_standing_order_events(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS bank_standing_order_events_order_time_idx
  ON public.bank_standing_order_events(company_id, standing_order_id, created_at DESC);
```

Events are append-only. Update/delete trigger functions must reject mutations, and their execute grants must be revoked from `PUBLIC`, `anon`, and `authenticated` unless the project’s approved trigger privilege pattern requires otherwise.

### 3.4 Optional execution-control settings

The first implementation may keep retry and failure policy on the order itself. If the institution needs centralized controls, add a separate tenant-scoped configuration table rather than putting unvalidated policy values in `data`:

```sql
CREATE TABLE IF NOT EXISTS public.bank_standing_order_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  default_currency text NOT NULL DEFAULT 'TZS',
  default_timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  default_max_retries integer NOT NULL DEFAULT 3 CHECK (default_max_retries BETWEEN 0 AND 10),
  default_failure_policy text NOT NULL DEFAULT 'PAUSE_AFTER_MAX_RETRIES',
  execution_window_start time,
  execution_window_end time,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

This table is optional and should not be created unless the product requires tenant-wide configurable execution windows.

## 4. Financial and scheduling invariants

The RPC and database must enforce the following invariants together:

| Invariant | Enforcement |
|---|---|
| Source account belongs to the current company | Query by `id` and `company_id`; lock with `FOR UPDATE` during activation/run |
| Source account is active | Reject `PENDING`, `SUSPENDED`, `CLOSED`, or `BLOCKED` accounts |
| Source account currency matches order currency | Reject mismatches; do not perform implicit FX conversion |
| Internal destination belongs to current company | Query by `id` and `company_id`; lock during execution |
| Internal destination is active | Reject inactive destination accounts |
| Source and destination are different | Reject same-account transfers |
| Mobile-money destination is normalized | Accept Tanzania numbers in E.164 `+255...` form; normalize `0...` input to `+255...` only after validation |
| Amount is positive and bounded | `numeric(20,2)`, minimum greater than zero, institution/product operational maximum enforced in RPC |
| Available balance is sufficient at execution | Recheck immediately before posting; recurring orders cannot reserve a balance indefinitely by default |
| Fees are explicit | Any fee must be included in the run/payment instruction and idempotent key; no hidden deduction |
| No duplicate occurrence | Unique run idempotency key and transaction/payment instruction key |
| End date is inclusive | A run on `end_date` is allowed; next date beyond end date transitions to `COMPLETED` |
| Calendar correctness | Daily, weekly, and monthly increments use timezone-aware date logic; no client-calculated trust |
| Failed run does not advance silently | Failure policy determines retry, pause, skip, or fail-closed behavior |
| Journal remains balanced | Internal transfers call the approved `bank_post_transaction` path; no direct balance edits |
| Provider settlement is not fabricated | Mobile money remains `PENDING_PROVIDER` until provider confirmation |
| Maker-checker separation | Creator cannot approve or activate an order requiring approval |
| Tenant isolation | Every read, lock, mutation, run, event, and audit row includes current company scope |

The execution runner must not use `bank_post_transaction` for an MSISDN-only destination because that procedure expects a destination account for a `TRANSFER`. The mobile-money path must call a payment-instruction RPC or provider integration that persists a `bank_payment_instructions` row and returns a provider-traceable state.

## 5. RPC contracts

### 5.1 Shared RPC conventions

All write RPCs are `SECURITY DEFINER` only where necessary, use a fixed `search_path = public, auth`, derive `company_id` from `public.current_company_id()`, validate `auth.uid()`, and use the existing `bank_has_role`/approved role helper. They never accept a trusted client-supplied tenant, actor, role, balance, approval timestamp, or provider settlement state.

The server adapter passes the authenticated bearer token to Supabase and returns only the confirmed RPC result. Direct PostgREST insert/update/delete privileges should remain closed for these workflow tables unless the project’s approved RLS model explicitly requires them.

Idempotency uses the existing `bank_idempotency_keys` convention or the order/run unique keys. For a repeated key with the same request hash, return the original result with `replayed: true`. Reuse with a different request hash returns `IDEMPOTENCY_KEY_REUSED`.

### 5.2 `bank_list_standing_orders`

```sql
public.bank_list_standing_orders(
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  order_number text,
  source_account_id uuid,
  destination_account_id uuid,
  destination_msisdn text,
  amount numeric,
  currency text,
  channel text,
  frequency text,
  next_run_date date,
  end_date date,
  status text,
  approval_required boolean,
  run_count integer,
  failure_count integer,
  consecutive_failure_count integer,
  last_run_at timestamptz,
  last_result text,
  version bigint,
  created_at timestamptz,
  updated_at timestamptz
)
```

The list RPC filters by current company, excludes terminal rows unless requested, applies bounded pagination, and returns no cross-tenant existence information. It should include the latest run status as a joined read model only if the query remains bounded and indexed.

### 5.3 `bank_get_standing_order`

```sql
public.bank_get_standing_order(p_order_id uuid)
RETURNS jsonb
```

Returns the current-company order, latest run, and lifecycle summary, or raises `STANDING_ORDER_NOT_FOUND`. It must not reveal whether an ID exists in another tenant.

### 5.4 `bank_create_standing_order`

```sql
public.bank_create_standing_order(p_payload jsonb)
RETURNS jsonb
```

Accepted payload, preserving the current UI fields and adding optional fields:

```json
{
  "sourceAccountId": "uuid",
  "destinationAccountId": "uuid",
  "destinationMsisdn": null,
  "customerId": "uuid",
  "amount": 50000.00,
  "currency": "TZS",
  "channel": "INTERNAL_TRANSFER",
  "frequency": "MONTHLY",
  "nextRunDate": "2025-09-01",
  "endDate": "2026-08-31",
  "scheduleDay": 1,
  "timezone": "Africa/Dar_es_Salaam",
  "narration": "Monthly savings transfer",
  "approvalRequired": true,
  "maxRetries": 3,
  "failurePolicy": "PAUSE_AFTER_MAX_RETRIES",
  "data": {},
  "idempotencyKey": "client-generated-uuid-or-stable-key"
}
```

Create behavior:

1. Resolve the verified actor and current company.
2. Check create permission. If `approvalRequired = true`, permit creation by an authorized maker but do not activate the order until approval.
3. Validate exactly one destination according to channel. Internal transfer requires a same-tenant destination account; mobile money requires a normalized Tanzania MSISDN.
4. Lock and validate the source account, currency, status, and customer relationship.
5. Validate frequency, first run date, optional end date, schedule day, amount, narration, retry policy, and bounded payload size.
6. Generate an order number server-side, preferably with a tenant-safe unique sequence or collision-safe timestamp/UUID strategy.
7. Check idempotency before insertion and store a request hash.
8. Insert the order in `PENDING_APPROVAL` when approval is required; otherwise insert `ACTIVE` only if the caller is authorized to create and approve and all activation checks pass.
9. Insert a `CREATED` or `ACTIVATED` event and shared `bank_audit` event in the same transaction.
10. Return the confirmed row and `replayed` indicator.

Example response:

```json
{
  "standingOrderId": "uuid",
  "orderNumber": "SO-20250825-000001",
  "status": "PENDING_APPROVAL",
  "nextRunDate": "2025-09-01",
  "version": 0,
  "eventId": "uuid",
  "replayed": false
}
```

### 5.5 `bank_submit_standing_order`

```sql
public.bank_submit_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
```

Moves a draft or rejected order to `PENDING_APPROVAL`. It revalidates source/destination ownership and payload completeness, increments `version`, writes a `SUBMITTED` event, and does not approve or activate the order. A creator may submit their own order, but submission is not approval.

### 5.6 `bank_approve_standing_order`

```sql
public.bank_approve_standing_order(
  p_order_id uuid,
  p_decision text,
  p_note text DEFAULT NULL,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
```

`p_decision` is `APPROVE` or `REJECT`. The RPC requires an authorized approver, rejects self-approval when the order creator equals `auth.uid()`, locks the order, checks `PENDING_APPROVAL`, validates the accounts again, and moves the order to `APPROVED` or `REJECTED`. A rejection requires a non-empty note. The approval RPC must not mark a mobile-money provider instruction as settled.

### 5.7 `bank_activate_standing_order`

```sql
public.bank_activate_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
```

Activation requires `APPROVED` unless the order’s approved policy explicitly permits direct activation. It revalidates account status, destination, currency, date range, and schedule. It moves the order to `ACTIVE`, writes an `ACTIVATED` event, and returns the next run date. Activation does not debit the source account; the first debit occurs during a run.

### 5.8 `bank_pause_standing_order`

```sql
public.bank_pause_standing_order(
  p_order_id uuid,
  p_reason text,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
```

Pause is allowed for an active or approved order. It requires a reason, records `PAUSED`, preserves the next run date, increments the version, and writes an event. It must not reverse a prior successful transaction.

### 5.9 `bank_resume_standing_order`

```sql
public.bank_resume_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
```

Resume revalidates accounts and the schedule. If the next run date is in the past, the RPC must use an explicit policy: either run on the next valid date, or return `STANDING_ORDER_REQUIRES_REVIEW`. It must not silently create a backlog of payments.

### 5.10 `bank_cancel_standing_order`

```sql
public.bank_cancel_standing_order(
  p_order_id uuid,
  p_reason text,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
```

Cancellation is terminal and allowed only for non-terminal orders. It requires a reason, sets `cancelled_at` and `cancelled_by`, writes a `CANCELLED` event, and does not delete historical run or transaction records.

### 5.11 `bank_run_standing_orders`

```sql
public.bank_run_standing_orders(
  p_run_date date DEFAULT current_date,
  p_order_id uuid DEFAULT NULL,
  p_max_orders integer DEFAULT 250
)
RETURNS jsonb
```

This is the controlled scheduler RPC. It must be callable only by the approved scheduled-task/service path or explicitly authorized banking operations roles. It selects due `ACTIVE` orders for the current company, uses `FOR UPDATE SKIP LOCKED`, and creates one run ledger row per due occurrence.

For each order:

1. Derive the deterministic occurrence key from order ID and scheduled date.
2. Insert or replay the run ledger row.
3. Lock and recheck the source account and internal destination account if applicable.
4. For `INTERNAL_TRANSFER`, call `bank_post_transaction` with `transactionType = 'TRANSFER'`, `channel = 'STANDING_ORDER'`, the same company-scoped idempotency key, and the order currency. Do not edit balances directly.
5. For `MOBILE_MONEY`, create or submit a `bank_payment_instructions` record with `paymentType = 'STANDING_ORDER'`, the normalized MSISDN, provider, amount, currency, and idempotency key. Return `PENDING_PROVIDER` unless the provider gives a confirmed synchronous result.
6. Mark the run `POSTED` for a confirmed internal transaction, or `SUBMITTED`/`PENDING_PROVIDER` for an unconfirmed external instruction.
7. Update `last_run_at`, `last_result`, `run_count`, and failure counters.
8. Advance `next_run_date` only according to the configured success policy. A failed attempt must not be treated as a posted payment.
9. If the next occurrence is beyond `end_date`, transition the order to `COMPLETED`; otherwise retain `ACTIVE`.
10. Insert a `RUN_POSTED`, `RUN_FAILED`, or `RUN_SKIPPED` event and a redacted bank audit event.

The RPC returns counts and per-order results without exposing provider secrets:

```json
{
  "runDate": "2025-08-25",
  "processed": 4,
  "posted": 2,
  "pendingProvider": 1,
  "failed": 1,
  "completed": 0,
  "results": [
    {"standingOrderId": "uuid", "runId": "uuid", "status": "POSTED", "transactionId": "uuid"}
  ]
}
```

The current runner’s `destinationMsisdn` gap must be resolved before the New Standing Order button is considered fully connected. An MSISDN-only order must never flow into an internal `TRANSFER` call with a null destination account.

### 5.12 `bank_confirm_standing_order_provider_payment`

```sql
public.bank_confirm_standing_order_provider_payment(
  p_run_id uuid,
  p_provider_reference text,
  p_provider_status text,
  p_provider_event_id text,
  p_idempotency_key text
)
RETURNS jsonb
```

This provider callback or controlled reconciliation RPC is required for mobile-money settlement. It must authenticate the provider callback through the project’s approved webhook verification path, or require an internal authorized role if manually reconciled. It locks the run and linked payment instruction, rejects conflicting duplicate provider events, records the provider reference, and transitions the run to `POSTED` or `FAILED`. It must not accept a client-supplied success status without verifying the provider event.

### 5.13 `bank_retry_standing_order_run`

```sql
public.bank_retry_standing_order_run(
  p_run_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
```

Retry is optional if the scheduler automatically retries. When exposed, it requires an authorized operator, locks the failed run and order, checks the failure policy and retry limit, and reuses occurrence-level idempotency so a previously posted payment is replayed rather than duplicated. A retry cannot bypass a paused or cancelled order.

## 6. Stable error contract

| Application code | Meaning | Client behavior |
|---|---|---|
| `UNAUTHENTICATED` | No verified workspace session | Request sign-in |
| `FORBIDDEN` | Actor lacks the required bank operation role | Keep local state unchanged |
| `STANDING_ORDER_NOT_FOUND` | Order is not visible in the tenant | Refresh without revealing cross-tenant existence |
| `SOURCE_ACCOUNT_NOT_FOUND` | Source account is not in the tenant | Ask the user to refresh account options |
| `SOURCE_ACCOUNT_INACTIVE` | Source account cannot fund payments | Do not create/activate/run |
| `DESTINATION_ACCOUNT_NOT_FOUND` | Internal destination is not in the tenant | Ask the user to select a valid destination |
| `DESTINATION_ACCOUNT_INACTIVE` | Destination account cannot receive funds | Do not create/activate/run |
| `DESTINATION_SAME_AS_SOURCE` | Source and destination are identical | Correct the form |
| `DESTINATION_REQUIRED` | No valid account or MSISDN destination | Correct the form |
| `MSISDN_INVALID` | Mobile number is not a valid Tanzania destination | Normalize or correct the number |
| `CHANNEL_DESTINATION_MISMATCH` | Internal/mobile channel conflicts with destination type | Correct the form |
| `CURRENCY_MISMATCH` | Account and order currencies differ | Do not perform implicit FX |
| `AMOUNT_INVALID` | Amount is non-positive, too large, or malformed | Highlight amount |
| `FREQUENCY_INVALID` | Frequency is unsupported | Select daily, weekly, or monthly |
| `SCHEDULE_INVALID` | Date/day/end date is invalid | Correct schedule fields |
| `ORDER_STATE_INVALID` | Lifecycle transition is not allowed | Refresh order state |
| `MAKER_CHECKER_REQUIRED` | Different approver is required | Route to an authorized approver |
| `STALE_ORDER_VERSION` | Another actor changed the order | Reload and retry |
| `IDEMPOTENCY_KEY_REUSED` | Same key used with different request data | Stop and request a new key |
| `INSUFFICIENT_AVAILABLE_BALANCE` | Source account cannot fund this occurrence | Apply configured failure policy |
| `PROVIDER_UNAVAILABLE` | Mobile-money provider did not accept the instruction | Keep run pending/failed according to policy |
| `PROVIDER_CONFIRMATION_REQUIRED` | Provider instruction is not settled yet | Do not display it as posted |
| `DUPLICATE_RUN` | Scheduled occurrence already has a run | Return the existing run result |
| `JOURNAL_UNBALANCED` | Internal posting failed the ledger invariant | Roll back the run and surface an operational error |
| `RUN_RETRY_LIMIT_REACHED` | Max retries exceeded | Pause or fail closed according to policy |
| `STANDING_ORDER_SERVICE_UNAVAILABLE` | RPC/database service unavailable | Do not update local UI state |

The tRPC adapter should map these to `TRPCError` categories while preserving the application code in structured metadata where supported. Raw SQL messages and provider secrets must not be returned to the browser.

## 7. RLS, execute privileges, and audit requirements

Enable RLS on `bank_standing_orders`, `bank_standing_order_runs`, and `bank_standing_order_events`. Authenticated users may read only rows where `company_id = public.current_company_id()` and their verified role has Bank & MFI read access. Direct writes should be blocked for client roles when the RPC is the approved mutation path.

```sql
ALTER TABLE public.bank_standing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_standing_order_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_standing_order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY bank_standing_orders_tenant_select
  ON public.bank_standing_orders FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY bank_standing_order_runs_tenant_select
  ON public.bank_standing_order_runs FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY bank_standing_order_events_tenant_select
  ON public.bank_standing_order_events FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
```

The exact write policies must match the project’s approved Bank & MFI privilege model. If RPCs are `SECURITY DEFINER`, each function must set a fixed search path, validate the current user and company, and explicitly check role permissions. Internal helpers such as `bank_has_role`, `bank_audit`, and trigger functions must not be client-callable.

Expose only the necessary RPCs:

```sql
REVOKE ALL ON FUNCTION public.bank_create_standing_order(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_submit_standing_order(uuid, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_approve_standing_order(uuid, text, text, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_activate_standing_order(uuid, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_pause_standing_order(uuid, text, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_resume_standing_order(uuid, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_cancel_standing_order(uuid, text, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_run_standing_orders(date, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_create_standing_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_submit_standing_order(uuid, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_approve_standing_order(uuid, text, text, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_activate_standing_order(uuid, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_pause_standing_order(uuid, text, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_resume_standing_order(uuid, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_cancel_standing_order(uuid, text, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_standing_orders(date, uuid, integer) TO authenticated;
```

The exact function signatures must be finalized before migration because PostgreSQL treats overloaded function signatures as separate privileges. Existing `bank_create_standing_order(jsonb)` and `bank_run_standing_orders()` cannot be replaced casually; use additive signatures or a reviewed compatibility wrapper, then update the server adapter and scheduler together.

## 8. tRPC/server adapter contract

The current adapter already resolves the verified profile and calls `bank_create_standing_order` through the user’s Supabase bearer token. The evolved adapter should validate the input before forwarding and preserve the existing payload names:

```ts
const standingOrderInput = z.object({
  sourceAccountId: z.string().uuid(),
  destinationAccountId: z.string().uuid().optional(),
  destinationMsisdn: z.string().trim().optional(),
  customerId: z.string().uuid().optional(),
  amount: z.number().finite().positive().max(10_000_000_000),
  currency: z.string().trim().length(3).toUpperCase().default("TZS"),
  channel: z.enum(["INTERNAL_TRANSFER", "MOBILE_MONEY"]).default("INTERNAL_TRANSFER"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  nextRunDate: z.string().date(),
  endDate: z.string().date().optional(),
  scheduleDay: z.number().int().min(1).max(31).optional(),
  timezone: z.string().default("Africa/Dar_es_Salaam"),
  narration: z.string().trim().min(1).max(500),
  approvalRequired: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(10).default(3),
  failurePolicy: z.enum(["RETRY_THEN_PAUSE", "PAUSE_AFTER_MAX_RETRIES", "SKIP_AND_CONTINUE", "FAIL_CLOSED"]).default("PAUSE_AFTER_MAX_RETRIES"),
  data: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().uuid(),
}).superRefine((value, ctx) => {
  if (value.channel === "INTERNAL_TRANSFER" && (!value.destinationAccountId || value.destinationMsisdn)) {
    ctx.addIssue({ code: "custom", path: ["destinationAccountId"], message: "Internal transfers require exactly one destination account." });
  }
  if (value.channel === "MOBILE_MONEY" && (!value.destinationMsisdn || value.destinationAccountId)) {
    ctx.addIssue({ code: "custom", path: ["destinationMsisdn"], message: "Mobile-money orders require exactly one MSISDN destination." });
  }
});

export async function createStandingOrder(req: BankRequest, payload: z.infer<typeof standingOrderInput>) {
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_standing_order", { p_payload: payload });
}
```

The modern UI currently generates the idempotency key at submit time and refreshes the confirmed snapshot on success. The legacy New Standing Order control should follow the same server-confirmation boundary: do not append the new order to local state until the RPC returns the confirmed order. On a retry caused by a network timeout, reuse the same idempotency key rather than generating another one.

For mobile money, the UI must show `PENDING_PROVIDER` or `SUBMITTED` distinctly from `POSTED`. A provider reference and confirmation event are required before presenting the recurring payment as settled.

## 9. Required tests before connecting the legacy button

| Test area | Required assertion |
|---|---|
| Payload validation | Amount, frequency, date, currency, channel, destination, MSISDN, and retry policy are validated |
| Tenant isolation | Source, destination, order, run, and event IDs from another company are rejected without existence leakage |
| Authorization | Unauthorized roles cannot create, approve, activate, pause, resume, cancel, or run orders |
| Maker-checker | Creator cannot approve or activate an order requiring a different approver |
| Internal destination | Same-tenant active destination is required and same-account transfers are rejected |
| Mobile-money destination | Tanzania MSISDN is normalized and no internal transfer is posted with a null destination account |
| Currency | Source/destination/order currencies must match; no implicit FX |
| Idempotency | Repeated create/run/provider confirmation returns the original result; changed payload with same key fails |
| Concurrency | `FOR UPDATE SKIP LOCKED` and version checks prevent duplicate activation or execution |
| Balance safety | Insufficient available balance creates a failed run according to policy and never makes balances negative |
| Journal safety | Internal execution routes through the approved transaction RPC and produces a balanced journal |
| Provider safety | Mobile-money instructions remain pending until verified provider confirmation |
| Scheduling | Daily, weekly, and monthly next dates are correct across month ends and timezone boundaries |
| End date | Final eligible run is allowed; later runs transition to `COMPLETED` |
| Failure policy | Retry, pause, skip, and fail-closed behavior matches configuration |
| Auditability | Every create, approval, activation, lifecycle change, run, failure, and provider event has a redacted audit/event record |
| UI confirmation | The button does not update local state after a rejected, failed, or unconfirmed RPC |
| Regression | Existing `bank_run_daily_controls`, account transfers, payment instructions, and snapshot loading remain compatible |

Live mutation tests require an isolated authenticated tenant and cleanup strategy. Without disposable credentials and a controlled tenant, use RPC contract tests, mocked Supabase responses, and source assertions rather than mutating production financial records.

## 10. Migration and rollout sequence

1. Reconcile existing `bank_standing_orders` rows for null currencies, unsupported frequencies, invalid dates, duplicate order numbers, missing idempotency keys, and destination/channel ambiguity.
2. Decide whether existing active orders are grandfathered or must be reviewed before the new destination invariant is enforced.
3. Apply additive columns, child run/event tables, indexes, RLS, immutable-event protection, and privilege hardening through the Supabase connector.
4. Add the new RPCs or compatibility wrappers without breaking the current zero-argument `bank_run_standing_orders()` scheduler signature.
5. Update the run scheduler so mobile-money orders use the payment-instruction/provider path and internal orders use `bank_post_transaction`.
6. Add server-side and browser contract tests for create, approval, internal transfer, MSISDN handling, retry, failure, and reload persistence.
7. Connect the legacy New Standing Order control only after the new RPC returns confirmed server data.
8. Run Supabase security/performance advisors and remediate only findings introduced by this workflow.

No new table should be created if the product chooses to keep a simple internal-transfer-only workflow and explicitly defers mobile-money scheduling, run history, and maker-checker. In that case, the minimum safe change is still to add idempotency enforcement, destination validation, versioning, and a run ledger before calling the legacy button complete.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/supabase/migrations/20260823_015_bank_mfi_core.sql "Bank & MFI core schema and current standing-order creation RPC"
[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/supabase/migrations/20260823_020_bank_mfi_workflow_completion.sql "Standing-order execution runner and daily controls"
[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/client/src/components/BankMfiWorkspace.jsx "Current Bank & MFI Standing Order form and payload"
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/bankMfiOperations.ts "Server adapter and verified-profile RPC conventions"
[5]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/bankMfiSecurity.test.ts "Bank & MFI security contract tests"
