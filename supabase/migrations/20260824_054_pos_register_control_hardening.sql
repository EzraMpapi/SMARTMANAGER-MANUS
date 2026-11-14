-- SMART MANAGER additive POS register-control hardening.
-- Requires 20260824_050_fin_foundation.sql,
-- 20260824_051_fin_journal_core.sql, and
-- 20260824_053_pos_register_control.sql.
-- This migration fails closed: a pre-existing unsafe Posted cash movement
-- prevents completion rather than being silently repaired.
BEGIN;

ALTER TABLE public.pos_shift_sessions
  ADD COLUMN IF NOT EXISTS open_request_hash text,
  ADD COLUMN IF NOT EXISTS close_request_hash text;

ALTER TABLE public.pos_shift_cash_movements
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS request_hash text,
  ADD COLUMN IF NOT EXISTS posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS posted_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS reversal_of_movement_id uuid,
  ALTER COLUMN status SET DEFAULT 'Pending Approval';

ALTER TABLE public.pos_sync_devices
  ADD COLUMN IF NOT EXISTS last_accepted_hash text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pos_shift_cash_movements_reversal_company_fkey'
      AND conrelid = 'public.pos_shift_cash_movements'::regclass
  ) THEN
    ALTER TABLE public.pos_shift_cash_movements
      ADD CONSTRAINT pos_shift_cash_movements_reversal_company_fkey
      FOREIGN KEY (company_id, reversal_of_movement_id)
      REFERENCES public.pos_shift_cash_movements (company_id, id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pos_shift_cash_movements_posted_evidence_check'
      AND conrelid = 'public.pos_shift_cash_movements'::regclass
  ) THEN
    ALTER TABLE public.pos_shift_cash_movements
      ADD CONSTRAINT pos_shift_cash_movements_posted_evidence_check
      CHECK (
        status <> 'Posted'
        OR (journal_batch_id IS NOT NULL AND posted_at IS NOT NULL AND posted_by IS NOT NULL)
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pos_shift_cash_movements_pending_approval_check'
      AND conrelid = 'public.pos_shift_cash_movements'::regclass
  ) THEN
    ALTER TABLE public.pos_shift_cash_movements
      ADD CONSTRAINT pos_shift_cash_movements_pending_approval_check
      CHECK (status <> 'Pending Approval' OR approval_request_id IS NOT NULL)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pos_shift_cash_movements_reversed_evidence_check'
      AND conrelid = 'public.pos_shift_cash_movements'::regclass
  ) THEN
    ALTER TABLE public.pos_shift_cash_movements
      ADD CONSTRAINT pos_shift_cash_movements_reversed_evidence_check
      CHECK (status <> 'Reversed' OR (journal_batch_id IS NOT NULL AND reversal_of_movement_id IS NOT NULL))
      NOT VALID;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS pos_shift_sessions_open_request_hash_idx
  ON public.pos_shift_sessions (company_id, open_idempotency_key, open_request_hash)
  WHERE open_request_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pos_shift_sessions_close_request_hash_idx
  ON public.pos_shift_sessions (company_id, close_idempotency_key, close_request_hash)
  WHERE close_request_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pos_shift_cash_movements_company_idempotency_idx
  ON public.pos_shift_cash_movements (company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_journal_idx
  ON public.pos_shift_cash_movements (company_id, journal_batch_id, status);
CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_approval_idx
  ON public.pos_shift_cash_movements (company_id, approval_request_id, status);

CREATE OR REPLACE FUNCTION public.pos_require_operate()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_company_id() IS NULL THEN
    RAISE EXCEPTION 'An authenticated POS session is required.' USING ERRCODE = '42501';
  END IF;
  IF NOT public.fin_has_role(ARRAY[
    'super administrator', 'platform administrator', 'institution administrator',
    'organization owner', 'owner', 'ceo', 'cfo', 'finance manager',
    'branch manager', 'pos manager', 'sales manager', 'cashier', 'teller',
    'sales officer', 'finance officer'
  ]) THEN
    RAISE EXCEPTION 'Your role cannot operate POS register controls.' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.pos_open_shift(
  p_register_id uuid,
  p_terminal_id uuid DEFAULT NULL,
  p_cashier_id uuid DEFAULT NULL,
  p_business_date date DEFAULT current_date,
  p_opening_float numeric DEFAULT 0,
  p_open_idempotency_key text DEFAULT NULL,
  p_open_request_hash text DEFAULT NULL,
  p_shift_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid := public.current_company_id();
  v_cashier_id uuid := coalesce(p_cashier_id, v_user_id);
  v_existing public.pos_shift_sessions%ROWTYPE;
  v_shift public.pos_shift_sessions%ROWTYPE;
  v_register public.pos_registers%ROWTYPE;
  v_terminal public.pos_terminals%ROWTYPE;
  v_key text := nullif(btrim(p_open_idempotency_key), '');
  v_request_hash text := nullif(btrim(p_open_request_hash), '');
  v_shift_number text := coalesce(nullif(btrim(p_shift_number), ''), 'POS-' || upper(substr(gen_random_uuid()::text, 1, 12)));
BEGIN
  PERFORM public.pos_require_operate();
  IF p_register_id IS NULL OR p_business_date IS NULL OR p_opening_float IS NULL OR p_opening_float < 0 OR v_key IS NULL OR length(v_key) > 160 OR v_request_hash IS NULL OR length(v_request_hash) > 128 THEN
    RAISE EXCEPTION 'A POS shift requires a register, business date, non-negative opening float, idempotency key, and request hash.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.fin_periods fp
    WHERE fp.company_id = v_company_id
      AND fp.period_start <= p_business_date
      AND fp.period_end >= p_business_date
      AND fp.status = 'Open'
  ) THEN
    RAISE EXCEPTION 'The POS shift business date is not inside an open financial period.' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_company_id::text || ':pos-open-key:' || v_key, 0));
  SELECT * INTO v_existing
  FROM public.pos_shift_sessions
  WHERE company_id = v_company_id AND open_idempotency_key = v_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing.open_request_hash IS NOT NULL AND v_request_hash IS NOT NULL AND v_existing.open_request_hash <> v_request_hash THEN
      RAISE EXCEPTION 'The POS open idempotency key was reused with a different request.' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object(
      'shift_id', v_existing.id,
      'shift_number', v_existing.shift_number,
      'status', v_existing.status,
      'idempotent_replay', true
    );
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_company_id::text || ':pos-register:' || p_register_id::text, 0));
  SELECT * INTO v_register
  FROM public.pos_registers
  WHERE id = p_register_id AND company_id = v_company_id AND status = 'Active'
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The POS register is not active for this workspace.' USING ERRCODE = '42501';
  END IF;

  IF p_terminal_id IS NOT NULL THEN
    SELECT * INTO v_terminal
    FROM public.pos_terminals
    WHERE id = p_terminal_id
      AND company_id = v_company_id
      AND register_id = p_register_id
      AND status = 'Active'
    FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'The POS terminal is not active on the selected register.' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_cashier_id
      AND p.company_id = v_company_id
      AND coalesce(p.is_active, true)
  ) THEN
    RAISE EXCEPTION 'The selected POS cashier is not active in this workspace.' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('pos.internal_write', 'on', true);
  INSERT INTO public.pos_shift_sessions (
    company_id, shift_number, register_id, terminal_id, cashier_id,
    business_date, opening_float, expected_cash, status,
    open_idempotency_key, open_request_hash, created_by, updated_by
  ) VALUES (
    v_company_id, v_shift_number, p_register_id, p_terminal_id, v_cashier_id,
    p_business_date, round(p_opening_float, 2), round(p_opening_float, 2), 'Open',
    v_key, v_request_hash, v_user_id, v_user_id
  ) RETURNING * INTO v_shift;

  INSERT INTO public.audit_log (company_id, action, module, actor, details, subject, detail)
  VALUES (
    v_company_id,
    'POS shift opened',
    'Point of Sale',
    coalesce((SELECT full_name FROM public.profiles WHERE id = v_user_id), 'POS Operator'),
    format('Opened POS shift %s with opening float %.2f.', v_shift.shift_number, v_shift.opening_float),
    v_shift.shift_number,
    jsonb_build_object('shift_id', v_shift.id, 'register_id', p_register_id, 'terminal_id', p_terminal_id, 'cashier_id', v_cashier_id, 'business_date', p_business_date, 'opening_float', v_shift.opening_float, 'idempotency_key', v_key)
  );

  RETURN jsonb_build_object(
    'shift_id', v_shift.id,
    'shift_number', v_shift.shift_number,
    'status', v_shift.status,
    'opening_float', v_shift.opening_float,
    'idempotent_replay', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.pos_record_cash_movement(
  p_shift_id uuid,
  p_movement_type text,
  p_amount numeric,
  p_reason text,
  p_reference text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_request_hash text DEFAULT NULL,
  p_approval_request_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid := public.current_company_id();
  v_shift public.pos_shift_sessions%ROWTYPE;
  v_existing public.pos_shift_cash_movements%ROWTYPE;
  v_movement public.pos_shift_cash_movements%ROWTYPE;
  v_key text := nullif(btrim(p_idempotency_key), '');
  v_hash text := nullif(btrim(p_request_hash), '');
  v_status text;
BEGIN
  PERFORM public.pos_require_operate();
  IF p_shift_id IS NULL OR p_movement_type IS NULL OR p_amount IS NULL OR p_amount <= 0 OR v_key IS NULL OR length(v_key) > 160 OR v_hash IS NULL OR length(v_hash) > 128 THEN
    RAISE EXCEPTION 'A POS cash movement requires a shift, movement type, positive amount, idempotency key, and request hash.' USING ERRCODE = '22023';
  END IF;
  IF p_movement_type NOT IN ('Cash In', 'Cash Out', 'Pay In', 'Pay Out', 'Paid Out', 'Cash Drop', 'Adjustment') THEN
    RAISE EXCEPTION 'Unsupported POS cash movement type.' USING ERRCODE = '22023';
  END IF;
  IF p_approval_request_id IS NULL THEN
    RAISE EXCEPTION 'A POS cash movement requires an approval request before journal posting.' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_company_id::text || ':pos-cash-key:' || v_key, 0));
  SELECT * INTO v_existing
  FROM public.pos_shift_cash_movements
  WHERE company_id = v_company_id AND idempotency_key = v_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing.request_hash IS NOT NULL AND v_hash IS NOT NULL AND v_existing.request_hash <> v_hash THEN
      RAISE EXCEPTION 'The POS cash-movement idempotency key was reused with a different request.' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object(
      'movement_id', v_existing.id,
      'status', v_existing.status,
      'journal_batch_id', v_existing.journal_batch_id,
      'idempotent_replay', true
    );
  END IF;

  SELECT * INTO v_shift
  FROM public.pos_shift_sessions
  WHERE id = p_shift_id AND company_id = v_company_id
  FOR UPDATE;
  IF NOT FOUND OR v_shift.status <> 'Open' THEN
    RAISE EXCEPTION 'Cash movements can only be recorded against an open POS shift.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.fin_approval_requests a
    WHERE a.id = p_approval_request_id
      AND a.company_id = v_company_id
      AND a.status IN ('Pending', 'Approved')
  ) THEN
    RAISE EXCEPTION 'The POS cash movement approval request is not available for this workspace.' USING ERRCODE = '42501';
  END IF;

  -- This public-facing routine only creates a Pending Approval source record.
  -- A separate protected posting routine must create the balanced journal and
  -- atomically transition the movement to Posted.
  v_status := 'Pending Approval';

  PERFORM set_config('pos.internal_write', 'on', true);
  INSERT INTO public.pos_shift_cash_movements (
    company_id, shift_id, movement_type, amount, reason, reference,
    approval_request_id, status, occurred_at,
    idempotency_key, request_hash, created_by, updated_by
  ) VALUES (
    v_company_id, p_shift_id, p_movement_type, round(p_amount, 2),
    nullif(left(btrim(coalesce(p_reason, '')), 500), ''),
    nullif(left(btrim(coalesce(p_reference, '')), 160), ''),
    p_approval_request_id, v_status, now(),
    v_key, v_hash, v_user_id, v_user_id
  ) RETURNING * INTO v_movement;

  INSERT INTO public.audit_log (company_id, action, module, actor, details, subject, detail)
  VALUES (
    v_company_id,
    'POS cash movement recorded',
    'Point of Sale',
    coalesce((SELECT full_name FROM public.profiles WHERE id = v_user_id), 'POS Operator'),
    format('Recorded %s of %.2f on POS shift %s with status %s.', v_movement.movement_type, v_movement.amount, v_shift.shift_number, v_movement.status),
    v_shift.shift_number,
    jsonb_build_object('movement_id', v_movement.id, 'shift_id', p_shift_id, 'movement_type', v_movement.movement_type, 'amount', v_movement.amount, 'status', v_movement.status, 'idempotency_key', v_key, 'journal_batch_id', NULL)
  );

  RETURN jsonb_build_object(
    'movement_id', v_movement.id,
    'status', v_movement.status,
    'journal_batch_id', v_movement.journal_batch_id,
    'idempotent_replay', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.pos_block_sensitive_shift_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('pos.internal_write', true) IS DISTINCT FROM 'on'
     AND (
       NEW.register_id IS DISTINCT FROM OLD.register_id
       OR NEW.terminal_id IS DISTINCT FROM OLD.terminal_id
       OR NEW.cashier_id IS DISTINCT FROM OLD.cashier_id
       OR NEW.business_date IS DISTINCT FROM OLD.business_date
       OR NEW.opening_float IS DISTINCT FROM OLD.opening_float
       OR NEW.expected_cash IS DISTINCT FROM OLD.expected_cash
       OR NEW.counted_cash IS DISTINCT FROM OLD.counted_cash
       OR NEW.variance IS DISTINCT FROM OLD.variance
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.closed_at IS DISTINCT FROM OLD.closed_at
       OR NEW.closed_by IS DISTINCT FROM OLD.closed_by
       OR NEW.close_reason IS DISTINCT FROM OLD.close_reason
       OR NEW.close_idempotency_key IS DISTINCT FROM OLD.close_idempotency_key
       OR NEW.close_request_hash IS DISTINCT FROM OLD.close_request_hash
     ) THEN
    RAISE EXCEPTION 'POS shift financial and lifecycle fields can only change through a protected workflow.' USING ERRCODE = '42501';
  END IF;
  IF OLD.status IN ('Closed', 'Exception', 'Cancelled')
     AND current_setting('pos.internal_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Closed POS shift history can only change through a protected workflow.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_shift_sessions_immutable_guard ON public.pos_shift_sessions;
CREATE TRIGGER pos_shift_sessions_immutable_guard
BEFORE UPDATE ON public.pos_shift_sessions
FOR EACH ROW EXECUTE FUNCTION public.pos_block_sensitive_shift_update();

CREATE OR REPLACE FUNCTION public.pos_sync_device_sequence_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.last_sequence < OLD.last_sequence THEN
    RAISE EXCEPTION 'POS sync device sequence cannot move backwards.' USING ERRCODE = '22023';
  END IF;
  IF NEW.last_sequence IS DISTINCT FROM OLD.last_sequence
     AND current_setting('pos.internal_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'POS sync device sequence can only advance through the protected sync workflow.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_sync_devices_sequence_guard ON public.pos_sync_devices;
CREATE TRIGGER pos_sync_devices_sequence_guard
BEFORE UPDATE ON public.pos_sync_devices
FOR EACH ROW EXECUTE FUNCTION public.pos_sync_device_sequence_guard();

CREATE OR REPLACE FUNCTION public.pos_accept_sync_device_sequence(
  p_device_id uuid,
  p_sequence bigint,
  p_payload_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_device public.pos_sync_devices%ROWTYPE;
  v_hash text := nullif(btrim(p_payload_hash), '');
BEGIN
  PERFORM public.pos_require_operate();
  IF p_device_id IS NULL OR p_sequence IS NULL OR p_sequence < 1 OR v_hash IS NULL OR length(v_hash) > 128 THEN
    RAISE EXCEPTION 'A POS sync item requires a device, positive sequence, and payload hash.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_company_id::text || ':pos-device:' || p_device_id::text, 0));
  SELECT * INTO v_device
  FROM public.pos_sync_devices
  WHERE id = p_device_id
    AND company_id = v_company_id
    AND status = 'Active'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The POS sync device is not active for this workspace.' USING ERRCODE = '42501';
  END IF;

  IF p_sequence < v_device.last_sequence THEN
    RAISE EXCEPTION 'POS sync sequence is older than the last accepted sequence.' USING ERRCODE = '40001';
  END IF;
  IF p_sequence = v_device.last_sequence THEN
    IF v_device.last_accepted_hash = v_hash THEN
      RETURN jsonb_build_object('status', 'Replay', 'accepted', false, 'sequence', p_sequence, 'idempotent_replay', true);
    END IF;
    RAISE EXCEPTION 'POS sync sequence was reused with a different payload.' USING ERRCODE = '23505';
  END IF;
  IF p_sequence <> v_device.last_sequence + 1 THEN
    RETURN jsonb_build_object('status', 'Gap', 'accepted', false, 'sequence', p_sequence, 'next_expected_sequence', v_device.last_sequence + 1, 'idempotent_replay', false);
  END IF;

  PERFORM set_config('pos.internal_write', 'on', true);
  UPDATE public.pos_sync_devices
  SET last_sequence = p_sequence,
      last_accepted_hash = v_hash,
      last_seen_at = now(),
      updated_by = auth.uid()
  WHERE id = p_device_id AND company_id = v_company_id;

  RETURN jsonb_build_object('status', 'Accepted', 'accepted', true, 'sequence', p_sequence, 'idempotent_replay', false);
END;
$$;

ALTER TABLE public.pos_shift_cash_movements
  VALIDATE CONSTRAINT pos_shift_cash_movements_posted_evidence_check;
ALTER TABLE public.pos_shift_cash_movements
  VALIDATE CONSTRAINT pos_shift_cash_movements_pending_approval_check;
ALTER TABLE public.pos_shift_cash_movements
  VALIDATE CONSTRAINT pos_shift_cash_movements_reversed_evidence_check;

REVOKE ALL ON FUNCTION public.pos_require_operate() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_open_shift(uuid, uuid, uuid, date, numeric, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_record_cash_movement(uuid, text, numeric, text, text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_block_sensitive_shift_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_sync_device_sequence_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_accept_sync_device_sequence(uuid, bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pos_require_operate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_open_shift(uuid, uuid, uuid, date, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_record_cash_movement(uuid, text, numeric, text, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pos_accept_sync_device_sequence(uuid, bigint, text) TO authenticated;

COMMIT;
