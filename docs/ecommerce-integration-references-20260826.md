# E-Commerce Integration References

## Supabase Row Level Security

Source: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

Key verified guidance: every table in an exposed schema must have RLS enabled; grants and policies are separate controls; revoke broad `anon` and `authenticated` privileges and grant only required operations; use explicit policies for SELECT/INSERT/UPDATE/DELETE; add indexes for policy filter columns; wrap stable helper calls such as `auth.uid()` in a SELECT expression where appropriate; and use `security_invoker = true` for exposed views in Postgres 15+ when they must obey underlying RLS.

## Supabase Database Functions

Source: [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)

Key verified guidance: database functions can execute data-intensive transactional operations and are callable through `rpc`; prefer `security invoker` by default; if `security definer` is required, set an explicit safe `search_path` and schema-qualify relations; restrict function execution grants instead of relying on default public execution; and keep external/low-latency work in an Edge Function when appropriate.

## Stripe idempotency

Source: [Stripe Idempotent requests](https://docs.stripe.com/api/idempotent_requests)

Key verified guidance: mutating requests should carry an idempotency key; the provider stores the first result and returns the same result for retries; keys should have sufficient entropy, should not contain sensitive identifiers, and should be reused only for the same logical operation and parameters.

## Stripe webhooks

Source: [Stripe webhooks](https://docs.stripe.com/webhooks)

Key verified guidance: webhook endpoints must be publicly accessible HTTPS endpoints in production; verify the signature with the raw request body and endpoint secret; return a successful 2xx quickly before complex downstream work; and process asynchronous payment events such as `payment_intent.succeeded` and `payment_intent.payment_failed` through the verified webhook path.
