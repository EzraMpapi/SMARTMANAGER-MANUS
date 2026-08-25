# SMARTMANAGER Provider Webhook Security Runbook

**Scope:** Detection and response for replay attacks, provider-identity conflicts, signature failures, correlation failures, and quarantine floods affecting automated Standing Order settlement.

**Status:** Operational design only. The webhook migration, provider adapter, and alert rules are not deployed.

**Initial target:** PlusPesa adapter, only if PlusPesa is confirmed as the merchant’s actual provider. The thresholds below are conservative starting values and must be recalibrated after 14 days of measured sandbox and controlled production volume.

## 1. Operating principles

A provider webhook is untrusted until its raw request body passes the provider-specific cryptographic validator. A valid signature proves possession of the provider callback secret; it does not prove that the callback is correct for the tenant, Standing Order run, amount, currency, or lifecycle state. Those checks occur after durable event capture and before the service-only settlement bridge.

The system must fail closed. Invalid signatures are rejected and never settle. Authenticated duplicate callbacks are recorded as replay attempts in metrics and return the original durable outcome without invoking financial posting a second time. Provider-reference reuse with a different semantic fingerprint is retained as a conflict and quarantined. No operator may repair a quarantine by directly editing balances, bank transactions, journals, or Standing Order status.

The current event schema stores one immutable evidence row per semantic event. Therefore, exact replay attempts are not visible from the database row count alone: the Edge Function must emit a counter for every authenticated claim call and whether it returned `replayed=true`. If durable replay-attempt history is required for forensic retention, add a separate append-only attempts table in a follow-up migration; do not mutate immutable evidence rows to increment counters.

## 2. Security event taxonomy

| Code | Event | Default severity | Financial risk |
|---|---|---:|---|
| `WH_SIG_INVALID` | Missing, malformed, or invalid provider signature | SEV-3; SEV-2 at threshold | Requests cannot settle, but a secret compromise or endpoint probing may be underway |
| `WH_REPLAY_BURST` | High volume of authenticated duplicate fingerprints or repeated claims | SEV-2 | Usually no duplicate posting, but indicates credential compromise, provider retry storm, or abuse |
| `WH_REFERENCE_CONFLICT` | Same provider reference/UUID/event identity appears with a different semantic fingerprint | SEV-2 immediately | Possible tampering, provider defect, account mix-up, or attempted payment substitution |
| `WH_QUARANTINE_FLOOD` | `CONFLICT` or `NEEDS_ATTENTION` events accumulate above queue capacity | SEV-2; SEV-1 if settlement controls are bypassed or backlog threatens SLA | Valid settlements may be held; unsafe manual processing pressure may arise |
| `WH_UNCORRELATED` | Authenticated event has no trusted outbound provider transaction | SEV-3; SEV-2 at threshold | Settlement is blocked, but events may require reconciliation |
| `WH_PROCESSING_STALL` | Claimed events remain `RECEIVED`, `PROCESSING`, or `FAILED` beyond the allowed age | SEV-2 | Valid collections may remain pending and provider retries may increase |
| `WH_SECRET_ROTATION` | Signature verification changes from active to previous key or fails after rotation | SEV-2 during change window | Can indicate stale provider configuration or secret compromise |

## 3. Required telemetry

The webhook Edge Function must emit structured, aggregation-safe metrics and logs. Labels must contain only `provider`, non-secret `provider_account_key`, deployment environment, outcome, and key version. Do not label metrics with provider reference, UUID, client reference, company ID, MSISDN, raw body, signature, or secret; high-cardinality or sensitive labels create both privacy and operational risk.

| Metric | Type | Required labels | Meaning |
|---|---|---|---|
| `standing_order_webhook_requests_total` | Counter | `provider`, `account`, `outcome` | `accepted`, `replay`, `conflict`, `uncorrelated`, `rejected`, `error` |
| `standing_order_webhook_signature_total` | Counter | `provider`, `account`, `result`, `key_version` | `valid`, `invalid`, `missing`, `malformed` |
| `standing_order_webhook_claim_duration_seconds` | Histogram | `provider`, `account`, `outcome` | Claim latency, excluding provider network time |
| `standing_order_webhook_quarantine_total` | Counter | `provider`, `account`, `reason` | `reference_conflict`, `field_mismatch`, `uncorrelated`, `processing_failure` |
| `standing_order_webhook_settlement_total` | Counter | `provider`, `account`, `result` | `posted`, `failed`, `duplicate`, `blocked` |
| `standing_order_webhook_processing_oldest_seconds` | Gauge | `provider`, `account`, `status` | Age of oldest `RECEIVED`, `FAILED`, or `NEEDS_ATTENTION` item |
| `standing_order_webhook_replay_fingerprint_attempts_total` | Counter | `provider`, `account` | Every authenticated callback that resolves to an existing semantic fingerprint |
| `standing_order_webhook_reference_conflict_total` | Counter | `provider`, `account` | Any different fingerprint reusing a provider identity |

The application log event should include `executionId`, `provider`, `providerAccountKey`, `outcome`, `keyVersion`, `eventId` when available, a truncated or hashed provider identity, and duration. It must not include the raw request body, complete signature, callback secret, API credentials, customer PIN, or complete MSISDN.

## 4. Initial alert thresholds

The thresholds below operate per provider account unless stated otherwise. `N` means the event count in the stated window. Ratio alerts require at least the stated minimum denominator to avoid paging on very small volumes.

| Alert | Warning | Critical/page | Automatic action |
|---|---|---|---|
| Invalid signatures | `N >= 5` in 5 minutes **or** invalid ratio `>= 2%` with at least 50 requests in 15 minutes | `N >= 20` in 5 minutes **or** invalid ratio `>= 10%` with at least 50 requests in 15 minutes | Keep valid callbacks flowing; apply edge rate limiting. Disable the affected provider account only if critical persists for 10 minutes or provider confirms compromise |
| Exact replay burst | Replay ratio `>= 20%` over 10 minutes with at least 10 verified callbacks | Replay ratio `>= 50%` over 5 minutes with at least 50 verified callbacks, **or** one fingerprint receives `>= 10` attempts in 1 minute | Do not repost. Page security and MFI operations; consider account-level settlement pause if critical persists |
| Provider-reference conflict | `N >= 1` in 15 minutes | Any conflict that changes amount, currency, client reference, provider UUID, or terminal status; or `N >= 3` in 15 minutes | Immediately quarantine the event. Pause automated settlement for that provider account pending review; never auto-retry the conflicting event |
| Quarantine flood | `CONFLICT + NEEDS_ATTENTION >= 25` open items or oldest open item `>= 15` minutes | `>= 100` open items or oldest open item `>= 30` minutes | Pause the affected provider account, keep authenticated evidence capture enabled, and start reconciliation incident |
| Quarantine rate | `>= 10` quarantines in 15 minutes or `>= 5%` of verified callbacks with at least 100 callbacks | `>= 50` in 15 minutes or `>= 20%` with at least 100 callbacks | Same as quarantine flood; inspect provider deployment and correlation records |
| Uncorrelated events | `>= 10` in 15 minutes or `>= 5%` of verified callbacks with at least 100 callbacks | `>= 50` in 15 minutes or `>= 20%` with at least 100 callbacks | Do not infer a run; inspect outbound persistence/acknowledgement path and status-query reconciliation |
| Processing stall | Oldest `RECEIVED`/`FAILED` item `>= 10` minutes or `>= 3` failures in 10 minutes | Oldest item `>= 30` minutes or `>= 10` failures in 10 minutes | Pause settlement worker for the affected account if accounting outcomes are uncertain; retain events for retry |
| Previous-key use | Any use outside an approved rotation window | Any previous-key use after its expiry or any signature failure immediately after rotation | Freeze secret rotation changes; verify provider configuration and Vault metadata; rotate only after evidence review |
| Settlement mismatch | Any provider callback amount/currency mismatch | Any mismatch paired with a provider-reference conflict or any attempted post | Block settlement and page immediately; no manual balance correction |

These are starting thresholds, not provider guarantees. Tune them using measured per-account baselines after the first controlled observation period. Never lower the reference-conflict or settlement-mismatch threshold below one authenticated event.

## 5. Alert grouping and deduplication

Group alerts by `provider`, `provider_account_key`, environment, and alert code. Suppress duplicate notifications for the same group for 15 minutes, but do not suppress `WH_REFERENCE_CONFLICT` events that introduce a new provider reference or a new amount/currency mismatch. A single provider account may be paused independently; do not disable all mobile-money providers for a localized problem unless evidence shows a shared application or credential failure.

The minimum notification route is an on-call engineering channel, the MFI/finance operations owner, and the security owner for SEV-2 or higher. A SEV-1 condition is declared when an unverified or conflicting callback reaches a financial posting routine, when duplicate financial posting is detected, or when the quarantine backlog prevents safe operation across multiple provider accounts.

## 6. First five minutes of response

### 6.1 Acknowledge and classify

Record the alert code, first-seen time, provider account, affected environment, current deployment version, and whether any settlement transaction was posted during the alert window. Check the metric denominator before interpreting ratios. Do not paste raw webhook bodies, signatures, secrets, or customer phone numbers into the incident channel.

### 6.2 Apply the least disruptive containment

For invalid signatures alone, continue accepting valid signed callbacks while rate-limiting repeated invalid requests. For a replay burst, do not delete or reject valid duplicates solely because they are duplicates; the idempotency branch is the safety control. For a provider-reference conflict, quarantine the event and pause automated settlement for that provider account. For a quarantine flood or processing stall, pause the affected account’s settlement worker and preserve the intake path so authenticated events remain durable.

The pause must be applied through the approved provider-account control plane or feature flag. Do not revoke database grants, drop indexes, truncate event tables, or edit balances during incident containment. Do not rotate the callback secret solely because of a provider retry storm; rotate it only when provider evidence, secret exposure, or sustained invalid-signature behavior supports compromise.

### 6.3 Establish financial safety

Query the settlement audit trail for the alert window and verify that each provider reference maps to zero or one bank transaction. If any reference maps to more than one posting, declare SEV-1, stop all affected settlement, preserve evidence, and begin accounting reconciliation. If no duplicate posting exists, keep the affected events quarantined and proceed with identity and provider-status investigation.

## 7. Read-only triage queries

The following queries are diagnostic examples for the deployed schema. Run them with a bounded time window and a read-only role. Do not run them against production unless the incident owner has approved the query. The examples intentionally return only identifiers, counts, status, hashes, and timestamps; they do not retrieve raw payloads or secrets.

### 7.1 Quarantine backlog and age

```sql
select
  e.provider,
  e.provider_account_key,
  p.processing_status,
  count(*)::bigint as item_count,
  min(p.updated_at) as oldest_updated_at
from public.bank_provider_webhook_processing p
join public.bank_provider_webhook_events e on e.id = p.event_id
where p.processing_status in ('NEEDS_ATTENTION', 'FAILED', 'RECEIVED', 'PROCESSING')
  and p.updated_at >= now() - interval '24 hours'
group by e.provider, e.provider_account_key, p.processing_status
order by oldest_updated_at asc
limit 100;
```

### 7.2 Recent reference conflicts

```sql
select
  e.id,
  e.provider,
  e.provider_account_key,
  e.provider_reference,
  e.provider_uuid,
  e.client_reference,
  e.raw_payload_hash,
  e.semantic_fingerprint,
  e.received_at,
  p.processing_status
from public.bank_provider_webhook_events e
join public.bank_provider_webhook_processing p on p.event_id = e.id
where e.ingest_outcome = 'CONFLICT'
  and e.received_at >= now() - interval '24 hours'
order by e.received_at desc
limit 100;
```

### 7.3 Provider identity reuse

```sql
select
  provider,
  provider_account_key,
  provider_reference,
  count(*)::bigint as event_count,
  count(distinct semantic_fingerprint)::bigint as fingerprint_count,
  min(received_at) as first_seen,
  max(received_at) as last_seen
from public.bank_provider_webhook_events
where provider_reference is not null
  and received_at >= now() - interval '24 hours'
group by provider, provider_account_key, provider_reference
having count(distinct semantic_fingerprint) > 1
order by last_seen desc
limit 100;
```

### 7.4 Uncorrelated authenticated events

```sql
select
  provider,
  provider_account_key,
  count(*)::bigint as uncorrelated_count,
  min(received_at) as first_seen,
  max(received_at) as last_seen
from public.bank_provider_webhook_events
where company_id is null
  and signature_verified = true
  and received_at >= now() - interval '24 hours'
group by provider, provider_account_key
order by uncorrelated_count desc
limit 100;
```

### 7.5 Posted transactions in the incident window

Use the project’s existing bank transaction and audit-event contract to correlate provider reference, run ID, and journal batch. Do not assume column names not present in the live schema. The query must be tailored after inspecting the live audit contract and must return only transaction IDs, run IDs, provider references, amounts, currencies, and creation times.

## 8. Replay-attack triage

A high duplicate rate is not automatically an attack. Providers may retry callbacks after timeouts, and a correctly idempotent endpoint should treat those retries as harmless. Distinguish a provider retry storm from a replay attack using four signals: whether the signature validates, whether the exact raw-body hash repeats, whether the semantic fingerprint repeats, and whether the source deployment/provider account changed.

A likely provider retry storm has valid signatures, the same raw-body and semantic fingerprint, a recent latency or 5xx incident, and no field changes. A likely replay attack has valid signatures but unusually high volume, attempts outside the expected provider delivery window, repeated fingerprints across many references, key-version anomalies, or conflicts where a provider identity is reused with changed amount/currency/reference fields. An invalid-signature flood is evidence of probing or misconfiguration, not a replay that can be safely processed.

Do not attempt to block based solely on IP address. IP addresses can change, be shared, or be hidden by provider infrastructure. Use provider-account controls, signature validation, rate limits, semantic idempotency, and provider-side delivery logs.

## 9. Quarantine-flood triage

A quarantine flood means the system is protecting the ledger but cannot safely complete normal settlement. First classify the dominant reason: provider-reference conflict, amount/currency mismatch, missing outbound correlation, malformed signed payload, or processing failure. If most items share one deployment version or one provider account, pause that account rather than all providers. If events are uncorrelated, inspect whether the outbound provider transaction was persisted before the provider callback arrived; do not resolve correlation from a customer phone number or an operator-supplied company ID.

If the provider confirms a duplicate delivery or corrected payload, preserve the original evidence and process only through the approved reconciliation routine. A quarantine may be cleared only when an authorized operator can document the provider reference, provider status, exact amount, currency, client reference, tenant/run, and resulting accounting transaction. Every release must be idempotent and auditable.

## 10. Secret-rotation procedure

Secret rotation is a controlled change, not a first response to every alert. Confirm whether the provider supports overlapping callback secrets. If it does, provision the new secret as active, retain the previous secret only until the documented expiry, record the non-secret key version, test a provider sandbox callback, and monitor `WH_SECRET_ROTATION`. If it does not, schedule a short maintenance window, update the provider and Vault in the documented order, send a sandbox callback, and confirm invalid old signatures are rejected.

Never print or copy the callback secret into an incident ticket. Do not store it in event payloads, logs, migration files, source control, or client-visible configuration. After rotation, inspect only key-version counts and verification outcomes.

## 11. Recovery and closure gates

Automated settlement for a paused provider account may resume only after all of the following are true:

1. The provider or gateway owner has confirmed whether the event pattern was a retry storm, configuration problem, provider defect, or security incident.
2. No invalid-signature or reference-conflict critical alert has fired for at least 30 minutes after containment, or the security owner has approved an alternative evidence-based decision.
3. The open quarantine backlog is zero, or every remaining item has a documented owner, known provider reference, and explicit manual-review status. No item older than the approved operational SLA may be silently skipped.
4. The settlement audit check confirms no duplicate bank transaction or journal batch was created for a provider reference.
5. A controlled sandbox or test-tenant callback passes signature, correlation, idempotency, amount, currency, and service-only settlement checks.
6. The provider-account enablement change is approved by two people: one engineering/service owner and one MFI/finance operations owner.
7. The incident record contains the alert timeline, thresholds reached, containment action, evidence hashes/IDs, provider communication, financial impact assessment, and follow-up actions.

If a callback secret may have been exposed, do not resume until rotation is complete and the provider confirms the new callback configuration. If duplicate posting occurred, keep settlement disabled and escalate to the accounting and compliance owners; do not repair by ad hoc SQL.

## 12. Post-incident improvements

After every SEV-2 or SEV-1 event, review the 14-day baseline and adjust thresholds only with evidence. Consider adding the append-only `bank_provider_webhook_attempts` table if replay-attempt forensic detail cannot be retained adequately in metrics. Add provider-specific delivery IDs and timestamp checks only when the provider publishes them. Add provider status-query reconciliation metrics and a dashboard panel showing provider transaction state against webhook processing state.

The operational design must remain compatible with the existing service-only settlement bridge. Legacy authenticated provider-confirmation grants must not be revoked as an incident response; they may be removed only after the separate server broker/router cutover and controlled observation period are complete.

## References

[1]: https://docs.pluspesa.com/ PlusPesa Collections API documentation, including callback fields, HMAC-SHA256 signature verification, delivery retry behavior, and status-query fallback.

[2]: https://supabase.com/docs/guides/functions/auth Supabase, “Securing Edge Functions,” including raw-body external webhook verification and the responsibility created by disabling platform JWT checks.

[3]: https://supabase.com/docs/guides/database/vault Supabase, “Vault,” including encrypted secret storage and protection of decrypted secret access.

**Author:** Manus AI
