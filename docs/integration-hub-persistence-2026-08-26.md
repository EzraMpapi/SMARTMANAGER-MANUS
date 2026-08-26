# Integration Hub persistence improvement

**Date:** 26 August 2026  
**Scope:** Existing Smart Manager Integration Hub  
**Live table:** `public.integration_connections`

## Gap identified from the supplied references

The visual reference presents connected providers, clear connection status, configuration fields, and an operational integration surface. The existing UI had the right navigation and forms, but its mapper and update path expected columns such as `integration_id`, `enabled`, `tenant_id`, `payment_link`, and `webhook_url`. The live Supabase table does not expose those columns. It uses the common company-table envelope: `id`, `company_id`, `name`, `status`, `amount`, `notes`, `data jsonb`, `created_at`, and `updated_at`.

That mismatch meant a connection could appear editable in the UI while an update attempted to write unsupported columns. The live audit also confirmed that the KMKM tenant had no existing `integration_connections` rows at the time of review, so the repaired insert path is needed for first-time configuration.

## Implemented behavior

The Integration Hub now reads feature-specific settings from the existing `data` JSONB envelope and falls back safely for older rows. Each connection is identified by a stable feature ID such as `slack`, `stripe`, or `microsoft365`, while the canonical table `name` stores the human-readable provider name. The canonical `status` is `Connected` or `Disconnected`, and the JSONB payload stores only the UI configuration envelope and an `integrationId` marker.

When an existing row is present, the UI updates it by its UUID. When no row exists, the UI inserts a new company-scoped generic record. Local optimistic state is rolled back if the server does not confirm the write. A successful response is mapped back through the same normalizer before the UI reports that the configuration was saved. The status label now distinguishes `Connected`, `Ready to connect`, and `Configuration required` instead of implying that all providers are already connected.

Server-held credentials and provider secrets remain outside this browser configuration path. The form continues to describe when an OAuth app, webhook, payment provider, or backend-held secret is required. No secret was created, copied, or committed.

## Schema change

The live table already supports the required configuration envelope, so no duplicate integration table or speculative credential columns were created. The only DDL added is an additive lookup index:

```sql
CREATE INDEX IF NOT EXISTS integration_connections_company_name_idx
  ON public.integration_connections (company_id, name);
```

The migration is stored at `supabase/migrations/20260826_004_integration_connections_lookup.sql` and was applied to Supabase migration ledger as `integration_connections_lookup_20260826`.

## Security boundary

The post-migration query confirmed that `public.integration_connections` still has RLS enabled and retains its existing policy row. The migration did not modify RLS, policies, grants, authentication, provider credentials, or other tables. The application continues to use the existing company-table query/mutation boundary; no cross-tenant filter was removed or bypassed.

## Verification

The focused Integration Hub and migration contracts passed: **7/7 tests**. `pnpm check` passed and `VERCEL=1 pnpm build` passed; the existing large dashboard JavaScript chunk warning remains. A rollback-only live Supabase compatibility test successfully inserted and read the JSONB envelope for the approved KMKM company and then rolled the transaction back, leaving no test row behind. The applied migration was confirmed in the live ledger as `integration_connections_lookup_20260826`.

The existing full Vitest run previously reported unrelated dashboard/UI contract failures, so those are not silently represented as resolved by this improvement.
