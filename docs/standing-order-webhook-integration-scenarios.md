# Standing Order Webhook Integration-Test Scenarios

**Status:** Test scenarios and a transactional SQL integration script are prepared. The migration and tests are not deployed or run against production.

## Test assets

| Asset | Purpose |
|---|---|
| `server/standingOrderWebhookMigration.test.ts` | Fast Vitest contract suite that verifies the migration source contains the required tables, keys, advisory lock, replay branch, conflict branch, append-only trigger, RLS, and grants |
| `supabase/tests/standing_order_webhook_migration.sql` | Disposable-database SQL integration test; inserts unresolved test evidence, checks duplicate/conflict behavior, verifies namespace isolation, verifies immutability, and rolls back all rows |
| `docs/standing-order-webhook-event-migration.sql` | Migration draft under test; not applied |

## Test environment guard

Run the SQL integration file only on an isolated or disposable database where the migration draft has already been applied. Do not point it at the live SMARTMANAGER project. The SQL file is transactional and finishes with `ROLLBACK`, but the operator must still verify the connection target before execution.

A valid service-role request context is required because the claim bridge rejects all other roles. A direct SQL harness should set `request.jwt.claims` to `{"role":"service_role"}` for the test transaction, or use a controlled test role that reproduces the same `auth.role()` behavior. The provider signature validator is not exercised by this file; `signature_verified=true` is used only after the test fixture explicitly represents a verified callback.

## Scenario matrix

| ID | Scenario | Action | Expected result |
|---|---|---|---|
| WHE-001 | First authenticated event | Claim a unique semantic fingerprint | One evidence row, one `RECEIVED` processing row, `replayed=false`, `conflict=false` |
| WHE-002 | Exact replay | Claim the same provider/account/fingerprint with a new execution UUID | Same event ID, `replayed=true`, no second evidence row, no second processing row |
| WHE-003 | Reused provider reference | Claim a different fingerprint with the same provider reference | Second evidence row retained as `CONFLICT`; processing status `NEEDS_ATTENTION`; no settlement call |
| WHE-004 | Provider-account namespace isolation | Claim the same semantic fingerprint under a different provider account | New event, not a replay; no cross-account deduplication |
| WHE-005 | Two-session duplicate race | Two independent database sessions claim the same fingerprint simultaneously | Exactly one evidence row and one processing row; both callers receive the same durable event identity or one receives the committed replay result |
| WHE-006 | Two-session conflict race | Session A claims a reference; Session B concurrently claims a different fingerprint with the same reference | Advisory lock serializes the identity; one accepted event and one conflict event; neither path creates duplicate processing for the accepted fingerprint |
| WHE-007 | Observable advisory-lock wait | Session A holds the identity lock while Session B calls the claim function | Session B blocks until Session A commits, then rechecks and returns replay/conflict based on committed evidence; no check-then-insert race |
| WHE-008 | Unknown client reference | Signed event has a valid signature but no matching outbound provider transaction | Event is retained with null tenant/run links and `RECEIVED` or reconciliation status; it cannot settle |
| WHE-009 | Tenant spoof attempt | Callback body contains or is accompanied by a forged company/run identifier | Claim API has no tenant/run input parameters; correlation is derived from the trusted provider transaction or remains unresolved |
| WHE-010 | Provider identity mismatch | Same client reference maps to an outbound row but callback UUID/reference/amount/currency differs | Event is retained for attention; settlement routine must refuse to call the financial confirmation bridge |
| WHE-011 | Evidence mutation | Attempt to update and delete an event row | Append-only trigger raises SQLSTATE `42501` for both operations |
| WHE-012 | Unverified service call | Invoke the claim bridge with `signature_verified=false` | SQLSTATE `42501`; no evidence or processing row is created |
| WHE-013 | Browser-role access | Attempt insert/update/delete/claim under `authenticated` or `anon` | Privilege denial or RLS denial; no event mutation |
| WHE-014 | Service settlement idempotency | Process one accepted event twice through the later settlement routine | Exactly one provider confirmation, one bank transaction, one journal batch, and one run transition; second attempt returns the committed result |

The included SQL file executes WHE-001 through WHE-004, WHE-011, and WHE-012. WHE-005 through WHE-010 and WHE-013/WHE-014 require the migration to be installed in a disposable database and a test harness with independent database sessions or the eventual application service.

## Two-session advisory-lock test

The following is a psql-style scenario for a disposable database. It is intentionally not executed by the repository test command and must not be run against production. Use the same provider/account/reference identity in both sessions.

### Session A: establish the first event and hold the identity lock

```sql
BEGIN;
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT pg_advisory_xact_lock(
  hashtextextended('PLUSPESA:test-merchant-account-lock:pp-ref-lock-001', 0)
);

SELECT public.bank_provider_webhook_claim(
  'PLUSPESA',
  'test-merchant-account-lock',
  NULL,
  NULL,
  'pp-ref-lock-001',
  'SM:TEST:lock-001',
  repeat('1', 64),
  repeat('2', 64),
  true,
  'test-key',
  'ACCEPTED',
  '{"reference":"pp-ref-lock-001","status":"SUCCESS","amount":1000,"currency":"TZS"}'::jsonb,
  '00000000-0000-0000-0000-000000000001'
);

SELECT pg_sleep(3);
COMMIT;
```

The explicit lock uses the same key derivation as the claim function. The claim function’s reentrant acquisition in Session A is safe within the same transaction. Holding the transaction open makes the wait observable without modifying the migration.

### Session B: call the conflicting event while Session A holds the lock

```sql
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT clock_timestamp() AS before_call;
SELECT public.bank_provider_webhook_claim(
  'PLUSPESA',
  'test-merchant-account-lock',
  NULL,
  NULL,
  'pp-ref-lock-001',
  'SM:TEST:lock-001',
  repeat('3', 64),
  repeat('4', 64),
  true,
  'test-key',
  'ACCEPTED',
  '{"reference":"pp-ref-lock-001","status":"SUCCESS","amount":1100,"currency":"TZS"}'::jsonb,
  '00000000-0000-0000-0000-000000000002'
);
SELECT clock_timestamp() AS after_call;
```

Expected behavior is that Session B waits for Session A’s commit, then observes the existing provider reference and returns `conflict=true` with `processingStatus='NEEDS_ATTENTION'`. The exact elapsed time depends on scheduling, but it should be approximately the deliberate Session A hold interval when the calls overlap.

After the call, verify in the disposable database:

```sql
SELECT count(*) AS event_count
  FROM public.bank_provider_webhook_events
 WHERE provider = 'PLUSPESA'
   AND provider_account_key = 'test-merchant-account-lock'
   AND provider_reference = 'pp-ref-lock-001';

SELECT ingest_outcome, count(*) AS count
  FROM public.bank_provider_webhook_events
 WHERE provider = 'PLUSPESA'
   AND provider_account_key = 'test-merchant-account-lock'
   AND provider_reference = 'pp-ref-lock-001'
 GROUP BY ingest_outcome
 ORDER BY ingest_outcome;
```

Expected counts are two evidence rows, one `ACCEPTED`, and one `CONFLICT`. The financial settlement routine is not called by this claim test; the accepted event remains an event-claim result until the later provider payload validation and settlement transaction completes.

## Concurrent exact-duplicate test

Run two independent sessions with identical provider, provider account, client reference, raw-body hash, and semantic fingerprint, but different execution IDs. Start them at the same time. The expected result is one evidence row and one processing row. Both calls may return the first insert result or the replay result depending on transaction timing, but neither may return two different event IDs for the same semantic fingerprint.

The verification query is:

```sql
SELECT count(*) AS event_count
  FROM public.bank_provider_webhook_events
 WHERE provider = 'PLUSPESA'
   AND provider_account_key = 'test-merchant-account-duplicate'
   AND semantic_fingerprint = repeat('a', 64);

SELECT count(*) AS processing_count
  FROM public.bank_provider_webhook_processing p
  JOIN public.bank_provider_webhook_events e ON e.id = p.event_id
 WHERE e.provider = 'PLUSPESA'
   AND e.provider_account_key = 'test-merchant-account-duplicate'
   AND e.semantic_fingerprint = repeat('a', 64);
```

Both counts must equal one. If either count exceeds one, the migration is not safe to deploy.

## Financial settlement gate

WHE-014 is deliberately separate from event claiming. The claim function only creates durable evidence and processing state. A later private service routine must lock the processing row and provider transaction, compare the provider payload against the outbound amount/currency/reference/UUID, call the existing private confirmation implementation exactly once, and commit the run, payment instruction, bank transaction, journal, Standing Order event, audit event, and processing outcome atomically.

Before WHE-014 is enabled, use a dedicated test company and a non-production provider account. Verify that a duplicate callback does not decrement an account balance twice and does not create a second journal batch. Do not use a live customer or production collection for this test.

## Success criteria

The migration is test-ready only when the Vitest contract suite passes, the transactional SQL script passes on a disposable database, the two-session duplicate and advisory-lock scenarios pass, all service-only and RLS checks pass, no raw provider body or secret is stored, and the later financial settlement test proves exactly-once accounting behavior. Until then, the provider adapter must remain disabled.

**Author:** Manus AI
