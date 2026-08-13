-- BusinessSphere ERP production schema baseline repair
--
-- Audit basis: the protected PostgREST OpenAPI contract was retrieved on
-- 2026-08-12. All 110 ERP tables referenced by BusinessSphereDashboard.jsx
-- already exist in the connected Supabase project. This migration therefore
-- creates no duplicate business tables and never drops data.
--
-- The audit found one safe, additive contract gap: public.audit_log does not
-- expose updated_at. This migration backfills only NULL values, adds a default
-- for future records, and keeps the timestamp current on later updates.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.audit_log') IS NULL THEN
    RAISE EXCEPTION 'Expected public.audit_log to exist before applying the schema baseline repair.';
  END IF;
END $$;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.audit_log
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

ALTER TABLE public.audit_log
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.businesssphere_audit_log_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesssphere_audit_log_updated_at ON public.audit_log;

CREATE TRIGGER businesssphere_audit_log_updated_at
BEFORE UPDATE ON public.audit_log
FOR EACH ROW
EXECUTE FUNCTION public.businesssphere_audit_log_set_updated_at();

COMMIT;
