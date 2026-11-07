-- Standing Order service control plane.
-- Phase 1 installs private service-role implementations and bridges while the
-- existing authenticated compatibility functions remain available. A later
-- cutover migration revokes the old authenticated control-plane grants after
-- the application and Edge Function paths pass smoke tests.
BEGIN;

CREATE SCHEMA IF NOT EXISTS bank_private;
REVOKE ALL ON SCHEMA bank_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA bank_private TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA bank_private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION bank_private.service_audit(
  p_company_id uuid,
  p_actor_id uuid,
  p_operation text,
  p_entity_type text,
  p_entity_id uuid,
  p_outcome text,
  p_execution_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  INSERT INTO public.bank_audit_events(
    company_id, actor_id, operation, entity_type, entity_id, outcome,
    request_id, redacted_payload
  )
  VALUES (
    p_company_id,
    p_actor_id,
    p_operation,
    p_entity_type,
    p_entity_id,
    p_outcome,
    CASE WHEN p_execution_id IS NULL THEN 'service:standing-order' ELSE 'service:' || p_execution_id::text END,
    coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('executionPrincipal', 'standing-order-service', 'executionId', p_execution_id)
  );
$$;

CREATE OR REPLACE FUNCTION bank_private.post_transaction(
  p_company_id uuid,
  p_actor_id uuid,
  p_payload jsonb,
  p_execution_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_existing public.bank_transactions%ROWTYPE;
  v_source public.bank_accounts%ROWTYPE;
  v_destination public.bank_accounts%ROWTYPE;
  v_amount numeric(20,2) := (p_payload->>'amount')::numeric;
  v_fee numeric(20,2) := greatest(coalesce((p_payload->>'feeAmount')::numeric, 0), 0);
  v_type text := upper(coalesce(p_payload->>'transactionType', 'TRANSFER'));
  v_key text := p_payload->>'idempotencyKey';
  v_tx uuid;
  v_batch uuid;
  v_tx_no text;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Standing Order service execution requires service role.' USING ERRCODE = '42501';
  END IF;
  IF p_company_id IS NULL OR p_payload IS NULL OR v_amount IS NULL OR v_amount <= 0 OR v_key IS NULL OR length(v_key) < 12 THEN
    RAISE EXCEPTION 'Service transaction requires a company, positive amount, and idempotency key.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_existing
  FROM public.bank_transactions
  WHERE company_id = p_company_id AND idempotency_key = v_key
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('transactionId', v_existing.id, 'transactionNumber', v_existing.transaction_number, 'status', v_existing.status, 'replayed', true);
  END IF;
  IF v_type NOT IN ('WITHDRAWAL', 'TRANSFER', 'TRANSFER_OUT', 'TRANSFER_IN', 'DEPOSIT', 'LOAN_REPAYMENT') THEN
    RAISE EXCEPTION 'Unsupported service transaction type.' USING ERRCODE = '22023';
  END IF;
  IF v_type IN ('WITHDRAWAL', 'TRANSFER', 'TRANSFER_OUT', 'LOAN_REPAYMENT') THEN
    SELECT * INTO v_source
    FROM public.bank_accounts
    WHERE id = nullif(p_payload->>'sourceAccountId', '')::uuid
      AND company_id = p_company_id
    FOR UPDATE;
    IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN
      RAISE EXCEPTION 'Service source account is not active in the requested workspace.' USING ERRCODE = '42501';
    END IF;
    IF v_source.available_balance < v_amount + v_fee THEN
      RAISE EXCEPTION 'Insufficient available balance.' USING ERRCODE = '22003';
    END IF;
  END IF;
  IF v_type IN ('DEPOSIT', 'TRANSFER', 'TRANSFER_IN') THEN
    SELECT * INTO v_destination
    FROM public.bank_accounts
    WHERE id = nullif(p_payload->>'destinationAccountId', '')::uuid
      AND company_id = p_company_id
    FOR UPDATE;
    IF NOT FOUND OR v_destination.status <> 'ACTIVE' THEN
      RAISE EXCEPTION 'Service destination account is not active in the requested workspace.' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF v_type = 'TRANSFER' AND v_source.id = v_destination.id THEN
    RAISE EXCEPTION 'Service transfer source and destination must differ.' USING ERRCODE = '22023';
  END IF;
  IF v_source.id IS NOT NULL AND v_destination.id IS NOT NULL AND v_source.currency <> v_destination.currency THEN
    RAISE EXCEPTION 'Service transfer accounts must use the same currency.' USING ERRCODE = '22023';
  END IF;

  v_tx_no := 'TX-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');
  INSERT INTO public.bank_transactions(
    company_id, transaction_number, transaction_type, channel,
    source_account_id, destination_account_id, customer_id, amount, fee_amount,
    currency, status, idempotency_key, provider, provider_reference, narration,
    initiated_by, posted_at, data
  )
  VALUES (
    p_company_id, v_tx_no, v_type, upper(coalesce(p_payload->>'channel', 'STANDING_ORDER')),
    nullif(p_payload->>'sourceAccountId', '')::uuid,
    nullif(p_payload->>'destinationAccountId', '')::uuid,
    nullif(p_payload->>'customerId', '')::uuid,
    v_amount, v_fee, upper(coalesce(p_payload->>'currency', 'TZS')), 'POSTED', v_key,
    p_payload->>'provider', p_payload->>'providerReference', p_payload->>'narration',
    p_actor_id, now(), coalesce(p_payload->'data', '{}'::jsonb) || jsonb_build_object('executionId', p_execution_id, 'executionPrincipal', 'standing-order-service')
  )
  RETURNING id INTO v_tx;

  IF v_source.id IS NOT NULL AND v_type IN ('WITHDRAWAL', 'TRANSFER', 'TRANSFER_OUT', 'LOAN_REPAYMENT') THEN
    UPDATE public.bank_accounts
    SET ledger_balance = ledger_balance - v_amount - v_fee,
        available_balance = available_balance - v_amount - v_fee,
        version = version + 1,
        updated_at = now()
    WHERE id = v_source.id AND company_id = p_company_id;
  END IF;
  IF v_destination.id IS NOT NULL AND v_type IN ('DEPOSIT', 'TRANSFER', 'TRANSFER_IN') THEN
    UPDATE public.bank_accounts
    SET ledger_balance = ledger_balance + v_amount,
        available_balance = available_balance + v_amount,
        version = version + 1,
        updated_at = now()
    WHERE id = v_destination.id AND company_id = p_company_id;
  END IF;

  INSERT INTO public.bank_journal_batches(
    company_id, batch_number, currency, total_debit, total_credit,
    source_type, source_id, idempotency_key
  )
  VALUES (
    p_company_id, 'JB-' || v_tx, upper(coalesce(p_payload->>'currency', 'TZS')),
    v_amount + v_fee, v_amount + v_fee, 'BANK_TRANSACTION', v_tx, v_key
  )
  RETURNING id INTO v_batch;

  IF v_type IN ('DEPOSIT', 'TRANSFER_IN') THEN
    INSERT INTO public.bank_journal_lines(company_id, batch_id, account_id, gl_code, line_description, debit, credit)
    VALUES
      (p_company_id, v_batch, NULL, 'CASH_OR_CLEARING', coalesce(p_payload->>'narration', v_type), v_amount + v_fee, 0),
      (p_company_id, v_batch, v_destination.id, 'CUSTOMER-DEPOSIT', coalesce(p_payload->>'narration', v_type), 0, v_amount);
  ELSIF v_type IN ('WITHDRAWAL', 'TRANSFER_OUT', 'LOAN_REPAYMENT') THEN
    INSERT INTO public.bank_journal_lines(company_id, batch_id, account_id, gl_code, line_description, debit, credit)
    VALUES
      (p_company_id, v_batch, v_source.id, 'CUSTOMER-DEPOSIT', coalesce(p_payload->>'narration', v_type), v_amount + v_fee, 0),
      (p_company_id, v_batch, NULL, 'CASH_OR_CLEARING', coalesce(p_payload->>'narration', v_type), 0, v_amount);
  ELSIF v_type = 'TRANSFER' THEN
    INSERT INTO public.bank_journal_lines(company_id, batch_id, account_id, gl_code, line_description, debit, credit)
    VALUES
      (p_company_id, v_batch, v_source.id, 'CUSTOMER-DEPOSIT', coalesce(p_payload->>'narration', v_type), v_amount + v_fee, 0),
      (p_company_id, v_batch, v_destination.id, 'CUSTOMER-DEPOSIT', coalesce(p_payload->>'narration', v_type), 0, v_amount);
  END IF;
  IF v_fee > 0 THEN
    INSERT INTO public.bank_journal_lines(company_id, batch_id, account_id, gl_code, line_description, debit, credit)
    VALUES (p_company_id, v_batch, NULL, 'FEE_INCOME', coalesce(p_payload->>'narration', v_type), 0, v_fee);
  END IF;
  UPDATE public.bank_transactions SET journal_batch_id = v_batch WHERE id = v_tx AND company_id = p_company_id;
  PERFORM bank_private.service_audit(p_company_id, p_actor_id, 'TRANSACTION_POSTED', 'transaction', v_tx, 'SUCCESS', p_execution_id, jsonb_build_object('transactionType', v_type, 'amount', v_amount, 'channel', upper(coalesce(p_payload->>'channel', 'STANDING_ORDER'))));
  RETURN jsonb_build_object('transactionId', v_tx, 'transactionNumber', v_tx_no, 'status', 'POSTED', 'replayed', false);
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO v_existing
  FROM public.bank_transactions
  WHERE company_id = p_company_id AND idempotency_key = v_key
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('transactionId', v_existing.id, 'transactionNumber', v_existing.transaction_number, 'status', v_existing.status, 'replayed', true);
  END IF;
  RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.create_payment_instruction(
  p_company_id uuid,
  p_actor_id uuid,
  p_payload jsonb,
  p_execution_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_existing public.bank_payment_instructions%ROWTYPE;
  v_id uuid;
  v_number text := 'PI-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');
  v_key text := p_payload->>'idempotencyKey';
  v_source public.bank_accounts%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Standing Order service execution requires service role.' USING ERRCODE = '42501';
  END IF;
  IF p_company_id IS NULL OR v_key IS NULL OR length(v_key) < 12 THEN
    RAISE EXCEPTION 'Payment instructions require a company and idempotency key.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_existing
  FROM public.bank_payment_instructions
  WHERE company_id = p_company_id AND idempotency_key = v_key
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('instructionId', v_existing.id, 'instructionNumber', v_existing.instruction_number, 'status', v_existing.status, 'replayed', true);
  END IF;
  SELECT * INTO v_source
  FROM public.bank_accounts
  WHERE id = nullif(p_payload->>'sourceAccountId', '')::uuid
    AND company_id = p_company_id
  FOR SHARE;
  IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Payment source account is not active in the requested workspace.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.bank_payment_instructions(
    company_id, instruction_number, payment_type, channel, source_account_id,
    destination_account_id, amount, currency, provider, msisdn, status,
    idempotency_key, data
  )
  VALUES (
    p_company_id, v_number, coalesce(p_payload->>'paymentType', 'STANDING_ORDER'),
    upper(coalesce(p_payload->>'channel', 'MOBILE_MONEY')),
    nullif(p_payload->>'sourceAccountId', '')::uuid,
    nullif(p_payload->>'destinationAccountId', '')::uuid,
    (p_payload->>'amount')::numeric,
    upper(coalesce(p_payload->>'currency', 'TZS')),
    p_payload->>'provider', p_payload->>'msisdn', 'INITIATED', v_key,
    coalesce(p_payload->'data', '{}'::jsonb) || jsonb_build_object('executionId', p_execution_id, 'executionPrincipal', 'standing-order-service')
  )
  RETURNING id INTO v_id;
  PERFORM bank_private.service_audit(p_company_id, p_actor_id, 'PAYMENT_INSTRUCTION_CREATED', 'payment_instruction', v_id, 'SUCCESS', p_execution_id, jsonb_build_object('channel', upper(coalesce(p_payload->>'channel', 'MOBILE_MONEY')), 'status', 'INITIATED'));
  RETURN jsonb_build_object('instructionId', v_id, 'instructionNumber', v_number, 'status', 'INITIATED', 'replayed', false);
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO v_existing
  FROM public.bank_payment_instructions
  WHERE company_id = p_company_id AND idempotency_key = v_key
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('instructionId', v_existing.id, 'instructionNumber', v_existing.instruction_number, 'status', v_existing.status, 'replayed', true);
  END IF;
  RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.run_standing_orders(
  p_run_date date,
  p_order_id uuid DEFAULT NULL,
  p_max_orders integer DEFAULT 250,
  p_execution_id uuid DEFAULT NULL,
  p_requested_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_order public.bank_standing_orders%ROWTYPE;
  v_prior public.bank_standing_order_runs%ROWTYPE;
  v_run_id uuid;
  v_transaction_id uuid;
  v_instruction_id uuid;
  v_result jsonb;
  v_run_date date := coalesce(p_run_date, current_date);
  v_attempt integer;
  v_max integer := least(greatest(coalesce(p_max_orders, 250), 1), 250);
  v_occurrence_key text;
  v_run_key text;
  v_next_date date;
  v_status text;
  v_error_code text;
  v_error_message text;
  v_results jsonb := '[]'::jsonb;
  v_processed integer := 0;
  v_posted integer := 0;
  v_pending integer := 0;
  v_failed integer := 0;
  v_skipped integer := 0;
  v_completed integer := 0;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Standing Order scheduler requires service role.' USING ERRCODE = '42501';
  END IF;
  IF v_run_date > current_date THEN
    RAISE EXCEPTION 'A scheduler cannot execute a future run date.' USING ERRCODE = '22023';
  END IF;
  IF p_requested_by IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_requested_by
  ) THEN
    RAISE EXCEPTION 'Requested-by operator does not exist.' USING ERRCODE = '42501';
  END IF;

  FOR v_order IN
    SELECT so.*
    FROM public.bank_standing_orders so
    WHERE so.status = 'ACTIVE'
      AND (p_order_id IS NULL OR so.id = p_order_id)
      AND so.next_run_date <= v_run_date
      AND (so.end_date IS NULL OR so.end_date >= so.next_run_date)
    ORDER BY so.next_run_date, so.id
    LIMIT v_max
    FOR UPDATE SKIP LOCKED
  LOOP
    IF p_requested_by IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = p_requested_by AND company_id = v_order.company_id
    ) THEN
      RAISE EXCEPTION 'Requested-by operator is not in the order workspace.' USING ERRCODE = '42501';
    END IF;
    v_processed := v_processed + 1;
    v_occurrence_key := 'SO:' || v_order.id::text || ':' || v_order.next_run_date::text;
    SELECT * INTO v_prior
    FROM public.bank_standing_order_runs r
    WHERE r.company_id = v_order.company_id
      AND r.standing_order_id = v_order.id
      AND r.scheduled_for = v_order.next_run_date
    ORDER BY r.attempt_number DESC, r.created_at DESC
    LIMIT 1;

    IF FOUND AND v_prior.status IN ('POSTED', 'SUBMITTED', 'PENDING_PROVIDER', 'SKIPPED', 'CANCELLED') THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId', v_order.id, 'runId', v_prior.id, 'status', v_prior.status, 'replayed', true));
      CONTINUE;
    END IF;
    IF FOUND AND v_prior.status = 'FAILED' AND v_prior.attempt_number >= v_order.max_retries + 1 THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId', v_order.id, 'runId', v_prior.id, 'status', 'FAILED', 'errorCode', v_prior.error_code, 'replayed', true));
      v_failed := v_failed + 1;
      CONTINUE;
    END IF;

    v_attempt := CASE WHEN FOUND THEN v_prior.attempt_number + 1 ELSE 1 END;
    v_run_key := CASE WHEN v_attempt = 1 THEN v_occurrence_key ELSE v_occurrence_key || ':attempt:' || v_attempt::text END;
    INSERT INTO public.bank_standing_order_runs(
      company_id, standing_order_id, scheduled_for, started_at, attempt_number,
      status, amount, currency, idempotency_key, data, created_by
    )
    VALUES (
      v_order.company_id, v_order.id, v_order.next_run_date, now(), v_attempt,
      'PROCESSING', v_order.amount, v_order.currency, v_run_key,
      jsonb_build_object('parentOccurrenceKey', v_occurrence_key, 'channel', v_order.channel, 'sourceAccountId', v_order.source_account_id, 'destinationAccountId', v_order.destination_account_id, 'destinationMsisdn', v_order.destination_msisdn, 'executionId', p_execution_id, 'executionPrincipal', 'standing-order-scheduler'),
      p_requested_by
    )
    RETURNING id INTO v_run_id;

    BEGIN
      IF v_order.channel = 'INTERNAL_TRANSFER' THEN
        v_result := bank_private.post_transaction(
          v_order.company_id,
          p_requested_by,
          jsonb_build_object(
            'transactionType', 'TRANSFER',
            'channel', 'STANDING_ORDER',
            'sourceAccountId', v_order.source_account_id,
            'destinationAccountId', v_order.destination_account_id,
            'customerId', v_order.customer_id,
            'amount', v_order.amount,
            'currency', v_order.currency,
            'narration', coalesce(v_order.narration, 'Standing order ' || v_order.order_number),
            'idempotencyKey', v_occurrence_key,
            'data', jsonb_build_object('standingOrderId', v_order.id, 'runId', v_run_id)
          ),
          p_execution_id
        );
        v_transaction_id := nullif(v_result->>'transactionId', '')::uuid;
        v_next_date := public.bank_standing_order_next_date(v_order.next_run_date, v_order.frequency, v_order.schedule_day);
        v_status := CASE WHEN v_order.end_date IS NOT NULL AND v_next_date > v_order.end_date THEN 'COMPLETED' ELSE 'ACTIVE' END;
        UPDATE public.bank_standing_order_runs
        SET status = 'POSTED', transaction_id = v_transaction_id, completed_at = now(), data = data || jsonb_build_object('result', v_result)
        WHERE id = v_run_id AND company_id = v_order.company_id;
        UPDATE public.bank_standing_orders
        SET status = v_status, next_run_date = v_next_date, last_run_at = now(), last_result = 'POSTED', run_count = run_count + 1, consecutive_failure_count = 0, version = version + 1, updated_at = now(), updated_by = p_requested_by
        WHERE id = v_order.id AND company_id = v_order.company_id;
        INSERT INTO public.bank_standing_order_events(company_id, standing_order_id, event_type, previous_status, next_status, actor_id, request_id, idempotency_key, after_data)
        VALUES (v_order.company_id, v_order.id, CASE WHEN v_status = 'COMPLETED' THEN 'COMPLETED' ELSE 'RUN_POSTED' END, v_order.status, v_status, p_requested_by, coalesce('scheduler:' || p_execution_id::text, v_run_key), v_run_key, jsonb_build_object('runId', v_run_id, 'transactionId', v_transaction_id, 'scheduledFor', v_order.next_run_date, 'executionId', p_execution_id));
        PERFORM bank_private.service_audit(v_order.company_id, p_requested_by, 'STANDING_ORDER_RUN_POSTED', 'standing_order', v_order.id, 'SUCCESS', p_execution_id, jsonb_build_object('runId', v_run_id, 'transactionId', v_transaction_id));
        v_posted := v_posted + 1;
        IF v_status = 'COMPLETED' THEN v_completed := v_completed + 1; END IF;
        v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId', v_order.id, 'runId', v_run_id, 'status', 'POSTED', 'transactionId', v_transaction_id, 'replayed', false));
      ELSE
        v_result := bank_private.create_payment_instruction(
          v_order.company_id,
          p_requested_by,
          jsonb_build_object(
            'paymentType', 'STANDING_ORDER',
            'channel', 'MOBILE_MONEY',
            'sourceAccountId', v_order.source_account_id,
            'amount', v_order.amount,
            'currency', v_order.currency,
            'provider', coalesce(v_order.data->>'provider', 'MOBILE_MONEY'),
            'msisdn', v_order.destination_msisdn,
            'idempotencyKey', v_occurrence_key,
            'data', jsonb_build_object('standingOrderId', v_order.id, 'runId', v_run_id)
          ),
          p_execution_id
        );
        v_instruction_id := nullif(v_result->>'instructionId', '')::uuid;
        UPDATE public.bank_standing_order_runs
        SET status = 'PENDING_PROVIDER', payment_instruction_id = v_instruction_id, provider = coalesce(v_order.data->>'provider', 'MOBILE_MONEY'), completed_at = now(), data = data || jsonb_build_object('result', v_result)
        WHERE id = v_run_id AND company_id = v_order.company_id;
        UPDATE public.bank_standing_orders
        SET last_run_at = now(), last_result = 'PENDING_PROVIDER', updated_at = now(), updated_by = p_requested_by
        WHERE id = v_order.id AND company_id = v_order.company_id;
        INSERT INTO public.bank_standing_order_events(company_id, standing_order_id, event_type, previous_status, next_status, actor_id, request_id, idempotency_key, after_data)
        VALUES (v_order.company_id, v_order.id, 'RUN_PENDING_PROVIDER', v_order.status, 'ACTIVE', p_requested_by, coalesce('scheduler:' || p_execution_id::text, v_run_key), v_run_key, jsonb_build_object('runId', v_run_id, 'paymentInstructionId', v_instruction_id, 'scheduledFor', v_order.next_run_date, 'executionId', p_execution_id));
        PERFORM bank_private.service_audit(v_order.company_id, p_requested_by, 'STANDING_ORDER_PROVIDER_SUBMITTED', 'standing_order', v_order.id, 'SUCCESS', p_execution_id, jsonb_build_object('runId', v_run_id, 'paymentInstructionId', v_instruction_id));
        v_pending := v_pending + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId', v_order.id, 'runId', v_run_id, 'status', 'PENDING_PROVIDER', 'paymentInstructionId', v_instruction_id, 'replayed', false));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_error_code := SQLSTATE;
      v_error_message := left(SQLERRM, 500);
      UPDATE public.bank_standing_order_runs
      SET status = 'FAILED', error_code = v_error_code, error_message = v_error_message, completed_at = now()
      WHERE id = v_run_id AND company_id = v_order.company_id;
      IF v_order.failure_policy = 'SKIP_AND_CONTINUE' THEN
        v_next_date := public.bank_standing_order_next_date(v_order.next_run_date, v_order.frequency, v_order.schedule_day);
        UPDATE public.bank_standing_orders
        SET next_run_date = v_next_date, last_run_at = now(), last_result = 'SKIPPED', failure_count = failure_count + 1, consecutive_failure_count = consecutive_failure_count + 1, version = version + 1, updated_at = now(), updated_by = p_requested_by
        WHERE id = v_order.id AND company_id = v_order.company_id;
        UPDATE public.bank_standing_order_runs SET status = 'SKIPPED' WHERE id = v_run_id AND company_id = v_order.company_id;
        INSERT INTO public.bank_standing_order_events(company_id, standing_order_id, event_type, previous_status, next_status, actor_id, request_id, idempotency_key, reason, after_data)
        VALUES (v_order.company_id, v_order.id, 'RUN_SKIPPED', v_order.status, 'ACTIVE', p_requested_by, coalesce('scheduler:' || p_execution_id::text, v_run_key), v_run_key, v_error_message, jsonb_build_object('runId', v_run_id, 'errorCode', v_error_code, 'executionId', p_execution_id));
        PERFORM bank_private.service_audit(v_order.company_id, p_requested_by, 'STANDING_ORDER_RUN_SKIPPED', 'standing_order', v_order.id, 'SUCCESS', p_execution_id, jsonb_build_object('runId', v_run_id, 'errorCode', v_error_code));
        v_skipped := v_skipped + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId', v_order.id, 'runId', v_run_id, 'status', 'SKIPPED', 'errorCode', v_error_code, 'replayed', false));
      ELSE
        UPDATE public.bank_standing_orders
        SET last_run_at = now(), last_result = v_error_message, failure_count = failure_count + 1, consecutive_failure_count = consecutive_failure_count + 1, status = CASE WHEN v_attempt >= v_order.max_retries + 1 THEN 'PAUSED' ELSE status END, paused_at = CASE WHEN v_attempt >= v_order.max_retries + 1 THEN now() ELSE paused_at END, version = version + 1, updated_at = now(), updated_by = p_requested_by
        WHERE id = v_order.id AND company_id = v_order.company_id;
        INSERT INTO public.bank_standing_order_events(company_id, standing_order_id, event_type, previous_status, next_status, actor_id, request_id, idempotency_key, reason, after_data)
        VALUES (v_order.company_id, v_order.id, 'RUN_FAILED', v_order.status, CASE WHEN v_attempt >= v_order.max_retries + 1 THEN 'PAUSED' ELSE v_order.status END, p_requested_by, coalesce('scheduler:' || p_execution_id::text, v_run_key), v_run_key, v_error_message, jsonb_build_object('runId', v_run_id, 'errorCode', v_error_code, 'attempt', v_attempt, 'executionId', p_execution_id));
        PERFORM bank_private.service_audit(v_order.company_id, p_requested_by, 'STANDING_ORDER_RUN_FAILED', 'standing_order', v_order.id, 'FAILURE', p_execution_id, jsonb_build_object('runId', v_run_id, 'errorCode', v_error_code, 'attempt', v_attempt));
        v_failed := v_failed + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId', v_order.id, 'runId', v_run_id, 'status', 'FAILED', 'errorCode', v_error_code, 'replayed', false));
      END IF;
    END;
  END LOOP;
  RETURN jsonb_build_object('runDate', v_run_date, 'processed', v_processed, 'posted', v_posted, 'pendingProvider', v_pending, 'failed', v_failed, 'skipped', v_skipped, 'completed', v_completed, 'executionId', p_execution_id, 'results', v_results);
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.confirm_provider_payment(
  p_run_id uuid,
  p_provider_reference text,
  p_provider_status text,
  p_provider_event_id text,
  p_idempotency_key text,
  p_execution_id uuid DEFAULT NULL,
  p_requested_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_run public.bank_standing_order_runs%ROWTYPE;
  v_order public.bank_standing_orders%ROWTYPE;
  v_instruction public.bank_payment_instructions%ROWTYPE;
  v_result jsonb;
  v_transaction_id uuid;
  v_next_date date;
  v_next_status text;
  v_success boolean := upper(coalesce(p_provider_status, '')) IN ('SUCCESS', 'SETTLED', 'CONFIRMED', 'COMPLETED');
  v_fingerprint text := md5(format('PROVIDER|%s|%s|%s|%s', p_run_id, coalesce(p_provider_reference, ''), coalesce(p_provider_status, ''), coalesce(p_provider_event_id, '')));
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Provider reconciliation requires service role.' USING ERRCODE = '42501';
  END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 12 OR nullif(trim(p_provider_reference), '') IS NULL OR nullif(trim(p_provider_event_id), '') IS NULL THEN
    RAISE EXCEPTION 'Provider confirmation requires an idempotency key, reference, and event ID.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_run FROM public.bank_standing_order_runs WHERE id = p_run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Standing Order run was not found.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id = v_run.standing_order_id AND company_id = v_run.company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Standing Order was not found in the run workspace.' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id = v_run.company_id AND e.idempotency_key = p_idempotency_key) THEN
    IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id = v_run.company_id AND e.idempotency_key = p_idempotency_key AND e.after_data->>'_requestFingerprint' = v_fingerprint) THEN
      RETURN jsonb_build_object('runId', v_run.id, 'status', v_run.status, 'transactionId', v_run.transaction_id, 'replayed', true);
    END IF;
    RAISE EXCEPTION 'Provider confirmation idempotency key was reused with different data.' USING ERRCODE = 'P0001';
  END IF;
  IF v_run.status = 'POSTED' THEN
    RETURN jsonb_build_object('runId', v_run.id, 'status', 'POSTED', 'transactionId', v_run.transaction_id, 'replayed', true);
  END IF;
  IF v_run.status NOT IN ('SUBMITTED', 'PENDING_PROVIDER') THEN
    RAISE EXCEPTION 'The Standing Order run is not awaiting provider confirmation.' USING ERRCODE = 'P0001';
  END IF;
  IF v_run.payment_instruction_id IS NOT NULL THEN
    SELECT * INTO v_instruction FROM public.bank_payment_instructions WHERE id = v_run.payment_instruction_id AND company_id = v_run.company_id FOR UPDATE;
  END IF;
  IF v_success THEN
    v_result := bank_private.post_transaction(
      v_run.company_id,
      p_requested_by,
      jsonb_build_object(
        'transactionType', 'WITHDRAWAL',
        'channel', 'MOBILE_MONEY',
        'sourceAccountId', v_order.source_account_id,
        'customerId', v_order.customer_id,
        'amount', v_order.amount,
        'currency', v_order.currency,
        'provider', coalesce(v_run.provider, 'MOBILE_MONEY'),
        'providerReference', p_provider_reference,
        'narration', coalesce(v_order.narration, 'Standing order ' || v_order.order_number),
        'idempotencyKey', v_run.idempotency_key || ':SETTLEMENT',
        'data', jsonb_build_object('standingOrderId', v_order.id, 'runId', v_run.id, 'providerEventId', p_provider_event_id)
      ),
      p_execution_id
    );
    v_transaction_id := nullif(v_result->>'transactionId', '')::uuid;
    v_next_date := public.bank_standing_order_next_date(v_run.scheduled_for, v_order.frequency, v_order.schedule_day);
    v_next_status := CASE WHEN v_order.end_date IS NOT NULL AND v_next_date > v_order.end_date THEN 'COMPLETED' ELSE 'ACTIVE' END;
    UPDATE public.bank_standing_order_runs SET status = 'POSTED', transaction_id = v_transaction_id, provider_reference = p_provider_reference, completed_at = now(), data = data || jsonb_build_object('providerEventId', p_provider_event_id) WHERE id = v_run.id AND company_id = v_run.company_id;
    IF v_instruction.id IS NOT NULL THEN UPDATE public.bank_payment_instructions SET status = 'CONFIRMED', provider_reference = p_provider_reference, confirmed_at = now() WHERE id = v_instruction.id AND company_id = v_run.company_id; END IF;
    UPDATE public.bank_standing_orders SET status = v_next_status, next_run_date = v_next_date, last_run_at = now(), last_result = 'POSTED', run_count = run_count + 1, consecutive_failure_count = 0, version = version + 1, updated_at = now(), updated_by = p_requested_by WHERE id = v_order.id AND company_id = v_run.company_id;
    INSERT INTO public.bank_standing_order_events(company_id, standing_order_id, event_type, previous_status, next_status, actor_id, request_id, idempotency_key, after_data)
    VALUES (v_run.company_id, v_order.id, CASE WHEN v_next_status = 'COMPLETED' THEN 'COMPLETED' ELSE 'RUN_POSTED' END, v_order.status, v_next_status, p_requested_by, p_provider_event_id, p_idempotency_key, jsonb_build_object('_requestFingerprint', v_fingerprint, 'runId', v_run.id, 'transactionId', v_transaction_id, 'executionId', p_execution_id));
    PERFORM bank_private.service_audit(v_run.company_id, p_requested_by, 'STANDING_ORDER_PROVIDER_CONFIRMED', 'standing_order', v_order.id, 'SUCCESS', p_execution_id, jsonb_build_object('runId', v_run.id, 'providerReference', p_provider_reference));
    RETURN jsonb_build_object('runId', v_run.id, 'status', 'POSTED', 'transactionId', v_transaction_id, 'replayed', false);
  END IF;
  UPDATE public.bank_standing_order_runs SET status = 'FAILED', provider_reference = p_provider_reference, error_code = 'PROVIDER_FAILED', error_message = left(coalesce(p_provider_status, 'Provider failed'), 500), completed_at = now(), data = data || jsonb_build_object('providerEventId', p_provider_event_id) WHERE id = v_run.id AND company_id = v_run.company_id;
  IF v_instruction.id IS NOT NULL THEN UPDATE public.bank_payment_instructions SET status = 'FAILED', provider_reference = p_provider_reference, failure_reason = left(coalesce(p_provider_status, 'Provider failed'), 500) WHERE id = v_instruction.id AND company_id = v_run.company_id; END IF;
  UPDATE public.bank_standing_orders SET last_run_at = now(), last_result = 'PROVIDER_FAILED', failure_count = failure_count + 1, consecutive_failure_count = consecutive_failure_count + 1, status = CASE WHEN v_order.failure_policy IN ('FAIL_CLOSED', 'PAUSE_AFTER_MAX_RETRIES') THEN 'PAUSED' ELSE status END, paused_at = CASE WHEN v_order.failure_policy IN ('FAIL_CLOSED', 'PAUSE_AFTER_MAX_RETRIES') THEN now() ELSE paused_at END, version = version + 1, updated_at = now(), updated_by = p_requested_by WHERE id = v_order.id AND company_id = v_run.company_id;
  INSERT INTO public.bank_standing_order_events(company_id, standing_order_id, event_type, previous_status, next_status, actor_id, request_id, idempotency_key, reason, after_data)
  VALUES (v_run.company_id, v_order.id, 'RUN_FAILED', v_order.status, CASE WHEN v_order.failure_policy IN ('FAIL_CLOSED', 'PAUSE_AFTER_MAX_RETRIES') THEN 'PAUSED' ELSE v_order.status END, p_requested_by, p_provider_event_id, p_idempotency_key, left(coalesce(p_provider_status, 'Provider failed'), 500), jsonb_build_object('_requestFingerprint', v_fingerprint, 'runId', v_run.id, 'executionId', p_execution_id));
  PERFORM bank_private.service_audit(v_run.company_id, p_requested_by, 'STANDING_ORDER_PROVIDER_FAILED', 'standing_order', v_order.id, 'FAILURE', p_execution_id, jsonb_build_object('runId', v_run.id, 'providerStatus', p_provider_status));
  RETURN jsonb_build_object('runId', v_run.id, 'status', 'FAILED', 'replayed', false);
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.retry_standing_order_run(
  p_run_id uuid,
  p_idempotency_key text,
  p_execution_id uuid DEFAULT NULL,
  p_requested_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_run public.bank_standing_order_runs%ROWTYPE;
  v_order public.bank_standing_orders%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Standing Order retry requires service role.' USING ERRCODE = '42501';
  END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 12 THEN
    RAISE EXCEPTION 'Retry requires an idempotency key.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_run FROM public.bank_standing_order_runs WHERE id = p_run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Standing Order run was not found.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id = v_run.standing_order_id AND company_id = v_run.company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Standing Order was not found in the run workspace.' USING ERRCODE = '42501'; END IF;
  IF v_run.status <> 'FAILED' OR v_order.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Only failed runs for active Standing Orders may be retried.' USING ERRCODE = 'P0001';
  END IF;
  IF v_run.attempt_number >= v_order.max_retries + 1 THEN
    RAISE EXCEPTION 'Standing Order retry limit has been reached.' USING ERRCODE = 'P0001';
  END IF;
  RETURN bank_private.run_standing_orders(v_run.scheduled_for, v_order.id, 1, coalesce(p_execution_id, gen_random_uuid()), p_requested_by) || jsonb_build_object('requestedRetry', true, 'retryIdempotencyKey', p_idempotency_key);
END;
$$;

-- Service-only public bridges. These contain no business logic and are not
-- executable by PUBLIC, anon, or authenticated callers.
CREATE OR REPLACE FUNCTION public.bank_scheduler_tick(
  p_run_date date,
  p_order_id uuid DEFAULT NULL,
  p_max_orders integer DEFAULT 250,
  p_execution_id uuid DEFAULT NULL,
  p_requested_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$
  SELECT bank_private.run_standing_orders(p_run_date, p_order_id, p_max_orders, p_execution_id, p_requested_by);
$$;

CREATE OR REPLACE FUNCTION public.bank_provider_settlement_tick(
  p_run_id uuid,
  p_provider_reference text,
  p_provider_status text,
  p_provider_event_id text,
  p_idempotency_key text,
  p_execution_id uuid DEFAULT NULL,
  p_requested_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$
  SELECT bank_private.confirm_provider_payment(p_run_id, p_provider_reference, p_provider_status, p_provider_event_id, p_idempotency_key, p_execution_id, p_requested_by);
$$;

CREATE OR REPLACE FUNCTION public.bank_retry_standing_order_service(
  p_run_id uuid,
  p_idempotency_key text,
  p_execution_id uuid DEFAULT NULL,
  p_requested_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$
  SELECT bank_private.retry_standing_order_run(p_run_id, p_idempotency_key, p_execution_id, p_requested_by);
$$;

REVOKE ALL ON FUNCTION bank_private.service_audit(uuid, uuid, text, text, uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.post_transaction(uuid, uuid, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.create_payment_instruction(uuid, uuid, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.run_standing_orders(date, uuid, integer, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.confirm_provider_payment(uuid, text, text, text, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.retry_standing_order_run(uuid, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bank_private.service_audit(uuid, uuid, text, text, uuid, text, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.post_transaction(uuid, uuid, jsonb, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.create_payment_instruction(uuid, uuid, jsonb, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.run_standing_orders(date, uuid, integer, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.confirm_provider_payment(uuid, text, text, text, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.retry_standing_order_run(uuid, text, uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.bank_scheduler_tick(date, uuid, integer, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_provider_settlement_tick(uuid, text, text, text, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_retry_standing_order_service(uuid, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bank_scheduler_tick(date, uuid, integer, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_provider_settlement_tick(uuid, text, text, text, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_retry_standing_order_service(uuid, text, uuid, uuid) TO service_role;

COMMENT ON SCHEMA bank_private IS 'Private Standing Order service-control implementations. Not exposed to browser/API roles.';
COMMENT ON FUNCTION public.bank_scheduler_tick(date, uuid, integer, uuid, uuid) IS 'Service-role-only bridge to the private Standing Order scheduler. Browser and anonymous execution are denied.';
COMMENT ON FUNCTION public.bank_provider_settlement_tick(uuid, text, text, text, text, uuid, uuid) IS 'Service-role-only provider reconciliation bridge; requires an independently verified provider event before invocation.';
COMMENT ON FUNCTION public.bank_retry_standing_order_service(uuid, text, uuid, uuid) IS 'Service-role-only Standing Order retry bridge.';

COMMIT;
