# Standing Order Server Implementation Update

**Status:** Implementation draft for review. No application code or live database function has been changed by this document.

**Scope:** Replace the minimal Standing Order create/runner behavior with a server-owned workflow that enforces request idempotency, maker-checker separation, typed lifecycle transitions, run-ledger writes, internal-transfer journal safety, mobile-money pending settlement, retries, and tenant authorization.

**Related schema:** `supabase/migrations/20250825_004_standing_order_schema.sql`, `20250825_005_standing_order_fk_indexes.sql`, and `20250825_006_standing_order_policy_hardening.sql`.

## 1. Current implementation gap

The repository currently exposes `createStandingOrder` and `runStandingOrders` in `server/bankMfiOperations.ts`. The adapter resolves the verified profile and forwards the bearer token to `bank_create_standing_order(p_payload)` or `bank_run_standing_orders()`. The current SQL implementation authorizes a creator, verifies only the source-account tenant, inserts an `ACTIVE` order, and writes an audit event. The current runner selects due active orders, calls `bank_post_transaction` as an internal transfer, updates `last_run_at` and `next_run_date`, and records only aggregate counts.

This baseline is insufficient for the new schema because it does not persist or compare request hashes, does not prevent a creator from approving their own order, does not implement explicit lifecycle transitions, does not write `bank_standing_order_runs`, does not write immutable lifecycle events for every transition, and sends an MSISDN-only order through an internal transfer call with a null destination account. The implementation update must close those gaps without direct browser writes or direct balance edits.

The current modern UI submits these fields and must remain compatible during rollout:

```json
{
  "sourceAccountId": "uuid",
  "destinationAccountId": "uuid-or-null",
  "destinationMsisdn": "string-or-null",
  "amount": 50000,
  "frequency": "MONTHLY",
  "nextRunDate": "2025-09-01",
  "idempotencyKey": "uuid"
}
```

The server supplies safe defaults for newly typed fields. A later UI update may expose channel, currency, narration, approval, retry, and timezone controls explicitly.

## 2. Non-negotiable server invariants

Every write begins by resolving the verified profile and current company. The client cannot supply or override `company_id`, `created_by`, `updated_by`, `approved_by`, `cancelled_by`, actor role, provider settlement state, account balances, journal state, or audit actor.

| Invariant | Required implementation behavior |
|---|---|
| Tenant boundary | Every order, account, customer, run, event, payment instruction, and transaction lookup includes `company_id = public.current_company_id()` or an equivalent verified-company predicate. |
| Direct writes | Browser clients call authenticated server adapters only. Client roles do not receive direct insert/update/delete privileges for run/event ledgers. |
| Idempotency | A repeated key with the same canonical request hash returns the original confirmed result with `replayed: true`; the same key with different data returns `IDEMPOTENCY_KEY_REUSED`. |
| Maker-checker | An order requiring approval cannot be approved by its creator. Approval and activation are separate transitions. |
| Versioning | Lifecycle mutations lock the row and require `p_expected_version`; a mismatch returns `STALE_ORDER_VERSION`. |
| Account safety | Source and internal destination accounts are same-tenant, active, and currency-compatible. Source and destination cannot be the same account. |
| Destination safety | `INTERNAL_TRANSFER` requires exactly one destination account; `MOBILE_MONEY` requires exactly one normalized Tanzania MSISDN. |
| Posting safety | Internal execution calls `bank_post_transaction`; no RPC writes balances or journal lines directly. |
| Provider safety | Mobile-money runs remain `SUBMITTED` or `PENDING_PROVIDER` until a verified provider event confirms settlement. |
| Run safety | A scheduled occurrence has one deterministic occurrence key and one authoritative run result. Retrying a posted occurrence replays it and never posts twice. |
| Schedule safety | The server calculates the next date, applies the inclusive end-date rule, and marks the order `COMPLETED` when no future occurrence remains. |
| Auditability | Every accepted lifecycle transition and run outcome writes an event row and a redacted `bank_audit` entry in the same transaction. |

## 3. RPC surface

The following signatures are the proposed public contract. PostgreSQL privileges must be granted and revoked using the complete signatures because overloaded functions are independent objects.

| RPC | Purpose | Authorized actor |
|---|---|---|
| `bank_list_standing_orders(text, text, integer, integer)` | Bounded tenant-scoped read model | Authenticated Bank & MFI reader |
| `bank_get_standing_order(uuid)` | Tenant-scoped detail/read model | Authenticated Bank & MFI reader |
| `bank_create_standing_order(jsonb)` | Create a draft or pending-approval order | Existing creator role set |
| `bank_submit_standing_order(uuid, bigint, text)` | Submit draft/rejected order for approval | Creator or authorized operator |
| `bank_approve_standing_order(uuid, text, text, bigint, text)` | Approve or reject a pending order | Different authorized approver |
| `bank_activate_standing_order(uuid, bigint, text)` | Activate an approved order | Authorized banking operator |
| `bank_pause_standing_order(uuid, text, bigint, text)` | Pause approved/active order | Authorized banking operator |
| `bank_resume_standing_order(uuid, bigint, text)` | Resume paused order after revalidation | Authorized banking operator |
| `bank_cancel_standing_order(uuid, text, bigint, text)` | Terminal cancellation with reason | Authorized banking operator |
| `bank_run_standing_orders(date, uuid, integer)` | Controlled scheduler/operator execution | Scheduler or approved operations role |
| `bank_confirm_standing_order_provider_payment(uuid, text, text, text, text)` | Verified mobile-money settlement callback/reconciliation | Verified provider path or controlled operator |
| `bank_retry_standing_order_run(uuid, text)` | Explicit retry of an eligible failed run | Authorized operations role |

The existing zero-argument `bank_run_standing_orders()` should remain as a compatibility wrapper during rollout. It should call the new bounded function with `current_date`, `NULL`, and the configured maximum batch size, or be replaced only in a migration that updates every caller atomically.

## 4. Shared payload and response contracts

### 4.1 Create payload

The canonical payload is normalized before hashing. Key ordering, omitted defaults, whitespace, date format, currency case, frequency case, and MSISDN format must produce one deterministic representation.

```json
{
  "sourceAccountId": "uuid",
  "destinationAccountId": "uuid-or-null",
  "destinationMsisdn": null,
  "customerId": "uuid-or-null",
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
  "idempotencyKey": "uuid"
}
```

The existing UI may omit the fields introduced after the first release. The server defaults `currency` to `TZS`, `channel` to `INTERNAL_TRANSFER`, `timezone` to the institution timezone or `Africa/Dar_es_Salaam`, `approvalRequired` to `true`, `maxRetries` to `3`, `failurePolicy` to `PAUSE_AFTER_MAX_RETRIES`, and `data` to `{}`. The server must reject an omitted destination rather than inferring one.

### 4.2 Canonical response

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

All mutation RPCs return the confirmed current row projection, the event or run identifier when applicable, the new version, and `replayed`. They never return provider credentials, raw SQL errors, internal stack traces, or another tenant’s existence.

## 5. Idempotency contract

### 5.1 Request hashing

The server must canonicalize and hash the request before any mutation. A recommended implementation is SHA-256 over canonical JSON with server defaults applied and security-sensitive fields excluded from the hash only when they are server-generated. The hash is stored in the order or run `data` envelope under a reserved key such as `_requestHash`; clients cannot set or overwrite reserved keys.

```ts
function canonicalStandingOrderRequest(input: NormalizedStandingOrderInput) {
  return stableJsonStringify({
    sourceAccountId: input.sourceAccountId,
    destinationAccountId: input.destinationAccountId ?? null,
    destinationMsisdn: input.destinationMsisdn ?? null,
    customerId: input.customerId ?? null,
    amount: input.amount,
    currency: input.currency,
    channel: input.channel,
    frequency: input.frequency,
    nextRunDate: input.nextRunDate,
    endDate: input.endDate ?? null,
    scheduleDay: input.scheduleDay ?? null,
    timezone: input.timezone,
    narration: input.narration,
    approvalRequired: input.approvalRequired,
    maxRetries: input.maxRetries,
    failurePolicy: input.failurePolicy,
    data: stripReservedData(input.data),
  });
}
```

### 5.2 Create replay

`bank_create_standing_order` first searches the current company for `idempotency_key`. If found, it compares the stored `_requestHash`. A matching hash returns the original order projection and `replayed: true`; a different hash raises `IDEMPOTENCY_KEY_REUSED`. The unique `(company_id, idempotency_key)` index remains the final race-condition guard. An insert conflict must be re-read under the company predicate rather than returned as an opaque database error.

### 5.3 Lifecycle replay

Lifecycle RPCs accept an optional idempotency key. The event unique index `(company_id, idempotency_key)` is used for replay. The server stores the operation name, target order, expected version, decision/reason, and canonical request hash in the event `after_data` or a reserved event envelope. Repeating an identical lifecycle request returns the existing outcome. Reusing the same key for a different order, transition, decision, or reason raises `IDEMPOTENCY_KEY_REUSED`.

### 5.4 Run replay

The occurrence key is deterministic: `SO:<standing-order-id>:<scheduled-date>`. The run row stores that key as `idempotency_key` for the authoritative occurrence. If a run already exists, the runner returns the recorded `POSTED`, `SUBMITTED`, `PENDING_PROVIDER`, `FAILED`, or `SKIPPED` result without calling a posting or provider operation again. A separately recorded retry attempt may use `SO:<order-id>:<scheduled-date>:attempt:<n>` while `data.parentOccurrenceKey` remains the authoritative occurrence key.

## 6. Create RPC implementation update

### Signature

```sql
public.bank_create_standing_order(p_payload jsonb) returns jsonb
```

### Transaction algorithm

1. Resolve `auth.uid()` and `public.current_company_id()`. Reject missing or unverified workspace context.
2. Check the existing creator role set: `Bank Manager`, `Branch Manager`, `Customer Service`, `Teller`, or `Admin`. If the approved product policy changes this set, update the helper and tests together.
3. Normalize and validate the payload. Reject unknown reserved fields, oversized `data`, non-positive amounts, invalid frequency/date/range, invalid retry policy, and unsupported currency.
4. Enforce destination/channel exclusivity. Internal transfer requires a destination account and no MSISDN. Mobile money requires a normalized Tanzania MSISDN and no destination account.
5. Lock and validate the source account by ID and current company. It must be active and have a currency equal to the order currency. Do not reserve recurring balance at creation.
6. For internal transfer, lock and validate the destination account by ID and current company. It must be active, currency-compatible, and different from the source account. For mobile money, validate the destination owner/customer association if the product requires one and persist only the normalized MSISDN.
7. Resolve the request idempotency key and compare an existing order hash before generating a new order number or writing an event.
8. Generate a server-side collision-safe order number. Never accept a client order number.
9. Determine the initial status. The default is `PENDING_APPROVAL` when `approvalRequired` is true. Direct `ACTIVE` creation is permitted only for a role explicitly authorized to both create and approve and only when the product policy allows it.
10. Insert the order with server actor fields, normalized fields, reserved request hash, and version `0`.
11. Insert `CREATED` for pending approval, or `CREATED` followed by `ACTIVATED` only for an approved direct-activation policy. The event should capture before/after status, actor, request ID, and redacted normalized data.
12. Write `bank_audit` in the same transaction.
13. Return the confirmed order projection and `replayed: false`.

### Required SQL behavior

```sql
-- Pseudocode: exact implementation must use the project helper signatures.
SELECT * INTO v_existing
FROM public.bank_standing_orders
WHERE company_id = v_company AND idempotency_key = v_key
FOR UPDATE;

IF FOUND THEN
  IF v_existing.data->>'_requestHash' <> v_request_hash THEN
    RAISE EXCEPTION 'Idempotency key was already used with different request data.' USING ERRCODE = '22023';
  END IF;
  RETURN public.bank_standing_order_response(v_existing.id, true);
END IF;

-- Validate locked accounts, then insert order/event/audit in this transaction.
```

The production function should use stable application error codes through a project-consistent exception helper if available. If PostgreSQL `ERRCODE` cannot carry the full application code, the tRPC adapter must map stable SQL messages or an encoded JSON error envelope without exposing raw SQL details.

## 7. Submit RPC

### Signature

```sql
public.bank_submit_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text default null
) returns jsonb
```

The function allows `DRAFT` or `REJECTED` to become `PENDING_APPROVAL`. It locks the current-company order, checks version, revalidates source/destination ownership and channel, increments `version`, clears stale rejection metadata where appropriate, inserts a `SUBMITTED` event, and writes audit. It never approves or activates the order. A repeated request with the same lifecycle key replays the original result.

## 8. Approve/reject RPC

### Signature

```sql
public.bank_approve_standing_order(
  p_order_id uuid,
  p_decision text,
  p_note text default null,
  p_expected_version bigint,
  p_idempotency_key text default null
) returns jsonb
```

The function authorizes `Bank Manager`, `Branch Manager`, `Finance Manager`, `CFO`, or `Admin`, locks the order, checks `PENDING_APPROVAL`, checks `p_expected_version`, and rejects self-approval by comparing the creator with `auth.uid()` or the recorded verified actor. `p_decision` must be `APPROVE` or `REJECT`; rejection requires a non-empty reason.

An approval sets `status = 'APPROVED'`, `approved_by = auth.uid()`, and `approved_at = now()`. A rejection sets `status = 'REJECTED'`, `rejected_by`, `rejected_at`, and `rejection_reason`. The function revalidates accounts but does not debit an account, create a transaction, or mark a provider instruction settled. It writes `APPROVED` or `REJECTED` event history and an audit record in the same transaction.

## 9. Activate/pause/resume/cancel RPCs

### Activation

```sql
public.bank_activate_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text default null
) returns jsonb
```

Activation requires `APPROVED` unless a separately approved direct-activation policy applies. It revalidates the account and destination invariants, increments `version`, sets `status = 'ACTIVE'`, writes `ACTIVATED`, and leaves the first debit to the scheduler. It must not create a run during activation.

### Pause

```sql
public.bank_pause_standing_order(
  p_order_id uuid,
  p_reason text,
  p_expected_version bigint,
  p_idempotency_key text default null
) returns jsonb
```

Pause requires a non-empty reason and is permitted for `APPROVED` or `ACTIVE`. It sets `status = 'PAUSED'`, records `paused_at`, increments `version`, preserves `next_run_date`, and writes `PAUSED`. It never reverses or edits a prior posted transaction.

### Resume

```sql
public.bank_resume_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text default null
) returns jsonb
```

Resume requires `PAUSED`, revalidates accounts and schedule, and applies the documented backlog policy. The first release should return `STANDING_ORDER_REQUIRES_REVIEW` when `next_run_date < current_date` rather than silently issuing multiple overdue payments. A successful resume sets `ACTIVE`, increments `version`, and writes `RESUMED`.

### Cancel

```sql
public.bank_cancel_standing_order(
  p_order_id uuid,
  p_reason text,
  p_expected_version bigint,
  p_idempotency_key text default null
) returns jsonb
```

Cancellation requires a reason, is terminal for all non-terminal states, sets `CANCELLED`, records actor/time fields, increments `version`, writes `CANCELLED`, and retains every run, event, payment instruction, and transaction for auditability.

## 10. Run-ledger scheduler update

### Signature

```sql
public.bank_run_standing_orders(
  p_run_date date default current_date,
  p_order_id uuid default null,
  p_max_orders integer default 250
) returns jsonb
```

The compatibility wrapper `bank_run_standing_orders()` calls this function with `current_date`, `NULL`, and a safe maximum. The scheduler must not process an arbitrary client-supplied company; the company remains derived from the verified context, and a non-interactive scheduled deployment must use the project’s approved service identity rather than an unverified browser token.

### Selection and locking

The function checks scheduler/operator authorization, clamps `p_max_orders` to an institution-safe range, and selects due `ACTIVE` orders with:

```sql
FOR UPDATE SKIP LOCKED
```

The query is scoped to the current company, optionally to `p_order_id`, and excludes rows whose end date has passed. If an active order is already past its end date, the function transitions it to `EXPIRED` or `COMPLETED` according to the product policy and writes an event rather than executing it.

### Per-order execution algorithm

For each locked order:

1. Compute the occurrence date and deterministic key `SO:<order-id>:<scheduled-date>`.
2. Check for an existing run by company and idempotency key. Return its prior result if it is already `POSTED`, `SUBMITTED`, `PENDING_PROVIDER`, `SKIPPED`, or a terminal `FAILED` result that must not be retried automatically.
3. Insert a `PROCESSING` run with a snapshot of amount, currency, source/destination, channel, scheduled date, parent occurrence key, and request ID. A unique conflict is treated as replay, not as an unhandled failure.
4. Recheck the source account under lock and validate active status, matching currency, and available balance. A failure creates a failed run and invokes the configured failure policy; it does not make the balance negative.
5. For `INTERNAL_TRANSFER`, call `bank_post_transaction` with `transactionType = 'TRANSFER'`, `channel = 'STANDING_ORDER'`, the same occurrence idempotency key, source account, destination account, amount, currency, and narration. The run stores the confirmed `transaction_id` and becomes `POSTED` only after the transaction RPC returns success.
6. For `MOBILE_MONEY`, create or submit a payment instruction through the approved payment-instruction/provider path with `paymentType = 'STANDING_ORDER'`, channel, normalized MSISDN, amount, currency, provider, and the occurrence key. The run stores `payment_instruction_id` and becomes `SUBMITTED` or `PENDING_PROVIDER`; it must not become `POSTED` without verified provider confirmation.
7. On confirmed internal posting, compute and persist the next schedule date, increment `run_count`, clear consecutive failures, set `last_result = 'POSTED'`, and transition to `COMPLETED` if no later occurrence is eligible. On pending provider submission, update run metadata and advance only according to the approved provider policy; do not count it as settled.
8. On failure, update `error_code`, redacted `error_message`, attempt/failure counters, and `last_result`. Apply `RETRY_THEN_PAUSE`, `PAUSE_AFTER_MAX_RETRIES`, `SKIP_AND_CONTINUE`, or `FAIL_CLOSED` deterministically. A failure must not advance the schedule as if payment posted.
9. Insert `RUN_POSTED`, `RUN_FAILED`, or `RUN_SKIPPED` event history and a redacted `bank_audit` record in the same transaction.
10. Return aggregate counts and bounded per-order results.

### Run response

```json
{
  "runDate": "2025-08-25",
  "processed": 4,
  "posted": 2,
  "pendingProvider": 1,
  "failed": 1,
  "skipped": 0,
  "completed": 0,
  "results": [
    {
      "standingOrderId": "uuid",
      "runId": "uuid",
      "status": "POSTED",
      "transactionId": "uuid",
      "replayed": false
    }
  ]
}
```

The scheduler must not return provider secrets, full payment payloads, or raw database errors. Results should be capped by `p_max_orders` and should not leak cross-tenant IDs.

## 11. Provider confirmation and retry

### Provider confirmation

```sql
public.bank_confirm_standing_order_provider_payment(
  p_run_id uuid,
  p_provider_reference text,
  p_provider_status text,
  p_provider_event_id text,
  p_idempotency_key text
) returns jsonb
```

This function must be called only from the verified webhook/provider path or an explicitly authorized reconciliation operation. It locks the current-company run and linked payment instruction, verifies the provider event independently of the client payload, rejects conflicting duplicate provider events, and transitions the run to `POSTED` or `FAILED`. A successful external settlement must be reconciled through the approved financial posting path before it is presented as settled. It writes an event and audit record and uses provider-event idempotency.

### Retry

```sql
public.bank_retry_standing_order_run(
  p_run_id uuid,
  p_idempotency_key text
) returns jsonb
```

Retry requires an authorized operator, a current-company failed run, an eligible parent order, and a failure count below `max_retries`. It locks both run and order, increments the attempt, and reuses the parent occurrence key so a previously posted occurrence is replayed rather than duplicated. A paused, cancelled, expired, or completed order cannot be retried.

## 12. TypeScript server adapter update

`server/bankMfiOperations.ts` should validate inputs before making the PostgREST RPC request. The adapter must continue calling `resolveVerifiedProfile(req)` and forwarding the user bearer token. It should map transport failures and known database error envelopes to stable `TRPCError` categories.

```ts
const standingOrderInput = z.object({
  sourceAccountId: z.string().uuid(),
  destinationAccountId: z.string().uuid().nullable().optional(),
  destinationMsisdn: z.string().trim().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  amount: z.number().finite().positive().max(10_000_000_000),
  currency: z.string().trim().length(3).transform((v) => v.toUpperCase()).default("TZS"),
  channel: z.enum(["INTERNAL_TRANSFER", "MOBILE_MONEY"]).default("INTERNAL_TRANSFER"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  nextRunDate: z.string().date(),
  endDate: z.string().date().nullable().optional(),
  scheduleDay: z.number().int().min(1).max(31).nullable().optional(),
  timezone: z.string().trim().min(1).max(100).default("Africa/Dar_es_Salaam"),
  narration: z.string().trim().min(1).max(500).default("Standing order"),
  approvalRequired: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(10).default(3),
  failurePolicy: z.enum([
    "RETRY_THEN_PAUSE",
    "PAUSE_AFTER_MAX_RETRIES",
    "SKIP_AND_CONTINUE",
    "FAIL_CLOSED",
  ]).default("PAUSE_AFTER_MAX_RETRIES"),
  data: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().uuid(),
}).superRefine((value, ctx) => {
  const hasAccount = Boolean(value.destinationAccountId);
  const hasMsisdn = Boolean(value.destinationMsisdn);
  if (value.channel === "INTERNAL_TRANSFER" && (!hasAccount || hasMsisdn)) {
    ctx.addIssue({ code: "custom", path: ["destinationAccountId"], message: "Internal transfers require exactly one account destination." });
  }
  if (value.channel === "MOBILE_MONEY" && (hasAccount || !hasMsisdn)) {
    ctx.addIssue({ code: "custom", path: ["destinationMsisdn"], message: "Mobile-money orders require exactly one MSISDN destination." });
  }
});

export async function createStandingOrder(req: BankRequest, payload: z.infer<typeof standingOrderInput>) {
  const input = standingOrderInput.parse(payload);
  const { token } = await resolveVerifiedProfile(req);
  return callRpc(token, "bank_create_standing_order", { p_payload: input });
}
```

Add typed adapter methods for `submitStandingOrder`, `approveStandingOrder`, `activateStandingOrder`, `pauseStandingOrder`, `resumeStandingOrder`, `cancelStandingOrder`, `runStandingOrders`, `confirmStandingOrderProviderPayment`, and `retryStandingOrderRun`. Each method must validate UUIDs, dates, bounded integers, decision enums, reason lengths, and idempotency keys before forwarding.

The server should normalize known error envelopes into a stable shape such as:

```ts
type StandingOrderError = {
  applicationCode: string;
  retryable: boolean;
  message: string;
  requestId?: string;
};
```

`FORBIDDEN`, `UNAUTHORIZED`, and `BAD_REQUEST` remain the tRPC transport categories; the application code carries `MAKER_CHECKER_REQUIRED`, `STALE_ORDER_VERSION`, `DUPLICATE_RUN`, `PROVIDER_CONFIRMATION_REQUIRED`, and related workflow semantics.

## 13. SQL privilege and RLS update

The new functions should be `SECURITY DEFINER` only where needed, with `SET search_path = public, auth`, explicit role checks, current-company derivation, and no dynamic SQL from client input. Revoke `EXECUTE` from `PUBLIC` and `anon`; grant only the intended authenticated or approved service role. Internal helpers such as `bank_has_role`, `bank_audit`, and event trigger functions remain non-client-callable.

The current migration already separates tenant reads from privileged direct table writes for `bank_standing_orders`, and grants authenticated `SELECT` only on run/event ledgers. Keep that posture. Add policies for any new read RPC only through the existing tenant predicate. Do not add broad `ALL` policies that combine with `SELECT` and weaken maker-checker control.

Required privilege statements after implementation, using exact signatures:

```sql
REVOKE ALL ON FUNCTION public.bank_create_standing_order(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_submit_standing_order(uuid, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_approve_standing_order(uuid, text, text, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_activate_standing_order(uuid, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_pause_standing_order(uuid, text, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_resume_standing_order(uuid, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_cancel_standing_order(uuid, text, bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_run_standing_orders(date, uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_confirm_standing_order_provider_payment(uuid, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_retry_standing_order_run(uuid, text) FROM PUBLIC, anon;
```

If the controlled scheduler uses a service identity, grant execution to that approved role through the project’s deployment convention rather than making the RPC anonymously callable.

## 14. Repository implementation update

The implementation should be delivered as a coordinated change set rather than isolated functions.

| File/area | Update |
|---|---|
| `server/bankMfiOperations.ts` | Add Zod schemas, typed lifecycle adapter methods, stable error mapping, bounded runner arguments, and confirmed-response types. |
| Banking tRPC router | Expose the new mutations with authentication and verified-profile context; do not expose raw generic table writes. |
| Supabase migration | Add or replace the typed lifecycle RPCs, compatibility wrapper, helper functions, exact grants, and function hardening. |
| `BankMfiWorkspace.jsx` | Preserve current payload compatibility, retain the same idempotency key across network retries, show pending approval/provider states, and refresh from server confirmation only. |
| Legacy Banking module | Replace `notify("Set up standing order — form")` with the shared form or a navigation handoff to the modern Standing Order workspace. |
| Scheduler integration | Call the bounded runner with controlled date/order/batch parameters and a verified service context. |
| Tests | Add unit, SQL/source-contract, integration, concurrency, and browser coverage described below. |

A failed RPC must leave local UI state unchanged. On success, the client should refresh the server snapshot rather than append a locally invented row. On a timeout, it must retry with the same idempotency key and display an indeterminate/pending state until the server result is known.

## 15. Required tests before connecting the legacy button

| Test category | Required assertions |
|---|---|
| Create validation | Invalid amounts, dates, frequencies, currencies, retry policies, channels, and destinations are rejected before mutation. |
| Tenant isolation | Source, destination, customer, order, run, event, and payment-instruction IDs from another company cannot be used or inferred. |
| Authorization | Unauthorized creator, approver, operator, scheduler, and provider paths are rejected. |
| Maker-checker | Creator cannot approve own order; approval changes to `APPROVED`; activation is a distinct transition. |
| Versioning | Concurrent updates with stale `p_expected_version` return `STALE_ORDER_VERSION`; only one transition wins. |
| Create idempotency | Same key and same canonical payload replay; same key and changed payload returns `IDEMPOTENCY_KEY_REUSED`. |
| Lifecycle idempotency | Repeated submit/approve/activate/pause/resume/cancel calls replay the same event/result. |
| Run idempotency | Same occurrence cannot create a second run, transaction, or payment instruction. |
| Internal execution | `bank_post_transaction` is called with a valid destination and balanced journal; balances never update directly. |
| Mobile money | MSISDN-only orders never invoke internal transfer with a null destination; unconfirmed provider runs remain pending. |
| Provider callback | Duplicate provider events replay; conflicting provider events fail; client-supplied success cannot settle a run. |
| Balance safety | Insufficient available balance creates a policy-compliant failed run without a negative balance. |
| Scheduling | Daily, weekly, and monthly dates, month-end clamping, timezone, inclusive end date, and completion are correct. |
| Failure policy | Retry, pause, skip, and fail-closed outcomes match policy and counters. |
| Ledger/event safety | Run rows and events are written atomically with outcome; immutable events reject update/delete. |
| Browser behavior | Legacy button opens the shared form; local list changes only after confirmed RPC; rejection leaves UI unchanged. |
| Regression | Existing account, transaction, payment-instruction, daily-control, snapshot, and browser suites remain green. |

The tests must include mocked RPC/HTTP contract tests and controlled authenticated integration tests. A live production mutation test must not be claimed without a dedicated test tenant, authenticated credentials, cleanup plan, and explicit approval.

## 16. Rollout sequence

1. Deploy the server adapter schemas and response/error types without changing the legacy button.
2. Deploy the additive RPC migration and exact privileges while retaining compatibility wrappers.
3. Run read-only reconciliation for existing orders and classify any legacy row whose channel/destination data is incomplete.
4. Enable maker-checker for new orders by default; do not silently rewrite existing active orders.
5. Enable run-ledger execution for a controlled tenant or feature flag, beginning with internal transfers and zero live production mutations in test validation.
6. Add mobile-money provider execution only after webhook verification and settlement reconciliation are proven.
7. Connect the legacy button to the shared form after server, browser, concurrency, and idempotency tests pass.
8. Monitor run outcomes, duplicate-key conflicts, failed provider instructions, journal balance assertions, and approval latency.

## 17. Stable error contract

| Code | Meaning | Retryable |
|---|---|---:|
| `UNAUTHENTICATED` | Verified workspace session is absent | No |
| `FORBIDDEN` | Actor lacks the required role or service context | No |
| `STANDING_ORDER_NOT_FOUND` | Order is not visible in the current tenant | No |
| `SOURCE_ACCOUNT_NOT_FOUND` / `SOURCE_ACCOUNT_INACTIVE` | Source cannot fund the order | No |
| `DESTINATION_ACCOUNT_NOT_FOUND` / `DESTINATION_ACCOUNT_INACTIVE` | Internal destination is invalid | No |
| `DESTINATION_SAME_AS_SOURCE` | Source and destination are identical | No |
| `DESTINATION_REQUIRED` / `CHANNEL_DESTINATION_MISMATCH` | Payload has no valid destination or wrong destination type | No |
| `MSISDN_INVALID` | Tanzania MSISDN is invalid or cannot be normalized | No |
| `CURRENCY_MISMATCH` | Account and order currencies differ | No |
| `AMOUNT_INVALID` | Amount is malformed, non-positive, or above policy maximum | No |
| `SCHEDULE_INVALID` | Schedule or end-date rule is invalid | No |
| `ORDER_STATE_INVALID` | Requested lifecycle transition is not allowed | No |
| `MAKER_CHECKER_REQUIRED` | Different authorized approver is required | No |
| `STALE_ORDER_VERSION` | Another actor changed the order | Yes after refresh |
| `IDEMPOTENCY_KEY_REUSED` | Key was reused with different request data | No |
| `DUPLICATE_RUN` | Existing authoritative occurrence result is returned | No; replay |
| `INSUFFICIENT_AVAILABLE_BALANCE` | Source cannot fund this occurrence | According to failure policy |
| `PROVIDER_UNAVAILABLE` | Provider did not accept the instruction | According to retry policy |
| `PROVIDER_CONFIRMATION_REQUIRED` | Provider instruction is not settled | No; wait for callback |
| `JOURNAL_UNBALANCED` | Internal posting failed the ledger invariant | Operational retry only |
| `RUN_RETRY_LIMIT_REACHED` | Configured retry ceiling is reached | No |
| `STANDING_ORDER_REQUIRES_REVIEW` | Resume/run requires explicit schedule review | No |
| `STANDING_ORDER_SERVICE_UNAVAILABLE` | RPC/database service unavailable | Yes with same key |

## 18. Acceptance gate

The New Standing Order button is production-ready only when the server has the typed lifecycle RPCs, request/run idempotency, maker-checker separation, run/event writes, internal journal-safe posting, mobile-money pending semantics, exact privileges, tenant tests, concurrency tests, and browser confirmation coverage. The schema migration alone is not sufficient evidence of a connected or financially safe workflow.

## References

[1] [SMART MANAGER Bank & MFI core migration](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/supabase/migrations/20260823_015_bank_mfi_core.sql)

[2] [SMART MANAGER Bank & MFI workflow completion migration](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/supabase/migrations/20260823_020_bank_mfi_workflow_completion.sql)

[3] [SMART MANAGER Standing Order schema migration](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/supabase/migrations/20250825_004_standing_order_schema.sql)

[4] [SMART MANAGER Bank & MFI server operations](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/server/bankMfiOperations.ts)

[5] [SMART MANAGER Bank & MFI workspace](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/main/client/src/components/BankMfiWorkspace.jsx)
