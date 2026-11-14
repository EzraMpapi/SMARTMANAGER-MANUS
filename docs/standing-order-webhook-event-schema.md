# Durable Provider Webhook Event Schema for SMARTMANAGER

**Status:** Exact migration draft; not applied to Supabase.

**Proposed migration name:** `20260825_013_standing_order_webhook_event_log.sql`

**Scope:** Durable provider-event evidence, replay protection, provider transaction correlation, tenant-safe foreign keys, processing leases, append-only evidence, and service-only event claiming for Standing Order settlement.

## Decision summary

The migration adds three tables. `bank_provider_transactions` records the outbound provider operation and is the correlation authority. `bank_provider_webhook_events` records the authenticated provider evidence exactly once per semantic event, with only hashes and a redacted payload. `bank_provider_webhook_processing` stores mutable retry/lease state separately so the evidence row remains append-only.

The migration also adds composite uniqueness to existing Standing Order parent tables, because PostgreSQL requires a referenced unique key for composite tenant-safe foreign keys. It adds service-only claim functions and grants no browser role permission to insert, update, or delete webhook evidence.

The migration does not implement a provider signature algorithm. The provider-specific Edge Function and Vault-backed validator must verify the raw request body first and pass `p_signature_verified = true` only after successful verification. For the previously researched PlusPesa adapter, that validator would implement the provider-published HMAC-SHA256 contract; for direct M-Pesa, Airtel Money, Mixx by Yas, HaloPesa, or another gateway, the exact provider specification must replace it.

## Existing live contracts used

The design was checked against the live schemas for:

| Existing relation | Fields used |
|---|---|
| `public.bank_standing_orders` | `company_id`, `id`, `currency`, `channel`, `amount`, lifecycle status |
| `public.bank_standing_order_runs` | `company_id`, `id`, `standing_order_id`, `payment_instruction_id`, `amount`, `currency`, `status`, `provider`, `provider_reference`, `idempotency_key` |
| `public.bank_payment_instructions` | `company_id`, `id`, `amount`, `currency`, `provider`, `provider_reference`, `status`, `idempotency_key` |
| `public.bank_standing_order_events` | Existing lifecycle and audit-adjacent history; the new provider event table is separate to preserve provider evidence and processing state |
| `public.bank_audit_events` | Existing audit sink used by the eventual settlement routine |
| `public.integration_connections` | Existing generic integration envelope; no provider webhook event table is currently available for this contract |

The live database currently has no `bank_provider_transactions`, `bank_provider_webhook_events`, or `bank_provider_webhook_processing` relations.

## Table 1: `bank_provider_transactions`

This is the trusted outbound correlation record. It must be created when the server creates a provider payment instruction, before a callback is considered eligible for settlement.

| Column | Type | Required behavior |
|---|---|---|
| `id` | `uuid` | Primary key generated server-side |
| `company_id` | `uuid` | Tenant key; references `companies` |
| `provider` | `text` | Provider adapter name, such as `PLUSPESA` |
| `provider_account_key` | `text` | Non-secret merchant-account scope; never an API secret |
| `operation_type` | `text` | `STANDING_ORDER_COLLECTION` for this workflow |
| `standing_order_run_id` | `uuid` | Tenant-safe composite FK to the run |
| `payment_instruction_id` | `uuid` | Nullable tenant-safe composite FK |
| `client_reference` | `text` | Exact outbound reconciliation reference; unique within provider/account scope |
| `provider_event_id` | `text` | Optional provider event identity |
| `provider_uuid` | `text` | Optional provider collection UUID; unique within provider/account scope |
| `provider_reference` | `text` | Optional provider receipt/reference; unique within provider/account scope |
| `amount` | `numeric(20,2)` | Immutable expected amount; must be positive |
| `currency` | `text` | Three uppercase letters; must match the run/order |
| `status` | `text` | Processing state; terminal success/failure is not inferred from request acknowledgement |
| `request_payload_hash` | `text` | Optional lowercase SHA-256 hex digest of a safe outbound representation |
| `last_callback_at` | `timestamptz` | Latest verified callback time |
| `failure_code`, `failure_message` | `text` | Bounded redacted diagnostics |
| `created_at`, `updated_at` | `timestamptz` | UTC database timestamps |

The unique indexes include `provider` and `provider_account_key` so separate provider accounts do not collide. A future provider adapter must populate a stable merchant-account identifier that is not secret.

## Table 2: `bank_provider_webhook_events`

This is the immutable evidence ledger. It can contain an unresolved signed event with `company_id`, run, and instruction set to `NULL`; such an event is retained for reconciliation but cannot settle until correlation succeeds.

| Column | Type | Meaning |
|---|---|---|
| `id` | `uuid` | Immutable evidence row ID |
| `provider`, `provider_account_key` | `text` | Provider and merchant-account scope |
| `company_id` | `uuid null` | Derived from the outbound transaction, never trusted from callback input |
| `standing_order_run_id`, `payment_instruction_id` | `uuid null` | Derived tenant-safe links |
| `provider_event_id`, `provider_uuid`, `provider_reference` | `text null` | Provider identities from the verified payload |
| `client_reference` | `text null` | Provider callback correlation field, such as PlusPesa `external_id` |
| `provider_status` | `text null` | Normalized provider status used during reconciliation classification |
| `amount`, `currency` | `numeric(20,2)`, `text null` | Normalized callback values used for exact settlement preflight |
| `raw_payload_hash` | `text` | SHA-256 of exact received raw body; no raw body is stored |
| `semantic_fingerprint` | `text` | SHA-256 of normalized provider identity/status fields for replay detection |
| `signature_verified` | `boolean` | Must be true for an accepted/retained authenticated event |
| `signature_key_version` | `text null` | Non-secret active/previous key label used by the validator |
| `ingest_outcome` | `text` | `ACCEPTED`, `CONFLICT`, or `REJECTED` |
| `payload_redacted` | `jsonb` | Only approved non-secret, redacted provider fields |
| `received_at` | `timestamptz` | Database receipt time |
| `execution_id` | `uuid` | Correlates the Edge Function invocation and audit records |

The primary replay key is `(provider, provider_account_key, semantic_fingerprint)`. Provider UUID, reference, event ID, and client reference are indexed separately for conflict detection. The migration deliberately does not place a global unique constraint on provider references because multiple merchant accounts may use independent provider namespaces; the merchant-account scope must be part of the identity.

## Table 3: `bank_provider_webhook_processing`

This is a mutable operational cursor keyed one-to-one with the evidence row.

| Column | Type | Purpose |
|---|---|---|
| `event_id` | `uuid` | Primary key and restricted FK to evidence |
| `company_id` | `uuid null` | Correlated tenant, nullable for unresolved events |
| `processing_status` | `text` | `RECEIVED`, `PROCESSING`, `PROCESSED`, `DUPLICATE`, `NEEDS_ATTENTION`, or `FAILED` |
| `attempt_count` | `integer` | Bounded retry counter |
| `next_attempt_at` | `timestamptz` | Reconciliation scheduling time |
| `lease_until` | `timestamptz` | Worker lease expiry |
| `processing_started_at` | `timestamptz` | Processing start time |
| `processed_at` | `timestamptz` | Set only for `PROCESSED` or `DUPLICATE` |
| `last_error_code`, `last_error_message` | `text` | Bounded redacted diagnostics |
| `updated_at` | `timestamptz` | Operational cursor timestamp |

Keeping this table separate prevents a retry, lease extension, or processing failure from mutating cryptographic evidence. The event trigger blocks all updates and deletes on `bank_provider_webhook_events`.

## Replay and conflict semantics

The private claim function takes a provider identity, hashes, a redacted payload, and an execution UUID. It does not accept `company_id`, `standing_order_run_id`, or `payment_instruction_id` as authority. If `client_reference` matches a trusted `bank_provider_transactions` row, those tenant and relationship fields are derived inside the function and checked by composite foreign keys.

The function obtains a transaction-scoped advisory lock keyed by provider, merchant-account scope, and the strongest available provider identity. The remediation control plane separately serializes one drain run per provider account and leases rows with `FOR UPDATE OF p, r SKIP LOCKED`. It then applies this sequence:

1. If the semantic fingerprint already exists, return the existing event and processing status with `replayed=true`.
2. If a different fingerprint reuses an existing provider event ID, UUID, reference, or client reference, insert a second immutable event marked `CONFLICT` and create `NEEDS_ATTENTION` processing state. No financial settlement is performed.
3. Otherwise insert one immutable event and one `RECEIVED` processing row.
4. A separate trusted settlement routine must lock the processing row and provider transaction, compare provider, reference, UUID, client reference, amount, currency, and lifecycle status, and only then call the existing private provider-confirmation implementation.
5. The `SUCCESS` settlement and processing outcome must commit in one database transaction. A duplicate callback must never call the posting routine a second time.

## Security and grants

All three tables have RLS enabled. Browser-authenticated users receive `SELECT` only through `company_id = public.current_company_id()` policies. `anon` and `authenticated` receive no table write privileges. `service_role` is the only role with the table privileges required by the server-side webhook path.

The private claim function is `SECURITY INVOKER`, uses `SET search_path = pg_catalog`, checks `auth.role() = 'service_role'`, and is executable only by `service_role`. The public REST bridge is also `SECURITY INVOKER`, uses `SET search_path = pg_catalog, public, bank_private`, and is executable only by `service_role`. The bridge is an event-claim boundary, not a browser-facing API and not a substitute for signature validation.

## Required preflight and post-apply checks

Before applying the migration, verify that the target database does not already contain any of the three table names, or stop and reconcile the schema rather than allowing `IF NOT EXISTS` to mask drift. Verify the exact installed `extensions.gen_random_uuid()` and `pg_advisory_xact_lock(hashtextextended(text, bigint))` signatures. Review the provider-specific signature validator separately.

After applying it, inspect `pg_class`, `pg_constraint`, `pg_indexes`, `pg_policies`, `information_schema.role_table_grants`, and `information_schema.routine_privileges` with bounded read-only queries. Confirm RLS is enabled, the composite parent indexes exist, all three tables have the intended unique keys, the event trigger exists, and no browser role can write evidence or processing state.

Run concurrency tests with two simultaneous identical events and two simultaneous conflicting events. The expected results are one event plus one processing row for an identical replay, and two evidence rows with one `CONFLICT`/`NEEDS_ATTENTION` row for a reused provider identity with a different fingerprint. Run tenant tests proving that a callback cannot select a company from payload data and that an authenticated user sees only their own company’s resolved records.

Do not apply the migration, create a provider secret, enable a callback URL, or revoke legacy authenticated provider grants until the provider is confirmed, outbound provider transaction records are populated, the signature validator is tested against official sandbox fixtures, and the service settlement path has passed a controlled financial test.

## Related files

- SQL migration: `supabase/migrations/20260825_013_standing_order_webhook_event_log.sql`
- SQL migration draft: `docs/standing-order-webhook-event-migration.sql`
- Remediation control-plane migration: `supabase/migrations/20260825_014_standing_order_webhook_remediation.sql`
- Remediation worker: `scripts/standing_order_webhook_remediation.py`
- Provider webhook design: `docs/standing-order-provider-webhook-settlement-design.md`
- Provider research record: `docs/standing-order-provider-webhook-research.md`

## References

[1]: https://supabase.com/docs/guides/functions/auth Supabase, “Securing Edge Functions,” including raw-body external webhook signature verification.

[2]: https://supabase.com/docs/guides/database/vault Supabase, “Vault,” including encrypted secret storage and protection of decrypted secret access.

[3]: https://docs.pluspesa.com/ PlusPesa Collections API documentation, including callback fields, `X-PlusPesa-Signature`, HMAC-SHA256, and status-query fallback.

**Author:** Manus AI
