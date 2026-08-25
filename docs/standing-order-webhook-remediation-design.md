# Standing Order Webhook Quarantine-Flood Remediation Design

**Status:** Design only. No remediation worker, queue-drain RPC, feature flag, or production behavior has been deployed.

**Purpose:** Provide an automated but fail-closed way to contain a provider webhook quarantine flood, classify dead-letter items, requeue only demonstrably safe transient cases, and drain the queue through the same idempotent service-only settlement path.

## 1. Non-negotiable safety rule

The remediation worker is not a second settlement engine. It may classify, lease, reconcile, requeue, or close webhook processing items, but it must never directly update balances, bank transactions, journals, Standing Order status, or provider references. Any financial mutation must pass through the existing private provider-confirmation implementation after all normal provider, tenant, amount, currency, identity, state, and idempotency checks succeed.

The current webhook migration draft has `RECEIVED`, `PROCESSING`, `PROCESSED`, `DUPLICATE`, `NEEDS_ATTENTION`, and `FAILED` processing states. It does not yet have a deployed dead-letter queue or remediation control plane. The design below therefore requires a follow-up migration and private service RPCs before a drain script can run. It must not be implemented by issuing ad hoc updates from a shell script.

## 2. Recommended operating model

Use a short-lived, server-side remediation command invoked by an operator or a controlled scheduled worker. It should run in dry-run mode by default. The command acquires one provider-account remediation lock, opens a durable drain-run record, leases bounded batches with `FOR UPDATE SKIP LOCKED`, classifies each item, and acts only on allowlisted safe classes. Every action is idempotent and carries a `drain_run_id` and `execution_id` into the audit trail.

The worker should be deployed with the application’s server-side runtime or a managed background job. It must not run from the default sandbox as a persistent process, and it must not receive browser credentials. Provider API credentials and database service credentials remain server-side. A five-minute or slower scheduled invocation is adequate for controlled draining; a continuous high-frequency polling loop is not required.

```text
alert / operator approval
          │
          ▼
remediation command: DRY_RUN by default
          │
          ├── acquire provider-account lock
          ├── pause downstream settlement for affected account
          ├── lease bounded queue batch
          ├── classify against durable evidence + provider status
          ├── requeue only SAFE_RETRY / SAFE_RECONCILE
          ├── invoke normal service-only webhook processor
          ├── verify exactly-once outcome
          └── stop on any circuit-breaker condition
```

## 3. Queue and drain-run control records

The existing `bank_provider_webhook_processing` table can hold the processing cursor, but the drain itself needs a durable run record. Add a follow-up table such as `bank_provider_webhook_drain_runs` only after the schema name is approved and absent from the target database.

| Field | Required behavior |
|---|---|
| `id` | UUID drain-run identifier |
| `provider` | Provider adapter name |
| `provider_account_key` | Non-secret merchant-account scope |
| `environment` | `staging` or `production`; production requires an approval token |
| `mode` | `DRY_RUN`, `REQUEUE_ONLY`, or `DRAIN_SAFE_SETTLEMENTS` |
| `status` | `OPEN`, `PAUSED`, `COMPLETED`, `ABORTED`, or `FAILED` |
| `requested_by` | Non-secret operator/service identity |
| `approval_id` | Required for production mutations and safe settlements |
| `max_items` | Hard per-run cap, default 25, maximum 100 |
| `max_settlements` | Hard per-run financial-posting cap, default 10, maximum 25 |
| `lease_seconds` | Bounded lease, default 120 seconds, maximum 600 seconds |
| `started_at`, `finished_at` | UTC lifecycle timestamps |
| `claimed_count`, `requeued_count`, `settled_count`, `quarantined_count`, `failed_count` | Monotonic counters |
| `stop_reason` | Redacted circuit-breaker reason |
| `execution_id` | Correlates logs and audit records |

Add `drain_run_id`, `classification`, `quarantine_reason`, `last_remediation_at`, and `remediation_attempt_count` to a separate mutable remediation table keyed by `event_id`, or add them to the processing cursor only through a reviewed migration. Do not mutate immutable webhook evidence to record remediation attempts.

Suggested remediation states are:

```text
UNCLASSIFIED → SAFE_RETRY → LEASED → REQUEUED → PROCESSED
             ↘ SAFE_RECONCILE → LEASED → PROCESSED
             ↘ DUPLICATE → CLOSED
             ↘ CONFLICT / MANUAL_REVIEW / SECRET_SUSPECTED → CLOSED_BY_REVIEW
```

A dead-letter item is not deleted when drained. Its evidence and processing history remain queryable, and the drain-run record links the remediation decision to the resulting event and settlement outcome.

## 4. Classification policy

The classifier must use only durable evidence, the trusted outbound provider transaction, the current processing state, and a provider status query performed through the approved provider adapter. It must not classify from a customer phone number, operator-supplied company ID, or free-text error message alone.

| Classification | Automated action | Financial permission |
|---|---|---|
| `SAFE_RETRY` | Requeue through the normal processor when the failure was transient and no financial mutation occurred | May settle only with production approval, exact identity match, and all settlement gates |
| `SAFE_RECONCILE` | Refresh provider status, then requeue only if the response matches the outbound record exactly | May settle only through the normal service-only bridge |
| `DUPLICATE` | Mark processing cursor `DUPLICATE` if the same semantic fingerprint already produced a committed outcome | Never post again |
| `CONFLICT` | Keep `NEEDS_ATTENTION`; stop automatic handling for the item and likely pause the provider account | Never settle automatically |
| `FIELD_MISMATCH` | Keep quarantined; require provider and finance review | Never settle automatically |
| `UNCORRELATED` | Leave unresolved until a trusted outbound transaction appears; bounded reconciliation only | Never infer tenant/run; never settle from callback alone |
| `INVALID_SIGNATURE` | Do not create or requeue an event; investigate telemetry and provider configuration | Never settle |
| `SECRET_SUSPECTED` | Pause account and rotate credentials through approved procedure | Never settle |
| `ALREADY_SETTLED` | Mark duplicate only after audit confirms exactly one existing bank transaction/journal outcome | Never post again |
| `UNKNOWN_PROVIDER_STATE` | Keep dead-lettered and request provider status/manual review | Never settle |

A `SAFE_RETRY` decision requires all of the following: the signature was verified; provider, provider-account scope, client reference, UUID/reference, amount, and currency match the outbound provider transaction; the provider transaction is not already terminally settled; no bank transaction or journal is linked to the run; the Standing Order run remains eligible for provider confirmation; the item has not exceeded the retry cap; the event is not a conflict; and the provider status response is terminal and consistent where a status query is required.

## 5. Exact service-only RPC boundaries

The remediation worker should call a small set of narrowly scoped service-only RPCs. These are design contracts and must be implemented in a private schema with `SECURITY INVOKER`, pinned search paths, explicit `auth.role() = 'service_role'` checks, and no browser-role execution.

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

This function validates the environment, mode, caps, and approval requirement; acquires the provider-account remediation lock; pauses downstream settlement for the selected account; and creates a drain-run row. It must not delete or mutate webhook evidence.

```sql
public.bank_webhook_remediation_lease(
  p_drain_run_id uuid,
  p_limit integer
) returns jsonb
```

This function selects eligible `RECEIVED`, `FAILED`, or dead-letter remediation rows with `FOR UPDATE SKIP LOCKED`, requires the drain run to be open, sets a bounded lease, increments the remediation attempt counter, and returns only event IDs plus redacted classification inputs. It must never return raw payloads or secrets.

```sql
public.bank_webhook_remediation_classify(
  p_drain_run_id uuid,
  p_event_id uuid
) returns jsonb
```

This function locks the event, processing cursor, provider transaction, and related Standing Order run in a consistent order, then returns one of the classifications above. It must reject a stale lease and must not perform financial posting.

```sql
public.bank_webhook_remediation_requeue(
  p_drain_run_id uuid,
  p_event_id uuid,
  p_expected_attempt integer,
  p_classification text,
  p_next_attempt_at timestamptz
) returns jsonb
```

This function may requeue only `SAFE_RETRY` or `SAFE_RECONCILE`, only while the drain run is open, only when the lease and expected attempt match, and only after all identity and accounting-preflight checks pass. It must be idempotent: re-running with the same drain run, event, and expected attempt returns the prior result rather than incrementing the queue again.

```sql
public.bank_webhook_remediation_process(
  p_drain_run_id uuid,
  p_event_id uuid,
  p_allow_settlement boolean
) returns jsonb
```

This function delegates to the existing normal service-only webhook processor. It must enforce `p_allow_settlement = true` only for `DRAIN_SAFE_SETTLEMENTS` runs with a valid production approval. The function must return the resulting event status, provider transaction status, Standing Order run status, bank transaction ID if created, and journal ID if created, without returning secrets or raw payloads.

```sql
public.bank_webhook_remediation_close(
  p_drain_run_id uuid,
  p_status text,
  p_stop_reason text
) returns jsonb
```

This function closes or pauses the run, releases the provider-account lock through transaction completion, resumes normal settlement only when the run completed without a circuit-breaker condition, and writes the audit outcome. A failed or aborted run leaves the provider account paused until an authorized operator resumes it.

## 6. Remediation script contract

The command should expose a narrow interface and reject ambiguous invocations:

```text
standing-order-webhook-remediate \
  --provider PLUSPESA \
  --provider-account ACCOUNT_KEY \
  --environment staging|production \
  --mode dry-run|requeue-only|drain-safe-settlements \
  --max-items 25 \
  --max-settlements 10 \
  --approval-id UUID
```

Defaults are `--mode dry-run`, `--max-items 25`, and `--max-settlements 0`. Production requires `--approval-id`, an explicit provider-account allowlist, and a separate confirmation environment variable supplied by the deployment system rather than typed into a shell history. The command must refuse provider-account wildcards, missing provider names, limits above policy, production mode without approval, and any request to delete or rewrite event evidence.

Implementation outline:

```ts
async function remediate(args: Args): Promise<Summary> {
  validateArgs(args);                    // fail closed; dry-run default
  const executionId = crypto.randomUUID();
  const run = await openRun(args, executionId);

  try {
    while (run.claimedCount < args.maxItems) {
      const batch = await leaseBatch(run.id, Math.min(10, args.maxItems - run.claimedCount));
      if (batch.length === 0) break;

      for (const item of batch) {
        const classification = await classify(run.id, item.eventId);

        if (classification.kind === "DUPLICATE") {
          await closeDuplicate(run.id, item.eventId);
          continue;
        }
        if (classification.kind !== "SAFE_RETRY" && classification.kind !== "SAFE_RECONCILE") {
          await keepQuarantined(run.id, item.eventId, classification.reason);
          continue;
        }
        if (!classification.identityMatch || classification.accountingPreflight !== "CLEAR") {
          await keepQuarantined(run.id, item.eventId, "preflight_not_clear");
          continue;
        }

        await requeue(run.id, item.eventId, classification.expectedAttempt, classification.kind);

        const allowSettlement =
          args.mode === "drain-safe-settlements" && args.environment === "production";
        const result = await processThroughNormalServicePath(
          run.id,
          item.eventId,
          allowSettlement,
        );
        recordRedactedOutcome(result);

        if (result.duplicatePostingDetected || result.identityConflict || result.amountMismatch) {
          await abortRun(run.id, "financial_safety_breach");
          throw new Error("Remediation circuit breaker opened");
        }
        if (result.status === "FAILED") {
          await abortRun(run.id, "processing_failure");
          throw new Error("Remediation circuit breaker opened");
        }
        if (run.settledCount >= args.maxSettlements) {
          await pauseRun(run.id, "settlement_cap_reached");
          return summary(run);
        }
      }
    }
    await closeRun(run.id, "COMPLETED");
    return summary(run);
  } catch (error) {
    await abortRun(run.id, redactError(error));
    throw error;
  }
}
```

The actual implementation should call only the service RPCs, not issue table writes from TypeScript. The provider status adapter may make outbound status queries, but it must use server-side credentials, timeouts, bounded retries, and the stored provider reference. It must not create a new collection during remediation.

## 7. Circuit breakers

The worker must stop the current drain run and keep the provider account paused when any condition below occurs:

| Circuit breaker | Default stop condition |
|---|---|
| Financial safety | Any duplicate bank transaction, journal duplication, amount/currency mismatch, or attempted settlement of a conflict |
| Error rate | More than 1 failed processing item in a batch of 10, or more than 5% failures in a run with at least 20 items |
| Conflict rate | Any new provider-reference conflict during a drain, or more than 1 existing conflict in a batch |
| Queue growth | Open quarantine count increases after two consecutive batches |
| Lease churn | More than 3 expired leases for the same event in one run |
| Provider status | Provider status endpoint returns inconsistent identity, unsupported status, timeout rate above 20%, or authentication failure |
| Time/cap | Run exceeds 15 minutes, 100 total items, or 25 settlement attempts |
| Approval | Approval missing, expired, revoked, or not scoped to the provider account/environment |
| Secret/security | Invalid signature pattern, unexpected previous-key use, or suspected callback/API-secret exposure |

A circuit breaker must be durable, visible in the drain-run record, and safe to retry after investigation. It must not silently fall back to a broader provider scope.

## 8. Quarantine-flood response sequence

When the alert threshold is reached, the automation first pauses downstream settlement for the affected provider account but continues authenticated evidence intake. It then opens a dry-run drain and produces a bounded classification report. The report must include counts by classification, oldest item age, provider/account scope, event IDs, provider-reference hashes or redacted references, and whether any bank transaction is already linked. It must not include raw payloads or secrets.

Only after the dry-run report is reviewed may an authorized operator open `REQUEUE_ONLY` or `DRAIN_SAFE_SETTLEMENTS`. The first applied run should be capped at 10 items and zero automatic settlements. If all ten classify cleanly and no circuit breaker fires, a second run may enable safe settlements with a production approval and a cap of 5. Gradually increase the cap only after observing two clean batches.

## 9. Recovery and rollback

There is no rollback that reverses an accounting posting by deleting a row. If a settlement was incorrectly posted, stop remediation and invoke the institution’s controlled reversal and accounting-review process. The remediation worker must never attempt a compensating SQL update.

For non-financial queue errors, recovery means pausing the run, leaving evidence intact, correcting the provider/correlation/configuration issue, and reopening a new drain run with a new approval ID. A new drain run must not reuse a stale lease or silently retry an item whose classification has changed.

The provider account may be resumed only when the quarantine backlog is below the approved threshold, no critical alert has fired for at least 30 minutes, all remaining items have an owner, no duplicate posting exists, a controlled sandbox/test-tenant callback succeeds, and engineering plus MFI/finance operations approve resumption.

## 10. Required tests before automation is enabled

The remediation script requires disposable-database tests for duplicate leases, concurrent drain runs, advisory-lock serialization, stale approval, expired lease, idempotent requeue, provider status mismatch, conflict quarantine, queue growth, and circuit-breaker recovery. It requires provider sandbox tests for a valid terminal success, terminal failure, repeated callback, delayed status, unknown reference, and corrected provider response.

Financial tests must prove that a safe drain creates at most one bank transaction and one journal batch for a provider reference, that a duplicate event creates no second posting, and that a conflict never reaches the financial confirmation routine. All tests must use a dedicated test company and non-production provider account.

## 11. Deployment order

1. Confirm the real provider and provider-account scope.
2. Apply and validate the webhook event migration separately.
3. Add the drain-run/remediation schema and service-only RPCs with RLS and grant tests.
4. Add metrics and alert dashboards before enabling mutation mode.
5. Deploy the script with dry-run as the only default.
6. Run dry-run against a disposable or staging queue.
7. Run `REQUEUE_ONLY` with zero settlement allowance.
8. Run a controlled test-tenant safe settlement with explicit approval.
9. Observe two clean batches and provider reconciliation.
10. Enable gradual production draining with hard caps and the kill switch available.

**Author:** Manus AI
