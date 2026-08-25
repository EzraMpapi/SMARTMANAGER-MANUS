-- DESIGN DRAFT ONLY: do not apply until the provider, merchant-account scope,
-- callback contract, signature validator, and sandbox fixtures are approved.
-- Applied migration: 20260825_013_standing_order_webhook_event_log.sql
--
-- Purpose:
--   1. Persist one immutable, redacted record for every authenticated provider event.
--   2. Persist a mutable processing cursor separately from the immutable event.
--   3. Correlate provider callbacks to one tenant/run/instruction without trusting
--      company_id from the callback.
--   4. Deduplicate exact semantic replays and retain conflicting callbacks for review.
--   5. Expose no event-write capability to browser roles.
--
-- Preconditions:
--   - 20250825_004, 20260825_010, and the provider signature-validator migration
--     have been reviewed and applied in the target environment.
--   - The provider adapter supplies a non-secret provider_account_key, the SHA-256
--     raw-body hash, a SHA-256 semantic fingerprint, and a redacted payload.
--   - Signature verification has already returned true from the provider-specific
--     Vault-backed validator. This migration does not invent a provider algorithm.

BEGIN;

-- Fail closed on pre-existing relations. A same-named table with an incompatible
-- contract must be reconciled explicitly; IF NOT EXISTS would hide schema drift.
DO $$
BEGIN
  IF to_regclass('public.bank_provider_transactions') IS NOT NULL
     OR to_regclass('public.bank_provider_webhook_events') IS NOT NULL
     OR to_regclass('public.bank_provider_webhook_processing') IS NOT NULL THEN
    RAISE EXCEPTION 'Provider webhook schema objects already exist; reconcile drift before applying migration.'
      USING ERRCODE = '42710';
  END IF;
END;
$$;

-- PostgreSQL composite foreign keys require a unique key on (company_id, id).
-- These are logically redundant with each table's UUID primary key but make the
-- tenant boundary enforceable at the relational layer.
CREATE UNIQUE INDEX IF NOT EXISTS bank_standing_order_runs_company_id_id_uq
  ON public.bank_standing_order_runs(company_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS bank_payment_instructions_company_id_id_uq
  ON public.bank_payment_instructions(company_id, id);

CREATE TABLE public.bank_provider_transactions (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_key text NOT NULL,
  operation_type text NOT NULL,
  standing_order_run_id uuid NOT NULL,
  payment_instruction_id uuid,
  client_reference text NOT NULL,
  provider_event_id text,
  provider_uuid text,
  provider_reference text,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'UNKNOWN', 'REVERSED', 'NEEDS_ATTENTION')),
  request_payload_hash text
    CHECK (request_payload_hash IS NULL OR request_payload_hash ~ '^[0-9a-f]{64}$'),
  last_callback_at timestamptz,
  failure_code text,
  failure_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_provider_transactions_provider_key_valid
    CHECK (length(btrim(provider)) BETWEEN 1 AND 80),
  CONSTRAINT bank_provider_transactions_account_key_valid
    CHECK (length(btrim(provider_account_key)) BETWEEN 1 AND 160),
  CONSTRAINT bank_provider_transactions_operation_valid
    CHECK (length(btrim(operation_type)) BETWEEN 1 AND 80),
  CONSTRAINT bank_provider_transactions_client_reference_valid
    CHECK (length(btrim(client_reference)) BETWEEN 1 AND 240),
  CONSTRAINT bank_provider_transactions_run_company_fk
    FOREIGN KEY (company_id, standing_order_run_id)
    REFERENCES public.bank_standing_order_runs(company_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT bank_provider_transactions_instruction_company_fk
    FOREIGN KEY (company_id, payment_instruction_id)
    REFERENCES public.bank_payment_instructions(company_id, id)
    ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_provider_transactions_client_reference_uq
  ON public.bank_provider_transactions(provider, provider_account_key, client_reference);
CREATE UNIQUE INDEX IF NOT EXISTS bank_provider_transactions_provider_uuid_uq
  ON public.bank_provider_transactions(provider, provider_account_key, provider_uuid)
  WHERE provider_uuid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bank_provider_transactions_provider_reference_uq
  ON public.bank_provider_transactions(provider, provider_account_key, provider_reference)
  WHERE provider_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_provider_transactions_pending_idx
  ON public.bank_provider_transactions(provider, provider_account_key, status, updated_at)
  WHERE status IN ('CREATED', 'PROCESSING', 'UNKNOWN', 'NEEDS_ATTENTION');
CREATE INDEX IF NOT EXISTS bank_provider_transactions_run_idx
  ON public.bank_provider_transactions(company_id, standing_order_run_id, created_at DESC);

CREATE TABLE public.bank_provider_webhook_events (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  provider text NOT NULL,
  provider_account_key text NOT NULL,
  company_id uuid,
  standing_order_run_id uuid,
  payment_instruction_id uuid,
  provider_event_id text,
  provider_uuid text,
  provider_reference text,
  client_reference text,
  provider_status text,
  amount numeric(20,2),
  currency text CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  raw_payload_hash text NOT NULL
    CHECK (raw_payload_hash ~ '^[0-9a-f]{64}$'),
  semantic_fingerprint text NOT NULL
    CHECK (semantic_fingerprint ~ '^[0-9a-f]{64}$'),
  signature_verified boolean NOT NULL,
  signature_key_version text,
  ingest_outcome text NOT NULL
    CHECK (ingest_outcome IN ('ACCEPTED', 'CONFLICT', 'REJECTED')),
  payload_redacted jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  execution_id uuid NOT NULL,
  CONSTRAINT bank_provider_webhook_events_provider_valid
    CHECK (length(btrim(provider)) BETWEEN 1 AND 80),
  CONSTRAINT bank_provider_webhook_events_account_key_valid
    CHECK (length(btrim(provider_account_key)) BETWEEN 1 AND 160),
  CONSTRAINT bank_provider_webhook_events_signature_outcome_valid
    CHECK (signature_verified OR ingest_outcome = 'REJECTED'),
  CONSTRAINT bank_provider_webhook_events_correlation_company_valid
    CHECK (
      company_id IS NOT NULL
      OR (standing_order_run_id IS NULL AND payment_instruction_id IS NULL)
    ),
  CONSTRAINT bank_provider_webhook_events_run_company_fk
    FOREIGN KEY (company_id, standing_order_run_id)
    REFERENCES public.bank_standing_order_runs(company_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT bank_provider_webhook_events_instruction_company_fk
    FOREIGN KEY (company_id, payment_instruction_id)
    REFERENCES public.bank_payment_instructions(company_id, id)
    ON DELETE SET NULL
);

-- Exact semantic replays are represented by one immutable event row. Formatting
-- changes in JSON do not bypass this key because the provider adapter must compute
-- the fingerprint from normalized provider fields.
CREATE UNIQUE INDEX IF NOT EXISTS bank_provider_webhook_events_replay_uq
  ON public.bank_provider_webhook_events(provider, provider_account_key, semantic_fingerprint);

CREATE INDEX IF NOT EXISTS bank_provider_webhook_events_reference_idx
  ON public.bank_provider_webhook_events(provider, provider_account_key, provider_reference, received_at DESC)
  WHERE provider_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_provider_webhook_events_client_reference_idx
  ON public.bank_provider_webhook_events(provider, provider_account_key, client_reference, received_at DESC)
  WHERE client_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_provider_webhook_events_provider_event_idx
  ON public.bank_provider_webhook_events(provider, provider_account_key, provider_event_id, received_at DESC)
  WHERE provider_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_provider_webhook_events_company_time_idx
  ON public.bank_provider_webhook_events(company_id, received_at DESC)
  WHERE company_id IS NOT NULL;

-- Processing state is deliberately separate so the evidence row remains
-- append-only while retries, leases, and settlement outcomes can change.
CREATE UNIQUE INDEX IF NOT EXISTS bank_provider_webhook_events_company_id_id_uq
  ON public.bank_provider_webhook_events(company_id, id);

CREATE TABLE public.bank_provider_webhook_processing (
  event_id uuid PRIMARY KEY
    REFERENCES public.bank_provider_webhook_events(id) ON DELETE RESTRICT,
  company_id uuid,
  processing_status text NOT NULL DEFAULT 'RECEIVED'
    CHECK (processing_status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'DUPLICATE', 'NEEDS_ATTENTION', 'FAILED')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 1000),
  next_attempt_at timestamptz,
  lease_until timestamptz,
  processing_started_at timestamptz,
  processed_at timestamptz,
  last_error_code text,
  last_error_message text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_provider_webhook_processing_company_event_fk
    FOREIGN KEY (company_id, event_id)
    REFERENCES public.bank_provider_webhook_events(company_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT bank_provider_webhook_processing_processed_time_valid
    CHECK (processed_at IS NULL OR processing_status IN ('PROCESSED', 'DUPLICATE'))
);

CREATE INDEX IF NOT EXISTS bank_provider_webhook_processing_queue_idx
  ON public.bank_provider_webhook_processing(processing_status, next_attempt_at, updated_at)
  WHERE processing_status IN ('RECEIVED', 'FAILED');
CREATE INDEX IF NOT EXISTS bank_provider_webhook_processing_company_idx
  ON public.bank_provider_webhook_processing(company_id, updated_at DESC)
  WHERE company_id IS NOT NULL;

-- Evidence rows are immutable. Processing state is the only mutable operational
-- record and is writable only through service-role code.
CREATE OR REPLACE FUNCTION bank_private.provider_webhook_event_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'Provider webhook evidence is append-only.' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS bank_provider_webhook_events_immutable
  ON public.bank_provider_webhook_events;
CREATE TRIGGER bank_provider_webhook_events_immutable
  BEFORE UPDATE OR DELETE ON public.bank_provider_webhook_events
  FOR EACH ROW EXECUTE FUNCTION bank_private.provider_webhook_event_immutable();

ALTER TABLE public.bank_provider_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_provider_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_provider_webhook_processing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bank_provider_transactions_tenant_select
  ON public.bank_provider_transactions;
CREATE POLICY bank_provider_transactions_tenant_select
  ON public.bank_provider_transactions
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS bank_provider_webhook_events_tenant_select
  ON public.bank_provider_webhook_events;
CREATE POLICY bank_provider_webhook_events_tenant_select
  ON public.bank_provider_webhook_events
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS bank_provider_webhook_processing_tenant_select
  ON public.bank_provider_webhook_processing;
CREATE POLICY bank_provider_webhook_processing_tenant_select
  ON public.bank_provider_webhook_processing
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

REVOKE ALL ON TABLE public.bank_provider_transactions
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.bank_provider_webhook_events
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.bank_provider_webhook_processing
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.bank_provider_transactions
  TO authenticated;
GRANT SELECT ON TABLE public.bank_provider_webhook_events
  TO authenticated;
GRANT SELECT ON TABLE public.bank_provider_webhook_processing
  TO authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.bank_provider_transactions
  TO service_role;
GRANT SELECT, INSERT
  ON TABLE public.bank_provider_webhook_events
  TO service_role;
GRANT SELECT, INSERT, UPDATE
  ON TABLE public.bank_provider_webhook_processing
  TO service_role;

REVOKE ALL ON FUNCTION bank_private.provider_webhook_event_immutable()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bank_private.provider_webhook_event_immutable()
  TO service_role;

-- Atomically claim an authenticated event. The provider-specific signature
-- validator must be called before this function and must return true. This
-- function never accepts company_id as tenant authority; company_id/run/instruction
-- values are resolved from bank_provider_transactions by this function
-- and are checked by composite foreign keys; they are never accepted from callback input.
CREATE OR REPLACE FUNCTION bank_private.claim_provider_webhook_event(
  p_provider text,
  p_provider_account_key text,
  p_provider_event_id text,
  p_provider_uuid text,
  p_provider_reference text,
  p_client_reference text,
  p_raw_payload_hash text,
  p_semantic_fingerprint text,
  p_signature_verified boolean,
  p_signature_key_version text,
  p_ingest_outcome text,
  p_payload_redacted jsonb,
  p_execution_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_existing public.bank_provider_webhook_events%ROWTYPE;
  v_provider_transaction public.bank_provider_transactions%ROWTYPE;
  v_event_id uuid;
  v_company_id uuid;
  v_standing_order_run_id uuid;
  v_payment_instruction_id uuid;
  v_conflict boolean := false;
  v_processing_status text;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Provider webhook event claiming requires service role.'
      USING ERRCODE = '42501';
  END IF;
  IF NOT coalesce(p_signature_verified, false) THEN
    RAISE EXCEPTION 'Provider webhook signature must be verified before event claim.'
      USING ERRCODE = '42501';
  END IF;
  IF p_provider IS NULL OR length(btrim(p_provider)) = 0
     OR p_provider_account_key IS NULL OR length(btrim(p_provider_account_key)) = 0
     OR p_raw_payload_hash IS NULL OR p_raw_payload_hash !~ '^[0-9a-f]{64}$'
     OR p_semantic_fingerprint IS NULL OR p_semantic_fingerprint !~ '^[0-9a-f]{64}$'
     OR p_execution_id IS NULL THEN
    RAISE EXCEPTION 'Provider webhook event identity is incomplete.'
      USING ERRCODE = '22023';
  END IF;

  -- Serialize callbacks sharing the same provider identity. This closes the
  -- race where two different payloads with the same provider reference could
  -- both pass the conflict check before either INSERT commits.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      p_provider || ':' || p_provider_account_key || ':' ||
      coalesce(p_provider_reference, p_provider_uuid, p_provider_event_id,
               p_client_reference, p_semantic_fingerprint),
      0
    )
  );

  SELECT e.*
    INTO v_existing
    FROM public.bank_provider_webhook_events e
   WHERE e.provider = p_provider
     AND e.provider_account_key = p_provider_account_key
     AND e.semantic_fingerprint = p_semantic_fingerprint
   FOR UPDATE;

  IF FOUND THEN
    SELECT p.processing_status
      INTO v_processing_status
      FROM public.bank_provider_webhook_processing p
     WHERE p.event_id = v_existing.id;
    RETURN jsonb_build_object(
      'eventId', v_existing.id,
      'processingStatus', coalesce(v_processing_status, 'RECEIVED'),
      'replayed', true,
      'conflict', v_existing.ingest_outcome = 'CONFLICT'
    );
  END IF;

  IF p_client_reference IS NOT NULL THEN
    SELECT pt.*
      INTO v_provider_transaction
      FROM public.bank_provider_transactions pt
     WHERE pt.provider = p_provider
       AND pt.provider_account_key = p_provider_account_key
       AND pt.client_reference = p_client_reference
     FOR UPDATE;
    IF FOUND THEN
      v_company_id := v_provider_transaction.company_id;
      v_standing_order_run_id := v_provider_transaction.standing_order_run_id;
      v_payment_instruction_id := v_provider_transaction.payment_instruction_id;
    END IF;
  END IF;

  -- A reused provider identity with a different semantic fingerprint is a
  -- conflict. It is retained for investigation rather than hidden by a unique
  -- constraint or treated as a second settlement.
  SELECT EXISTS (
    SELECT 1
      FROM public.bank_provider_webhook_events e
     WHERE e.provider = p_provider
       AND e.provider_account_key = p_provider_account_key
       AND e.semantic_fingerprint <> p_semantic_fingerprint
       AND (
         (p_provider_event_id IS NOT NULL AND e.provider_event_id = p_provider_event_id)
         OR (p_provider_uuid IS NOT NULL AND e.provider_uuid = p_provider_uuid)
         OR (p_provider_reference IS NOT NULL AND e.provider_reference = p_provider_reference)
         OR (p_client_reference IS NOT NULL AND e.client_reference = p_client_reference)
       )
  ) INTO v_conflict;

  INSERT INTO public.bank_provider_webhook_events (
    provider, provider_account_key, company_id, standing_order_run_id,
    payment_instruction_id, provider_event_id, provider_uuid,
    provider_reference, client_reference, provider_status, amount, currency,
    raw_payload_hash,
    semantic_fingerprint, signature_verified, signature_key_version,
    ingest_outcome, payload_redacted, execution_id
  ) VALUES (
    btrim(p_provider), btrim(p_provider_account_key), v_company_id,
    v_standing_order_run_id, v_payment_instruction_id,
    nullif(btrim(p_provider_event_id), ''),
    nullif(btrim(p_provider_uuid), ''),
    nullif(btrim(p_provider_reference), ''),
    nullif(btrim(p_client_reference), ''),
    nullif(btrim(p_payload_redacted->>'status'), ''),
    nullif(p_payload_redacted->>'amount', '')::numeric,
    upper(nullif(btrim(p_payload_redacted->>'currency'), '')),
    lower(p_raw_payload_hash), lower(p_semantic_fingerprint),
    true, nullif(btrim(p_signature_key_version), ''),
    CASE WHEN v_conflict THEN 'CONFLICT' ELSE coalesce(p_ingest_outcome, 'ACCEPTED') END,
    coalesce(p_payload_redacted, '{}'::jsonb), p_execution_id
  ) RETURNING id INTO v_event_id;

  INSERT INTO public.bank_provider_webhook_processing (
    event_id, company_id, processing_status, attempt_count, updated_at
  ) VALUES (
    v_event_id, v_company_id,
    CASE WHEN v_conflict THEN 'NEEDS_ATTENTION' ELSE 'RECEIVED' END,
    0, now()
  );

  RETURN jsonb_build_object(
    'eventId', v_event_id,
    'processingStatus', CASE WHEN v_conflict THEN 'NEEDS_ATTENTION' ELSE 'RECEIVED' END,
    'replayed', false,
    'conflict', v_conflict
  );
EXCEPTION WHEN unique_violation THEN
  -- A concurrent callback won the semantic-fingerprint race. Return the
  -- durable winner instead of creating a second settlement attempt.
  SELECT e.*
    INTO v_existing
    FROM public.bank_provider_webhook_events e
   WHERE e.provider = p_provider
     AND e.provider_account_key = p_provider_account_key
     AND e.semantic_fingerprint = p_semantic_fingerprint
   LIMIT 1;
  IF FOUND THEN
    SELECT p.processing_status
      INTO v_processing_status
      FROM public.bank_provider_webhook_processing p
     WHERE p.event_id = v_existing.id;
    RETURN jsonb_build_object(
      'eventId', v_existing.id,
      'processingStatus', coalesce(v_processing_status, 'RECEIVED'),
      'replayed', true,
      'conflict', v_existing.ingest_outcome = 'CONFLICT'
    );
  END IF;
  RAISE;
END;
$$;

-- Service-only REST bridge for the Edge Function. It contains no business
-- settlement logic; a later private routine must lock the processing row,
-- validate amount/currency/provider against bank_provider_transactions, and only
-- then call bank_private.confirm_provider_payment().
CREATE OR REPLACE FUNCTION public.bank_provider_webhook_claim(
  p_provider text,
  p_provider_account_key text,
  p_provider_event_id text,
  p_provider_uuid text,
  p_provider_reference text,
  p_client_reference text,
  p_raw_payload_hash text,
  p_semantic_fingerprint text,
  p_signature_verified boolean,
  p_signature_key_version text,
  p_ingest_outcome text,
  p_payload_redacted jsonb,
  p_execution_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$
  SELECT bank_private.claim_provider_webhook_event(
    p_provider, p_provider_account_key,
    p_provider_event_id, p_provider_uuid, p_provider_reference,
    p_client_reference, p_raw_payload_hash, p_semantic_fingerprint,
    p_signature_verified, p_signature_key_version, p_ingest_outcome,
    p_payload_redacted, p_execution_id
  );
$$;

REVOKE ALL ON FUNCTION bank_private.claim_provider_webhook_event(
  text, text, text, text, text, text, text, text,
  boolean, text, text, jsonb, uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bank_private.claim_provider_webhook_event(
  text, text, text, text, text, text, text, text,
  boolean, text, text, jsonb, uuid
) TO service_role;

REVOKE ALL ON FUNCTION public.bank_provider_webhook_claim(
  text, text, text, text, text, text, text, text,
  boolean, text, text, jsonb, uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bank_provider_webhook_claim(
  text, text, text, text, text, text, text, text,
  boolean, text, text, jsonb, uuid
) TO service_role;

COMMIT;

-- Required post-migration checks, to be run read-only after applying:
--   1. Verify both new tables have RLS enabled and only authenticated SELECT
--      plus service_role write grants.
--   2. Verify the event immutable trigger exists.
--   3. Verify public.bank_provider_webhook_claim(...) and the private claim
--      function are executable only by service_role.
--   4. Verify the two composite unique indexes exist before the foreign keys.
--   5. Run concurrent duplicate-event tests: exactly one event row and one
--      processing row must result.
--   6. Run conflicting-reference tests: a second event row is retained with
--      ingest_outcome = 'CONFLICT' and processing_status = 'NEEDS_ATTENTION'.
--   7. Confirm no raw payload, provider secret, API key, PIN, or complete MSISDN
--      is present in payload_redacted, logs, or audit metadata.
