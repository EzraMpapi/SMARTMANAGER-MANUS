-- Standing Order server-side implementation update.
-- Adds lifecycle RPCs, canonical idempotency, maker-checker controls,
-- run-ledger execution, provider confirmation, and retry semantics.
-- No direct browser table writes or direct balance edits are introduced.

BEGIN;

-- The initial schema migration predated provider-pending run events. Extend the
-- event vocabulary before installing the runner that emits them.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bank_standing_order_events_type_valid'
      AND conrelid = 'public.bank_standing_order_events'::regclass
  ) THEN
    ALTER TABLE public.bank_standing_order_events
      DROP CONSTRAINT bank_standing_order_events_type_valid;
  END IF;
  ALTER TABLE public.bank_standing_order_events
    ADD CONSTRAINT bank_standing_order_events_type_valid CHECK (
      event_type IN (
        'CREATED', 'UPDATED', 'SUBMITTED', 'APPROVED', 'REJECTED',
        'ACTIVATED', 'PAUSED', 'RESUMED', 'CANCELLED', 'EXPIRED',
        'COMPLETED', 'RUN_POSTED', 'RUN_PENDING_PROVIDER', 'RUN_FAILED',
        'RUN_SKIPPED'
      )
    );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_standing_order_raise(
  p_code text,
  p_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RAISE EXCEPTION '%: %', p_code, p_message USING ERRCODE = 'P0001';
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_standing_order_request_fingerprint(
  p_payload jsonb
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT md5(
    jsonb_build_object(
      'sourceAccountId', p_payload->>'sourceAccountId',
      'destinationAccountId', p_payload->>'destinationAccountId',
      'destinationMsisdn', p_payload->>'destinationMsisdn',
      'customerId', p_payload->>'customerId',
      'amount', p_payload->>'amount',
      'currency', upper(coalesce(p_payload->>'currency', 'TZS')),
      'channel', upper(coalesce(p_payload->>'channel', 'INTERNAL_TRANSFER')),
      'frequency', upper(coalesce(p_payload->>'frequency', 'MONTHLY')),
      'nextRunDate', p_payload->>'nextRunDate',
      'endDate', p_payload->>'endDate',
      'scheduleDay', p_payload->>'scheduleDay',
      'timezone', coalesce(p_payload->>'timezone', 'Africa/Dar_es_Salaam'),
      'narration', coalesce(p_payload->>'narration', 'Standing order'),
      'approvalRequired', coalesce(p_payload->>'approvalRequired', 'true'),
      'maxRetries', coalesce(p_payload->>'maxRetries', '3'),
      'failurePolicy', coalesce(p_payload->>'failurePolicy', 'PAUSE_AFTER_MAX_RETRIES'),
      'data', coalesce(p_payload->'data', '{}'::jsonb)
    )::text
  );
$$;

CREATE OR REPLACE FUNCTION public.bank_standing_order_normalize_msisdn(
  p_msisdn text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_msisdn text := regexp_replace(coalesce(p_msisdn, ''), '[[:space:]()\-]', '', 'g');
BEGIN
  IF v_msisdn ~ '^0[67][0-9]{8}$' THEN
    v_msisdn := '+255' || substr(v_msisdn, 2);
  ELSIF v_msisdn ~ '^255[67][0-9]{8}$' THEN
    v_msisdn := '+' || v_msisdn;
  END IF;
  IF v_msisdn !~ '^\+255[67][0-9]{8}$' THEN
    PERFORM public.bank_standing_order_raise('MSISDN_INVALID', 'A valid Tanzania mobile number is required.');
  END IF;
  RETURN v_msisdn;
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_standing_order_next_date(
  p_run_date date,
  p_frequency text,
  p_schedule_day integer DEFAULT NULL
)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_frequency text := upper(coalesce(p_frequency, 'MONTHLY'));
  v_month_start date;
  v_next_month date;
  v_day integer;
  v_last_day integer;
BEGIN
  IF v_frequency = 'DAILY' THEN
    RETURN p_run_date + 1;
  ELSIF v_frequency = 'WEEKLY' THEN
    RETURN p_run_date + 7;
  ELSIF v_frequency = 'MONTHLY' THEN
    v_month_start := (date_trunc('month', p_run_date)::date + interval '1 month')::date;
    v_next_month := (v_month_start + interval '1 month')::date;
    v_last_day := v_next_month - v_month_start;
    v_day := least(coalesce(p_schedule_day, extract(day FROM p_run_date)::integer), v_last_day);
    RETURN v_month_start + greatest(v_day - 1, 0);
  END IF;
  PERFORM public.bank_standing_order_raise('FREQUENCY_INVALID', 'Only DAILY, WEEKLY, and MONTHLY schedules are supported.');
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_standing_order_response(
  p_order_id uuid,
  p_replayed boolean DEFAULT false,
  p_event_id uuid DEFAULT NULL,
  p_run_id uuid DEFAULT NULL,
  p_transaction_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_order public.bank_standing_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.bank_standing_orders
  WHERE id = p_order_id
    AND company_id = public.current_company_id();
  IF NOT FOUND THEN
    PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.');
  END IF;
  RETURN jsonb_build_object(
    'standingOrderId', v_order.id,
    'orderNumber', v_order.order_number,
    'status', v_order.status,
    'nextRunDate', v_order.next_run_date,
    'endDate', v_order.end_date,
    'amount', v_order.amount,
    'currency', v_order.currency,
    'channel', v_order.channel,
    'frequency', v_order.frequency,
    'version', v_order.version,
    'approvalRequired', v_order.approval_required,
    'eventId', p_event_id,
    'runId', p_run_id,
    'transactionId', p_transaction_id,
    'replayed', p_replayed
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_list_standing_orders(
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    so.id, so.order_number, so.source_account_id, so.destination_account_id,
    so.destination_msisdn, so.amount, so.currency, so.channel, so.frequency,
    so.next_run_date, so.end_date, so.status, so.approval_required, so.run_count,
    so.failure_count, so.consecutive_failure_count, so.last_run_at, so.last_result,
    so.version, so.created_at, so.updated_at
  FROM public.bank_standing_orders so
  WHERE so.company_id = public.current_company_id()
    AND (p_status IS NULL OR upper(so.status) = upper(p_status))
    AND (
      p_search IS NULL OR p_search = '' OR
      lower(coalesce(so.order_number, '')) LIKE '%' || lower(p_search) || '%' OR
      lower(coalesce(so.name, '')) LIKE '%' || lower(p_search) || '%' OR
      lower(coalesce(so.narration, '')) LIKE '%' || lower(p_search) || '%'
    )
  ORDER BY so.next_run_date ASC NULLS LAST, so.created_at DESC
  LIMIT least(greatest(coalesce(p_limit, 100), 1), 100)
  OFFSET greatest(coalesce(p_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.bank_get_standing_order(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_order public.bank_standing_orders%ROWTYPE;
  v_run jsonb;
BEGIN
  SELECT * INTO v_order
  FROM public.bank_standing_orders
  WHERE id = p_order_id
    AND company_id = public.current_company_id();
  IF NOT FOUND THEN
    PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.');
  END IF;
  SELECT to_jsonb(r) INTO v_run
  FROM public.bank_standing_order_runs r
  WHERE r.standing_order_id = p_order_id
    AND r.company_id = public.current_company_id()
  ORDER BY r.scheduled_for DESC, r.attempt_number DESC, r.created_at DESC
  LIMIT 1;
  RETURN jsonb_build_object(
    'standingOrder', to_jsonb(v_order),
    'latestRun', v_run,
    'replayed', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_create_standing_order(
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id();
  v_actor uuid := auth.uid();
  v_source public.bank_accounts%ROWTYPE;
  v_destination public.bank_accounts%ROWTYPE;
  v_existing public.bank_standing_orders%ROWTYPE;
  v_id uuid;
  v_event_id uuid;
  v_number text;
  v_key text := nullif(trim(p_payload->>'idempotencyKey'), '');
  v_fingerprint text := public.bank_standing_order_request_fingerprint(p_payload);
  v_customer_id uuid := nullif(p_payload->>'customerId', '')::uuid;
  v_source_id uuid := nullif(p_payload->>'sourceAccountId', '')::uuid;
  v_destination_id uuid := nullif(p_payload->>'destinationAccountId', '')::uuid;
  v_amount numeric(20,2) := (p_payload->>'amount')::numeric;
  v_currency text := upper(coalesce(nullif(trim(p_payload->>'currency'), ''), 'TZS'));
  v_channel text := upper(coalesce(nullif(trim(p_payload->>'channel'), ''), CASE WHEN v_destination_id IS NOT NULL THEN 'INTERNAL_TRANSFER' ELSE 'MOBILE_MONEY' END));
  v_frequency text := upper(coalesce(nullif(trim(p_payload->>'frequency'), ''), 'MONTHLY'));
  v_next_date date := (p_payload->>'nextRunDate')::date;
  v_end_date date := nullif(p_payload->>'endDate', '')::date;
  v_schedule_day integer := nullif(p_payload->>'scheduleDay', '')::integer;
  v_timezone text := coalesce(nullif(trim(p_payload->>'timezone'), ''), 'Africa/Dar_es_Salaam');
  v_narration text := coalesce(nullif(trim(p_payload->>'narration'), ''), 'Standing order');
  v_approval_required boolean := coalesce((p_payload->>'approvalRequired')::boolean, true);
  v_max_retries integer := coalesce((p_payload->>'maxRetries')::integer, 3);
  v_failure_policy text := upper(coalesce(nullif(trim(p_payload->>'failurePolicy'), ''), 'PAUSE_AFTER_MAX_RETRIES'));
  v_msisdn text := null;
  v_status text;
  v_data jsonb := coalesce(p_payload->'data', '{}'::jsonb);
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Customer Service','Teller','Admin']) THEN
    PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to create standing orders.');
  END IF;
  IF v_key IS NULL OR length(v_key) < 12 THEN
    PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REQUIRED', 'A stable idempotency key is required.');
  END IF;
  IF jsonb_typeof(v_data) <> 'object' THEN
    PERFORM public.bank_standing_order_raise('PAYLOAD_INVALID', 'The data envelope must be a JSON object.');
  END IF;
  v_data := jsonb_set(v_data, '{_requestFingerprint}', to_jsonb(v_fingerprint), true);
  IF v_amount IS NULL OR v_amount <= 0 OR v_amount > 10000000000 THEN
    PERFORM public.bank_standing_order_raise('AMOUNT_INVALID', 'Amount must be positive and within the operational limit.');
  END IF;
  IF v_currency !~ '^[A-Z]{3}$' THEN
    PERFORM public.bank_standing_order_raise('CURRENCY_INVALID', 'Currency must be a three-letter ISO code.');
  END IF;
  IF v_channel NOT IN ('INTERNAL_TRANSFER', 'MOBILE_MONEY') THEN
    PERFORM public.bank_standing_order_raise('CHANNEL_INVALID', 'Unsupported standing order channel.');
  END IF;
  IF v_frequency NOT IN ('DAILY', 'WEEKLY', 'MONTHLY') THEN
    PERFORM public.bank_standing_order_raise('FREQUENCY_INVALID', 'Only DAILY, WEEKLY, and MONTHLY schedules are supported.');
  END IF;
  IF v_next_date IS NULL OR v_next_date < current_date THEN
    PERFORM public.bank_standing_order_raise('SCHEDULE_INVALID', 'The first run date cannot be in the past.');
  END IF;
  IF v_end_date IS NOT NULL AND v_end_date < v_next_date THEN
    PERFORM public.bank_standing_order_raise('SCHEDULE_INVALID', 'End date must be on or after the first run date.');
  END IF;
  IF v_max_retries NOT BETWEEN 0 AND 10 THEN
    PERFORM public.bank_standing_order_raise('RETRY_POLICY_INVALID', 'Maximum retries must be between 0 and 10.');
  END IF;
  IF v_failure_policy NOT IN ('RETRY_THEN_PAUSE', 'PAUSE_AFTER_MAX_RETRIES', 'SKIP_AND_CONTINUE', 'FAIL_CLOSED') THEN
    PERFORM public.bank_standing_order_raise('FAILURE_POLICY_INVALID', 'Unsupported failure policy.');
  END IF;
  IF v_frequency = 'WEEKLY' AND (v_schedule_day IS NULL OR v_schedule_day NOT BETWEEN 1 AND 7) THEN
    PERFORM public.bank_standing_order_raise('SCHEDULE_INVALID', 'Weekly schedule day must be ISO weekday 1 through 7.');
  END IF;
  IF v_frequency = 'MONTHLY' AND v_schedule_day IS NOT NULL AND v_schedule_day NOT BETWEEN 1 AND 31 THEN
    PERFORM public.bank_standing_order_raise('SCHEDULE_INVALID', 'Monthly schedule day must be between 1 and 31.');
  END IF;

  SELECT * INTO v_existing
  FROM public.bank_standing_orders
  WHERE company_id = v_company AND idempotency_key = v_key
  FOR UPDATE;
  IF FOUND THEN
    IF coalesce(v_existing.data->>'_requestFingerprint', '') <> v_fingerprint THEN
      PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REUSED', 'The idempotency key was used with different request data.');
    END IF;
    RETURN public.bank_standing_order_response(v_existing.id, true);
  END IF;

  SELECT * INTO v_source
  FROM public.bank_accounts
  WHERE id = v_source_id AND company_id = v_company
  FOR UPDATE;
  IF NOT FOUND THEN
    PERFORM public.bank_standing_order_raise('SOURCE_ACCOUNT_NOT_FOUND', 'Source account is not in the authenticated workspace.');
  END IF;
  IF v_source.status <> 'ACTIVE' THEN
    PERFORM public.bank_standing_order_raise('SOURCE_ACCOUNT_INACTIVE', 'Source account is not active.');
  END IF;
  IF v_source.currency <> v_currency THEN
    PERFORM public.bank_standing_order_raise('CURRENCY_MISMATCH', 'Source account currency does not match the order currency.');
  END IF;
  v_customer_id := coalesce(v_customer_id, v_source.customer_id);
  IF v_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.bank_customers
    WHERE id = v_customer_id AND company_id = v_company
  ) THEN
    PERFORM public.bank_standing_order_raise('CUSTOMER_NOT_FOUND', 'Customer is not in the authenticated workspace.');
  END IF;

  IF v_channel = 'INTERNAL_TRANSFER' THEN
    IF v_destination_id IS NULL OR nullif(trim(p_payload->>'destinationMsisdn'), '') IS NOT NULL THEN
      PERFORM public.bank_standing_order_raise('CHANNEL_DESTINATION_MISMATCH', 'Internal transfers require exactly one account destination.');
    END IF;
    IF v_destination_id = v_source_id THEN
      PERFORM public.bank_standing_order_raise('DESTINATION_SAME_AS_SOURCE', 'Source and destination accounts must differ.');
    END IF;
    SELECT * INTO v_destination
    FROM public.bank_accounts
    WHERE id = v_destination_id AND company_id = v_company
    FOR UPDATE;
    IF NOT FOUND THEN
      PERFORM public.bank_standing_order_raise('DESTINATION_ACCOUNT_NOT_FOUND', 'Destination account is not in the authenticated workspace.');
    END IF;
    IF v_destination.status <> 'ACTIVE' THEN
      PERFORM public.bank_standing_order_raise('DESTINATION_ACCOUNT_INACTIVE', 'Destination account is not active.');
    END IF;
    IF v_destination.currency <> v_currency THEN
      PERFORM public.bank_standing_order_raise('CURRENCY_MISMATCH', 'Destination account currency does not match the order currency.');
    END IF;
  ELSE
    IF v_destination_id IS NOT NULL OR nullif(trim(p_payload->>'destinationMsisdn'), '') IS NULL THEN
      PERFORM public.bank_standing_order_raise('CHANNEL_DESTINATION_MISMATCH', 'Mobile-money orders require exactly one MSISDN destination.');
    END IF;
    v_msisdn := public.bank_standing_order_normalize_msisdn(p_payload->>'destinationMsisdn');
  END IF;

  IF NOT v_approval_required AND NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','CFO','Admin']) THEN
    PERFORM public.bank_standing_order_raise('MAKER_CHECKER_REQUIRED', 'Direct activation requires an authorized maker-checker role.');
  END IF;
  v_status := CASE WHEN v_approval_required THEN 'PENDING_APPROVAL' ELSE 'ACTIVE' END;
  v_number := 'SO-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  INSERT INTO public.bank_standing_orders(
    company_id, order_number, name, source_account_id, destination_account_id,
    destination_msisdn, customer_id, amount, currency, channel, frequency,
    next_run_date, end_date, timezone, schedule_day, narration, approval_required,
    max_retries, failure_policy, status, idempotency_key, data, created_by,
    updated_by, version
  ) VALUES (
    v_company, v_number, coalesce(nullif(trim(p_payload->>'name'), ''), v_narration),
    v_source_id, CASE WHEN v_channel = 'INTERNAL_TRANSFER' THEN v_destination_id ELSE NULL END,
    v_msisdn, v_customer_id, v_amount, v_currency, v_channel, v_frequency,
    v_next_date, v_end_date, v_timezone, v_schedule_day, v_narration,
    v_approval_required, v_max_retries, v_failure_policy, v_status, v_key,
    v_data, v_actor, v_actor, 0
  ) RETURNING id INTO v_id;

  INSERT INTO public.bank_standing_order_events(
    company_id, standing_order_id, event_type, previous_status, next_status,
    actor_id, request_id, idempotency_key, after_data
  ) VALUES (
    v_company, v_id, 'CREATED', NULL, v_status, v_actor, v_key, v_key,
    jsonb_build_object('_requestFingerprint', v_fingerprint, 'channel', v_channel, 'currency', v_currency)
  ) RETURNING id INTO v_event_id;

  PERFORM public.bank_audit(
    'STANDING_ORDER_CREATED', 'standing_order', v_id, 'SUCCESS',
    jsonb_build_object('status', v_status, 'channel', v_channel, 'currency', v_currency)
  );
  RETURN public.bank_standing_order_response(v_id, false, v_event_id);
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO v_existing
  FROM public.bank_standing_orders
  WHERE company_id = v_company AND idempotency_key = v_key
  LIMIT 1;
  IF FOUND AND coalesce(v_existing.data->>'_requestFingerprint', '') = v_fingerprint THEN
    RETURN public.bank_standing_order_response(v_existing.id, true);
  END IF;
  RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_submit_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id();
  v_actor uuid := auth.uid();
  v_order public.bank_standing_orders%ROWTYPE;
  v_event_id uuid;
  v_fingerprint text := md5(format('SUBMIT|%s|%s', p_order_id, p_expected_version));
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Customer Service','Teller','Admin']) THEN
    PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to submit standing orders.');
  END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_order FROM public.bank_standing_orders WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
    IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id = v_company AND e.idempotency_key = p_idempotency_key) THEN
      IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id = v_company AND e.idempotency_key = p_idempotency_key AND e.after_data->>'_requestFingerprint' = v_fingerprint) THEN
        RETURN public.bank_standing_order_response(p_order_id, true);
      END IF;
      PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REUSED', 'Lifecycle idempotency key was used for another request.');
    END IF;
  ELSE
    SELECT * INTO v_order FROM public.bank_standing_orders WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  END IF;
  IF NOT FOUND THEN
    PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.');
  END IF;
  IF v_order.version <> p_expected_version THEN
    PERFORM public.bank_standing_order_raise('STALE_ORDER_VERSION', 'Standing order changed; refresh before submitting.');
  END IF;
  IF v_order.status NOT IN ('DRAFT', 'REJECTED') THEN
    PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'Only draft or rejected orders may be submitted.');
  END IF;
  UPDATE public.bank_standing_orders
  SET status = 'PENDING_APPROVAL', rejected_by = NULL, rejected_at = NULL,
      rejection_reason = NULL, version = version + 1, updated_by = v_actor, updated_at = now()
  WHERE id = p_order_id AND company_id = v_company;
  INSERT INTO public.bank_standing_order_events(
    company_id, standing_order_id, event_type, previous_status, next_status,
    actor_id, idempotency_key, before_data, after_data
  ) VALUES (
    v_company, p_order_id, 'SUBMITTED', v_order.status, 'PENDING_APPROVAL', v_actor,
    p_idempotency_key, jsonb_build_object('version', v_order.version),
    jsonb_build_object('_requestFingerprint', v_fingerprint, 'version', v_order.version + 1)
  ) RETURNING id INTO v_event_id;
  PERFORM public.bank_audit('STANDING_ORDER_SUBMITTED', 'standing_order', p_order_id, 'SUCCESS', '{}'::jsonb);
  RETURN public.bank_standing_order_response(p_order_id, false, v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_approve_standing_order(
  p_order_id uuid,
  p_decision text,
  p_note text DEFAULT NULL,
  p_expected_version bigint DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id();
  v_actor uuid := auth.uid();
  v_order public.bank_standing_orders%ROWTYPE;
  v_decision text := upper(trim(p_decision));
  v_next_status text;
  v_event_type text;
  v_event_id uuid;
  v_fingerprint text := md5(format('APPROVE|%s|%s|%s|%s', p_order_id, v_decision, coalesce(p_note, ''), p_expected_version));
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','CFO','Admin']) THEN
    PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to approve standing orders.');
  END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN
    PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.');
  END IF;
  IF p_idempotency_key IS NOT NULL AND EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id = v_company AND e.idempotency_key = p_idempotency_key) THEN
    IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id = v_company AND e.idempotency_key = p_idempotency_key AND e.after_data->>'_requestFingerprint' = v_fingerprint) THEN
      RETURN public.bank_standing_order_response(p_order_id, true);
    END IF;
    PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REUSED', 'Lifecycle idempotency key was used for another request.');
  END IF;
  IF v_order.version <> p_expected_version THEN
    PERFORM public.bank_standing_order_raise('STALE_ORDER_VERSION', 'Standing order changed; refresh before approving.');
  END IF;
  IF v_order.status <> 'PENDING_APPROVAL' THEN
    PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'Standing order is not awaiting approval.');
  END IF;
  IF v_order.created_by = v_actor THEN
    PERFORM public.bank_standing_order_raise('MAKER_CHECKER_REQUIRED', 'The creator cannot approve the same standing order.');
  END IF;
  IF v_decision NOT IN ('APPROVE', 'APPROVED', 'REJECT', 'REJECTED') THEN
    PERFORM public.bank_standing_order_raise('DECISION_INVALID', 'Decision must be APPROVE or REJECT.');
  END IF;
  IF v_decision IN ('REJECT', 'REJECTED') AND nullif(trim(p_note), '') IS NULL THEN
    PERFORM public.bank_standing_order_raise('REJECTION_REASON_REQUIRED', 'A rejection reason is required.');
  END IF;
  IF v_decision IN ('APPROVE', 'APPROVED') THEN
    v_next_status := 'APPROVED'; v_event_type := 'APPROVED';
    UPDATE public.bank_standing_orders
    SET status = v_next_status, approved_by = v_actor, approved_at = now(),
        version = version + 1, updated_by = v_actor, updated_at = now()
    WHERE id = p_order_id AND company_id = v_company;
  ELSE
    v_next_status := 'REJECTED'; v_event_type := 'REJECTED';
    UPDATE public.bank_standing_orders
    SET status = v_next_status, rejected_by = v_actor, rejected_at = now(),
        rejection_reason = left(trim(p_note), 1000), version = version + 1,
        updated_by = v_actor, updated_at = now()
    WHERE id = p_order_id AND company_id = v_company;
  END IF;
  INSERT INTO public.bank_standing_order_events(
    company_id, standing_order_id, event_type, previous_status, next_status,
    actor_id, idempotency_key, before_data, after_data, reason
  ) VALUES (
    v_company, p_order_id, v_event_type, v_order.status, v_next_status, v_actor,
    p_idempotency_key, jsonb_build_object('version', v_order.version),
    jsonb_build_object('_requestFingerprint', v_fingerprint, 'version', v_order.version + 1), p_note
  ) RETURNING id INTO v_event_id;
  PERFORM public.bank_audit('STANDING_ORDER_' || v_event_type, 'standing_order', p_order_id, 'SUCCESS', jsonb_build_object('note', left(coalesce(p_note, ''), 200)));
  RETURN public.bank_standing_order_response(p_order_id, false, v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_activate_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id();
  v_actor uuid := auth.uid();
  v_order public.bank_standing_orders%ROWTYPE;
  v_source public.bank_accounts%ROWTYPE;
  v_destination public.bank_accounts%ROWTYPE;
  v_event_id uuid;
  v_fingerprint text := md5(format('ACTIVATE|%s|%s', p_order_id, p_expected_version));
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','CFO','Admin']) THEN
    PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to activate standing orders.');
  END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.'); END IF;
  IF p_idempotency_key IS NOT NULL AND EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id = v_company AND e.idempotency_key = p_idempotency_key) THEN
    IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id = v_company AND e.idempotency_key = p_idempotency_key AND e.after_data->>'_requestFingerprint' = v_fingerprint) THEN RETURN public.bank_standing_order_response(p_order_id, true); END IF;
    PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REUSED', 'Lifecycle idempotency key was used for another request.');
  END IF;
  IF v_order.version <> p_expected_version THEN PERFORM public.bank_standing_order_raise('STALE_ORDER_VERSION', 'Standing order changed; refresh before activation.'); END IF;
  IF v_order.status <> 'APPROVED' THEN PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'Only approved standing orders may be activated.'); END IF;
  SELECT * INTO v_source FROM public.bank_accounts WHERE id = v_order.source_account_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND OR v_source.status <> 'ACTIVE' THEN PERFORM public.bank_standing_order_raise('SOURCE_ACCOUNT_INACTIVE', 'Source account is not active.'); END IF;
  IF v_source.currency <> v_order.currency THEN PERFORM public.bank_standing_order_raise('CURRENCY_MISMATCH', 'Source account currency does not match the order.'); END IF;
  IF v_order.channel = 'INTERNAL_TRANSFER' THEN
    SELECT * INTO v_destination FROM public.bank_accounts WHERE id = v_order.destination_account_id AND company_id = v_company FOR UPDATE;
    IF NOT FOUND OR v_destination.status <> 'ACTIVE' THEN PERFORM public.bank_standing_order_raise('DESTINATION_ACCOUNT_INACTIVE', 'Destination account is not active.'); END IF;
    IF v_destination.currency <> v_order.currency THEN PERFORM public.bank_standing_order_raise('CURRENCY_MISMATCH', 'Destination account currency does not match the order.'); END IF;
  END IF;
  UPDATE public.bank_standing_orders SET status = 'ACTIVE', version = version + 1, updated_by = v_actor, updated_at = now() WHERE id = p_order_id AND company_id = v_company;
  INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,idempotency_key,before_data,after_data)
  VALUES (v_company,p_order_id,'ACTIVATED',v_order.status,'ACTIVE',v_actor,p_idempotency_key,jsonb_build_object('version',v_order.version),jsonb_build_object('_requestFingerprint',v_fingerprint,'version',v_order.version + 1)) RETURNING id INTO v_event_id;
  PERFORM public.bank_audit('STANDING_ORDER_ACTIVATED','standing_order',p_order_id,'SUCCESS','{}'::jsonb);
  RETURN public.bank_standing_order_response(p_order_id,false,v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_pause_standing_order(
  p_order_id uuid,
  p_reason text,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id(); v_actor uuid := auth.uid();
  v_order public.bank_standing_orders%ROWTYPE; v_event_id uuid;
  v_fingerprint text := md5(format('PAUSE|%s|%s|%s', p_order_id, coalesce(p_reason, ''), p_expected_version));
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','CFO','Admin']) THEN PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to pause standing orders.'); END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id = p_order_id AND company_id = v_company FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.'); END IF;
  IF p_idempotency_key IS NOT NULL AND EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id=v_company AND e.idempotency_key=p_idempotency_key) THEN
    IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id=v_company AND e.idempotency_key=p_idempotency_key AND e.after_data->>'_requestFingerprint'=v_fingerprint) THEN RETURN public.bank_standing_order_response(p_order_id,true); END IF;
    PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REUSED', 'Lifecycle idempotency key was used for another request.');
  END IF;
  IF v_order.version <> p_expected_version THEN PERFORM public.bank_standing_order_raise('STALE_ORDER_VERSION', 'Standing order changed; refresh before pausing.'); END IF;
  IF v_order.status NOT IN ('APPROVED','ACTIVE') THEN PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'Only approved or active standing orders may be paused.'); END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN PERFORM public.bank_standing_order_raise('REASON_REQUIRED', 'A pause reason is required.'); END IF;
  UPDATE public.bank_standing_orders SET status='PAUSED', paused_at=now(), version=version+1, updated_by=v_actor, updated_at=now() WHERE id=p_order_id AND company_id=v_company;
  INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,idempotency_key,before_data,after_data,reason)
  VALUES(v_company,p_order_id,'PAUSED',v_order.status,'PAUSED',v_actor,p_idempotency_key,jsonb_build_object('version',v_order.version),jsonb_build_object('_requestFingerprint',v_fingerprint,'version',v_order.version+1),left(trim(p_reason),1000)) RETURNING id INTO v_event_id;
  PERFORM public.bank_audit('STANDING_ORDER_PAUSED','standing_order',p_order_id,'SUCCESS',jsonb_build_object('reason',left(trim(p_reason),200)));
  RETURN public.bank_standing_order_response(p_order_id,false,v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_resume_standing_order(
  p_order_id uuid,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id(); v_actor uuid := auth.uid();
  v_order public.bank_standing_orders%ROWTYPE; v_event_id uuid;
  v_fingerprint text := md5(format('RESUME|%s|%s', p_order_id, p_expected_version));
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','CFO','Admin']) THEN PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to resume standing orders.'); END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id=p_order_id AND company_id=v_company FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.'); END IF;
  IF p_idempotency_key IS NOT NULL AND EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id=v_company AND e.idempotency_key=p_idempotency_key) THEN
    IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id=v_company AND e.idempotency_key=p_idempotency_key AND e.after_data->>'_requestFingerprint'=v_fingerprint) THEN RETURN public.bank_standing_order_response(p_order_id,true); END IF;
    PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REUSED', 'Lifecycle idempotency key was used for another request.');
  END IF;
  IF v_order.version <> p_expected_version THEN PERFORM public.bank_standing_order_raise('STALE_ORDER_VERSION', 'Standing order changed; refresh before resuming.'); END IF;
  IF v_order.status <> 'PAUSED' THEN PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'Only paused standing orders may be resumed.'); END IF;
  IF v_order.next_run_date < current_date THEN PERFORM public.bank_standing_order_raise('STANDING_ORDER_REQUIRES_REVIEW', 'The overdue schedule requires explicit review before resume.'); END IF;
  UPDATE public.bank_standing_orders SET status='ACTIVE', paused_at=NULL, version=version+1, updated_by=v_actor, updated_at=now() WHERE id=p_order_id AND company_id=v_company;
  INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,idempotency_key,before_data,after_data)
  VALUES(v_company,p_order_id,'RESUMED',v_order.status,'ACTIVE',v_actor,p_idempotency_key,jsonb_build_object('version',v_order.version),jsonb_build_object('_requestFingerprint',v_fingerprint,'version',v_order.version+1)) RETURNING id INTO v_event_id;
  PERFORM public.bank_audit('STANDING_ORDER_RESUMED','standing_order',p_order_id,'SUCCESS','{}'::jsonb);
  RETURN public.bank_standing_order_response(p_order_id,false,v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_cancel_standing_order(
  p_order_id uuid,
  p_reason text,
  p_expected_version bigint,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id(); v_actor uuid := auth.uid();
  v_order public.bank_standing_orders%ROWTYPE; v_event_id uuid;
  v_fingerprint text := md5(format('CANCEL|%s|%s|%s', p_order_id, coalesce(p_reason, ''), p_expected_version));
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','CFO','Admin']) THEN PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to cancel standing orders.'); END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id=p_order_id AND company_id=v_company FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.'); END IF;
  IF p_idempotency_key IS NOT NULL AND EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id=v_company AND e.idempotency_key=p_idempotency_key) THEN
    IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id=v_company AND e.idempotency_key=p_idempotency_key AND e.after_data->>'_requestFingerprint'=v_fingerprint) THEN RETURN public.bank_standing_order_response(p_order_id,true); END IF;
    PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REUSED', 'Lifecycle idempotency key was used for another request.');
  END IF;
  IF v_order.version <> p_expected_version THEN PERFORM public.bank_standing_order_raise('STALE_ORDER_VERSION', 'Standing order changed; refresh before cancelling.'); END IF;
  IF v_order.status IN ('CANCELLED','COMPLETED','EXPIRED') THEN PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'The standing order is already terminal.'); END IF;
  IF nullif(trim(p_reason), '') IS NULL THEN PERFORM public.bank_standing_order_raise('REASON_REQUIRED', 'A cancellation reason is required.'); END IF;
  UPDATE public.bank_standing_orders SET status='CANCELLED', cancelled_at=now(), cancelled_by=v_actor, version=version+1, updated_by=v_actor, updated_at=now() WHERE id=p_order_id AND company_id=v_company;
  INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,idempotency_key,before_data,after_data,reason)
  VALUES(v_company,p_order_id,'CANCELLED',v_order.status,'CANCELLED',v_actor,p_idempotency_key,jsonb_build_object('version',v_order.version),jsonb_build_object('_requestFingerprint',v_fingerprint,'version',v_order.version+1),left(trim(p_reason),1000)) RETURNING id INTO v_event_id;
  PERFORM public.bank_audit('STANDING_ORDER_CANCELLED','standing_order',p_order_id,'SUCCESS',jsonb_build_object('reason',left(trim(p_reason),200)));
  RETURN public.bank_standing_order_response(p_order_id,false,v_event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_run_standing_orders(
  p_run_date date DEFAULT current_date,
  p_order_id uuid DEFAULT NULL,
  p_max_orders integer DEFAULT 250
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id();
  v_order public.bank_standing_orders%ROWTYPE;
  v_prior public.bank_standing_order_runs%ROWTYPE;
  v_run_id uuid;
  v_transaction_id uuid;
  v_instruction_id uuid;
  v_run_date date := coalesce(p_run_date, current_date);
  v_attempt integer;
  v_max integer := least(greatest(coalesce(p_max_orders, 250), 1), 250);
  v_occurrence_key text;
  v_run_key text;
  v_result jsonb;
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
  IF auth.uid() IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','Admin']) THEN
    PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to run standing orders.');
  END IF;
  IF v_run_date > current_date THEN
    PERFORM public.bank_standing_order_raise('SCHEDULE_INVALID', 'A scheduler cannot execute a future run date.');
  END IF;

  FOR v_order IN
    SELECT *
    FROM public.bank_standing_orders so
    WHERE so.company_id = v_company
      AND so.status = 'ACTIVE'
      AND (p_order_id IS NULL OR so.id = p_order_id)
      AND so.next_run_date <= v_run_date
      AND (so.end_date IS NULL OR so.end_date >= so.next_run_date)
    ORDER BY so.next_run_date, so.id
    LIMIT v_max
    FOR UPDATE SKIP LOCKED
  LOOP
    v_processed := v_processed + 1;
    v_occurrence_key := 'SO:' || v_order.id::text || ':' || v_order.next_run_date::text;
    SELECT * INTO v_prior
    FROM public.bank_standing_order_runs r
    WHERE r.company_id = v_company
      AND r.standing_order_id = v_order.id
      AND r.scheduled_for = v_order.next_run_date
    ORDER BY r.attempt_number DESC, r.created_at DESC
    LIMIT 1;

    IF FOUND AND v_prior.status IN ('POSTED','SUBMITTED','PENDING_PROVIDER','SKIPPED','CANCELLED') THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId',v_order.id,'runId',v_prior.id,'status',v_prior.status,'replayed',true));
      CONTINUE;
    END IF;
    IF FOUND AND v_prior.status = 'FAILED' AND v_prior.attempt_number >= v_order.max_retries + 1 THEN
      v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId',v_order.id,'runId',v_prior.id,'status','FAILED','errorCode',v_prior.error_code,'replayed',true));
      v_failed := v_failed + 1;
      CONTINUE;
    END IF;

    v_attempt := CASE WHEN FOUND THEN v_prior.attempt_number + 1 ELSE 1 END;
    v_run_key := CASE WHEN v_attempt = 1 THEN v_occurrence_key ELSE v_occurrence_key || ':attempt:' || v_attempt::text END;
    INSERT INTO public.bank_standing_order_runs(
      company_id, standing_order_id, scheduled_for, started_at, attempt_number,
      status, amount, currency, idempotency_key, data, created_by
    ) VALUES (
      v_company, v_order.id, v_order.next_run_date, now(), v_attempt, 'PROCESSING',
      v_order.amount, v_order.currency, v_run_key,
      jsonb_build_object('parentOccurrenceKey',v_occurrence_key,'channel',v_order.channel,'sourceAccountId',v_order.source_account_id,'destinationAccountId',v_order.destination_account_id,'destinationMsisdn',v_order.destination_msisdn),
      auth.uid()
    ) RETURNING id INTO v_run_id;

    BEGIN
      IF v_order.channel = 'INTERNAL_TRANSFER' THEN
        v_result := public.bank_post_transaction(jsonb_build_object(
          'transactionType','TRANSFER',
          'channel','STANDING_ORDER',
          'sourceAccountId',v_order.source_account_id,
          'destinationAccountId',v_order.destination_account_id,
          'customerId',v_order.customer_id,
          'amount',v_order.amount,
          'currency',v_order.currency,
          'narration',coalesce(v_order.narration,'Standing order ' || v_order.order_number),
          'idempotencyKey',v_occurrence_key
        ));
        v_transaction_id := nullif(v_result->>'transactionId','')::uuid;
        v_next_date := public.bank_standing_order_next_date(v_order.next_run_date, v_order.frequency, v_order.schedule_day);
        v_status := CASE WHEN v_order.end_date IS NOT NULL AND v_next_date > v_order.end_date THEN 'COMPLETED' ELSE 'ACTIVE' END;
        UPDATE public.bank_standing_order_runs
        SET status='POSTED', transaction_id=v_transaction_id, completed_at=now(), data=data || jsonb_build_object('result',v_result)
        WHERE id=v_run_id;
        UPDATE public.bank_standing_orders
        SET status=v_status, next_run_date=v_next_date, last_run_at=now(), last_result='POSTED',
            run_count=run_count+1, failure_count=failure_count, consecutive_failure_count=0,
            version=version+1, updated_at=now()
        WHERE id=v_order.id AND company_id=v_company;
        INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,request_id,idempotency_key,after_data)
        VALUES(v_company,v_order.id,CASE WHEN v_status='COMPLETED' THEN 'COMPLETED' ELSE 'RUN_POSTED' END,v_order.status,v_status,auth.uid(),v_run_key,v_run_key,jsonb_build_object('runId',v_run_id,'transactionId',v_transaction_id,'scheduledFor',v_order.next_run_date));
        PERFORM public.bank_audit('STANDING_ORDER_RUN_POSTED','standing_order',v_order.id,'SUCCESS',jsonb_build_object('runId',v_run_id,'transactionId',v_transaction_id));
        v_posted := v_posted + 1;
        IF v_status = 'COMPLETED' THEN v_completed := v_completed + 1; END IF;
        v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId',v_order.id,'runId',v_run_id,'status','POSTED','transactionId',v_transaction_id,'replayed',false));
      ELSE
        v_result := public.bank_create_payment_instruction(jsonb_build_object(
          'paymentType','STANDING_ORDER',
          'channel','MOBILE_MONEY',
          'sourceAccountId',v_order.source_account_id,
          'amount',v_order.amount,
          'currency',v_order.currency,
          'provider',coalesce(v_order.data->>'provider','MOBILE_MONEY'),
          'msisdn',v_order.destination_msisdn,
          'idempotencyKey',v_occurrence_key,
          'data',jsonb_build_object('standingOrderId',v_order.id,'runId',v_run_id)
        ));
        v_instruction_id := nullif(v_result->>'instructionId','')::uuid;
        UPDATE public.bank_standing_order_runs
        SET status='PENDING_PROVIDER', payment_instruction_id=v_instruction_id, provider=coalesce(v_order.data->>'provider','MOBILE_MONEY'), completed_at=now(), data=data || jsonb_build_object('result',v_result)
        WHERE id=v_run_id;
        UPDATE public.bank_standing_orders
        SET last_run_at=now(), last_result='PENDING_PROVIDER', updated_at=now()
        WHERE id=v_order.id AND company_id=v_company;
        INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,request_id,idempotency_key,after_data)
        VALUES(v_company,v_order.id,'RUN_PENDING_PROVIDER',v_order.status,'ACTIVE',auth.uid(),v_run_key,v_run_key,jsonb_build_object('runId',v_run_id,'paymentInstructionId',v_instruction_id,'scheduledFor',v_order.next_run_date));
        PERFORM public.bank_audit('STANDING_ORDER_PROVIDER_SUBMITTED','standing_order',v_order.id,'SUCCESS',jsonb_build_object('runId',v_run_id,'paymentInstructionId',v_instruction_id));
        v_pending := v_pending + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId',v_order.id,'runId',v_run_id,'status','PENDING_PROVIDER','paymentInstructionId',v_instruction_id,'replayed',false));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_error_code := SQLSTATE;
      v_error_message := left(SQLERRM, 500);
      UPDATE public.bank_standing_order_runs
      SET status='FAILED', error_code=v_error_code, error_message=v_error_message, completed_at=now()
      WHERE id=v_run_id;
      IF v_order.failure_policy = 'SKIP_AND_CONTINUE' THEN
        v_next_date := public.bank_standing_order_next_date(v_order.next_run_date, v_order.frequency, v_order.schedule_day);
        UPDATE public.bank_standing_orders
        SET next_run_date=v_next_date, last_run_at=now(), last_result='SKIPPED',
            run_count=run_count, failure_count=failure_count+1, consecutive_failure_count=consecutive_failure_count+1,
            version=version+1, updated_at=now()
        WHERE id=v_order.id AND company_id=v_company;
        UPDATE public.bank_standing_order_runs SET status='SKIPPED' WHERE id=v_run_id;
        INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,request_id,idempotency_key,reason,after_data)
        VALUES(v_company,v_order.id,'RUN_SKIPPED',v_order.status,'ACTIVE',auth.uid(),v_run_key,v_run_key,v_error_message,jsonb_build_object('runId',v_run_id,'errorCode',v_error_code));
        PERFORM public.bank_audit('STANDING_ORDER_RUN_SKIPPED','standing_order',v_order.id,'SUCCESS',jsonb_build_object('runId',v_run_id,'errorCode',v_error_code));
        v_skipped := v_skipped + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId',v_order.id,'runId',v_run_id,'status','SKIPPED','errorCode',v_error_code,'replayed',false));
      ELSE
        UPDATE public.bank_standing_orders
        SET last_run_at=now(), last_result=v_error_message, failure_count=failure_count+1,
            consecutive_failure_count=consecutive_failure_count+1,
            status=CASE WHEN v_attempt >= max_retries + 1 THEN 'PAUSED' ELSE status END,
            paused_at=CASE WHEN v_attempt >= max_retries + 1 THEN now() ELSE paused_at END,
            version=version+1, updated_at=now()
        WHERE id=v_order.id AND company_id=v_company;
        INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,request_id,idempotency_key,reason,after_data)
        VALUES(v_company,v_order.id,'RUN_FAILED',v_order.status,CASE WHEN v_attempt >= v_order.max_retries + 1 THEN 'PAUSED' ELSE v_order.status END,auth.uid(),v_run_key,v_run_key,v_error_message,jsonb_build_object('runId',v_run_id,'errorCode',v_error_code,'attempt',v_attempt));
        PERFORM public.bank_audit('STANDING_ORDER_RUN_FAILED','standing_order',v_order.id,'FAILURE',jsonb_build_object('runId',v_run_id,'errorCode',v_error_code,'attempt',v_attempt));
        v_failed := v_failed + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object('standingOrderId',v_order.id,'runId',v_run_id,'status','FAILED','errorCode',v_error_code,'replayed',false));
      END IF;
    END;
  END LOOP;
  PERFORM public.bank_audit('STANDING_ORDERS_RUN','standing_order',NULL,'SUCCESS',jsonb_build_object('processed',v_processed,'posted',v_posted,'pendingProvider',v_pending,'failed',v_failed,'skipped',v_skipped));
  RETURN jsonb_build_object('runDate',v_run_date,'processed',v_processed,'posted',v_posted,'pendingProvider',v_pending,'failed',v_failed,'skipped',v_skipped,'completed',v_completed,'results',v_results);
END;
$$;

-- Compatibility wrapper retained for existing tRPC and daily-control callers.
CREATE OR REPLACE FUNCTION public.bank_run_standing_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN public.bank_run_standing_orders(current_date, NULL, 250);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_confirm_standing_order_provider_payment(
  p_run_id uuid,
  p_provider_reference text,
  p_provider_status text,
  p_provider_event_id text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id(); v_actor uuid := auth.uid();
  v_run public.bank_standing_order_runs%ROWTYPE;
  v_order public.bank_standing_orders%ROWTYPE;
  v_instruction public.bank_payment_instructions%ROWTYPE;
  v_event_id uuid; v_transaction_id uuid; v_result jsonb;
  v_success boolean := upper(coalesce(p_provider_status,'')) IN ('SUCCESS','SETTLED','CONFIRMED','COMPLETED');
  v_fingerprint text := md5(format('PROVIDER|%s|%s|%s|%s',p_run_id,coalesce(p_provider_reference,''),coalesce(p_provider_status,''),coalesce(p_provider_event_id,'')));
  v_next_date date; v_next_status text;
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','CFO','Admin']) THEN
    PERFORM public.bank_standing_order_raise('FORBIDDEN', 'Only an authorized banking operator may reconcile provider payments.');
  END IF;
  SELECT * INTO v_run FROM public.bank_standing_order_runs WHERE id=p_run_id AND company_id=v_company FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.bank_standing_order_raise('RUN_NOT_FOUND', 'Standing order run is not in the authenticated workspace.'); END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id=v_run.standing_order_id AND company_id=v_company FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.'); END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 12 THEN PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REQUIRED', 'Provider confirmation requires an idempotency key.'); END IF;
  IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id=v_company AND e.idempotency_key=p_idempotency_key) THEN
    IF EXISTS (SELECT 1 FROM public.bank_standing_order_events e WHERE e.company_id=v_company AND e.idempotency_key=p_idempotency_key AND e.after_data->>'_requestFingerprint'=v_fingerprint) THEN
      RETURN jsonb_build_object('runId',v_run.id,'status',v_run.status,'transactionId',v_run.transaction_id,'replayed',true);
    END IF;
    PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REUSED', 'Provider confirmation key was used for different data.');
  END IF;
  IF v_run.status NOT IN ('SUBMITTED','PENDING_PROVIDER') THEN
    IF v_run.status = 'POSTED' THEN RETURN jsonb_build_object('runId',v_run.id,'status','POSTED','transactionId',v_run.transaction_id,'replayed',true); END IF;
    PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'The provider run is not awaiting confirmation.');
  END IF;
  IF nullif(trim(p_provider_reference),'') IS NULL OR nullif(trim(p_provider_event_id),'') IS NULL THEN
    PERFORM public.bank_standing_order_raise('PROVIDER_CONFIRMATION_INVALID', 'Provider reference and event ID are required.');
  END IF;
  IF v_run.payment_instruction_id IS NOT NULL THEN
    SELECT * INTO v_instruction FROM public.bank_payment_instructions WHERE id=v_run.payment_instruction_id AND company_id=v_company FOR UPDATE;
  END IF;
  IF v_success THEN
    v_result := public.bank_post_transaction(jsonb_build_object(
      'transactionType','WITHDRAWAL','channel','MOBILE_MONEY',
      'sourceAccountId',v_order.source_account_id,'customerId',v_order.customer_id,
      'amount',v_order.amount,'currency',v_order.currency,
      'provider',coalesce(v_run.provider,'MOBILE_MONEY'),'providerReference',p_provider_reference,
      'narration',coalesce(v_order.narration,'Standing order ' || v_order.order_number),
      'idempotencyKey',v_run.idempotency_key || ':SETTLEMENT'
    ));
    v_transaction_id := nullif(v_result->>'transactionId','')::uuid;
    v_next_date := public.bank_standing_order_next_date(v_run.scheduled_for, v_order.frequency, v_order.schedule_day);
    v_next_status := CASE WHEN v_order.end_date IS NOT NULL AND v_next_date > v_order.end_date THEN 'COMPLETED' ELSE 'ACTIVE' END;
    UPDATE public.bank_standing_order_runs SET status='POSTED', transaction_id=v_transaction_id, provider_reference=p_provider_reference, completed_at=now(), data=data || jsonb_build_object('providerEventId',p_provider_event_id) WHERE id=v_run.id;
    IF v_instruction.id IS NOT NULL THEN UPDATE public.bank_payment_instructions SET status='CONFIRMED', provider_reference=p_provider_reference, confirmed_at=now() WHERE id=v_instruction.id AND company_id=v_company; END IF;
    UPDATE public.bank_standing_orders SET status=v_next_status, next_run_date=v_next_date, last_run_at=now(), last_result='POSTED', run_count=run_count+1, consecutive_failure_count=0, version=version+1, updated_at=now() WHERE id=v_order.id AND company_id=v_company;
    INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,request_id,idempotency_key,after_data)
    VALUES(v_company,v_order.id,CASE WHEN v_next_status='COMPLETED' THEN 'COMPLETED' ELSE 'RUN_POSTED' END,v_order.status,v_next_status,v_actor,p_provider_event_id,p_idempotency_key,jsonb_build_object('_requestFingerprint',v_fingerprint,'runId',v_run.id,'transactionId',v_transaction_id));
    PERFORM public.bank_audit('STANDING_ORDER_PROVIDER_CONFIRMED','standing_order',v_order.id,'SUCCESS',jsonb_build_object('runId',v_run.id,'providerReference',p_provider_reference));
    RETURN jsonb_build_object('runId',v_run.id,'status','POSTED','transactionId',v_transaction_id,'replayed',false);
  ELSE
    UPDATE public.bank_standing_order_runs SET status='FAILED', provider_reference=p_provider_reference, error_code='PROVIDER_FAILED', error_message=left(coalesce(p_provider_status,'Provider failed'),500), completed_at=now(), data=data || jsonb_build_object('providerEventId',p_provider_event_id) WHERE id=v_run.id;
    IF v_instruction.id IS NOT NULL THEN UPDATE public.bank_payment_instructions SET status='FAILED', provider_reference=p_provider_reference, failure_reason=left(coalesce(p_provider_status,'Provider failed'),500) WHERE id=v_instruction.id AND company_id=v_company; END IF;
    UPDATE public.bank_standing_orders SET last_run_at=now(), last_result='PROVIDER_FAILED', failure_count=failure_count+1, consecutive_failure_count=consecutive_failure_count+1, status=CASE WHEN v_order.failure_policy IN ('FAIL_CLOSED','PAUSE_AFTER_MAX_RETRIES') THEN 'PAUSED' ELSE status END, paused_at=CASE WHEN v_order.failure_policy IN ('FAIL_CLOSED','PAUSE_AFTER_MAX_RETRIES') THEN now() ELSE paused_at END, version=version+1, updated_at=now() WHERE id=v_order.id AND company_id=v_company;
    INSERT INTO public.bank_standing_order_events(company_id,standing_order_id,event_type,previous_status,next_status,actor_id,request_id,idempotency_key,reason,after_data)
    VALUES(v_company,v_order.id,'RUN_FAILED',v_order.status,CASE WHEN v_order.failure_policy IN ('FAIL_CLOSED','PAUSE_AFTER_MAX_RETRIES') THEN 'PAUSED' ELSE v_order.status END,v_actor,p_provider_event_id,p_idempotency_key,left(coalesce(p_provider_status,'Provider failed'),500),jsonb_build_object('_requestFingerprint',v_fingerprint,'runId',v_run.id));
    PERFORM public.bank_audit('STANDING_ORDER_PROVIDER_FAILED','standing_order',v_order.id,'FAILURE',jsonb_build_object('runId',v_run.id,'providerStatus',p_provider_status));
    RETURN jsonb_build_object('runId',v_run.id,'status','FAILED','replayed',false);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_retry_standing_order_run(
  p_run_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company uuid := public.current_company_id(); v_actor uuid := auth.uid();
  v_run public.bank_standing_order_runs%ROWTYPE;
  v_order public.bank_standing_orders%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Finance Manager','Admin']) THEN PERFORM public.bank_standing_order_raise('FORBIDDEN', 'You are not authorized to retry standing order runs.'); END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 12 THEN PERFORM public.bank_standing_order_raise('IDEMPOTENCY_KEY_REQUIRED', 'Retry requires an idempotency key.'); END IF;
  SELECT * INTO v_run FROM public.bank_standing_order_runs WHERE id=p_run_id AND company_id=v_company FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.bank_standing_order_raise('RUN_NOT_FOUND', 'Standing order run is not in the authenticated workspace.'); END IF;
  SELECT * INTO v_order FROM public.bank_standing_orders WHERE id=v_run.standing_order_id AND company_id=v_company FOR UPDATE;
  IF NOT FOUND THEN PERFORM public.bank_standing_order_raise('STANDING_ORDER_NOT_FOUND', 'Standing order is not in the authenticated workspace.'); END IF;
  IF v_run.status <> 'FAILED' THEN PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'Only failed runs may be retried.'); END IF;
  IF v_order.status <> 'ACTIVE' THEN PERFORM public.bank_standing_order_raise('ORDER_STATE_INVALID', 'Only active standing orders may be retried.'); END IF;
  IF v_run.attempt_number >= v_order.max_retries + 1 THEN PERFORM public.bank_standing_order_raise('RUN_RETRY_LIMIT_REACHED', 'The configured retry limit has been reached.'); END IF;
  RETURN public.bank_run_standing_orders(v_run.scheduled_for, v_order.id, 1) || jsonb_build_object('requestedRetry', true, 'retryIdempotencyKey', p_idempotency_key);
END;
$$;

-- Exposed workflow RPCs are authenticated-only. Internal helpers and immutable
-- event triggers remain non-client-callable.
REVOKE ALL ON FUNCTION public.bank_standing_order_raise(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_request_fingerprint(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_normalize_msisdn(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_next_date(date,text,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_standing_order_response(uuid,boolean,uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.bank_list_standing_orders(text,text,integer,integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_get_standing_order(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_create_standing_order(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_submit_standing_order(uuid,bigint,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_approve_standing_order(uuid,text,text,bigint,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_activate_standing_order(uuid,bigint,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_pause_standing_order(uuid,text,bigint,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_resume_standing_order(uuid,bigint,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_cancel_standing_order(uuid,text,bigint,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_run_standing_orders(date,uuid,integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_run_standing_orders() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_confirm_standing_order_provider_payment(uuid,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bank_retry_standing_order_run(uuid,text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.bank_list_standing_orders(text,text,integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_get_standing_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_standing_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_submit_standing_order(uuid,bigint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_approve_standing_order(uuid,text,text,bigint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_activate_standing_order(uuid,bigint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_pause_standing_order(uuid,text,bigint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_resume_standing_order(uuid,bigint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_cancel_standing_order(uuid,text,bigint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_standing_orders(date,uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_standing_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_confirm_standing_order_provider_payment(uuid,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_retry_standing_order_run(uuid,text) TO authenticated;

COMMIT;
