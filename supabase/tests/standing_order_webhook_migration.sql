-- Transactional integration test for the proposed webhook-event migration.
--
-- Preconditions:
--   1. Run only against an isolated/disposable database where the proposed
--      migration has already been applied.
--   2. Connect with a role allowed to execute the service-only bridge, or run
--      as an authorized test harness that sets request.jwt.claims below.
--   3. Do not run against production. The test intentionally inserts evidence
--      rows and relies on ROLLBACK for cleanup.
--
-- Example invocation through a controlled staging connection:
--   psql "$WEBHOOK_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f supabase/tests/standing_order_webhook_migration.sql
--
-- The script tests event claiming only. It does not call the financial
-- confirmation routine and cannot post a transaction.

BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- The service-only SQL boundary checks auth.role(). A direct SQL harness must
-- provide the same claim context that the service-key REST request supplies.
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);

CREATE TEMP TABLE webhook_test_results (
  test_name text PRIMARY KEY,
  result jsonb NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE
  v_first jsonb;
  v_replay jsonb;
  v_conflict jsonb;
  v_other_account jsonb;
  v_execution uuid;
  v_event_count integer;
  v_processing_count integer;
  v_conflict_count integer;
  v_replay_count integer;
  v_other_account_count integer;
  v_same_fingerprint text := repeat('a', 64);
  v_conflict_fingerprint text := repeat('b', 64);
  v_other_account_fingerprint text := repeat('a', 64);
  v_raw_hash text := repeat('c', 64);
BEGIN
  -- First authenticated event: no provider transaction is supplied, so the
  -- event remains durably unresolved and cannot settle. This isolates claim,
  -- replay, and conflict behavior from financial data.
  v_execution := extensions.gen_random_uuid();
  v_first := public.bank_provider_webhook_claim(
    'PLUSPESA',
    'test-merchant-account-a',
    NULL,
    NULL,
    'pp-ref-claim-001',
    'SM:TEST:claim-001',
    v_raw_hash,
    v_same_fingerprint,
    true,
    'test-key',
    'ACCEPTED',
    '{"reference":"pp-ref-claim-001","status":"SUCCESS","amount":1000,"currency":"TZS"}'::jsonb,
    v_execution
  );
  IF coalesce((v_first->>'replayed')::boolean, true) THEN
    RAISE EXCEPTION 'first claim unexpectedly reported replay: %', v_first;
  END IF;
  IF coalesce((v_first->>'conflict')::boolean, true) THEN
    RAISE EXCEPTION 'first claim unexpectedly reported conflict: %', v_first;
  END IF;
  INSERT INTO webhook_test_results VALUES ('first_claim', v_first);

  -- Exact semantic replay with a different execution ID must return the same
  -- durable event and must not create another evidence or processing row.
  v_replay := public.bank_provider_webhook_claim(
    'PLUSPESA',
    'test-merchant-account-a',
    NULL,
    NULL,
    'pp-ref-claim-001',
    'SM:TEST:claim-001',
    v_raw_hash,
    v_same_fingerprint,
    true,
    'test-key',
    'ACCEPTED',
    '{"currency":"TZS","amount":1000,"status":"SUCCESS","reference":"pp-ref-claim-001"}'::jsonb,
    extensions.gen_random_uuid()
  );
  IF coalesce((v_replay->>'replayed')::boolean, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'exact replay was not reported as replayed: %', v_replay;
  END IF;
  INSERT INTO webhook_test_results VALUES ('exact_replay', v_replay);

  -- Same provider reference, different semantic fingerprint must be retained
  -- as a conflict and must not become a RECEIVED processing item.
  v_conflict := public.bank_provider_webhook_claim(
    'PLUSPESA',
    'test-merchant-account-a',
    NULL,
    NULL,
    'pp-ref-claim-001',
    'SM:TEST:claim-001',
    repeat('d', 64),
    v_conflict_fingerprint,
    true,
    'test-key',
    'ACCEPTED',
    '{"reference":"pp-ref-claim-001","status":"SUCCESS","amount":1100,"currency":"TZS"}'::jsonb,
    extensions.gen_random_uuid()
  );
  IF coalesce((v_conflict->>'conflict')::boolean, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'reference conflict was not detected: %', v_conflict;
  END IF;
  IF (v_conflict->>'processingStatus') IS DISTINCT FROM 'NEEDS_ATTENTION' THEN
    RAISE EXCEPTION 'reference conflict was not quarantined: %', v_conflict;
  END IF;
  INSERT INTO webhook_test_results VALUES ('reference_conflict', v_conflict);

  -- The same semantic fingerprint in another provider-account namespace is a
  -- distinct event, not a replay of account A.
  v_other_account := public.bank_provider_webhook_claim(
    'PLUSPESA',
    'test-merchant-account-b',
    NULL,
    NULL,
    'pp-ref-account-b-001',
    'SM:TEST:account-b-001',
    repeat('e', 64),
    v_other_account_fingerprint,
    true,
    'test-key',
    'ACCEPTED',
    '{"reference":"pp-ref-account-b-001","status":"SUCCESS","amount":1000,"currency":"TZS"}'::jsonb,
    extensions.gen_random_uuid()
  );
  IF coalesce((v_other_account->>'replayed')::boolean, true) THEN
    RAISE EXCEPTION 'provider-account namespace was incorrectly deduplicated: %', v_other_account;
  END IF;
  INSERT INTO webhook_test_results VALUES ('account_namespace', v_other_account);

  SELECT count(*) INTO v_event_count
    FROM public.bank_provider_webhook_events
   WHERE provider = 'PLUSPESA'
     AND provider_account_key IN ('test-merchant-account-a', 'test-merchant-account-b');
  IF v_event_count <> 3 THEN
    RAISE EXCEPTION 'expected 3 evidence rows, found %', v_event_count;
  END IF;

  SELECT count(*) INTO v_processing_count
    FROM public.bank_provider_webhook_processing p
    JOIN public.bank_provider_webhook_events e ON e.id = p.event_id
   WHERE e.provider = 'PLUSPESA'
     AND e.provider_account_key IN ('test-merchant-account-a', 'test-merchant-account-b');
  IF v_processing_count <> 3 THEN
    RAISE EXCEPTION 'expected 3 processing rows, found %', v_processing_count;
  END IF;

  SELECT count(*) INTO v_conflict_count
    FROM public.bank_provider_webhook_events
   WHERE provider = 'PLUSPESA'
     AND provider_account_key = 'test-merchant-account-a'
     AND ingest_outcome = 'CONFLICT';
  IF v_conflict_count <> 1 THEN
    RAISE EXCEPTION 'expected 1 conflict evidence row, found %', v_conflict_count;
  END IF;

  SELECT count(*) INTO v_replay_count
    FROM public.bank_provider_webhook_processing p
    JOIN public.bank_provider_webhook_events e ON e.id = p.event_id
   WHERE e.provider = 'PLUSPESA'
     AND e.provider_account_key = 'test-merchant-account-a'
     AND p.processing_status = 'RECEIVED';
  IF v_replay_count <> 1 THEN
    RAISE EXCEPTION 'expected only first account-A event to be RECEIVED, found %', v_replay_count;
  END IF;

  SELECT count(*) INTO v_other_account_count
    FROM public.bank_provider_webhook_events
   WHERE provider = 'PLUSPESA'
     AND provider_account_key = 'test-merchant-account-b';
  IF v_other_account_count <> 1 THEN
    RAISE EXCEPTION 'expected 1 account-B event, found %', v_other_account_count;
  END IF;
END;
$$;

-- Evidence rows are immutable. The trigger must reject both mutation paths.
DO $$
DECLARE
  v_event_id uuid;
BEGIN
  SELECT id INTO v_event_id
    FROM public.bank_provider_webhook_events
   WHERE provider = 'PLUSPESA'
     AND provider_account_key = 'test-merchant-account-a'
   ORDER BY received_at, id
   LIMIT 1;

  BEGIN
    UPDATE public.bank_provider_webhook_events
       SET payload_redacted = '{"tampered":true}'::jsonb
     WHERE id = v_event_id;
    RAISE EXCEPTION 'immutable evidence UPDATE unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;

  BEGIN
    DELETE FROM public.bank_provider_webhook_events WHERE id = v_event_id;
    RAISE EXCEPTION 'immutable evidence DELETE unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;
END;
$$;

-- A caller cannot claim an event by asserting signature_verified=false.
DO $$
BEGIN
  BEGIN
    PERFORM public.bank_provider_webhook_claim(
      'PLUSPESA', 'test-merchant-account-a', NULL, NULL,
      'pp-ref-invalid-signature', 'SM:TEST:invalid-signature',
      repeat('f', 64), repeat('1', 64), false, 'test-key', 'ACCEPTED',
      '{}'::jsonb, extensions.gen_random_uuid()
    );
    RAISE EXCEPTION 'unverified claim unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;
END;
$$;

SELECT test_name, result
  FROM webhook_test_results
 ORDER BY test_name;

ROLLBACK;
