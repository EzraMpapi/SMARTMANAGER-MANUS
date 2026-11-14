-- Immutable owner-visible record history.
-- Captures INSERT, UPDATE, and DELETE snapshots so deleted records remain auditable.

CREATE TABLE IF NOT EXISTS public.record_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  actor_user_id uuid,
  actor_name text NOT NULL DEFAULT 'System',
  actor_role text,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS record_history_company_created_idx
  ON public.record_history (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS record_history_company_table_idx
  ON public.record_history (company_id, table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS record_history_record_idx
  ON public.record_history (company_id, table_name, record_id, created_at DESC);

ALTER TABLE public.record_history ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_read_record_history(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = p_company_id
      AND lower(trim(p.role)) IN (
        'owner', 'organization owner', 'ceo',
        'super administrator', 'system administrator', 'auditor'
      )
      AND p.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_record_history(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_record_history(uuid) TO authenticated;

DROP POLICY IF EXISTS record_history_owner_read ON public.record_history;
CREATE POLICY record_history_owner_read
  ON public.record_history
  FOR SELECT
  TO authenticated
  USING (public.can_read_record_history(company_id));

REVOKE ALL ON public.record_history FROM anon, authenticated;
GRANT SELECT ON public.record_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_history TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_record_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'record_history is append-only and cannot be changed or deleted';
END;
$$;

DROP TRIGGER IF EXISTS record_history_immutable_update ON public.record_history;
CREATE TRIGGER record_history_immutable_update
  BEFORE UPDATE OR DELETE ON public.record_history
  FOR EACH ROW EXECUTE FUNCTION public.prevent_record_history_mutation();

REVOKE ALL ON FUNCTION public.prevent_record_history_mutation() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.capture_record_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_payload jsonb;
  new_payload jsonb;
  company_text text;
  company_uuid uuid;
  record_key text;
  actor_id uuid := auth.uid();
  actor_display_name text := 'System';
  actor_display_role text;
  changed text[] := ARRAY[]::text[];
BEGIN
  old_payload := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END;
  new_payload := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
  company_text := COALESCE(new_payload->>'company_id', old_payload->>'company_id');

  BEGIN
    company_uuid := NULLIF(company_text, '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    company_uuid := NULL;
  END;

  IF company_uuid IS NULL THEN
    BEGIN
      company_uuid := public.current_company_id();
    EXCEPTION WHEN OTHERS THEN
      company_uuid := NULL;
    END;
  END IF;

  IF actor_id IS NOT NULL THEN
    SELECT COALESCE(p.preferred_name, p.full_name, p.email, 'Workspace user'), p.role
      INTO actor_display_name, actor_display_role
      FROM public.profiles p
     WHERE p.id = actor_id
     LIMIT 1;
  END IF;

  record_key := COALESCE(new_payload->>'id', old_payload->>'id');

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(array_agg(key ORDER BY key), ARRAY[]::text[])
      INTO changed
      FROM jsonb_object_keys(COALESCE(old_payload, '{}'::jsonb) || COALESCE(new_payload, '{}'::jsonb)) AS keys(key)
     WHERE (old_payload -> key) IS DISTINCT FROM (new_payload -> key);
  END IF;

  INSERT INTO public.record_history (
    company_id, actor_user_id, actor_name, actor_role, operation,
    table_name, record_id, old_data, new_data, changed_fields
  ) VALUES (
    company_uuid, actor_id, COALESCE(actor_display_name, 'System'), actor_display_role,
    TG_OP, TG_TABLE_NAME, record_key, old_payload, new_payload, changed
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_record_history() FROM PUBLIC, anon, authenticated;

-- Install the trigger on every current tenant table. Audit tables and the
-- history table are excluded to prevent recursive history writes.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN information_schema.columns col
        ON col.table_schema = n.nspname AND col.table_name = c.relname
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND col.column_name = 'company_id'
       AND c.relname NOT IN ('record_history', 'audit_log', 'audit_logs')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS capture_record_history ON public.%I', target.table_name);
    EXECUTE format(
      'CREATE TRIGGER capture_record_history AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.capture_record_history()',
      target.table_name
    );
  END LOOP;
END;
$$;

COMMENT ON TABLE public.record_history IS
  'Append-only tenant record history. Owner/auditor read access is RLS-protected; delete and update snapshots remain after source records are removed.';
