-- Follow-up hardening for the applied remediation control plane.
-- Failed cursors must be drainable, but incomplete financial fields must never
-- be classified as safe for settlement.
BEGIN;

ALTER TABLE public.bank_provider_webhook_remediation
  DROP CONSTRAINT bank_provider_webhook_remediation_remediation_status_check;
ALTER TABLE public.bank_provider_webhook_remediation
  ADD CONSTRAINT bank_provider_webhook_remediation_status_valid
  CHECK (remediation_status IN (
    'UNCLASSIFIED', 'LEASED', 'SAFE_RETRY', 'SAFE_RECONCILE',
    'REQUEUED', 'PROCESSED', 'DUPLICATE', 'CONFLICT',
    'FIELD_MISMATCH', 'UNCORRELATED', 'PROVIDER_UNKNOWN',
    'SECRET_SUSPECTED', 'ALREADY_SETTLED', 'CLOSED_BY_REVIEW'
  ));

DROP INDEX public.bank_provider_webhook_remediation_queue_idx;
CREATE INDEX bank_provider_webhook_remediation_queue_idx
  ON public.bank_provider_webhook_remediation(remediation_status, lease_until, updated_at)
  WHERE remediation_status IN ('UNCLASSIFIED', 'SAFE_RETRY', 'SAFE_RECONCILE', 'REQUEUED', 'FAILED');

CREATE OR REPLACE FUNCTION bank_private.remediation_classify(
  p_drain_run_id uuid,
  p_event_id uuid,
  p_lease_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_run public.bank_provider_webhook_drain_runs%ROWTYPE;
  v_event public.bank_provider_webhook_events%ROWTYPE;
  v_processing public.bank_provider_webhook_processing%ROWTYPE;
  v_remediation public.bank_provider_webhook_remediation%ROWTYPE;
  v_tx public.bank_provider_transactions%ROWTYPE;
  v_classification text;
  v_reason text;
  v_has_posting boolean := false;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook remediation requires service role.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_run
    FROM public.bank_provider_webhook_drain_runs
   WHERE id = p_drain_run_id
   FOR UPDATE;
  SELECT * INTO v_event
    FROM public.bank_provider_webhook_events
   WHERE id = p_event_id
   FOR UPDATE;
  SELECT * INTO v_processing
    FROM public.bank_provider_webhook_processing
   WHERE event_id = p_event_id
   FOR UPDATE;
  SELECT * INTO v_remediation
    FROM public.bank_provider_webhook_remediation
   WHERE event_id = p_event_id
   FOR UPDATE;

  IF NOT FOUND OR v_run.status <> 'OPEN'
     OR v_remediation.drain_run_id <> p_drain_run_id
     OR v_remediation.lease_token <> p_lease_token
     OR v_remediation.lease_until IS NULL
     OR v_remediation.lease_until <= now() THEN
    RAISE EXCEPTION 'Webhook remediation lease is invalid or expired.' USING ERRCODE = 'P0001';
  END IF;

  IF v_event.ingest_outcome = 'CONFLICT' THEN
    v_classification := 'CONFLICT';
    v_reason := 'durable_provider_identity_conflict';
  ELSIF v_event.client_reference IS NULL THEN
    v_classification := 'UNCORRELATED';
    v_reason := 'missing_client_reference';
  ELSE
    SELECT * INTO v_tx
      FROM public.bank_provider_transactions
     WHERE provider = v_run.provider
       AND provider_account_key = v_run.provider_account_key
       AND client_reference = v_event.client_reference
     FOR UPDATE;

    IF NOT FOUND THEN
      v_classification := 'UNCORRELATED';
      v_reason := 'trusted_outbound_provider_transaction_not_found';
    ELSIF v_event.amount IS NULL OR v_event.amount <> v_tx.amount THEN
      v_classification := 'FIELD_MISMATCH';
      v_reason := 'amount_missing_or_mismatch';
    ELSIF v_event.currency IS NULL OR upper(v_event.currency) <> upper(v_tx.currency) THEN
      v_classification := 'FIELD_MISMATCH';
      v_reason := 'currency_missing_or_mismatch';
    ELSIF v_event.provider_reference IS NOT NULL
          AND v_tx.provider_reference IS NOT NULL
          AND v_event.provider_reference <> v_tx.provider_reference THEN
      v_classification := 'FIELD_MISMATCH';
      v_reason := 'provider_reference_mismatch';
    ELSIF v_event.provider_uuid IS NOT NULL
          AND v_tx.provider_uuid IS NOT NULL
          AND v_event.provider_uuid <> v_tx.provider_uuid THEN
      v_classification := 'FIELD_MISMATCH';
      v_reason := 'provider_uuid_mismatch';
    ELSE
      SELECT EXISTS (
        SELECT 1
          FROM public.bank_transactions bt
         WHERE bt.company_id = v_tx.company_id
           AND bt.provider = v_tx.provider
           AND bt.provider_reference = coalesce(v_event.provider_reference, v_tx.provider_reference)
      ) INTO v_has_posting;
      IF v_tx.status IN ('SUCCESS', 'REVERSED') OR v_has_posting THEN
        v_classification := 'ALREADY_SETTLED';
        v_reason := 'trusted_provider_transaction_or_bank_posting_already_terminal';
      ELSIF upper(coalesce(v_event.provider_status, '')) IN (
        'SUCCESS', 'SETTLED', 'CONFIRMED', 'COMPLETED',
        'FAILED', 'DECLINED', 'CANCELLED', 'REVERSED'
      ) THEN
        v_classification := 'SAFE_RECONCILE';
        v_reason := 'terminal_provider_status_matches_trusted_outbound_identity';
      ELSIF v_event.provider_status IS NULL THEN
        v_classification := 'PROVIDER_UNKNOWN';
        v_reason := 'provider_status_missing';
      ELSE
        v_classification := 'SAFE_RETRY';
        v_reason := 'transient_or_nonterminal_provider_state';
      END IF;
    END IF;
  END IF;

  UPDATE public.bank_provider_webhook_remediation
     SET remediation_status = v_classification,
         classification = v_classification,
         reason_code = v_reason,
         lease_token = CASE WHEN v_classification IN ('SAFE_RETRY', 'SAFE_RECONCILE', 'ALREADY_SETTLED') THEN lease_token ELSE NULL END,
         lease_until = CASE WHEN v_classification IN ('SAFE_RETRY', 'SAFE_RECONCILE', 'ALREADY_SETTLED') THEN lease_until ELSE NULL END,
         updated_at = now(),
         last_error_code = CASE WHEN v_classification IN ('SAFE_RETRY', 'SAFE_RECONCILE', 'ALREADY_SETTLED') THEN NULL ELSE v_classification END,
         last_error_message = CASE WHEN v_classification IN ('SAFE_RETRY', 'SAFE_RECONCILE', 'ALREADY_SETTLED') THEN NULL ELSE v_reason END
   WHERE event_id = p_event_id;

  UPDATE public.bank_provider_webhook_processing
     SET processing_status = CASE
       WHEN v_classification IN ('CONFLICT', 'FIELD_MISMATCH', 'UNCORRELATED', 'PROVIDER_UNKNOWN', 'SECRET_SUSPECTED')
       THEN 'NEEDS_ATTENTION' ELSE processing_status END,
         lease_until = CASE
       WHEN v_classification IN ('CONFLICT', 'FIELD_MISMATCH', 'UNCORRELATED', 'PROVIDER_UNKNOWN', 'SECRET_SUSPECTED')
       THEN NULL ELSE lease_until END,
         updated_at = now()
   WHERE event_id = p_event_id;

  RETURN jsonb_build_object(
    'eventId', p_event_id,
    'classification', v_classification,
    'reasonCode', v_reason,
    'expectedAttempt', v_remediation.expected_attempt,
    'financialSettlementAllowed', v_classification IN ('SAFE_RETRY', 'SAFE_RECONCILE')
  );
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.remediation_process(
  p_drain_run_id uuid,
  p_event_id uuid,
  p_allow_settlement boolean,
  p_execution_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_run public.bank_provider_webhook_drain_runs%ROWTYPE;
  v_event public.bank_provider_webhook_events%ROWTYPE;
  v_remediation public.bank_provider_webhook_remediation%ROWTYPE;
  v_tx public.bank_provider_transactions%ROWTYPE;
  v_result jsonb;
  v_provider_event_id text;
  v_idempotency_key text;
  v_replayed boolean;
  v_status text;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook remediation requires service role.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_run FROM public.bank_provider_webhook_drain_runs WHERE id = p_drain_run_id FOR UPDATE;
  SELECT * INTO v_event FROM public.bank_provider_webhook_events WHERE id = p_event_id FOR UPDATE;
  SELECT * INTO v_remediation FROM public.bank_provider_webhook_remediation WHERE event_id = p_event_id FOR UPDATE;
  IF NOT FOUND OR v_run.status <> 'OPEN' THEN
    RAISE EXCEPTION 'Drain run or event is not open.' USING ERRCODE = 'P0001';
  END IF;
  IF v_remediation.drain_run_id <> p_drain_run_id
     OR v_remediation.remediation_status <> 'REQUEUED'
     OR v_remediation.classification NOT IN ('SAFE_RETRY', 'SAFE_RECONCILE') THEN
    RAISE EXCEPTION 'Event is not requeued by this drain run for safe processing.' USING ERRCODE = '42501';
  END IF;
  IF NOT p_allow_settlement THEN
    RETURN jsonb_build_object('eventId', p_event_id, 'status', 'DRY_RUN', 'settlementAttempted', false);
  END IF;
  IF v_run.mode <> 'DRAIN_SAFE_SETTLEMENTS'
     OR v_run.approval_id IS NULL
     OR v_run.settled_count >= v_run.max_settlements THEN
    RAISE EXCEPTION 'Safe settlement is not permitted for this drain run.' USING ERRCODE = '42501';
  END IF;
  IF v_event.standing_order_run_id IS NULL
     OR v_event.provider_reference IS NULL
     OR v_event.provider_status IS NULL
     OR v_event.amount IS NULL
     OR v_event.currency IS NULL THEN
    RAISE EXCEPTION 'Event lacks trusted settlement correlation or terminal provider data.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_tx
    FROM public.bank_provider_transactions
   WHERE provider = v_run.provider
     AND provider_account_key = v_run.provider_account_key
     AND client_reference = v_event.client_reference
   FOR UPDATE;
  IF NOT FOUND OR v_tx.company_id <> v_event.company_id
     OR v_event.amount <> v_tx.amount
     OR upper(v_event.currency) <> upper(v_tx.currency) THEN
    RAISE EXCEPTION 'Trusted provider transaction correlation or amount/currency validation failed.' USING ERRCODE = '42501';
  END IF;
  v_provider_event_id := coalesce(v_event.provider_event_id, v_event.provider_uuid);
  IF v_provider_event_id IS NULL THEN
    RAISE EXCEPTION 'Provider event identity is required for settlement.' USING ERRCODE = '42501';
  END IF;
  v_idempotency_key := 'WHE:' || p_event_id::text;
  v_result := bank_private.confirm_provider_payment(
    v_event.standing_order_run_id,
    v_event.provider_reference,
    v_event.provider_status,
    v_provider_event_id,
    v_idempotency_key,
    coalesce(p_execution_id, v_run.execution_id),
    NULL
  );
  v_replayed := coalesce((v_result->>'replayed')::boolean, false);
  v_status := coalesce(v_result->>'status', 'UNKNOWN');
  UPDATE public.bank_provider_transactions
     SET status = CASE WHEN v_status = 'POSTED' THEN 'SUCCESS' ELSE 'FAILED' END,
         provider_event_id = coalesce(provider_event_id, v_event.provider_event_id),
         provider_uuid = coalesce(provider_uuid, v_event.provider_uuid),
         provider_reference = coalesce(provider_reference, v_event.provider_reference),
         last_callback_at = now(), updated_at = now()
   WHERE id = v_tx.id AND company_id = v_tx.company_id;
  UPDATE public.bank_provider_webhook_remediation
     SET remediation_status = CASE WHEN v_replayed THEN 'DUPLICATE' ELSE 'PROCESSED' END,
         lease_token = NULL, lease_until = NULL, last_remediated_at = now(), updated_at = now()
   WHERE event_id = p_event_id;
  UPDATE public.bank_provider_webhook_processing
     SET processing_status = CASE WHEN v_replayed THEN 'DUPLICATE' ELSE 'PROCESSED' END,
         processed_at = now(), lease_until = NULL, updated_at = now()
   WHERE event_id = p_event_id;
  UPDATE public.bank_provider_webhook_drain_runs
     SET settled_count = settled_count + CASE WHEN v_status = 'POSTED' AND NOT v_replayed THEN 1 ELSE 0 END,
         failed_count = failed_count + CASE WHEN v_status = 'FAILED' AND NOT v_replayed THEN 1 ELSE 0 END
   WHERE id = p_drain_run_id;
  RETURN v_result || jsonb_build_object('eventId', p_event_id, 'settlementAttempted', true);
END;
$$;

COMMIT;
