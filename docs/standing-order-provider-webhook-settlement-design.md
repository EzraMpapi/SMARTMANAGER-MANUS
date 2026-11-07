# SMARTMANAGER Provider-Specific Cryptographic Webhook Settlement Design

**Status:** Design only. Not deployed and not enabled for automated financial settlement.

**Reference date:** 25 August 2026.

**Recommended first adapter:** PlusPesa Collections API, subject to confirmation that PlusPesa is the merchant’s actual payment counterparty. The current SMARTMANAGER repository and live database do not identify a configured provider, and the existing Standing Order records contain no provider rows. If the merchant instead uses direct Vodafone M-Pesa, Airtel Money, Mixx by Yas, HaloPesa, or another gateway, the PlusPesa adapter must not be enabled; the provider’s authenticated specification must replace the adapter-specific fields and signing rules.

> I am an AI, not a licensed financial advisor—this is technical risk-control analysis for implementation planning, not personalized financial advice. Payment-provider onboarding, regulatory obligations, and production approval should be reviewed by the institution’s engineering, risk, compliance, and provider-integration owners.

## 1. Executive decision

SMARTMANAGER should add a separate provider webhook function rather than extend the existing `standing-order-scheduler` endpoint. The scheduler is an outbound, pg_cron-triggered service-role process protected by a dedicated automation secret. A provider webhook is an inbound, internet-facing callback whose authority comes from the provider’s cryptographic signature. These trust boundaries must remain separate.

The first concrete adapter can target PlusPesa because its published Collections API documents the Tanzania mobile-money networks it supports, a `callback_url`, the `X-PlusPesa-Signature` header, HMAC-SHA256 over the exact raw request body, a dashboard-managed `callback_secret`, the `external_id` reconciliation field, and uppercase `SUCCESS`/`FAILED` webhook statuses.[1] The public documentation does not describe a timestamp header or event ID, so replay protection must be based on provider reference, normalized event fingerprint, durable idempotency, and a locked state transition rather than an invented timestamp rule.

The settlement authority chain should be:

```text
PlusPesa signed callback
        │
        ▼
pluspesa-collection-webhook Edge Function
  - read bounded raw body
  - verify HMAC-SHA256 in constant time
  - call service-only signed-event bridge
        │
        ▼
bank_provider_webhook_tick(...)
  - reverify signature in the database boundary
  - parse and validate provider payload
  - resolve external_id to one tenant/run
  - deduplicate and lock event/reference
  - validate amount/currency/provider/state
        │
        ▼
bank_private.confirm_provider_payment(...)
  - mark run/instruction/order
  - post the immutable bank transaction
  - write standing-order and audit events atomically
```

No client JWT, browser request, callback payload field, or provider status string may directly set `POSTED`, `CONFIRMED`, `Settled`, `journal_batch_id`, or account balances.

## 2. Provider contract to implement: PlusPesa

The PlusPesa documentation describes collection creation through `POST https://app.pluspesa.com/api/v1/collections`, using `X-Public-Key` and `X-Secret-Key` server-side headers. A collection request includes a customer account number, an integer amount, currency, an application-supplied `external_id`, and an optional `callback_url`. The acknowledgement returns a PlusPesa `uuid`, `reference`, and `status` of `processing`; the acknowledgement is not settlement evidence.[1]

The webhook payload contains `uuid`, `reference`, `external_id`, `status`, `amount`, `currency`, and `provider`. The documentation states that webhook status values are uppercase, with `SUCCESS` and `FAILED` as the documented terminal outcomes. It also states that, when `callback_secret` is configured, PlusPesa sends `X-PlusPesa-Signature`, calculated as the hexadecimal HMAC-SHA256 of the exact raw request body using the callback secret, and that the callback endpoint should return HTTP 200 after receipt. The documentation says non-200 responses may be retried with exponential backoff.[1]

| Provider field | SMARTMANAGER use | Settlement rule |
|---|---|---|
| `external_id` | Stable internal correlation key, for example `SM:SO:<run_uuid>` | Must resolve to exactly one company and one `bank_standing_order_runs` row; never trust a company ID supplied by the callback |
| `reference` | Provider receipt/reference | Required for terminal settlement and stored as the provider reference |
| `uuid` | Provider collection identifier | Stored as provider transaction identity and used for duplicate/conflict detection |
| `status` | `SUCCESS` or `FAILED` | Only `SUCCESS` may post the withdrawal; `FAILED` invokes the existing failure transition |
| `amount` | Provider-reported TZS amount | Must equal the run amount exactly after provider-unit validation; never round silently |
| `currency` | Provider currency | Must equal the run currency, initially `TZS` |
| `provider` | Network label such as M-Pesa, Tigo, Airtel, or HaloPesa | Must match the outbound provider transaction record; do not infer tenant or run from this field |
| `X-PlusPesa-Signature` | HMAC-SHA256 proof | Verify against the raw bytes before JSON parsing; compare in constant time |

The PlusPesa reference is the authoritative provider receipt for the internal record, but a successful HTTP acknowledgement from the collection-creation API is not evidence that the customer completed payment. The run remains `PENDING_PROVIDER` until a verified terminal callback or a verified status-query response is processed.[1]

## 3. Inbound Edge Function boundary

Create a dedicated function named `pluspesa-collection-webhook` with `verify_jwt=false`. Supabase’s official guidance for external webhooks is to skip the platform JWT check only when the function itself verifies the provider signature from the raw body; it also warns that disabling the platform check makes the handler fully responsible for authentication.[2] The function must therefore reject every request that is not authenticated by the provider signature or a controlled internal test mode that is unavailable in production.

The handler must use the following order of operations:

1. Accept only `POST` and impose a strict body-size limit before allocating or parsing JSON. A practical initial limit is 16 KiB, subject to the provider’s published maximum.
2. Read the raw request body exactly once as bytes or an equivalent lossless string. Do not parse and re-serialize JSON before verification because whitespace, key order, escaping, and number formatting are part of the signed message.
3. Read `X-PlusPesa-Signature`; normalize only the documented hexadecimal representation, not the body. Reject a missing, malformed, or invalid signature with HTTP 401 and a generic response.
4. Ask a service-only signature validator to compare the signature against the Vault-held callback secret. The validator must return only a boolean and optional non-secret key version; it must never return the secret.
5. Parse JSON only after signature verification. Validate the exact provider schema and terminal status vocabulary.
6. Forward the raw body, signature, provider name, and a fresh execution UUID to a service-only webhook bridge. The bridge repeats signature verification and performs the authoritative database transaction. This defense-in-depth check prevents a future handler regression from turning an unverified parsed payload into a financial posting.
7. Return HTTP 200 only after the event has been durably accepted as processed, duplicate, rejected-after-authentication, or needs-attention. Return a 5xx response only when the event could not be durably recorded or the service boundary is unavailable, so a provider retry remains useful.

The function must never log the raw body, callback secret, complete signature, customer PIN, API credentials, or an unredacted MSISDN. Structured logs should include only `executionId`, provider, event classification, provider reference hash or last four characters where permitted, run ID, HTTP outcome, and duration.

## 4. Cryptographic verification design

Store the PlusPesa callback secret in Supabase Vault under a provider-specific name such as `pluspesa_callback_secret_active`. Supabase documents Vault as encrypted and authenticated secret storage whose decrypted view must be protected because access to that view reveals secret values.[3] The existing SMARTMANAGER pattern already restricts Vault-backed validation to the service role; the provider validator should follow the same pattern.

Add a narrowly scoped database function with the following contract. This is a design contract, not an instruction to apply it unchanged:

```sql
public.bank_validate_provider_webhook_signature(
  p_provider text,
  p_raw_body text,
  p_signature text
) returns jsonb
```

Required properties are `SECURITY DEFINER`, a pinned `search_path`, `PUBLIC`/`anon`/`authenticated` execution revoked, and `service_role` execution granted. The function should accept only the explicitly supported provider identifier, load the active callback secret from Vault by a fixed name, calculate HMAC-SHA256 using the live `pgcrypto` installation in the `extensions` schema, compare the expected lowercase hexadecimal digest to the normalized supplied header in constant time, and return a minimal result such as `{ "valid": true, "keyVersion": "active" }`. The live project has `pgcrypto` 1.3 installed in the `extensions` schema, but the migration must still validate the exact installed function signature in a migration test before deployment.

For rotation, support an active and a previous secret only during a deliberately short overlap window, with the previous key’s expiry stored as non-secret metadata. The validator may accept the previous key only until the declared expiry and must return the matched key version for audit. If PlusPesa does not support overlapping callback secrets, rotate during a controlled maintenance window and monitor rejected-signature counts. Never put a callback secret in a webhook event row, log line, client response, migration file, or Git repository.

The validator must not implement a guessed RSA scheme, timestamp scheme, IP allowlist, or provider certificate check. Those controls may be added only if PlusPesa publishes them for the merchant’s account and the exact canonicalization requirements are tested with provider-supplied fixtures.

## 5. Durable event, transaction, and idempotency records

The current live database has `integration_connections` and `property_integration_events`, but no provider-settlement event table. The implementation should use an additive migration with dedicated, tenant-safe provider records rather than overloading generic property integration data.

### 5.1 Provider transaction record

Introduce an additive `bank_provider_transactions` table, or adopt the already-drafted `integration_provider_transactions` name only after a live schema review. The selected name must be consistent across migration, RPCs, tests, and reporting. Minimum fields are:

| Field | Requirement |
|---|---|
| `id` | UUID primary key |
| `company_id` | Not null; tenant key used in every lookup and unique constraint |
| `provider` | `PLUSPESA` for this adapter |
| `operation_type` | `STANDING_ORDER_COLLECTION` |
| `standing_order_run_id` | Not null, tenant-safe foreign key to the run |
| `payment_instruction_id` | Nullable tenant-safe foreign key |
| `client_reference` | The exact outbound `external_id`; unique per company/provider |
| `provider_uuid` | PlusPesa `uuid`; unique per provider when present |
| `provider_reference` | PlusPesa `reference`; unique per provider when present |
| `amount` and `currency` | Immutable outbound amount and currency |
| `status` | `CREATED`, `PROCESSING`, `SUCCESS`, `FAILED`, `UNKNOWN`, or `REVERSED` |
| `request_payload_hash` | SHA-256 of the redacted or canonical outbound request representation |
| `last_callback_at` | Latest verified callback time |
| `failure_code` and `failure_message` | Redacted bounded diagnostic fields |
| `created_at`, `updated_at` | UTC timestamps |

The callback must resolve `external_id` to this record, then compare `reference`, `uuid`, amount, currency, and provider. A callback that supplies an existing provider reference but a different `external_id`, amount, currency, or UUID is a **conflict**, not a successful update; it must be persisted as `NEEDS_ATTENTION` and must not call the settlement bridge.

### 5.2 Provider webhook event record

Introduce `bank_provider_webhook_events` with:

```text
id uuid primary key
company_id uuid null until correlation succeeds
provider text not null
provider_reference text null
provider_uuid text null
client_reference text null
semantic_event_fingerprint text not null
raw_payload_hash text not null
signature_verified boolean not null
generated_key_version text null
payload_redacted jsonb not null
received_at timestamptz not null
processing_status text not null
processed_at timestamptz null
processing_error_code text null
processing_error_message text null
execution_id uuid not null
```

Use a unique constraint on `(provider, semantic_event_fingerprint)` and an index on `(provider, provider_reference, received_at desc)`. The semantic fingerprint must be computed from normalized provider fields, for example:

```text
SHA-256(provider | reference | uuid | external_id | status | amount | currency | provider-network)
```

Store `raw_payload_hash` separately. This handles harmless JSON formatting differences while still detecting a conflicting payload for the same provider reference. A duplicate signed event returns an idempotent success response without invoking the posting bridge a second time. A signed event that conflicts with a previously accepted reference is durably marked `NEEDS_ATTENTION` and does not settle.

## 6. Service-only webhook bridge

Add a public service-role-only bridge that contains no browser-facing permissions:

```sql
public.bank_provider_webhook_tick(
  p_provider text,
  p_raw_body text,
  p_signature text,
  p_execution_id uuid default null,
  p_requested_by uuid default null
) returns jsonb
```

The bridge must be `SECURITY INVOKER`, use a pinned search path such as `pg_catalog, public, bank_private`, and execute only for `auth.role() = 'service_role'`. It should call the provider signature validator again, parse the provider-specific payload, and call a private implementation that performs the complete event-to-settlement transaction.

The private implementation must:

1. Validate that the provider is enabled for this integration environment.
2. Validate required PlusPesa fields and uppercase terminal status values.
3. Resolve `external_id` to exactly one provider transaction and tenant.
4. Lock the provider transaction, webhook reference, Standing Order run, payment instruction, and Standing Order rows in a consistent order.
5. Insert the webhook event idempotently. If the same semantic fingerprint exists, return `replayed=true` with the prior outcome. If the provider reference maps to a conflicting event, insert `NEEDS_ATTENTION` and do not settle.
6. Compare provider, amount, currency, `uuid`, and `reference` with the outbound transaction record. Any mismatch becomes `NEEDS_ATTENTION`; no balance or run state changes are allowed.
7. For `SUCCESS`, call the existing private `confirm_provider_payment` implementation through the service-only boundary with:

```text
p_run_id             = resolved standing-order run
p_provider_reference = PlusPesa reference
p_provider_status    = SUCCESS
p_provider_event_id  = deterministic semantic event key
p_idempotency_key    = provider + reference + semantic fingerprint
p_execution_id       = webhook execution UUID
p_requested_by       = null unless a controlled operator initiated reconciliation
```

8. For `FAILED`, call the same service-only confirmation path with the verified provider reference and `FAILED`. The existing private implementation records the failed run and applies the configured failure policy; it must not post a withdrawal.
9. Mark the webhook event `PROCESSED` only after the run, instruction, Standing Order, transaction, journal, Standing Order event, and audit write have committed. The settlement and event state must be one database transaction.
10. Include `executionPrincipal = 'pluspesa-webhook'`, provider, provider reference, event fingerprint, and execution UUID in redacted audit metadata.

The bridge must never accept a caller-supplied `company_id`, `transaction_id`, `journal_batch_id`, `status=POSTED`, or arbitrary transaction payload. Tenant identity is derived from the locked outbound correlation record.

## 7. Outbound collection correlation

The current service runner creates a payment instruction and leaves the run in `PENDING_PROVIDER`, but it does not yet call a provider API. The end-to-end rollout therefore needs a separate server-side dispatch step before webhook automation can be considered complete.

The dispatch contract should create the PlusPesa collection with:

```text
account_number = normalized destination MSISDN
amount        = exact integer TZS amount
currency      = TZS
external_id   = SM:SO:<run_uuid>
callback_url  = dedicated pluspesa-collection-webhook URL
```

For PlusPesa, the amount must be an integer according to the published API documentation. SMARTMANAGER must reject a fractional amount rather than round it silently. The outbound request must be made only by a server-side function or backend process with provider credentials in a secret store; no provider secret, API key, or callback secret may be sent to the browser.

After a successful acknowledgement, persist the PlusPesa `uuid` and `reference` in `bank_provider_transactions` and the existing payment-instruction data boundary, then keep the run `PENDING_PROVIDER`/`PROCESSING` until the callback or status query supplies terminal evidence. A lost acknowledgement must remain `UNKNOWN` and be reconciled by the provider status endpoint, not retried blindly with a new external reference.

## 8. Replay, duplicate, and out-of-order controls

PlusPesa’s public documentation does not expose a timestamp or event ID in the callback contract, so SMARTMANAGER must use the following controls instead:

| Threat or condition | Required response |
|---|---|
| Same signed body delivered twice | Same semantic fingerprint; return idempotent success; never post twice |
| Same reference with formatting-only body difference | Same normalized fingerprint; treat as duplicate after comparing normalized fields |
| Same reference with different amount, currency, external ID, UUID, or status | Persist conflict as `NEEDS_ATTENTION`; do not settle; return transport-level 200 after durable recording to avoid retry storms |
| Callback before outbound response is persisted | Keep event `RECEIVED`/`NEEDS_ATTENTION`; reconciliation worker retries correlation after the provider transaction is created; do not infer the run from free text |
| `FAILED` followed by `SUCCESS` | Apply a policy decision. Default is reject the late success and require manual review unless the provider’s documented state machine confirms that the transition is valid |
| `SUCCESS` followed by `FAILED` | Keep the run posted and record the later event as conflict/reversal candidate; never silently downgrade posted accounting |
| Provider reference reused across tenants | Treat as a global provider conflict; no tenant is allowed to claim it solely from callback data |
| Replay after secret rotation | Accept only if it verifies against an explicitly allowed previous key within the rotation window; keep the original fingerprint and audit key version |
| Duplicate delivery while a transaction is locked | Use row locks and idempotency; the second request returns the committed result or a transient 5xx if the first transaction is not yet durable |

## 9. Status-query fallback and reconciliation

The provider documentation describes `GET /collections/{reference}/status` as a fallback and recommends waiting about two minutes after collection creation before the first status query. It documents lowercase `processing`, `success`, and `failed` values for this endpoint.[1]

SMARTMANAGER should run a bounded reconciliation worker for provider transactions remaining `PROCESSING` or `UNKNOWN`. The worker must authenticate to PlusPesa server-side, use the stored provider `reference` rather than the provider `uuid`, and pass any verified terminal response through the same provider-event normalization and service-only settlement bridge. A status query is not allowed to bypass event idempotency or call `bank_private.confirm_provider_payment` directly.

The worker must use exponential backoff with a maximum attempt count, then mark the provider transaction `UNKNOWN`/`NEEDS_ATTENTION` and alert an authorized operator. It must not keep retrying a collection creation request, because that could produce duplicate customer prompts or withdrawals.

## 10. Response and operational semantics

The callback endpoint should return a small JSON response and no sensitive details:

| Condition | HTTP response | Durable action |
|---|---:|---|
| Wrong method | 405 | None |
| Missing/invalid HMAC | 401 | Minimal security log; do not store raw payload |
| Signed but malformed payload | 200 after durable rejection, or 400 only if the provider contract explicitly requires retry | Store redacted event as `REJECTED` |
| Signed duplicate already processed | 200 | Return prior outcome with `replayed=true` |
| Signed conflict | 200 | Store `NEEDS_ATTENTION`; no financial mutation |
| Signed valid `SUCCESS`/`FAILED` and bridge committed | 200 | Event processed and run transitioned |
| Temporary database/service outage before durable event recording | 500/503 | No false acknowledgement; allow provider retry |

Every accepted callback should be observable through metrics or logs for: verified events, invalid signatures, duplicate events, conflicts, uncorrelated external IDs, amount/currency mismatches, settlement failures, provider status-query attempts, and callback latency. Alert on any verified `SUCCESS` that remains unprocessed, any reference conflict, and any increase in invalid signatures after secret rotation.

## 11. Tests required before production enablement

The adapter must not be enabled after only a happy-path unit test. Required tests are:

| Test class | Required cases |
|---|---|
| Cryptography | Valid raw-body HMAC; invalid signature; missing header; uppercase/lowercase digest normalization; altered whitespace; altered key order; altered amount; constant-time comparison path |
| Parser | Valid PlusPesa `SUCCESS`; valid `FAILED`; lowercase status rejected or normalized only according to the documented webhook contract; missing reference; missing external ID; invalid amount/currency/provider |
| Correlation | Unknown external ID; duplicate external ID across tenants; provider UUID/reference mismatch; amount mismatch; currency mismatch; reference conflict |
| Idempotency | Exact duplicate; normalized duplicate with different JSON formatting; concurrent duplicate callbacks; reused idempotency key with different fingerprint |
| State machine | `PENDING_PROVIDER → POSTED`; `PENDING_PROVIDER → FAILED`; already posted replay; late success after failed; late failure after posted; end-date completion; retry policy behavior |
| Accounting | Exactly one bank transaction, one journal batch, balanced debit/credit, one payment-instruction confirmation, and no duplicate balance decrement |
| Security | Anonymous caller cannot execute the bridge; authenticated browser role cannot execute the bridge; service role without valid provider signature cannot settle; no secret values in logs or responses; tenant cannot be selected from callback input |
| Recovery | Provider retry after 5xx; database timeout; event saved but settlement failed; status-query recovery; secret rotation overlap and expiry |
| Live sandbox | Provider-supplied callback fixture and an actual sandbox transaction, with a dedicated test company/account and explicit financial test approval |

Production release gates are: official provider approval of the callback URL and signing setup; a verified sandbox callback; passing signature and concurrency tests; a controlled test tenant with a non-production account; observed event and audit traces; rollback tested; and an explicit approval to enable the provider adapter. Until those gates pass, all mobile-money runs remain pending or use the existing manual reconciliation path.

## 12. Migration and rollout sequence

1. Confirm the actual provider. If it is not PlusPesa, obtain the provider’s official authenticated API/webhook specification and replace this adapter contract before implementation.
2. Add provider configuration metadata without secrets: provider name, environment, callback URL, supported currencies, amount scale, status map, and enabled flag. Keep the flag disabled by default.
3. Add provider transaction and webhook event tables with tenant-safe foreign keys, unique constraints, indexes, RLS policy review, and append-only event behavior.
4. Add the Vault-backed provider signature validator and exact service-only grants. Verify the live `pgcrypto` function signature in migration tests.
5. Implement the PlusPesa-specific Edge Function using raw-body verification and bounded structured logging.
6. Implement the service-only webhook bridge and private atomic event-to-settlement routine. Do not revoke the old authenticated compatibility grants yet.
7. Implement outbound PlusPesa dispatch and status-query reconciliation through server-side credentials. Persist `uuid`, `reference`, and `external_id` before relying on callbacks.
8. Run all unit, integration, concurrency, RLS, and provider sandbox tests with a dedicated test tenant.
9. Enable the adapter for one controlled test tenant, observe verified callbacks, database events, journal linkage, and provider reports, then expand gradually.
10. Keep a kill switch that disables new provider submissions while allowing already-created events to be reconciled. A provider outage must not cause duplicate collection creation.
11. Only after a stable observation period should the server/router cutover remove the remaining authenticated provider-confirmation compatibility route. The old grants must remain until all application callers no longer depend on them and a controlled financial workflow proves the replacement path.

## 13. What is not claimed

This design does not claim that PlusPesa is SMARTMANAGER’s configured provider, that a PlusPesa merchant account or callback secret exists, that the outbound collection API is deployed, or that automated settlement is currently active. It also does not claim that direct M-Pesa, Airtel Money, Mixx by Yas, HaloPesa, or any other provider uses the PlusPesa HMAC contract. Provider-specific cryptographic behavior must be confirmed from the selected provider’s authenticated documentation and sandbox fixtures before production activation.

## References

[1]: https://docs.pluspesa.com/ PlusPesa Collections API documentation, including collection creation, webhooks, HMAC-SHA256 signature verification, retries, and status-query fallback.

[2]: https://supabase.com/docs/guides/functions/auth Supabase, “Securing Edge Functions,” including external webhook raw-body signature verification and the responsibility created by disabling platform JWT checks.

[3]: https://supabase.com/docs/guides/database/vault Supabase, “Vault,” including encrypted secret storage and protection requirements for the decrypted secrets view.

## Project research record

The related provider research record is `docs/standing-order-provider-webhook-research.md`. It records that the live SMARTMANAGER database has no selected provider rows and that public Vodafone M-Pesa, Airtel Africa, and Mixx by Yas pages do not expose enough authenticated callback-signature details to safely invent a direct-provider algorithm.

**Author:** Manus AI
