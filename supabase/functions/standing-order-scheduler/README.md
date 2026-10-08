# Standing Order Scheduler Edge Function

This function is the service-to-service cron handler for the Standing Order control plane. It accepts only `POST` requests carrying the named automation secret in the `apikey` header, generates an execution correlation ID, and calls the service-role-only `public.bank_scheduler_tick(...)` bridge.

## Server-side secret boundary

The function uses the project’s server-only Supabase secret key to call the bridge and validates the incoming `apikey` against the dedicated encrypted Vault entry `standing_order_scheduler_automation`. Do not commit secret values, put them in client environment variables, or send them in a browser request.

| Secret/configuration | Purpose |
|---|---|
| `SUPABASE_URL` | Project URL used for the service bridge request; provided by the hosted Edge Function runtime. |
| `SUPABASE_SECRET_KEYS` or `SUPABASE_SERVICE_ROLE_KEY` | Server-only service credential used for validator and bridge calls; never expose it to a browser. |
| Vault `standing_order_scheduler_automation` | Dedicated inbound automation credential expected in the request `apikey` header. |
| Vault `standing_order_scheduler_url` | Target function URL used by the database scheduler. |
| `STANDING_ORDER_SCHEDULER_TIMEOUT_MS` | Optional timeout from 1,000 to 120,000 milliseconds; defaults to 20,000. |

The inbound automation secret and outbound Supabase service key are intentionally different credentials. The validator is service-role-only and compares the supplied header to the decrypted Vault value inside PostgreSQL; the Edge Function does not need the plaintext automation secret as an environment variable. Supabase documents that secret keys are server-only and bypass RLS, and that Vault stores encrypted secrets for database use [1] [2].

## Bridge prerequisite

The database migration installs a service-only public bridge with this contract:

```sql
public.bank_scheduler_tick(
  p_run_date date,
  p_order_id uuid,
  p_max_orders integer,
  p_execution_id uuid default null,
  p_requested_by uuid default null
) returns jsonb
```

The bridge has `EXECUTE` revoked from `PUBLIC`, `anon`, and `authenticated`, and granted only to `service_role`. Its body delegates to the private implementation schema and contains no business logic.

## Local invocation

Use a non-production automation secret when testing locally:

```bash
curl -i -X POST \
  "https://<project-ref>.supabase.co/functions/v1/standing-order-scheduler" \
  -H "content-type: application/json" \
  -H "apikey: $STANDING_ORDER_AUTOMATION_SECRET" \
  --data '{"source":"manual-dry-run","maxOrders":1}'
```

The handler returns a bounded response containing `ok`, `executionId`, `runDate`, and aggregate counts. It deliberately does not return order-level customer data or raw database error text.

## Cron invocation

The active Supabase cron job uses `pg_cron` and `pg_net` to send a POST request to this function. It reads the URL and automation secret from Vault rather than embedding secret values in migration text:

```sql
select cron.schedule(
  'standing-order-scheduler',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'standing_order_scheduler_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'standing_order_scheduler_automation')
      ),
      body := jsonb_build_object('source', 'pg_cron')
    ) as request_id;
  $$
);
```

The database runner is idempotent and uses deterministic occurrence keys and row locks, so cron retries or overlapping invocations do not intentionally create duplicate postings.

## Verified deployment state

- Function: `standing-order-scheduler`
- Supabase project: `rlhngsrihahhyxnjxrxm`
- Active Edge Function version: 2
- JWT verification: disabled because the handler performs custom automation-secret validation
- Vault entries: `standing_order_scheduler_automation` and `standing_order_scheduler_url`
- Cron job: active, every five minutes
- Live smoke test: HTTP 200 with a successful zero-due-order summary

Provider confirmation is not implemented by this handler. A provider-specific signed callback path must be verified and built separately before any automatic mobile-money settlement transition is enabled.

## References

[1]: https://supabase.com/docs/guides/functions/secrets "Supabase Edge Function Secrets"

[2]: https://supabase.com/docs/guides/database/vault "Supabase Vault"
