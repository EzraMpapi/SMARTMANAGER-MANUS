# POS Register Control: Detailed P0/P1 Corrections

**Scope:** Remediation of the production blockers identified in `20260824_053_pos_register_control.sql`.
**Prepared patch:** `20260824_054_pos_register_control_hardening.sql`.
**Status:** Prepared and validated locally; not applied to Supabase, not deployed, and not pushed.

## Executive decision

The first register-control migration is appropriate as an **expand-only staging slice**, but it must not activate normalized POS production writes by itself. The corrections below split the blocker into two groups:

| Priority | Meaning | Required before |
|---|---|---|
| **P0** | A failure could create an unaccounted cash movement, duplicate a shift, or make runtime recovery ambiguous. | Any normalized POS production write. |
| **P1** | A failure could weaken tenant isolation, replay safety, or operational reconciliation under concurrency. | Broad rollout; some P1 controls are required before even a canary. |

The prepared hardening migration addresses the fail-closed cash status, request-hash, open-period, protected open-shift, pending cash-movement, and monotonic device-sequence portions. A complete production go-live still requires the normalized sale/return tables and a protected close-shift/post-cash routine because expected cash cannot be calculated from shift data alone.

## P0-01 — Fail closed for posted cash movements

### Current defect

`pos_shift_cash_movements.status` defaults to `Posted`, but `journal_batch_id` is nullable and the base migration does not require a journal batch, posting timestamp, or posting actor when status is `Posted`.

This allows a future write path to create a cash movement that appears posted but has no double-entry evidence. That violates the accounting invariant that every posted monetary source must have one balanced journal batch and one posting link.

### Exact correction

The hardening migration changes the default to `Pending Approval` and adds a validated check:

```sql
CHECK (
  status <> 'Posted'
  OR (
    journal_batch_id IS NOT NULL
    AND posted_at IS NOT NULL
    AND posted_by IS NOT NULL
  )
)
```

It also adds a reversal-evidence check:

```sql
CHECK (
  status <> 'Reversed'
  OR (
    journal_batch_id IS NOT NULL
    AND reversal_of_movement_id IS NOT NULL
  )
)
```

### Required business behavior

The public cash-movement routine may create only `Pending Approval`. A separate protected internal posting routine must lock the movement, verify the approval decision, create a balanced journal batch, insert the posting link, set `journal_batch_id`, `posted_at`, and `posted_by`, and transition the movement to `Posted` in one transaction. If any step fails, the source remains pending or the entire transaction rolls back.

The client must never submit a journal batch ID to force a posted status. The prepared patch removes `p_journal_batch_id` from the public `pos_record_cash_movement` signature.

### Acceptance tests

A posted movement without a journal batch must fail. A posted movement with an unbalanced, non-posted, cross-company, or reversed journal must fail. A pending movement without an approval request must fail. A reversed movement without a reversal source must fail. A valid posted movement must have one balanced journal batch and one source posting link.

## P0-02 — Add protected, idempotent shift operations

### Current defect

The base migration stores `open_idempotency_key` and `close_idempotency_key` but does not provide routines that use them. Client-side uniqueness checks are not sufficient under concurrent requests or lost HTTP responses.

### Exact correction

The prepared patch adds `pos_open_shift` and `pos_record_cash_movement` as `SECURITY DEFINER` routines with:

- `auth.uid()` and `public.current_company_id()` validation.
- Role validation through `pos_require_operate`.
- A request hash that detects reuse of the same key with different payloads.
- Transaction-scoped advisory locks for idempotency keys and registers.
- `FOR UPDATE` replay lookup.
- Server-side register, terminal, cashier, and open-period validation.
- Atomic insert plus audit record.
- A local transaction GUC only for the protected trigger path.

The canonical public contracts are:

```text
pos_open_shift(
  register_id,
  terminal_id?,
  cashier_id?,
  business_date,
  opening_float,
  open_idempotency_key,
  open_request_hash,
  shift_number?
) -> shift_id, shift_number, status, opening_float, idempotent_replay
```

```text
pos_record_cash_movement(
  shift_id,
  movement_type,
  amount,
  reason,
  reference?,
  idempotency_key,
  request_hash,
  approval_request_id
) -> movement_id, status, journal_batch_id, idempotent_replay
```

Both routines must return the original result when retried with the same request key and hash. If the key is reused with a different hash, they must reject the request rather than create a second record.

### Remaining P0 dependency

A complete `pos_close_shift` routine must be delivered after `pos_sale_headers` and `pos_sale_tenders` exist. It must lock the shift, calculate expected cash from opening float plus posted cash tenders plus signed posted cash movements, require `counted_cash`, compute variance server-side, write a closing-count evidence row, and transition the shift once. It must not accept a client-supplied expected cash or variance as authoritative.

## P0-03 — Make financial lifecycle transitions explicit

The allowed shift transition graph is:

```text
Open -> Pending Close -> Closed
Open -> Exception
Pending Close -> Closed
Pending Close -> Exception
Open -> Cancelled
Exception -> Closed       [approved recovery only]
```

No transition may reopen a closed or cancelled shift. No transition may skip directly to `Closed` without a counted drawer and a server-computed variance. No client update should be able to change register, terminal, cashier, opening float, expected cash, counted cash, variance, status, or close evidence.

The prepared patch adds a sensitive-field trigger. The close RPC must additionally enforce the transition graph under `FOR UPDATE` and use a close idempotency key.

## P1-01 — Preserve tenant isolation at every relationship boundary

### Current condition

The new tables contain `company_id` and use composite foreign keys among the new POS/control tables. The branch, warehouse, profile, and legacy POS foreign keys are plain ID foreign keys because those existing parents do not expose the required composite unique key in the current contract.

### Exact correction

Keep the scope triggers and add integration tests for every external parent:

```text
register.branch_id       -> branches.id       + branches.company_id = register.company_id
register.warehouse_id    -> inventory_warehouses.id + matching company_id
shift.cashier_id         -> profiles.id       + profiles.company_id = shift.company_id
shift.closed_by          -> profiles.id       + matching company_id
shift.terminal_id        -> pos_terminals.id  + matching company_id/register_id
cash.shift_id            -> pos_shift_sessions.id + matching company_id
cash.approval_request_id -> fin_approval_requests.id + matching company_id
cash.journal_batch_id    -> fin_journal_batches.id + matching company_id
```

Before broad rollout, add `(company_id, id)` unique keys to shared parent tables where additive and safe. Until then, the `SECURITY DEFINER` scope triggers must remain and must always compare both IDs. Direct table writes remain unavailable to `authenticated`; controlled RPCs are the write boundary.

## P1-02 — Prevent incompatible-object masking

`CREATE TABLE IF NOT EXISTS` is useful for idempotent deployment but can conceal a pre-existing object with the same name and a different definition. Before production application, add a preflight migration check that verifies:

- The object is either absent or a table in `public`.
- Required columns have the expected data type and nullability.
- Required primary keys, unique keys, and RLS state exist.
- Existing constraints do not conflict with the expected contract.

If any check fails, the migration must raise an exception and abort. It must not continue with a partially compatible object.

## P1-03 — Make sync sequence acceptance deterministic

### Current defect

`last_sequence` exists, but the base migration has no protected routine to prevent sequence rollback, payload reuse, or silent sequence gaps.

### Exact correction

The prepared patch adds `last_accepted_hash` and `pos_accept_sync_device_sequence`. The routine locks the device row and applies this decision table:

| Incoming sequence | Hash condition | Result |
|---:|---|---|
| Less than `last_sequence` | Any | Reject as stale. |
| Equal to `last_sequence` | Same hash | Return replay; do not update. |
| Equal to `last_sequence` | Different hash | Reject as sequence/payload conflict. |
| Greater than `last_sequence + 1` | Any | Return a gap and next expected sequence; do not advance. |
| Exactly `last_sequence + 1` | Valid hash | Accept and atomically advance sequence/hash/last-seen. |

This routine is a device-envelope control only. The later `pos_sync_queue` migration must couple sequence acceptance to the actual sale/return/cash operation in one transaction. A device sequence must never advance merely because a request arrived; it advances only when the protected workflow accepts the corresponding queue item.

## P1-04 — Protect the internal-write context

The trigger uses `current_setting('pos.internal_write', true)`. The only safe way to use it is:

```sql
PERFORM set_config('pos.internal_write', 'on', true);
```

The third argument must remain `true`, making the setting transaction-local. Protected routines must set it only immediately before their internal mutation and must never use a session-level setting. The routine must not expose a client-controlled `set_config` path. Add a pooled-connection test proving that the setting is not present in the next transaction.

The eventual posting and close routines should use a separate context value, such as `pos.workflow_write`, if the implementation needs to distinguish a normal operational write from a financial reversal. The trigger should reject all unrecognized contexts.

## P1-05 — Make expected cash a server projection with source evidence

`expected_cash` and `variance` are stored values. They must not be accepted as client authority. The close routine should calculate:

```text
expected_cash = opening_float
              + posted cash sale tenders
              + posted positive cash movements
              - posted negative cash movements
              - posted cash drops
              - posted cash refunds
```

The exact signed movement mapping must be centralized in a database function or immutable configuration. The close operation must lock the shift and all relevant source rows, then persist the computed expected amount, counted amount, variance, and calculation version. The Z-report should expose both the stored evidence and the source totals used for calculation.

## P1-06 — Keep compatibility mirroring atomic

During expand and canary rollout, the normalized source and existing legacy POS envelope must be written by one protected server transaction. The client must not perform one insert into `pos_shift_sessions` and a separate insert into `pos_shifts`.

If the legacy mirror fails, the normalized operation must roll back. If the normalized write fails, the legacy operation must not remain as a successful new operation. Existing legacy rows are not to be deleted during recovery; an approved repair job may create a missing mirror with a source reference, or the operation may remain in an exception queue.

## 4. Required test gate before production

The following tests are mandatory before changing any normalized POS write flag:

| Test group | Required result |
|---|---|
| Migration atomicity | Inject a failure after each major DDL block; no partial new schema is visible after rollback. |
| Idempotent apply | Applying the migration twice is safe; incompatible pre-existing objects abort. |
| Posted evidence | Posted cash without journal evidence fails. |
| Approval | Pending movement without an approval request fails; maker cannot approve their own request. |
| Concurrency | Two concurrent opens for one register produce exactly one open shift. |
| Tenant boundary | Cross-company register, terminal, cashier, branch, warehouse, approval, journal, and legacy references fail. |
| Request replay | Same key and hash returns original result; same key with different hash fails. |
| Close recovery | Timeout after close commit and retry returns one close result; closed shift cannot reopen. |
| Sequence | Replay, stale, gap, conflict, and next-sequence cases produce the decision table above. |
| Compatibility | Old application continues using legacy tables after expand migrations. |
| Accounting | Every posted cash movement has a balanced journal and posting link. |
| Connection safety | Internal-write context is transaction-local and cannot leak through pooling. |

## 5. Production approval gate

The current prepared hardening patch is **not a full production unblock** because the normalized sale/return source tables and close routine are later migration dependencies. The correct release order is:

1. Apply and validate finance foundation and journal core.
2. Apply the base POS register-control migration.
3. Apply this hardening migration and validate all existing rows before commit.
4. Add normalized sale headers/tenders and their journal posting routines.
5. Add the protected close-shift routine and source-based expected-cash calculation.
6. Add the queue table and couple device sequence acceptance to accepted operations.
7. Run staging concurrency, rollback, tenant, and accounting tests.
8. Deploy server compatibility code with flags off.
9. Canary one internal register, then expand by register/tenant cohort.
10. Obtain Finance and Operations sign-off before enabling broad normalized writes.

**Current gate:** the prepared hardening migration is suitable for code review and staging rehearsal. Production normalized POS writes remain **NO-GO** until the close routine, normalized sale/tender dependencies, queue-coupled sequence acceptance, and integration tests are complete.
