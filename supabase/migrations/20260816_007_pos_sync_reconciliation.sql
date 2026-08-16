BEGIN;

CREATE TABLE IF NOT EXISTS public.pos_sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL,
  transaction_id uuid NULL REFERENCES public.pos_transactions(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('synced', 'needs_attention')),
  message text NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pos_sync_events_company_idempotency_key UNIQUE (company_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS pos_sync_events_company_updated_idx
  ON public.pos_sync_events (company_id, updated_at DESC);

ALTER TABLE public.pos_sync_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_sync_events_company_select ON public.pos_sync_events;
CREATE POLICY pos_sync_events_company_select
  ON public.pos_sync_events
  FOR SELECT
  TO authenticated
  USING (company_id = (SELECT public.current_company_id()));

CREATE OR REPLACE FUNCTION public.record_pos_sync_event(
  p_idempotency_key text,
  p_status text,
  p_transaction_id uuid DEFAULT NULL,
  p_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid := public.current_company_id();
BEGIN
  IF v_user_id IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required to record POS synchronization.' USING ERRCODE = '42501';
  END IF;
  IF nullif(trim(p_idempotency_key), '') IS NULL OR length(trim(p_idempotency_key)) > 160 THEN
    RAISE EXCEPTION 'A valid POS idempotency key is required.' USING ERRCODE = '22023';
  END IF;
  IF p_status NOT IN ('synced', 'needs_attention') THEN
    RAISE EXCEPTION 'Unsupported POS synchronization status.' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'synced' THEN
    IF p_transaction_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.pos_transactions WHERE id = p_transaction_id AND company_id = v_company_id) THEN
      RAISE EXCEPTION 'A synchronized POS event must reference a workspace transaction.' USING ERRCODE = '42501';
    END IF;
  END IF;
  INSERT INTO public.pos_sync_events (company_id, idempotency_key, transaction_id, status, message, created_by)
  VALUES (v_company_id, trim(p_idempotency_key), p_transaction_id, p_status, nullif(left(trim(coalesce(p_message, '')), 500), ''), v_user_id)
  ON CONFLICT (company_id, idempotency_key) DO UPDATE
    SET transaction_id = EXCLUDED.transaction_id,
        status = EXCLUDED.status,
        message = EXCLUDED.message,
        updated_at = now();
  RETURN jsonb_build_object('idempotency_key', trim(p_idempotency_key), 'status', p_status, 'transaction_id', p_transaction_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.record_pos_sync_event(text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_pos_sync_event(text, text, uuid, text) TO authenticated;

COMMIT;
