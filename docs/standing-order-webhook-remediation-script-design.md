# Automated Webhook Quarantine Remediation and Dead-Letter Drain Design

**Status:** Design only. No worker, queue-drain RPC, feature flag, provider-account pause, or production mutation has been deployed.

**Scope:** SMARTMANAGER provider webhook processing for Standing Orders. The design covers quarantine-flood containment, dead-letter classification, safe requeue, bounded reconciliation, service-only processing, circuit breakers, resumability, and auditability.

## 1. Current-state boundary

The proposed webhook migration provides an immutable `bank_provider_webhook_events` evidence table and a mutable `bank_provider_webhook_processing` cursor with `RECEIVED`, `PROCESSING`, `PROCESSED`, `DUPLICATE`, `NEEDS_ATTENTION`, and `FAILED` states. A dedicated dead-letter table and remediation control plane do not yet exist. In this design, an item is considered dead-lettered when it is `NEEDS_ATTENTION`, or when it is `FAILED` after the allowed retry count; this must not be implemented by deleting or editing immutable evidence.

The remediation worker is not a settlement engine. It may classify and requeue a message, but it may not directly update balances, bank transactions, journals, Standing Order status, provider references, or payment-instruction settlement fields. Any financial mutation must use the normal service-only provider webhook processor, which must re-check provider identity, tenant correlation, amount, currency, state, and idempotency inside one database transaction.

## 2. Execution options

The existing production architecture already uses a Supabase Edge Function and `pg_cron`. The remediation path should remain server-side and provider-account scoped. Two viable execution models are:

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| **Supabase Edge Function invoked by controlled `pg_cron` or an operator endpoint** | Keeps the worker next to the current service-only bridge, uses the existing deployment boundary, and supports bounded batches. It must remain stateless and rely on durable leases. | Incremental platform usage; no separate worker host | Lower, because the scheduler and service bridge already exist |
| **Managed application worker with a scheduled job** | Offers richer queue telemetry and longer-running drain control, but introduces another deployment, secret boundary, and failure mode. It must still call only service-only RPCs. | Application hosting and job usage | Higher, because worker deployment, approval flow, and monitoring must be added |

This document targets the first option because it aligns with the deployed scheduler architecture. The choice does not authorize deployment; the worker must still be disabled until the migration, control-plane RPCs, provider adapter, and approval workflow exist.

## 3. Command contract

The remediation command should expose only explicit provider-account scope and conservative caps:

```text
standing-order-webhook-remediate \
  --provider PLUSPESA \
  --provider-account ACCOUNT_KEY \
  --environment staging|production \
  --mode dry-run|requeue-only|drain-safe-settlements \
  --max-items 25 \
  --max-settlements 0 \
  --approval-id UUID
```

The defaults are `dry-run`, 25 total items, and zero settlements. Production mutation requires an approval ID scoped to the provider, provider-account key, environment, and expiry time. The command must refuse empty or wildcard provider-account values, unknown providers, limits above policy, production without approval, and any delete/truncate/rewrite operation.

A confirmation token should be supplied by the deployment system rather than typed into shell history. It must be bound to the same drain-run ID and expire quickly. Browser users must never be able to invoke this command or supply a service-role credential.

## 4. Drain-run lifecycle

Every invocation creates one durable drain-run record. The minimum fields are `id`, provider, provider-account key, environment, mode, status, approval ID, requested-by identity, maximum items, maximum settlements, lease duration, execution ID, timestamps, counters, and stop reason.

The lifecycle is:

```text
OPEN → PAUSED → OPEN → COMPLETED
  │       └───────→ ABORTED
  └───────────────→ FAILED
```

The provider account is paused for automated settlement before a mutating drain starts. Authenticated evidence intake remains enabled so incoming callbacks are retained. A dry-run does not pause settlement unless the operator explicitly requests an inspection pause.

The worker obtains a provider-account advisory lock before opening a mutating run. A second run for the same provider/account must return `already_running` and must not process another batch. A run for a different provider account may proceed independently unless a global incident circuit breaker is active.

## 5. Item state and classification

The worker leases only eligible items whose `lease_until` is null or expired, whose `processing_status` is `RECEIVED` or `FAILED`, or whose remediation state is explicitly eligible for review. `NEEDS_ATTENTION` is never requeued merely because it is old.

Each item is classified using the immutable event, processing cursor, trusted outbound provider transaction, related Standing Order run, and provider status query where required. A classification result must include a reason code, identity-match result, accounting-preflight result, expected attempt number, and whether automatic settlement is permitted.

| Classification | Conditions | Automated disposition |
|---|---|---|
| `SAFE_RETRY` | Signature was verified; no identity conflict; no financial outcome exists; failure is transient; attempt and age caps are not exceeded | Requeue through the normal service processor |
| `SAFE_RECONCILE` | Provider status query confirms terminal state and exact identity/amount/currency match; no financial outcome exists | Requeue through the normal service processor |
| `DUPLICATE` | Same semantic fingerprint already has a committed outcome, or audit proves one existing posting | Mark processing cursor `DUPLICATE`; never post again |
| `CONFLICT` | Provider reference, UUID, event ID, client reference, amount, currency, or status conflicts | Keep `NEEDS_ATTENTION`; no automatic settlement |
| `UNCORRELATED` | Signed event has no trusted outbound transaction | Keep unresolved; bounded correlation retry only |
| `FIELD_MISMATCH` | Trusted outbound record exists but callback fields do not match exactly | Quarantine; provider/finance review required |
| `PROVIDER_UNKNOWN` | Provider status is unavailable, contradictory, or unsupported | Keep dead-lettered; no settlement |
| `SECRET_SUSPECTED` | Unexpected key-version use or signature anomaly suggests credential exposure | Pause account and start secret-rotation procedure |

A `SAFE_RETRY` decision must also prove that the related run is still eligible, the provider transaction is not terminally settled, no bank transaction or journal exists for the run, the payment instruction is not already confirmed, and the event is not in a conflict state. If any check is unknown, the item remains quarantined.

## 6. Required service-only RPCs

The script must not issue direct table writes. Add a private implementation and service-role-only public bridges in a follow-up migration. All functions must be `SECURITY INVOKER`, use pinned search paths, check `auth.role() = 'service_role'`, and grant execution only to `service_role`.

```sql
public.bank_webhook_remediation_open(
  p_provider text,
  p_provider_account_key text,
  p_environment text,
  p_mode text,
  p_max_items integer,
  p_max_settlements integer,
  p_approval_id uuid,
  p_execution_id uuid
) returns jsonb
```

The open function validates provider/account scope, environment, mode, caps, approval, and existing runs; acquires the provider-account lock; pauses downstream settlement for a mutating run; and creates the drain record.

```sql
public.bank_webhook_remediation_lease(
  p_drain_run_id uuid,
  p_limit integer
) returns jsonb
```

The lease function selects with `FOR UPDATE SKIP LOCKED`, increments a bounded remediation attempt counter, sets `lease_until`, and returns only event IDs and redacted metadata. It must not return raw payloads, secrets, complete signatures, PINs, or complete MSISDNs.

```sql
public.bank_webhook_remediation_classify(
  p_drain_run_id uuid,
  p_event_id uuid
) returns jsonb
```

The classify function locks the evidence cursor, provider transaction, and Standing Order run in a consistent order and returns a deterministic classification. It must not post or change balances.

```sql
public.bank_webhook_remediation_requeue(
  p_drain_run_id uuid,
  p_event_id uuid,
  p_expected_attempt integer,
  p_classification text,
  p_next_attempt_at timestamptz
) returns jsonb
```

The requeue function accepts only `SAFE_RETRY` and `SAFE_RECONCILE`, verifies the lease and expected attempt, and is idempotent for the same drain run/event/attempt. It must reject `CONFLICT`, `FIELD_MISMATCH`, `UNCORRELATED`, `PROVIDER_UNKNOWN`, and `SECRET_SUSPECTED`.

```sql
public.bank_webhook_remediation_process(
  p_drain_run_id uuid,
  p_event_id uuid,
  p_allow_settlement boolean
) returns jsonb
```

The process function delegates to the normal service-only webhook processor. It may set `p_allow_settlement=true` only for an approved `DRAIN_SAFE_SETTLEMENTS` run whose environment, provider account, and approval are valid. It must return redacted event, provider transaction, run, bank transaction, journal, and outcome IDs for audit correlation.

```sql
public.bank_webhook_remediation_close(
  p_drain_run_id uuid,
  p_status text,
  p_stop_reason text
) returns jsonb
```

The close function records counters and outcome, releases the provider-account lock at transaction completion, and resumes normal settlement only for a clean completed run. `PAUSED`, `ABORTED`, and `FAILED` runs leave the provider account paused until an authorized operator resumes it.

## 7. Reference control flow

```ts
async function remediate(args: RemediationArgs): Promise<DrainSummary> {
  validateArgsFailClosed(args);
  const executionId = crypto.randomUUID();
  const run = await openDrainRun(args, executionId);

  try {
    while (run.claimedCount < args.maxItems) {
      const remaining = args.maxItems - run.claimedCount;
      const batch = await leaseBatch(run.id, Math.min(10, remaining));
      if (batch.length === 0) break;

      for (const item of batch) {
        const classification = await classify(run.id, item.eventId);
        recordRedactedClassification(run, item, classification);

        if (classification.kind === "DUPLICATE") {
          await closeDuplicate(run.id, item.eventId);
          continue;
        }
        if (!isSafeClassification(classification)) {
          await keepQuarantined(run.id, item.eventId, classification.reasonCode);
          continue;
        }
        if (classification.accountingPreflight !== "CLEAR") {
          await keepQuarantined(run.id, item.eventId, "accounting_preflight_not_clear");
          continue;
        }

        await requeue(
          run.id,
          item.eventId,
          classification.expectedAttempt,
          classification.kind,
        );

        const allowSettlement =
          args.mode === "drain-safe-settlements" &&
          args.environment === "production" &&
          Boolean(args.approvalId);

        const outcome = await processThroughNormalServicePath(
          run.id,
          item.eventId,
          allowSettlement,
        );
        recordRedactedOutcome(run, item, outcome);

        if (
          outcome.duplicatePostingDetected ||
          outcome.identityConflict ||
          outcome.amountMismatch ||
          outcome.currencyMismatch
        ) {
          await abortDrain(run.id, "financial_safety_breach");
          throw new Error("Remediation circuit breaker opened");
        }
        if (outcome.status === "FAILED") {
          await abortDrain(run.id, "normal_processor_failure");
          throw new Error("Remediation circuit breaker opened");
        }
        if (run.settledCount >= args.maxSettlements) {
          await pauseDrain(run.id, "settlement_cap_reached");
          return summary(run);
        }
      }
    }

    await closeDrain(run.id, "COMPLETED", null);
    return summary(run);
  } catch (error) {
    await abortDrain(run.id, redactError(error));
    throw error;
  }
}
```

The worker must never catch an error and continue silently. A failed RPC, stale lease, provider authentication failure, or unexpected response opens the circuit breaker or leaves the item quarantined. It must not create a new provider collection during remediation.

## 8. Circuit breakers and hard caps

The following conditions stop the current run and leave the provider account paused:

| Condition | Default stop rule |
|---|---|
| Duplicate financial posting | Any occurrence |
| Amount/currency/identity mismatch reaching processing | Any occurrence |
| New provider-reference conflict during a drain | Any occurrence |
| Processing failures | More than 1 in a batch of 10 or more than 5% with at least 20 items |
| Queue growth | Open quarantine count increases after two consecutive batches |
| Lease churn | More than 3 expired leases for one event in one run |
| Provider status inconsistency | Any contradictory identity or unsupported terminal status |
| Provider status timeout | More than 20% of status queries in a batch |
| Security anomaly | Invalid signature pattern, unexpected key version, or suspected secret exposure |
| Run limits | 15 minutes, 100 items, or 25 settlement attempts |
| Approval problem | Missing, expired, revoked, or scope-mismatched approval |

A hard cap is not a failure. Reaching the cap pauses the run and produces a resumable summary. The next run must use a new drain-run ID and, for production settlement, a fresh approval.

## 9. Dead-letter draining procedure

The first pass is always `DRY_RUN`. It leases no more than 25 items, classifies them, and reports counts by reason without requeueing or settling. The operator reviews the report for reference conflicts, uncorrelated items, provider status failures, and already-posted outcomes.

The second pass is `REQUEUE_ONLY` with zero settlement allowance. It may requeue only `SAFE_RETRY` and `SAFE_RECONCILE` items, and the normal processor must still run with settlement disabled or in a non-production environment. The worker pauses on any new conflict or processing error.

The third pass is `DRAIN_SAFE_SETTLEMENTS`, permitted only for a dedicated test tenant first and then for production with two-person approval. Start with at most 5 settlement attempts. Increase only after two consecutive clean batches, no duplicate accounting result, no new conflict, and successful provider reconciliation.

Items classified as `CONFLICT`, `FIELD_MISMATCH`, `SECRET_SUSPECTED`, or `PROVIDER_UNKNOWN` are never automatically drained. They remain quarantined with an owner and review deadline. `UNCORRELATED` events may be revisited after the outbound provider transaction is durably persisted, but the worker must not infer tenant ownership from a phone number or free-text field.

## 10. Idempotency and crash recovery

The drain-run ID, event ID, expected attempt, semantic fingerprint, and provider-account advisory lock form the remediation idempotency key. If the worker crashes after requeue but before processing, a later run sees the durable cursor and re-evaluates the event; it must not increment the attempt counter without a fresh lease.

If the worker crashes after the normal processor commits settlement but before the remediation command receives the response, the next attempt must query the durable provider transaction and accounting outcome first. It must return `DUPLICATE`/already-settled and never call the posting routine again.

If a lease expires while processing is still running, the normal service processor’s own idempotency key remains authoritative. The remediation worker must not force a second settlement solely because a lease expired. A stale lease is a reason to classify and reconcile, not a reason to replay blindly.

## 11. Observability and audit

Emit one redacted structured record for each drain run, batch, classification, requeue, process result, circuit-breaker event, and close/abort action. Required fields are `executionId`, `drainRunId`, provider, provider-account key, mode, environment, event ID, classification, reason code, attempt, outcome, latency, and stop reason. Do not log raw webhook bodies, secrets, complete signatures, complete MSISDNs, or provider API credentials.

Required metrics are `remediation_runs_total`, `remediation_items_claimed_total`, `remediation_items_classified_total`, `remediation_items_requeued_total`, `remediation_items_quarantined_total`, `remediation_settlements_total`, `remediation_circuit_breakers_total`, `remediation_lease_expired_total`, and `remediation_oldest_open_item_seconds`. All metrics must be scoped by provider, non-secret provider-account key, environment, mode, and classification.

Every mutation must write an audit event with the drain-run ID and approval ID. The audit event must identify whether the outcome was dry-run, requeue-only, duplicate closure, quarantine retention, or service-only settlement. Evidence rows remain append-only.

## 12. Rollback and incident containment

There is no rollback that deletes a financial posting. If any duplicate posting, identity mismatch, or incorrect settlement is detected, stop the provider account and escalate to finance, security, and engineering owners. Use the institution’s controlled reversal and accounting-review process; do not issue compensating SQL updates from the remediation script.

For non-financial errors, abort the drain, leave evidence untouched, correct the provider or correlation problem, and start a new run with a new approval. Never resume a failed run by resetting its counters or clearing its stop reason.

The account may resume only when the quarantine backlog is below the approved operational threshold, no critical alert has fired for at least 30 minutes, every remaining item has an owner, no duplicate transaction or journal exists, a controlled test callback succeeds, and engineering plus MFI/finance operations approve resumption.

## 13. Required tests before enablement

Before enabling any automated mutation, test the worker against a disposable database with identical duplicate leases, concurrent drain runs, advisory-lock contention, stale approvals, expired leases, idempotent requeue, provider identity conflicts, amount/currency mismatch, provider status timeout, queue growth, and circuit-breaker recovery.

Run provider sandbox tests for terminal success, terminal failure, repeated callback, delayed status, unknown reference, corrected status, secret rotation, and provider retry. Run a dedicated financial test proving one provider reference produces at most one bank transaction and one journal batch, while every conflict remains outside the financial confirmation routine.

## 14. Deployment gates

The design is ready for implementation only after the provider is confirmed, the event migration is applied and validated, the remediation control-plane migration is separately reviewed, metrics and alerts are present, the provider account pause/kill switch is tested, the provider status adapter is configured server-side, and the worker passes the disposable-database and sandbox scenarios.

The first production mode must be `DRY_RUN`. Production safe settlement requires an explicit approval ID, a test-tenant rehearsal, a two-person approval, small hard caps, and an observation period. Legacy authenticated provider-confirmation grants must not be revoked as part of remediation; they can be decommissioned only after the server broker/router cutover and stable observation period.

**Author:** Manus AI
