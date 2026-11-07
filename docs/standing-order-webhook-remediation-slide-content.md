# SMARTMANAGER Webhook Remediation and Dead-Letter Drainage

## Slide 1 — Title and current status

Automated remediation design for provider webhook quarantine floods and dead-letter drainage. Current state: webhook event migration 013, remediation control plane 014, and hardening migration 015 applied to Supabase; worker implementation is committed locally but production drainage remains disabled.

## Slide 2 — Why remediation exists

Explain that provider retries, invalid correlation, provider-reference conflicts, and processing failures can create a quarantine backlog. The system must preserve immutable evidence, avoid duplicate financial posting, and recover only through the normal service-only settlement path. Explicitly distinguish harmless exact replays from suspicious identity conflicts.

## Slide 3 — Control-plane architecture

Show the flow: verified provider callback → immutable event evidence → mutable processing cursor → remediation classifier → safe requeue or quarantine → normal service-only processor → exactly-once financial confirmation. Show drain runs, provider-account pause control, and audit metadata beside the flow. State that the worker never writes balances, journals, bank transactions, or Standing Order status directly.

## Slide 4 — Advisory locking and bounded leases

Show provider-account advisory lock around drain-run creation and `FOR UPDATE OF p, r SKIP LOCKED` around queue leasing. Explain that one active drain run is allowed per provider account, leases expire, batches are capped at 10 internally and 100 per run, and stale leases are reconciled rather than blindly replayed.

## Slide 5 — Classification and dead-letter handling

Use a two-column safe/quarantine visual. Safe: `SAFE_RETRY` and `SAFE_RECONCILE`, only after exact trusted identity, amount, currency, status, and accounting preflight. Quarantine: `CONFLICT`, `FIELD_MISMATCH`, `UNCORRELATED`, `PROVIDER_UNKNOWN`, `SECRET_SUSPECTED`, and `ALREADY_SETTLED`. Show that exact duplicates become `DUPLICATE` and never repost.

## Slide 6 — Two-person production authorization

Show requester → approval request → independent approver → final execution token → worker. Include three distinct 32-byte CSPRNG tokens: request token, approver token, final execution token. Store only SHA-256 lowercase digests. Bind approval to provider/account/environment/mode/caps/requester, expire production approval within 15 minutes, consume the final token once, and require distinct operator identities.

## Slide 7 — Drain procedure and circuit breakers

Show dry run → requeue-only → test-tenant safe settlement → small production drain. Include hard stops: any duplicate posting, identity/amount/currency mismatch, new conflict, provider status inconsistency, lease churn, timeout/error threshold, approval problem, or cap reached. Keep evidence intake enabled while settlement for the affected provider account is paused.

## Slide 8 — Deployment status and next gates

Verified: migrations applied, live dry-run control-plane smoke succeeded, service-only grants and RLS boundaries present, local Python and Vitest validation passed. Not yet enabled: provider-specific webhook adapter, production worker schedule, real due-order settlement, and provider webhook automation. Next gates: confirm provider, run disposable concurrency tests, add metrics/alerts, validate sandbox fixtures, rehearse a test tenant, then obtain two-person approval for any production drain.
