# Standing Order Webhook Local Load-Test Report

**Date:** 2026-08-25  
**Backend:** Disposable SQLite emulator  
**Workload:** 250 exact duplicate claims and 250 conflicting-provider-identity claims at each concurrency level: 10, 25, 50, and 100.

## Scope and limitation

This benchmark ran locally because no staging Supabase endpoint or service-role credential was available. It did not contact Supabase, production, or any external provider. The local backend used a named process-local mutex per provider account plus SQLite transactions to emulate the serialization boundary. SQLite does not implement PostgreSQL `pg_advisory_xact_lock`; therefore these values are **algorithmic regression metrics**, not PostgreSQL or staging capacity measurements.

No settlement routine was invoked. All data was synthetic and stored in temporary SQLite files that the harness removed after each run.

## Results

| Concurrency | Duplicate p50 / p95 / p99 latency (ms) | Duplicate emulated lock-wait p50 / p95 / p99 (ms) | Conflict p50 / p95 / p99 latency (ms) | Conflict emulated lock-wait p50 / p95 / p99 (ms) |
|---:|---:|---:|---:|---:|
| 10 | 0.23 / 22.47 / 63.19 | 0.0006 / 22.1580 / 62.8455 | 0.26 / 28.00 / 53.78 | 0.0006 / 27.6163 / 53.4575 |
| 25 | 0.23 / 62.36 / 81.72 | 0.0006 / 61.9862 / 81.3050 | 0.27 / 61.70 / 90.70 | 0.0006 / 61.2418 / 90.3419 |
| 50 | 0.25 / 83.64 / 88.44 | 0.0007 / 83.3325 / 88.0622 | 0.27 / 86.43 / 93.32 | 0.0007 / 86.0598 / 92.9261 |
| 100 | 0.35 / 96.30 / 101.18 | 0.0008 / 96.0242 / 100.6391 | 0.44 / 103.61 / 107.18 | 0.0008 / 103.2669 / 106.8488 |

## Correctness outcomes

All four runs passed the duplicate and conflict invariants. For each duplicate batch, there was exactly one durable event identity, 249 replay responses, zero conflicts, and zero errors. For each conflict batch, all 250 responses referenced the original event identity and were marked `NEEDS_ATTENTION`; no conflicting identity was processed as a normal event.

The local run therefore validates the intended concurrency algorithm at the emulator level: serializing callbacks by provider account prevents duplicate event creation and makes conflicting provider-identity reuse deterministic.

## Interpretation

The dominant effect is serialized lock waiting: median lock wait remained below 0.001 ms, while the p95 wait increased from approximately 22 ms at concurrency 10 to approximately 96–103 ms at concurrency 100. This is expected for a single provider-account mutex under a deliberately hot-key workload in a local threaded process. It demonstrates that the test can expose contention, but it does not establish production throughput, PostgreSQL lock behavior, network latency, or Supabase resource limits.

Before production rollout, the same workload should be repeated in an isolated staging Supabase project using the real `bank_provider_webhook_claim` bridge, with database-side lock-wait and transaction metrics collected separately. Production webhook settlement must remain disabled until that staging test and provider-specific cryptographic callback tests pass.

## Reproduction

```bash
python3 scripts/standing_order_webhook_load_test.py \
  --environment local \
  --local-sqlite \
  --mode both \
  --requests 250 \
  --concurrency 100 \
  --output /tmp/standing-order-webhook-local-report.json
```

The matrix used the same command with concurrency values `10`, `25`, `50`, and `100`.
