-- Standing Order webhook remediation control plane.
--
-- This migration is intentionally separate from the webhook evidence migration.
-- It does not enable production draining by itself. The worker must remain in
-- DRY_RUN until the provider adapter, sandbox fixtures, and approval workflow
-- are approved.
--
-- All operational writes are service-role-only. Immutable provider evidence is
-- never updated or deleted. Financial settlement is delegated to the existing
-- private provider-confirmation implementation only after the normal checks.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.bank_provider_webhook_drain_approvals') IS NOT NULL
     OR to_regclass('public.bank_provider_webhook_drain_runs') IS NOT NULL
     OR to_regclass('public.bank_provider_webhook_remediation') IS NOT NULL
     OR to_regclass('public.bank_provider_webhook_account_controls') IS NOT NULL THEN
    RAISE EXCEPTION 'Webhook remediation control-plane objects already exist; reconcile drift before applying migration.'
      USING ERRCODE = '42710';
  END IF;
END;
$$;

CREATE TABLE public.bank_provider_webhook_drain_approvals (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  provider text NOT NULL,
  provider_account_key text NOT NULL,
  environment text NOT NULL
    CHECK (environment IN ('STAGING', 'PRODUCTION')),
  mode text NOT NULL
    CHECK (mode IN ('REQUEUE_ONLY', 'DRAIN_SAFE_SETTLEMENTS')),
  max_items integer NOT NULL CHECK (max_items BETWEEN 1 AND 100),
  max_settlements integer NOT NULL CHECK (max_settlements BETWEEN 0 AND 25),
  request_token_hash text NOT NULL
    CHECK (request_token_hash ~ '^[0-9a-f]{64}$'),
  approval_token_hash text
    CHECK (approval_token_hash IS NULL OR approval_token_hash ~ '^[0-9a-f]{64}$'),
  approver_token_hash text
    CHECK (approver_token_hash IS NULL OR approver_token_hash ~ '^[0-9a-f]{64}$'),
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED', 'CONSUMED')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  request_reason text NOT NULL CHECK (length(btrim(request_reason)) BETWEEN 1 AND 500),
  approval_reason text CHECK (approval_reason IS NULL OR length(btrim(approval_reason)) BETWEEN 1 AND 500),
  CONSTRAINT bank_webhook_drain_approval_two_person
    CHECK (approved_by IS NULL OR approved_by <> requested_by),
  CONSTRAINT bank_webhook_drain_approval_approved_fields
    CHECK (
      status <> 'APPROVED'
      OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND approval_token_hash IS NOT NULL AND approver_token_hash IS NOT NULL)
    ),
  CONSTRAINT bank_webhook_drain_approval_consumed_fields
    CHECK (
      status <> 'CONSUMED'
      OR consumed_at IS NOT NULL
    ),
  CONSTRAINT bank_webhook_drain_approval_requeue_cap_valid
    CHECK (mode <> 'REQUEUE_ONLY' OR max_settlements = 0),
  CONSTRAINT bank_webhook_drain_approval_expiry_valid
    CHECK (expires_at > requested_at)
);

CREATE UNIQUE INDEX bank_provider_webhook_drain_approvals_request_token_uq
  ON public.bank_provider_webhook_drain_approvals(request_token_hash);
CREATE UNIQUE INDEX bank_provider_webhook_drain_approvals_token_uq
  ON public.bank_provider_webhook_drain_approvals(approval_token_hash)
  WHERE approval_token_hash IS NOT NULL;
CREATE UNIQUE INDEX bank_provider_webhook_drain_approvals_approver_token_uq
  ON public.bank_provider_webhook_drain_approvals(approver_token_hash)
  WHERE approver_token_hash IS NOT NULL;
CREATE INDEX bank_provider_webhook_drain_approvals_scope_idx
  ON public.bank_provider_webhook_drain_approvals(provider, provider_account_key, status, expires_at);

CREATE TABLE public.bank_provider_webhook_drain_runs (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  provider text NOT NULL,
  provider_account_key text NOT NULL,
  environment text NOT NULL
    CHECK (environment IN ('STAGING', 'PRODUCTION')),
  mode text NOT NULL
    CHECK (mode IN ('DRY_RUN', 'REQUEUE_ONLY', 'DRAIN_SAFE_SETTLEMENTS')),
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'PAUSED', 'COMPLETED', 'ABORTED', 'FAILED')),
  approval_id uuid REFERENCES public.bank_provider_webhook_drain_approvals(id) ON DELETE RESTRICT,
  requested_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  max_items integer NOT NULL CHECK (max_items BETWEEN 1 AND 100),
  max_settlements integer NOT NULL CHECK (max_settlements BETWEEN 0 AND 25),
  lease_seconds integer NOT NULL DEFAULT 120 CHECK (lease_seconds BETWEEN 30 AND 600),
  claimed_count integer NOT NULL DEFAULT 0 CHECK (claimed_count BETWEEN 0 AND 1000000),
  requeued_count integer NOT NULL DEFAULT 0 CHECK (requeued_count BETWEEN 0 AND 1000000),
  settled_count integer NOT NULL DEFAULT 0 CHECK (settled_count BETWEEN 0 AND 25),
  quarantined_count integer NOT NULL DEFAULT 0 CHECK (quarantined_count BETWEEN 0 AND 1000000),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count BETWEEN 0 AND 1000000),
  execution_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  stop_reason text CHECK (stop_reason IS NULL OR length(btrim(stop_reason)) BETWEEN 1 AND 500),
  CONSTRAINT bank_webhook_drain_run_approval_required
    CHECK (
      mode = 'DRY_RUN'
      OR (approval_id IS NOT NULL AND environment IN ('STAGING', 'PRODUCTION'))
    ),
  CONSTRAINT bank_webhook_drain_run_requeue_cap_valid
    CHECK (mode <> 'REQUEUE_ONLY' OR max_settlements = 0)
);

CREATE UNIQUE INDEX bank_provider_webhook_drain_runs_approval_uq
  ON public.bank_provider_webhook_drain_runs(approval_id)
  WHERE approval_id IS NOT NULL;
CREATE INDEX bank_provider_webhook_drain_runs_open_idx
  ON public.bank_provider_webhook_drain_runs(provider, provider_account_key, status, started_at DESC)
  WHERE status IN ('OPEN', 'PAUSED');

CREATE TABLE public.bank_provider_webhook_account_controls (
  provider text NOT NULL,
  provider_account_key text NOT NULL,
  settlement_paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  paused_at timestamptz,
  paused_by_execution_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_account_key),
  CONSTRAINT bank_webhook_account_control_provider_valid
    CHECK (length(btrim(provider)) BETWEEN 1 AND 80),
  CONSTRAINT bank_webhook_account_control_account_valid
    CHECK (length(btrim(provider_account_key)) BETWEEN 1 AND 160),
  CONSTRAINT bank_webhook_account_control_pause_fields_valid
    CHECK (settlement_paused OR pause_reason IS NULL OR length(btrim(pause_reason)) BETWEEN 1 AND 500)
);

CREATE TABLE public.bank_provider_webhook_remediation (
  event_id uuid PRIMARY KEY
    REFERENCES public.bank_provider_webhook_events(id) ON DELETE RESTRICT,
  company_id uuid,
  remediation_status text NOT NULL DEFAULT 'UNCLASSIFIED'
    CHECK (remediation_status IN (
      'UNCLASSIFIED', 'LEASED', 'SAFE_RETRY', 'SAFE_RECONCILE',
      'REQUEUED', 'PROCESSED', 'DUPLICATE', 'CONFLICT',
      'FIELD_MISMATCH', 'UNCORRELATED', 'PROVIDER_UNKNOWN',
      'SECRET_SUSPECTED', 'ALREADY_SETTLED', 'CLOSED_BY_REVIEW'
    )),
  classification text,
  reason_code text,
  drain_run_id uuid REFERENCES public.bank_provider_webhook_drain_runs(id) ON DELETE RESTRICT,
  lease_token uuid,
  lease_until timestamptz,
  remediation_attempt_count integer NOT NULL DEFAULT 0 CHECK (remediation_attempt_count BETWEEN 0 AND 100),
  expected_attempt integer,
  last_remediated_at timestamptz,
  last_error_code text,
  last_error_message text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_webhook_remediation_company_fk
    FOREIGN KEY (company_id, event_id)
    REFERENCES public.bank_provider_webhook_events(company_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT bank_webhook_remediation_lease_fields_valid
    CHECK ((lease_token IS NULL AND lease_until IS NULL) OR (lease_token IS NOT NULL AND lease_until IS NOT NULL)),
  CONSTRAINT bank_webhook_remediation_classification_valid
    CHECK (classification IS NULL OR classification IN (
      'SAFE_RETRY', 'SAFE_RECONCILE', 'DUPLICATE', 'CONFLICT',
      'FIELD_MISMATCH', 'UNCORRELATED', 'PROVIDER_UNKNOWN',
      'SECRET_SUSPECTED', 'ALREADY_SETTLED'
    ))
);

CREATE INDEX bank_provider_webhook_remediation_queue_idx
  ON public.bank_provider_webhook_remediation(remediation_status, lease_until, updated_at)
  WHERE remediation_status IN ('UNCLASSIFIED', 'SAFE_RETRY', 'SAFE_RECONCILE', 'REQUEUED');
CREATE INDEX bank_provider_webhook_remediation_run_idx
  ON public.bank_provider_webhook_remediation(drain_run_id, remediation_status, updated_at);

-- Backfill one mutable remediation cursor per existing evidence row.
INSERT INTO public.bank_provider_webhook_remediation(event_id, company_id)
SELECT e.id, e.company_id
  FROM public.bank_provider_webhook_events e
ON CONFLICT (event_id) DO NOTHING;

CREATE OR REPLACE FUNCTION bank_private.ensure_webhook_remediation_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public.bank_provider_webhook_remediation(event_id, company_id)
  VALUES (NEW.event_id, NEW.company_id)
  ON CONFLICT (event_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bank_provider_webhook_processing_remediation_row
  ON public.bank_provider_webhook_processing;
CREATE TRIGGER bank_provider_webhook_processing_remediation_row
  AFTER INSERT ON public.bank_provider_webhook_processing
  FOR EACH ROW EXECUTE FUNCTION bank_private.ensure_webhook_remediation_row();

CREATE OR REPLACE FUNCTION bank_private.remediation_scope_lock(
  p_provider text,
  p_provider_account_key text,
  p_environment text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook remediation requires service role.' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      'standing-order-remediation:' || btrim(p_provider) || ':' ||
      btrim(p_provider_account_key) || ':' || upper(p_environment),
      0
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.remediation_request_approval(
  p_provider text,
  p_provider_account_key text,
  p_environment text,
  p_mode text,
  p_max_items integer,
  p_max_settlements integer,
  p_request_token_hash text,
  p_requested_by uuid,
  p_expires_at timestamptz,
  p_request_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook approval creation requires service role.' USING ERRCODE = '42501';
  END IF;
  IF p_provider IS NULL OR length(btrim(p_provider)) = 0
     OR p_provider_account_key IS NULL OR length(btrim(p_provider_account_key)) = 0
     OR upper(p_environment) NOT IN ('STAGING', 'PRODUCTION')
     OR upper(p_mode) NOT IN ('REQUEUE_ONLY', 'DRAIN_SAFE_SETTLEMENTS')
     OR p_max_items NOT BETWEEN 1 AND 100
     OR p_max_settlements NOT BETWEEN 0 AND 25
     OR (upper(p_mode) = 'REQUEUE_ONLY' AND p_max_settlements <> 0)
     OR p_request_token_hash IS NULL OR lower(p_request_token_hash) !~ '^[0-9a-f]{64}$'
     OR p_requested_by IS NULL OR p_expires_at IS NULL OR p_expires_at <= now()
     OR p_request_reason IS NULL OR length(btrim(p_request_reason)) = 0 THEN
    RAISE EXCEPTION 'Invalid webhook drain approval request.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_requested_by) THEN
    RAISE EXCEPTION 'Approval requester does not exist.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.bank_provider_webhook_drain_approvals(
    provider, provider_account_key, environment, mode, max_items,
    max_settlements, request_token_hash, requested_by, expires_at, request_reason
  )
  VALUES (
    btrim(p_provider), btrim(p_provider_account_key), upper(p_environment), upper(p_mode),
    p_max_items, p_max_settlements, lower(p_request_token_hash), p_requested_by,
    p_expires_at, left(btrim(p_request_reason), 500)
  )
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('approvalId', v_id, 'status', 'REQUESTED', 'expiresAt', p_expires_at);
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.remediation_approve(
  p_approval_id uuid,
  p_request_token_hash text,
  p_approver_token_hash text,
  p_final_token_hash text,
  p_approved_by uuid,
  p_approval_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_approval public.bank_provider_webhook_drain_approvals%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook approval requires service role.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_approval
    FROM public.bank_provider_webhook_drain_approvals
   WHERE id = p_approval_id
   FOR UPDATE;
  IF NOT FOUND OR v_approval.status <> 'REQUESTED' THEN
    RAISE EXCEPTION 'Approval is not pending.' USING ERRCODE = 'P0001';
  END IF;
  IF v_approval.expires_at <= now() THEN
    UPDATE public.bank_provider_webhook_drain_approvals
       SET status = 'EXPIRED'
     WHERE id = v_approval.id;
    RAISE EXCEPTION 'Approval has expired.' USING ERRCODE = 'P0001';
  END IF;
  IF p_request_token_hash IS NULL OR lower(p_request_token_hash) <> v_approval.request_token_hash
     OR p_approver_token_hash IS NULL OR lower(p_approver_token_hash) !~ '^[0-9a-f]{64}$'
     OR p_final_token_hash IS NULL OR lower(p_final_token_hash) !~ '^[0-9a-f]{64}$'
     OR lower(p_approver_token_hash) = v_approval.request_token_hash
     OR lower(p_final_token_hash) IN (v_approval.request_token_hash, lower(p_approver_token_hash)) THEN
    RAISE EXCEPTION 'Two distinct approval tokens are required.' USING ERRCODE = '42501';
  END IF;
  IF p_approved_by IS NULL OR p_approved_by = v_approval.requested_by THEN
    RAISE EXCEPTION 'A distinct second operator is required.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_approved_by) THEN
    RAISE EXCEPTION 'Approval operator does not exist.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.bank_provider_webhook_drain_approvals
     SET status = 'APPROVED', approval_token_hash = lower(p_final_token_hash),
         approver_token_hash = lower(p_approver_token_hash), approved_by = p_approved_by,
         approved_at = now(), approval_reason = left(nullif(btrim(p_approval_reason), ''), 500)
   WHERE id = v_approval.id;
  RETURN jsonb_build_object(
    'approvalId', v_approval.id,
    'status', 'APPROVED',
    'approvedBy', p_approved_by,
    'expiresAt', v_approval.expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.remediation_open(
  p_provider text,
  p_provider_account_key text,
  p_environment text,
  p_mode text,
  p_max_items integer,
  p_max_settlements integer,
  p_approval_id uuid,
  p_approval_token_hash text,
  p_requested_by uuid,
  p_execution_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_approval public.bank_provider_webhook_drain_approvals%ROWTYPE;
  v_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook remediation requires service role.' USING ERRCODE = '42501';
  END IF;
  IF p_provider IS NULL OR length(btrim(p_provider)) = 0 THEN
    RAISE EXCEPTION 'Provider is required.' USING ERRCODE = '22023';
  END IF;
  IF p_provider_account_key IS NULL OR length(btrim(p_provider_account_key)) = 0 THEN
    RAISE EXCEPTION 'Provider account is required.' USING ERRCODE = '22023';
  END IF;
  IF upper(p_environment) NOT IN ('STAGING', 'PRODUCTION') THEN
    RAISE EXCEPTION 'Invalid remediation environment.' USING ERRCODE = '22023';
  END IF;
  IF upper(p_mode) NOT IN ('DRY_RUN', 'REQUEUE_ONLY', 'DRAIN_SAFE_SETTLEMENTS') THEN
    RAISE EXCEPTION 'Invalid remediation mode.' USING ERRCODE = '22023';
  END IF;
  IF p_max_items NOT BETWEEN 1 AND 100 OR p_max_settlements NOT BETWEEN 0 AND 25 THEN
    RAISE EXCEPTION 'Remediation caps are outside policy.' USING ERRCODE = '22023';
  END IF;
  IF upper(p_mode) = 'REQUEUE_ONLY' AND p_max_settlements <> 0 THEN
    RAISE EXCEPTION 'Requeue-only runs cannot authorize settlement.' USING ERRCODE = '42501';
  END IF;
  IF p_execution_id IS NULL THEN
    RAISE EXCEPTION 'Execution ID is required.' USING ERRCODE = '22023';
  END IF;

  IF upper(p_mode) <> 'DRY_RUN' THEN
    IF p_approval_id IS NULL THEN
      RAISE EXCEPTION 'Approval ID is required for a mutating drain.' USING ERRCODE = '42501';
    END IF;
    IF p_approval_token_hash IS NULL OR lower(p_approval_token_hash) !~ '^[0-9a-f]{64}$' THEN
      RAISE EXCEPTION 'Final approval token hash is invalid.' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_approval
      FROM public.bank_provider_webhook_drain_approvals
     WHERE id = p_approval_id
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Approval was not found.' USING ERRCODE = '42501';
    END IF;
    IF v_approval.status <> 'APPROVED' OR v_approval.expires_at <= now() THEN
      RAISE EXCEPTION 'Approval is not active.' USING ERRCODE = '42501';
    END IF;
    IF p_requested_by IS NULL OR p_requested_by <> v_approval.requested_by THEN
      RAISE EXCEPTION 'Drain requester does not match approval requester.' USING ERRCODE = '42501';
    END IF;
    IF v_approval.provider <> btrim(p_provider)
       OR v_approval.provider_account_key <> btrim(p_provider_account_key)
       OR v_approval.environment <> upper(p_environment)
       OR p_max_items > v_approval.max_items
       OR p_max_settlements > v_approval.max_settlements
       OR lower(p_approval_token_hash) <> v_approval.approval_token_hash THEN
      RAISE EXCEPTION 'Approval scope or final token is invalid.' USING ERRCODE = '42501';
    END IF;
    IF upper(p_mode) = 'DRAIN_SAFE_SETTLEMENTS'
       AND v_approval.mode <> 'DRAIN_SAFE_SETTLEMENTS' THEN
      RAISE EXCEPTION 'Approval mode does not authorize safe settlements.' USING ERRCODE = '42501';
    END IF;
    IF upper(p_mode) = 'REQUEUE_ONLY' AND v_approval.mode <> 'REQUEUE_ONLY' THEN
      RAISE EXCEPTION 'Approval mode does not authorize requeue-only drainage.' USING ERRCODE = '42501';
    END IF;
  END IF;

  PERFORM bank_private.remediation_scope_lock(p_provider, p_provider_account_key, p_environment);
  IF EXISTS (
    SELECT 1 FROM public.bank_provider_webhook_drain_runs
     WHERE provider = btrim(p_provider)
       AND provider_account_key = btrim(p_provider_account_key)
       AND status IN ('OPEN', 'PAUSED')
  ) THEN
    RAISE EXCEPTION 'A remediation run is already active for this provider account.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.bank_provider_webhook_drain_runs(
    provider, provider_account_key, environment, mode, approval_id,
    requested_by, max_items, max_settlements, execution_id
  )
  VALUES (
    btrim(p_provider), btrim(p_provider_account_key), upper(p_environment), upper(p_mode),
    p_approval_id, p_requested_by, p_max_items, p_max_settlements, p_execution_id
  )
  RETURNING id INTO v_id;

  IF p_approval_id IS NOT NULL THEN
    UPDATE public.bank_provider_webhook_drain_approvals
       SET status = 'CONSUMED', consumed_at = now()
     WHERE id = p_approval_id;
  END IF;

  IF upper(p_mode) <> 'DRY_RUN' THEN
    INSERT INTO public.bank_provider_webhook_account_controls(
      provider, provider_account_key, settlement_paused, pause_reason,
      paused_at, paused_by_execution_id
    )
    VALUES (
      btrim(p_provider), btrim(p_provider_account_key), true,
      'standing_order_webhook_remediation:' || v_id::text, now(), p_execution_id
    )
    ON CONFLICT (provider, provider_account_key) DO UPDATE
      SET settlement_paused = true,
          pause_reason = EXCLUDED.pause_reason,
          paused_at = EXCLUDED.paused_at,
          paused_by_execution_id = EXCLUDED.paused_by_execution_id,
          updated_at = now();
  END IF;
  RETURN jsonb_build_object('drainRunId', v_id, 'status', 'OPEN', 'mode', upper(p_mode));
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.remediation_lease(
  p_drain_run_id uuid,
  p_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_run public.bank_provider_webhook_drain_runs%ROWTYPE;
  v_items jsonb;
  v_count integer;
  v_limit integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook remediation requires service role.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_run FROM public.bank_provider_webhook_drain_runs WHERE id = p_drain_run_id FOR UPDATE;
  IF NOT FOUND OR v_run.status <> 'OPEN' THEN
    RAISE EXCEPTION 'Drain run is not open.' USING ERRCODE = 'P0001';
  END IF;
  v_limit := least(greatest(coalesce(p_limit, 1), 1), 10);
  v_limit := least(v_limit, greatest(v_run.max_items - v_run.claimed_count, 0));
  IF v_limit <= 0 THEN
    RETURN jsonb_build_object('items', '[]'::jsonb, 'count', 0);
  END IF;

  WITH candidates AS (
    SELECT p.event_id
      FROM public.bank_provider_webhook_processing p
      JOIN public.bank_provider_webhook_events e ON e.id = p.event_id
      JOIN public.bank_provider_webhook_remediation r ON r.event_id = p.event_id
     WHERE e.provider = v_run.provider
       AND e.provider_account_key = v_run.provider_account_key
       AND p.processing_status IN ('RECEIVED', 'FAILED', 'NEEDS_ATTENTION')
       AND (p.lease_until IS NULL OR p.lease_until <= now())
       AND r.remediation_status IN ('UNCLASSIFIED', 'SAFE_RETRY', 'SAFE_RECONCILE', 'REQUEUED')
       AND (r.lease_until IS NULL OR r.lease_until <= now())
     ORDER BY coalesce(p.next_attempt_at, p.updated_at), e.received_at, e.id
     LIMIT v_limit
     FOR UPDATE OF p, r SKIP LOCKED
  ), leased AS (
    UPDATE public.bank_provider_webhook_remediation r
       SET remediation_status = 'LEASED',
           drain_run_id = p_drain_run_id,
           lease_token = extensions.gen_random_uuid(),
           lease_until = now() + make_interval(secs => v_run.lease_seconds),
           expected_attempt = r.remediation_attempt_count + 1,
           updated_at = now()
      FROM candidates c
     WHERE r.event_id = c.event_id
     RETURNING r.event_id, r.lease_token, r.lease_until, r.expected_attempt
  ), updated_processing AS (
    UPDATE public.bank_provider_webhook_processing p
       SET processing_status = 'PROCESSING',
           lease_until = l.lease_until,
           processing_started_at = coalesce(p.processing_started_at, now()),
           updated_at = now()
      FROM leased l
     WHERE p.event_id = l.event_id
     RETURNING p.event_id, l.lease_token, l.lease_until, l.expected_attempt
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'eventId', event_id,
    'leaseToken', lease_token,
    'leaseUntil', lease_until,
    'expectedAttempt', expected_attempt
  ) ORDER BY event_id), '[]'::jsonb)
    INTO v_items
    FROM updated_processing;

  v_count := jsonb_array_length(v_items);
  UPDATE public.bank_provider_webhook_drain_runs
     SET claimed_count = claimed_count + v_count
   WHERE id = p_drain_run_id;
  RETURN jsonb_build_object('items', v_items, 'count', v_count);
END;
$$;

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
  SELECT * INTO v_run FROM public.bank_provider_webhook_drain_runs WHERE id = p_drain_run_id FOR UPDATE;
  SELECT * INTO v_event FROM public.bank_provider_webhook_events WHERE id = p_event_id FOR UPDATE;
  SELECT * INTO v_processing FROM public.bank_provider_webhook_processing WHERE event_id = p_event_id FOR UPDATE;
  SELECT * INTO v_remediation FROM public.bank_provider_webhook_remediation WHERE event_id = p_event_id FOR UPDATE;
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
    ELSIF v_event.amount IS NOT NULL AND v_event.amount <> v_tx.amount THEN
      v_classification := 'FIELD_MISMATCH';
      v_reason := 'amount_mismatch';
    ELSIF v_event.currency IS NOT NULL AND upper(v_event.currency) <> upper(v_tx.currency) THEN
      v_classification := 'FIELD_MISMATCH';
      v_reason := 'currency_mismatch';
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
      ELSIF upper(coalesce(v_event.provider_status, '')) IN ('SUCCESS', 'SETTLED', 'CONFIRMED', 'COMPLETED', 'FAILED', 'DECLINED', 'CANCELLED', 'REVERSED') THEN
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

CREATE OR REPLACE FUNCTION bank_private.remediation_requeue(
  p_drain_run_id uuid,
  p_event_id uuid,
  p_lease_token uuid,
  p_expected_attempt integer,
  p_classification text,
  p_next_attempt_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_remediation public.bank_provider_webhook_remediation%ROWTYPE;
  v_run public.bank_provider_webhook_drain_runs%ROWTYPE;
  v_next timestamptz := coalesce(p_next_attempt_at, now());
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook remediation requires service role.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_run FROM public.bank_provider_webhook_drain_runs WHERE id = p_drain_run_id FOR UPDATE;
  SELECT * INTO v_remediation FROM public.bank_provider_webhook_remediation WHERE event_id = p_event_id FOR UPDATE;
  IF NOT FOUND OR v_run.status <> 'OPEN' THEN
    RAISE EXCEPTION 'Drain run or remediation item is not available.' USING ERRCODE = 'P0001';
  END IF;
  IF v_remediation.remediation_status = 'REQUEUED'
     AND v_remediation.drain_run_id = p_drain_run_id THEN
    RETURN jsonb_build_object('eventId', p_event_id, 'replayed', true, 'status', 'REQUEUED');
  END IF;
  IF p_classification NOT IN ('SAFE_RETRY', 'SAFE_RECONCILE')
     OR v_remediation.remediation_attempt_count >= 5
     OR v_remediation.classification <> p_classification
     OR v_remediation.drain_run_id <> p_drain_run_id
     OR v_remediation.lease_token <> p_lease_token
     OR v_remediation.lease_until IS NULL
     OR v_remediation.lease_until <= now()
     OR v_remediation.expected_attempt <> p_expected_attempt THEN
    RAISE EXCEPTION 'Remediation item failed safe-requeue preconditions.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.bank_provider_webhook_remediation
     SET remediation_status = 'REQUEUED',
         remediation_attempt_count = remediation_attempt_count + 1,
         lease_token = NULL,
         lease_until = NULL,
         last_remediated_at = now(),
         updated_at = now()
   WHERE event_id = p_event_id;
  UPDATE public.bank_provider_webhook_processing
     SET processing_status = 'RECEIVED',
         attempt_count = least(attempt_count + 1, 1000),
         next_attempt_at = v_next,
         lease_until = NULL,
         processing_started_at = NULL,
         updated_at = now()
   WHERE event_id = p_event_id;
  UPDATE public.bank_provider_webhook_drain_runs
     SET requeued_count = requeued_count + 1
   WHERE id = p_drain_run_id;
  RETURN jsonb_build_object('eventId', p_event_id, 'replayed', false, 'status', 'REQUEUED', 'nextAttemptAt', v_next);
END;
$$;

CREATE OR REPLACE FUNCTION bank_private.remediation_mark_duplicate(
  p_drain_run_id uuid,
  p_event_id uuid,
  p_lease_token uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_remediation public.bank_provider_webhook_remediation%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook remediation requires service role.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_remediation FROM public.bank_provider_webhook_remediation WHERE event_id = p_event_id FOR UPDATE;
  IF NOT FOUND OR v_remediation.drain_run_id <> p_drain_run_id
     OR v_remediation.lease_token <> p_lease_token THEN
    RAISE EXCEPTION 'Duplicate-close lease is invalid.' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.bank_provider_webhook_remediation
     SET remediation_status = 'DUPLICATE', classification = 'DUPLICATE',
         reason_code = left(coalesce(p_reason, 'already_settled'), 500),
         lease_token = NULL, lease_until = NULL, last_remediated_at = now(), updated_at = now()
   WHERE event_id = p_event_id;
  UPDATE public.bank_provider_webhook_processing
     SET processing_status = 'DUPLICATE', processed_at = now(), lease_until = NULL, updated_at = now()
   WHERE event_id = p_event_id;
  UPDATE public.bank_provider_webhook_drain_runs
     SET quarantined_count = quarantined_count
   WHERE id = p_drain_run_id;
  RETURN jsonb_build_object('eventId', p_event_id, 'status', 'DUPLICATE', 'replayed', true);
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
     OR v_event.provider_status IS NULL THEN
    RAISE EXCEPTION 'Event lacks trusted settlement correlation or terminal provider data.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_tx
    FROM public.bank_provider_transactions
   WHERE provider = v_run.provider
     AND provider_account_key = v_run.provider_account_key
     AND client_reference = v_event.client_reference
   FOR UPDATE;
  IF NOT FOUND OR v_tx.company_id <> v_event.company_id THEN
    RAISE EXCEPTION 'Trusted provider transaction correlation failed.' USING ERRCODE = '42501';
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

CREATE OR REPLACE FUNCTION bank_private.remediation_close(
  p_drain_run_id uuid,
  p_status text,
  p_stop_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_run public.bank_provider_webhook_drain_runs%ROWTYPE;
  v_open_leases integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Webhook remediation requires service role.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_run FROM public.bank_provider_webhook_drain_runs WHERE id = p_drain_run_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drain run was not found.' USING ERRCODE = 'P0001';
  END IF;
  IF upper(p_status) NOT IN ('COMPLETED', 'PAUSED', 'ABORTED', 'FAILED') THEN
    RAISE EXCEPTION 'Invalid remediation close status.' USING ERRCODE = '22023';
  END IF;
  IF upper(p_status) = 'COMPLETED' THEN
    SELECT count(*) INTO v_open_leases
      FROM public.bank_provider_webhook_remediation
     WHERE drain_run_id = p_drain_run_id
       AND lease_token IS NOT NULL
       AND lease_until > now();
    IF v_open_leases > 0 THEN
      RAISE EXCEPTION 'Cannot complete a drain with active leases.' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  UPDATE public.bank_provider_webhook_drain_runs
     SET status = upper(p_status), finished_at = CASE WHEN upper(p_status) = 'COMPLETED' THEN now() ELSE finished_at END,
         stop_reason = left(nullif(btrim(p_stop_reason), ''), 500)
   WHERE id = p_drain_run_id;
  IF upper(p_status) = 'COMPLETED' AND v_run.mode <> 'DRY_RUN' THEN
    UPDATE public.bank_provider_webhook_account_controls
       SET settlement_paused = false, pause_reason = NULL, updated_at = now()
     WHERE provider = v_run.provider AND provider_account_key = v_run.provider_account_key;
  END IF;
  RETURN jsonb_build_object('drainRunId', p_drain_run_id, 'status', upper(p_status), 'stopReason', p_stop_reason);
END;
$$;

ALTER TABLE public.bank_provider_webhook_drain_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_provider_webhook_drain_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_provider_webhook_account_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_provider_webhook_remediation ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.bank_provider_webhook_drain_approvals,
  public.bank_provider_webhook_drain_runs,
  public.bank_provider_webhook_account_controls,
  public.bank_provider_webhook_remediation
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.bank_provider_webhook_drain_approvals TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.bank_provider_webhook_drain_runs TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.bank_provider_webhook_account_controls TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.bank_provider_webhook_remediation TO service_role;

REVOKE ALL ON FUNCTION bank_private.ensure_webhook_remediation_row() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_scope_lock(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_request_approval(text, text, text, text, integer, integer, text, uuid, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_approve(uuid, text, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_open(text, text, text, text, integer, integer, uuid, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_lease(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_classify(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_requeue(uuid, uuid, uuid, integer, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_mark_duplicate(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_process(uuid, uuid, boolean, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bank_private.remediation_close(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bank_private.ensure_webhook_remediation_row() TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_scope_lock(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_request_approval(text, text, text, text, integer, integer, text, uuid, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_approve(uuid, text, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_open(text, text, text, text, integer, integer, uuid, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_lease(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_classify(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_requeue(uuid, uuid, uuid, integer, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_mark_duplicate(uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_process(uuid, uuid, boolean, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION bank_private.remediation_close(uuid, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.bank_webhook_drain_request_approval(
  p_provider text,
  p_provider_account_key text,
  p_environment text,
  p_mode text,
  p_max_items integer,
  p_max_settlements integer,
  p_request_token_hash text,
  p_requested_by uuid,
  p_expires_at timestamptz,
  p_request_reason text
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$
  SELECT bank_private.remediation_request_approval(
    p_provider, p_provider_account_key, p_environment, p_mode,
    p_max_items, p_max_settlements, p_request_token_hash,
    p_requested_by, p_expires_at, p_request_reason
  );
$$;

CREATE OR REPLACE FUNCTION public.bank_webhook_drain_approve(
  p_approval_id uuid,
  p_request_token_hash text,
  p_approver_token_hash text,
  p_final_token_hash text,
  p_approved_by uuid,
  p_approval_reason text
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$
  SELECT bank_private.remediation_approve(p_approval_id, p_request_token_hash, p_approver_token_hash, p_final_token_hash, p_approved_by, p_approval_reason);
$$;

CREATE OR REPLACE FUNCTION public.bank_webhook_remediation_open(
  p_provider text,
  p_provider_account_key text,
  p_environment text,
  p_mode text,
  p_max_items integer,
  p_max_settlements integer,
  p_approval_id uuid,
  p_approval_token_hash text,
  p_requested_by uuid,
  p_execution_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$
  SELECT bank_private.remediation_open(
    p_provider, p_provider_account_key, p_environment, p_mode,
    p_max_items, p_max_settlements, p_approval_id,
    p_approval_token_hash, p_requested_by, p_execution_id
  );
$$;

CREATE OR REPLACE FUNCTION public.bank_webhook_remediation_lease(uuid, integer)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$ SELECT bank_private.remediation_lease($1, $2); $$;

CREATE OR REPLACE FUNCTION public.bank_webhook_remediation_classify(uuid, uuid, uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$ SELECT bank_private.remediation_classify($1, $2, $3); $$;

CREATE OR REPLACE FUNCTION public.bank_webhook_remediation_requeue(uuid, uuid, uuid, integer, text, timestamptz)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$ SELECT bank_private.remediation_requeue($1, $2, $3, $4, $5, $6); $$;

CREATE OR REPLACE FUNCTION public.bank_webhook_remediation_mark_duplicate(uuid, uuid, uuid, text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$ SELECT bank_private.remediation_mark_duplicate($1, $2, $3, $4); $$;

CREATE OR REPLACE FUNCTION public.bank_webhook_remediation_process(uuid, uuid, boolean, uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$ SELECT bank_private.remediation_process($1, $2, $3, $4); $$;

CREATE OR REPLACE FUNCTION public.bank_webhook_remediation_close(uuid, text, text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, bank_private
AS $$ SELECT bank_private.remediation_close($1, $2, $3); $$;

REVOKE ALL ON FUNCTION public.bank_webhook_drain_request_approval(text, text, text, text, integer, integer, text, uuid, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_webhook_drain_approve(uuid, text, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_webhook_remediation_open(text, text, text, text, integer, integer, uuid, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_webhook_remediation_lease(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_webhook_remediation_classify(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_webhook_remediation_requeue(uuid, uuid, uuid, integer, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_webhook_remediation_mark_duplicate(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_webhook_remediation_process(uuid, uuid, boolean, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bank_webhook_remediation_close(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bank_webhook_drain_request_approval(text, text, text, text, integer, integer, text, uuid, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_webhook_drain_approve(uuid, text, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_webhook_remediation_open(text, text, text, text, integer, integer, uuid, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_webhook_remediation_lease(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_webhook_remediation_classify(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_webhook_remediation_requeue(uuid, uuid, uuid, integer, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_webhook_remediation_mark_duplicate(uuid, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_webhook_remediation_process(uuid, uuid, boolean, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.bank_webhook_remediation_close(uuid, text, text) TO service_role;

COMMIT;
