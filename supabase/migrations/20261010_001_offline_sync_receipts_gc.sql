BEGIN;

-- Keep the idempotency ledger bounded while retaining enough history to audit
-- normal offline replay behavior. The function is intentionally explicit about
-- the retention window so controlled maintenance runs can override the default.
CREATE OR REPLACE FUNCTION public.purge_old_offline_sync_operations(
  p_retention interval DEFAULT interval '30 days'
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted bigint;
BEGIN
  IF p_retention IS NULL OR p_retention < interval '1 day' THEN
    RAISE EXCEPTION 'Offline sync receipt retention must be at least one day.'
      USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.offline_sync_operations
  WHERE received_at < now() - p_retention;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_old_offline_sync_operations(interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_old_offline_sync_operations(interval) TO service_role;

-- Supabase-managed projects expose pg_cron. Replacing the named job keeps this
-- migration safe to re-run in staging and ensures only one cleanup schedule exists.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'offline-sync-receipts-gc'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'offline-sync-receipts-gc',
  '17 3 * * *',
  $$SELECT public.purge_old_offline_sync_operations(interval '30 days');$$
);

COMMENT ON FUNCTION public.purge_old_offline_sync_operations(interval)
  IS 'Purges successful offline sync idempotency receipts older than the requested retention window; scheduled daily at 03:17 UTC.';

COMMIT;
