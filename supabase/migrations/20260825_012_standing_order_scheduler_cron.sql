-- Enable the managed database scheduler only after the service bridge,
-- Vault entries, and Edge Function have passed smoke testing.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'standing-order-scheduler'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'standing-order-scheduler',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'standing_order_scheduler_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'standing_order_scheduler_automation')
      ),
      body := jsonb_build_object('source', 'pg_cron')
    ) AS request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Standing Order scheduler uses a Vault-backed Edge Function invocation every five minutes.';

COMMIT;
