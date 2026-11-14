-- SMART MANAGER shared operational accounting posting bridge.
-- Additive only: no existing rows are modified or deleted.
-- Requires 20260824_050_fin_foundation.sql and 20260824_051_fin_journal_core.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.fin_post_operational_entry(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_user_id uuid := auth.uid();
  v_idempotency_key text := nullif(trim(p_payload->>'idempotencyKey'), '');
  v_request_hash text := md5(coalesce(p_payload::text, '{}'));
  v_existing public.fin_idempotency_keys%ROWTYPE;
  v_batch_id uuid;
  v_source_id uuid := nullif(p_payload->>'sourceId', '')::uuid;
  v_source_module text := coalesce(nullif(trim(p_payload->>'sourceModule'), ''), 'MANUAL');
  v_source_type text := coalesce(nullif(trim(p_payload->>'sourceType'), ''), 'OPERATIONAL_ENTRY');
  v_business_date date := coalesce(nullif(p_payload->>'businessDate', '')::date, (now() AT TIME ZONE 'Africa/Dar_es_Salaam')::date);
  v_currency text := coalesce(nullif(p_payload->>'currency', ''), 'TZS');
  v_narration text := nullif(trim(p_payload->>'narration'), '');
  v_batch_number text;
  v_debit numeric(20,2) := 0;
  v_credit numeric(20,2) := 0;
  v_line_no integer := 0;
  v_account_id uuid;
  v_entry jsonb;
  v_account public.fin_accounts%ROWTYPE;
  v_period public.fin_periods%ROWTYPE;
  v_response jsonb;
BEGIN
  IF v_company_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required for accounting posting.' USING ERRCODE = '42501';
  END IF;
  PERFORM public.fin_require('manage');
  IF v_idempotency_key IS NULL OR length(v_idempotency_key) < 12 OR length(v_idempotency_key) > 200 THEN
    RAISE EXCEPTION 'A stable accounting idempotency key is required.' USING ERRCODE = '22023';
  END IF;
  IF v_narration IS NULL OR length(v_narration) > 500 THEN
    RAISE EXCEPTION 'Accounting narration is required and must be 500 characters or fewer.' USING ERRCODE = '22023';
  END IF;
  IF v_currency <> 'TZS' THEN
    RAISE EXCEPTION 'Only TZS accounting postings are supported.' USING ERRCODE = '22023';
  END IF;
  IF v_source_module NOT IN ('POS', 'VICOBA', 'SACCOS', 'BANK_MFI', 'MONEY_AGENT', 'SALES', 'INVENTORY', 'PROCUREMENT', 'PROPERTY', 'HOSPITALITY', 'FLEET', 'MANUAL') THEN
    RAISE EXCEPTION 'Unsupported accounting source module.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_payload->'entries') <> 'array' OR jsonb_array_length(p_payload->'entries') < 2 THEN
    RAISE EXCEPTION 'At least two accounting lines are required.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_company_id::text || ':fin-post:' || v_idempotency_key, 0));
  SELECT * INTO v_existing
  FROM public.fin_idempotency_keys
  WHERE company_id = v_company_id AND scope = 'fin_post_operational_entry' AND idempotency_key = v_idempotency_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      RAISE EXCEPTION 'The accounting idempotency key was already used with a different request.' USING ERRCODE = '23505';
    END IF;
    IF v_existing.status = 'Succeeded' AND v_existing.response IS NOT NULL THEN
      RETURN v_existing.response;
    END IF;
  ELSE
    INSERT INTO public.fin_idempotency_keys(company_id, scope, idempotency_key, request_hash, status, created_by)
    VALUES (v_company_id, 'fin_post_operational_entry', v_idempotency_key, v_request_hash, 'Started', v_user_id);
  END IF;

  SELECT * INTO v_period
  FROM public.fin_periods
  WHERE company_id = v_company_id
    AND v_business_date BETWEEN period_start AND period_end
  ORDER BY period_start DESC
  LIMIT 1
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No accounting period covers the posting date.' USING ERRCODE = '22023';
  END IF;
  IF v_period.status <> 'Open' THEN
    RAISE EXCEPTION 'The accounting period is not open for posting.' USING ERRCODE = '42501';
  END IF;

  FOR v_entry IN SELECT value FROM jsonb_array_elements(p_payload->'entries') LOOP
    IF coalesce(v_entry->>'entryType', '') NOT IN ('Debit', 'Credit') THEN
      RAISE EXCEPTION 'Each accounting line must be either Debit or Credit.' USING ERRCODE = '22023';
    END IF;
    IF coalesce((v_entry->>'amount')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'Accounting line amounts must be greater than zero.' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_account
    FROM public.fin_accounts
    WHERE company_id = v_company_id
      AND account_code = nullif(trim(v_entry->>'accountCode'), '')
      AND status = 'Active'
      AND is_postable = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'The account code is not active or postable: %', v_entry->>'accountCode' USING ERRCODE = '22023';
    END IF;
    IF v_entry->>'entryType' = 'Debit' THEN
      v_debit := v_debit + round((v_entry->>'amount')::numeric, 2);
    ELSE
      v_credit := v_credit + round((v_entry->>'amount')::numeric, 2);
    END IF;
  END LOOP;
  IF v_debit <= 0 OR v_debit <> v_credit THEN
    RAISE EXCEPTION 'Accounting posting must be balanced: debits must equal credits.' USING ERRCODE = '22023';
  END IF;

  v_batch_number := 'FIN-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || substr(md5(v_idempotency_key), 1, 8);
  INSERT INTO public.fin_journal_batches(
    company_id, batch_number, source_module, source_type, source_id, business_date,
    currency, status, debit_total, credit_total, posted_at, posted_by, narration,
    created_by, metadata
  ) VALUES (
    v_company_id, v_batch_number, v_source_module, v_source_type, v_source_id, v_business_date,
    v_currency, 'Posted', v_debit, v_credit, now(), v_user_id, v_narration,
    v_user_id, coalesce(p_payload->'metadata', '{}'::jsonb)
  ) RETURNING id INTO v_batch_id;

  FOR v_entry IN SELECT value FROM jsonb_array_elements(p_payload->'entries') LOOP
    v_line_no := v_line_no + 1;
    SELECT id INTO v_account_id
    FROM public.fin_accounts
    WHERE company_id = v_company_id
      AND account_code = nullif(trim(v_entry->>'accountCode'), '')
      AND status = 'Active'
      AND is_postable = true;
    INSERT INTO public.fin_journal_lines(
      company_id, journal_batch_id, line_no, business_date, account_id,
      debit, credit, currency, description, created_by, metadata
    ) VALUES (
      v_company_id, v_batch_id, v_line_no, v_business_date, v_account_id,
      CASE WHEN v_entry->>'entryType' = 'Debit' THEN round((v_entry->>'amount')::numeric, 2) ELSE 0 END,
      CASE WHEN v_entry->>'entryType' = 'Credit' THEN round((v_entry->>'amount')::numeric, 2) ELSE 0 END,
      v_currency, nullif(trim(v_entry->>'memo'), ''), v_user_id, coalesce(v_entry->'metadata', '{}'::jsonb)
    );
  END LOOP;

  INSERT INTO public.fin_posting_links(company_id, journal_batch_id, source_table, source_id, link_role, created_by, metadata)
  VALUES (v_company_id, v_batch_id, coalesce(nullif(p_payload->>'sourceTable', ''), 'accounting_postings'), coalesce(v_source_id, v_batch_id), 'Primary', v_user_id, jsonb_build_object('idempotencyKey', v_idempotency_key));

  v_response := jsonb_build_object(
    'ok', true,
    'batchId', v_batch_id,
    'batchNumber', v_batch_number,
    'status', 'Posted',
    'debitTotal', v_debit,
    'creditTotal', v_credit,
    'currency', v_currency,
    'businessDate', v_business_date
  );
  UPDATE public.fin_idempotency_keys
  SET status = 'Succeeded', response = v_response, updated_by = v_user_id, updated_at = now()
  WHERE company_id = v_company_id AND scope = 'fin_post_operational_entry' AND idempotency_key = v_idempotency_key;
  RETURN v_response;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.fin_idempotency_keys
  SET status = 'Failed', response = jsonb_build_object('ok', false, 'message', SQLERRM), updated_by = v_user_id, updated_at = now()
  WHERE company_id = v_company_id AND scope = 'fin_post_operational_entry' AND idempotency_key = v_idempotency_key;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.fin_post_operational_entry(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fin_post_operational_entry(jsonb) TO authenticated;
COMMENT ON FUNCTION public.fin_post_operational_entry(jsonb) IS 'Tenant-scoped, balanced, idempotent operational posting bridge for the shared TZS general ledger.';

COMMIT;
