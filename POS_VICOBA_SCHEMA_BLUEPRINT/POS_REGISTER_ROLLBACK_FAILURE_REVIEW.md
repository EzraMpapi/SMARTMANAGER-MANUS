# POS Register-Control Migration: Rollback and Failure-Recovery Review

**Reviewed migration:** `supabase/migrations/20260824_053_pos_register_control.sql`
**Review scope:** registers, terminals, shift sessions, shift cash movements, synchronization devices, deployment rollback, and runtime failure recovery.
**Review status:** analysis only; no migration or production database change was applied.

## Executive conclusion

The migration is **safe as an expand-only schema migration when run before any normalized POS writes are enabled**, because it is enclosed in a PostgreSQL transaction and does not alter or delete the existing POS envelopes or existing POS RPCs. If a DDL statement, dependency check, foreign key, index, trigger, or policy creation fails before `COMMIT`, PostgreSQL should roll back the migration transaction as a unit.

It is **not yet ready to be called production-complete for runtime recovery**. The migration creates the structures but does not yet provide the protected `open shift`, `record cash movement`, `close shift`, or `sync-device sequence` RPCs that make retry and recovery deterministic. In addition, a `pos_shift_cash_movements` row may be declared `Posted` while `journal_batch_id` is null, because the table defaults to `Posted` and does not currently enforce a journal link for that state. That is the most important schema-level control gap.

The recommended disposition is **approve for local/staging schema rehearsal only; do not activate normalized POS writes or apply this slice to production until the P0/P1 items below are addressed or explicitly accepted by Finance and Engineering.**

## 1. What rolls back automatically

The migration begins with `BEGIN` and ends with `COMMIT`. New table creation, foreign keys, indexes, trigger definitions, RLS enablement, policies, and function definitions are therefore part of one DDL transaction. A failure such as a missing dependency table, incompatible existing object, duplicate constraint conflict, invalid foreign key, or failed policy statement should abort the transaction and leave the database at its pre-migration schema state.

The migration is additive with respect to current POS business data. It does not update `pos_shifts`, `pos_cash_movements`, `pos_transactions`, `pos_transaction_items`, `pos_returns`, `pos_return_items`, `pos_transaction_commits`, `pos_return_commits`, or `pos_sync_events`. Existing application traffic can therefore continue through the legacy tables if the new migration is not committed or if the new feature flags remain disabled.

| Failure point | Expected result | Verification |
|---|---|---|
| Missing `branches`, `inventory_warehouses`, `profiles`, or legacy POS tables | Transaction aborts; no new POS-control objects should remain | Confirm the migration is absent from migration history and `to_regclass` returns null for all five new tables. |
| Invalid composite foreign key or duplicate constraint | Transaction aborts | Inspect PostgreSQL error; rerun only after correcting the migration in staging. |
| Index/policy/trigger failure | Transaction aborts | Confirm no partial normalized POS table is exposed to authenticated reads. |
| Migration succeeds but application release fails | Schema remains present but inert | Keep normalized feature flags false; old release continues using legacy tables. |
| Runtime RPC failure after activation | Source transaction must remain uncommitted or become an explicit failure state | Retry with the same idempotency key; never create a second business operation. |

## 2. What does not automatically roll back

A committed schema cannot safely be rolled back by dropping tables once they contain operational data. After normalized writes begin, rollback must mean **application fallback plus forward correction**, not destructive database reversal.

If a shift opens successfully but the HTTP request times out, the server may already have committed the shift. The future `pos_open_shift` routine must return the original result when retried with the same `(company_id, open_idempotency_key)`. If the routine is not yet implemented, the current migration alone cannot guarantee this runtime behavior; its unique key only prevents duplicate insertion if an application routine uses it correctly.

If a cash movement posts to a journal and the client loses its response, the same request must replay to the original source/journal result. If an application partially writes legacy and normalized rows outside one database transaction, the records can diverge and require reconciliation. Therefore compatibility mirroring must occur inside the protected posting routine, not in two independent client requests.

If a close operation fails after a drawer count has been recorded, the system needs an explicit `Pending Close` or `Exception` state and a retryable close idempotency key. The current schema has status values and close keys, but the migration does not implement the close procedure or the rule that computes `expected_cash` from posted sales and cash movements.

## 3. Severity-ranked findings

| ID | Severity | Finding | Consequence | Required action |
|---|---|---|---|---|
| RRC-01 | **P0** | `pos_shift_cash_movements.status` defaults to `Posted`, while `journal_batch_id` is nullable and no constraint requires a posted movement to have a journal batch. | A privileged or future routine defect could create an apparently posted cash movement without double-entry evidence. | Change the default to `Pending Approval` or add a check requiring `status <> 'Posted' OR journal_batch_id IS NOT NULL`; enforce posting only inside the protected RPC. Add a regression test. |
| RRC-02 | **P0** | No protected open/record/close RPCs exist in this slice. | Idempotent retry, expected-cash calculation, maker-checker approval, and atomic legacy mirroring are not yet executable. | Implement `pos_open_shift`, `pos_record_cash_movement`, and `pos_close_shift` after the journal core, with row locks and atomic idempotency. |
| RRC-03 | **P1** | `IF NOT EXISTS` can mask a pre-existing object with the same name but an incompatible shape. | The migration may appear successful while later constraints or application assumptions target the wrong schema. | Add a preflight contract check using `to_regclass` and `information_schema`; abort if an object exists but does not match the expected columns/keys. |
| RRC-04 | **P1** | Plain foreign keys to `branches`, `inventory_warehouses`, `profiles`, and legacy POS tables do not encode tenant equality at the FK level. | A cross-tenant ID could be referenced if a future write bypasses the scope triggers or if a trigger is changed incorrectly. | Keep the existing scope triggers, add explicit regression tests, and use composite tenant-safe keys wherever the parent table supports a unique `(company_id, id)` key. |
| RRC-05 | **P1** | `pos_sync_devices.last_sequence` has no monotonic update routine or conflict state. | A stale/offline device could replay an older sequence or advance the sequence without its queue item being durably processed. | Add the queue table and a locked `pos_sync_queue_item` routine that advances sequence only in the same transaction as accepted work. |
| RRC-06 | **P1** | Closed-shift mutation is blocked by a session GUC, but the migration does not yet define the protected routines that set/reset that GUC. | A future implementation could accidentally leave the GUC enabled on a pooled connection or fail to use it consistently. | Use `set_config('pos.internal_write','on',true)` locally inside the routine, never session-wide; add a finally-safe routine pattern and direct-mutation tests. |
| RRC-07 | **P2** | `expected_cash` and `variance` are stored projections, not derived values. | A stale or incorrect projection could make a Z-report disagree with source transactions. | Calculate them under a locked shift from posted tenders and cash movements; store the result as evidence and expose source totals in the report. |
| RRC-08 | **P2** | RLS provides select policies only; this is safe for an inert expand migration but gives no controlled draft writes. | New UI code cannot safely write until RPCs and explicit draft policies are added. | Keep the tables read-only during expansion; add narrow insert/update policies only for nonfinancial device/register setup or route all writes through protected procedures. |

## 4. Runtime recovery matrix

| Scenario | Correct recovery | Incorrect recovery to prohibit |
|---|---|---|
| Migration DDL fails | Abort transaction, fix forward in staging, rerun after validation | Dropping arbitrary existing tables or disabling RLS to force completion |
| Application deploy fails after schema commit | Keep schema; disable normalized flags; deploy prior compatible application | Dropping normalized tables that may contain data |
| Open-shift request times out | Replay the same idempotency key; return original shift result | Generate a new key and open a second drawer |
| Two users open one register concurrently | Let the partial unique index allow one commit; return conflict to the loser | Check for an open shift only in the client |
| Cash movement request times out | Replay the same idempotency key and source hash | Insert a second movement because the first response was lost |
| Cash movement journal posting fails | Keep the source unposted or roll back the entire RPC; mark no false `Posted` movement | Leave a posted movement with a null journal link |
| Close count submitted but response lost | Retry close key; return the existing close result; preserve `Exception` if policy review is needed | Reopen or overwrite a closed shift |
| Device sends duplicate sequence | Deduplicate by `(company_id, device_id, client_sequence)` and idempotency key | Advance `last_sequence` twice |
| Provider or network uncertainty | Keep operation pending/needs-attention; reconcile with provider evidence | Mark the movement settled because the request was sent |
| Accounting defect discovered after commit | Post an approved reversal/adjustment and audit it | Delete or overwrite the original journal/source row |

## 5. Required pre-production recovery tests

The current contract test checks the table names, tenant links, one-open-shift index, and mutation guards. It does not execute PostgreSQL transactions. Before production application, add staging/integration tests that run against a disposable Supabase branch or PostgreSQL instance:

1. Force a dependency or policy failure midway through the migration and confirm that no new table, trigger, policy, or function remains.
2. Apply the migration twice and confirm the second application is idempotent and does not silently accept an incompatible pre-existing object.
3. Attempt two concurrent inserts for the same company/register with `status = 'Open'`; confirm exactly one succeeds.
4. Attempt cross-company branch, warehouse, register, terminal, cashier, and legacy-shift references; confirm all fail.
5. Attempt to insert a `Posted` cash movement without a journal batch; this must fail after the RRC-01 correction.
6. Attempt to update or delete a closed shift and any cash movement without the internal workflow context; confirm failure.
7. Simulate a request timeout after commit and retry the same open/close idempotency key; confirm one result and one source record.
8. Simulate device sequence `10`, replay `10`, then send `9`; confirm only the first accepted operation advances the sequence.
9. Confirm that an old application version can still read and write the legacy POS tables after the migration is present.
10. Confirm that normalized reads remain empty or explicitly flagged until the canary feature flag is enabled.

## 6. Go/no-go decision

**Current decision: NO-GO for normalized POS production writes; CONDITIONAL-GO for staging schema rehearsal.**

The migration’s transactional DDL and additive design are appropriate for a zero-downtime expand step. Production activation requires the P0 controls first: a journal-link invariant for posted cash movement and protected, idempotent shift routines. The P1 preflight and sync-sequence controls should be completed before broad rollout. Until then, the existing POS RPCs and legacy `pos_shifts`/`pos_cash_movements` path should remain the operational source, with the new tables dark and read-only.
