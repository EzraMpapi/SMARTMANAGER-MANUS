-- SMART MANAGER additive POS register and shift-control slice.
-- Requires 20260824_050_fin_foundation.sql and 20260824_051_fin_journal_core.sql.
-- This migration does not alter or delete existing POS envelopes or RPCs.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.pos_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  register_code text NOT NULL,
  name text NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE RESTRICT,
  warehouse_id uuid REFERENCES public.inventory_warehouses(id) ON DELETE RESTRICT,
  default_currency text NOT NULL DEFAULT 'TZS' CHECK (default_currency = 'TZS'),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_registers_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_registers_company_code_unique UNIQUE (company_id, register_code),
  CONSTRAINT pos_registers_code_not_blank CHECK (length(btrim(register_code)) > 0),
  CONSTRAINT pos_registers_name_not_blank CHECK (length(btrim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS public.pos_terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  register_id uuid NOT NULL,
  device_key text NOT NULL,
  device_label text NOT NULL,
  app_version text,
  last_seen_at timestamptz,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Active', 'Suspended', 'Retired')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_terminals_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_terminals_company_device_unique UNIQUE (company_id, device_key),
  CONSTRAINT pos_terminals_device_key_not_blank CHECK (length(btrim(device_key)) > 0),
  CONSTRAINT pos_terminals_label_not_blank CHECK (length(btrim(device_label)) > 0)
);

ALTER TABLE public.pos_terminals
  DROP CONSTRAINT IF EXISTS pos_terminals_register_company_fkey;
ALTER TABLE public.pos_terminals
  ADD CONSTRAINT pos_terminals_register_company_fkey
  FOREIGN KEY (company_id, register_id)
  REFERENCES public.pos_registers (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_shift_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  shift_number text NOT NULL,
  register_id uuid NOT NULL,
  terminal_id uuid,
  cashier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  business_date date NOT NULL DEFAULT current_date,
  opened_at timestamptz NOT NULL DEFAULT now(),
  opening_float numeric(20,2) NOT NULL DEFAULT 0 CHECK (opening_float >= 0),
  expected_cash numeric(20,2) NOT NULL DEFAULT 0 CHECK (expected_cash >= 0),
  counted_cash numeric(20,2) CHECK (counted_cash IS NULL OR counted_cash >= 0),
  variance numeric(20,2),
  status text NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'Pending Close', 'Closed', 'Exception', 'Cancelled')),
  closed_at timestamptz,
  closed_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  close_reason text,
  open_idempotency_key text NOT NULL,
  close_idempotency_key text,
  legacy_pos_shift_id uuid REFERENCES public.pos_shifts(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_shift_sessions_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_shift_sessions_company_number_unique UNIQUE (company_id, shift_number),
  CONSTRAINT pos_shift_sessions_open_key_unique UNIQUE (company_id, open_idempotency_key),
  CONSTRAINT pos_shift_sessions_close_key_unique UNIQUE (company_id, close_idempotency_key),
  CONSTRAINT pos_shift_sessions_number_not_blank CHECK (length(btrim(shift_number)) > 0),
  CONSTRAINT pos_shift_sessions_open_key_not_blank CHECK (length(btrim(open_idempotency_key)) > 0),
  CONSTRAINT pos_shift_sessions_close_consistency CHECK (
    (status IN ('Open', 'Cancelled') AND closed_at IS NULL AND closed_by IS NULL)
    OR (status IN ('Pending Close', 'Closed', 'Exception') AND closed_at IS NOT NULL)
    OR status = 'Cancelled'
  ),
  CONSTRAINT pos_shift_sessions_closed_count_consistency CHECK (
    status NOT IN ('Pending Close', 'Closed', 'Exception') OR counted_cash IS NOT NULL
  )
);

ALTER TABLE public.pos_shift_sessions
  DROP CONSTRAINT IF EXISTS pos_shift_sessions_register_company_fkey;
ALTER TABLE public.pos_shift_sessions
  ADD CONSTRAINT pos_shift_sessions_register_company_fkey
  FOREIGN KEY (company_id, register_id)
  REFERENCES public.pos_registers (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_shift_sessions
  DROP CONSTRAINT IF EXISTS pos_shift_sessions_terminal_company_fkey;
ALTER TABLE public.pos_shift_sessions
  ADD CONSTRAINT pos_shift_sessions_terminal_company_fkey
  FOREIGN KEY (company_id, terminal_id)
  REFERENCES public.pos_terminals (company_id, id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS pos_shift_sessions_one_open_register_idx
  ON public.pos_shift_sessions (company_id, register_id)
  WHERE status = 'Open';
CREATE INDEX IF NOT EXISTS pos_shift_sessions_company_date_status_idx
  ON public.pos_shift_sessions (company_id, business_date DESC, status);
CREATE INDEX IF NOT EXISTS pos_shift_sessions_cashier_opened_idx
  ON public.pos_shift_sessions (company_id, cashier_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS pos_shift_sessions_terminal_idx
  ON public.pos_shift_sessions (company_id, terminal_id, opened_at DESC);

CREATE TABLE IF NOT EXISTS public.pos_shift_cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  shift_id uuid NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN (
    'Opening Float', 'Cash In', 'Cash Out', 'Pay In', 'Pay Out',
    'Paid Out', 'Cash Drop', 'Closing Count', 'Adjustment'
  )),
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  reason text,
  reference text,
  approval_request_id uuid,
  journal_batch_id uuid,
  status text NOT NULL DEFAULT 'Posted'
    CHECK (status IN ('Pending Approval', 'Posted', 'Reversed')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  legacy_pos_cash_movement_id uuid REFERENCES public.pos_cash_movements(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_shift_cash_movements_company_id_unique UNIQUE (company_id, id)
);

ALTER TABLE public.pos_shift_cash_movements
  DROP CONSTRAINT IF EXISTS pos_shift_cash_movements_shift_company_fkey;
ALTER TABLE public.pos_shift_cash_movements
  ADD CONSTRAINT pos_shift_cash_movements_shift_company_fkey
  FOREIGN KEY (company_id, shift_id)
  REFERENCES public.pos_shift_sessions (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_shift_cash_movements
  DROP CONSTRAINT IF EXISTS pos_shift_cash_movements_approval_company_fkey;
ALTER TABLE public.pos_shift_cash_movements
  ADD CONSTRAINT pos_shift_cash_movements_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;

ALTER TABLE public.pos_shift_cash_movements
  DROP CONSTRAINT IF EXISTS pos_shift_cash_movements_journal_company_fkey;
ALTER TABLE public.pos_shift_cash_movements
  ADD CONSTRAINT pos_shift_cash_movements_journal_company_fkey
  FOREIGN KEY (company_id, journal_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_company_shift_time_idx
  ON public.pos_shift_cash_movements (company_id, shift_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_company_status_idx
  ON public.pos_shift_cash_movements (company_id, status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_legacy_idx
  ON public.pos_shift_cash_movements (company_id, legacy_pos_cash_movement_id);

CREATE TABLE IF NOT EXISTS public.pos_sync_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  device_key text NOT NULL,
  terminal_id uuid,
  last_sequence bigint NOT NULL DEFAULT 0 CHECK (last_sequence >= 0),
  last_seen_at timestamptz,
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Pending', 'Active', 'Suspended', 'Retired')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_sync_devices_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_sync_devices_company_device_unique UNIQUE (company_id, device_key),
  CONSTRAINT pos_sync_devices_device_key_not_blank CHECK (length(btrim(device_key)) > 0)
);

ALTER TABLE public.pos_sync_devices
  DROP CONSTRAINT IF EXISTS pos_sync_devices_terminal_company_fkey;
ALTER TABLE public.pos_sync_devices
  ADD CONSTRAINT pos_sync_devices_terminal_company_fkey
  FOREIGN KEY (company_id, terminal_id)
  REFERENCES public.pos_terminals (company_id, id)
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS pos_registers_company_status_idx
  ON public.pos_registers (company_id, status, name);
CREATE INDEX IF NOT EXISTS pos_registers_branch_idx
  ON public.pos_registers (company_id, branch_id, status);
CREATE INDEX IF NOT EXISTS pos_terminals_register_status_idx
  ON public.pos_terminals (company_id, register_id, status);
CREATE INDEX IF NOT EXISTS pos_sync_devices_company_status_seen_idx
  ON public.pos_sync_devices (company_id, status, last_seen_at DESC);

CREATE OR REPLACE FUNCTION public.pos_register_assert_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.branch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id = NEW.branch_id AND b.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'POS register branch does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  IF NEW.warehouse_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.inventory_warehouses w
    WHERE w.id = NEW.warehouse_id AND w.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'POS register warehouse does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_registers_assert_scope ON public.pos_registers;
CREATE TRIGGER pos_registers_assert_scope
BEFORE INSERT OR UPDATE ON public.pos_registers
FOR EACH ROW EXECUTE FUNCTION public.pos_register_assert_scope();

CREATE OR REPLACE FUNCTION public.pos_shift_assert_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.terminal_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.pos_terminals t
    WHERE t.id = NEW.terminal_id
      AND t.company_id = NEW.company_id
      AND t.register_id = NEW.register_id
  ) THEN
    RAISE EXCEPTION 'POS terminal must belong to the selected workspace register.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.cashier_id AND p.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'POS cashier must belong to the selected workspace.' USING ERRCODE = '42501';
  END IF;
  IF NEW.closed_by IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.closed_by AND p.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'POS shift closer must belong to the selected workspace.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_shift_sessions_assert_scope ON public.pos_shift_sessions;
CREATE TRIGGER pos_shift_sessions_assert_scope
BEFORE INSERT OR UPDATE ON public.pos_shift_sessions
FOR EACH ROW EXECUTE FUNCTION public.pos_shift_assert_scope();

CREATE OR REPLACE FUNCTION public.pos_block_closed_shift_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IN ('Closed', 'Exception', 'Cancelled')
     AND current_setting('pos.internal_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Closed POS shift history can only change through a protected workflow.' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS pos_shift_sessions_immutable_guard ON public.pos_shift_sessions;
CREATE TRIGGER pos_shift_sessions_immutable_guard
BEFORE UPDATE OR DELETE ON public.pos_shift_sessions
FOR EACH ROW EXECUTE FUNCTION public.pos_block_closed_shift_mutation();

CREATE OR REPLACE FUNCTION public.pos_block_cash_movement_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('pos.internal_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'POS cash movement history can only change through a protected workflow.' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS pos_shift_cash_movements_immutable_guard ON public.pos_shift_cash_movements;
CREATE TRIGGER pos_shift_cash_movements_immutable_guard
BEFORE UPDATE OR DELETE ON public.pos_shift_cash_movements
FOR EACH ROW EXECUTE FUNCTION public.pos_block_cash_movement_mutation();

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pos_registers', 'pos_terminals', 'pos_shift_sessions', 'pos_shift_cash_movements', 'pos_sync_devices'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
      t || '_tenant_select', t
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.pos_register_assert_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_shift_assert_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_block_closed_shift_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_block_cash_movement_mutation() FROM PUBLIC;

COMMIT;
