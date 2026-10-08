BEGIN;

CREATE TABLE IF NOT EXISTS public.offline_sync_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  operation_id text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  request_hash text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_created_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offline_sync_operations_operation_id_length CHECK (length(btrim(operation_id)) BETWEEN 1 AND 160),
  CONSTRAINT offline_sync_operations_table_name_length CHECK (length(btrim(table_name)) BETWEEN 1 AND 128),
  CONSTRAINT offline_sync_operations_request_hash_length CHECK (length(btrim(request_hash)) BETWEEN 1 AND 128),
  CONSTRAINT offline_sync_operations_company_operation_unique UNIQUE (company_id, operation_id)
);

CREATE INDEX IF NOT EXISTS offline_sync_operations_company_received_idx
  ON public.offline_sync_operations(company_id, received_at DESC);

ALTER TABLE public.offline_sync_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS offline_sync_operations_select ON public.offline_sync_operations;
CREATE POLICY offline_sync_operations_select
  ON public.offline_sync_operations
  FOR SELECT
  USING (company_id = public.current_company_id());

CREATE OR REPLACE FUNCTION public.record_offline_sync_operation(
  p_operation_id text,
  p_table_name text,
  p_operation text,
  p_request_hash text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_result jsonb DEFAULT '{}'::jsonb,
  p_client_created_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_actor_id uuid := auth.uid();
  v_existing public.offline_sync_operations%ROWTYPE;
  v_saved public.offline_sync_operations%ROWTYPE;
  v_operation_id text := nullif(btrim(p_operation_id), '');
  v_table_name text := nullif(btrim(p_table_name), '');
  v_operation text := lower(nullif(btrim(p_operation), ''));
  v_request_hash text := nullif(btrim(p_request_hash), '');
BEGIN
  IF v_actor_id IS NULL OR v_company_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required.' USING ERRCODE = '42501';
  END IF;
  IF v_operation_id IS NULL OR length(v_operation_id) > 160
     OR v_table_name IS NULL OR length(v_table_name) > 128
     OR v_request_hash IS NULL OR length(v_request_hash) > 128
     OR v_operation NOT IN ('insert', 'update', 'delete') THEN
    RAISE EXCEPTION 'A valid offline sync operation id, table, operation, and request hash are required.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing
  FROM public.offline_sync_operations
  WHERE company_id = v_company_id AND operation_id = v_operation_id;

  IF FOUND THEN
    IF v_existing.request_hash <> v_request_hash THEN
      RAISE EXCEPTION 'The offline sync operation id was already used with a different payload.' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object(
      'accepted', true,
      'duplicate', true,
      'operation_id', v_existing.operation_id,
      'received_at', v_existing.received_at,
      'result', v_existing.result
    );
  END IF;

  INSERT INTO public.offline_sync_operations(
    company_id, actor_id, operation_id, table_name, operation,
    request_hash, payload, result, client_created_at
  ) VALUES (
    v_company_id, v_actor_id, v_operation_id, v_table_name, v_operation,
    v_request_hash, coalesce(p_payload, '{}'::jsonb), coalesce(p_result, '{}'::jsonb), p_client_created_at
  )
  RETURNING * INTO v_saved;

  RETURN jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'operation_id', v_saved.operation_id,
    'received_at', v_saved.received_at,
    'result', v_saved.result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_offline_sync_operation(text, text, text, text, jsonb, jsonb, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_offline_sync_operation(text, text, text, text, jsonb, jsonb, timestamptz) TO authenticated;

COMMIT;
