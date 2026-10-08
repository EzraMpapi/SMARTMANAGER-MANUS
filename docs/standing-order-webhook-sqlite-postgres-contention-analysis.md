# Standing Order Webhook Contention Analysis

**Date:** 2026-08-25  
**Measured backend:** Disposable local SQLite emulator with a process-local provider-account mutex  
**PostgreSQL status:** Analytical comparison only; no PostgreSQL server was available for an identical benchmark.

## Executive conclusion

The measured SQLite workload is dominated by the deliberately emulated provider-account mutex, not by SQLite transaction execution. At 100 concurrent callers with no injected jitter, the mutex accounts for approximately **99% of mean end-to-end latency** in the hot-key workloads. SQLite `BEGIN IMMEDIATE` acquisition remained below 0.21 ms at the p95 in the tested configurations, while SQLite transaction work remained below 0.8 ms at p95. This means the benchmark is primarily measuring serialized hot-key queueing in the Python process.

Injected network jitter changes arrival timing before the mutex. With a 10–50 ms deterministic jitter range at concurrency 100, the p95 mutex wait fell to approximately 31–37 ms, while p95 end-to-end latency remained approximately 76–83 ms. The jitter does not improve the lock itself; it spreads arrivals and reduces synchronized queue formation while adding deliberate delay to each request.

## Measured matrix

Each configuration executed an exact-duplicate batch and a conflicting-provider-identity batch. Each batch had one durable event identity, no errors, and passed its replay/conflict invariant.

| Batch | Concurrency | Jitter | Workload | Latency p95 | Emulated lock wait p95 | SQLite transaction work p95 | Approx. mean lock share |
|---:|---:|---:|---|---:|---:|---:|---:|
| 50 | 25 | 0 ms | Duplicate | 20.54 ms | 20.2197 ms | 0.4781 ms | 95.54% |
| 50 | 25 | 0 ms | Conflict | 22.97 ms | 22.6014 ms | 0.7231 ms | 95.39% |
| 250 | 100 | 0 ms | Duplicate | 119.18 ms | 118.8292 ms | 0.5356 ms | 98.94% |
| 250 | 100 | 0 ms | Conflict | 121.04 ms | 120.6926 ms | 0.7807 ms | 98.96% |
| 250 | 100 | 10–50 ms | Duplicate | 76.48 ms | 31.2023 ms | 0.5382 ms | 40.33% |
| 250 | 100 | 10–50 ms | Conflict | 77.89 ms | 32.7950 ms | 0.5487 ms | 41.68% |
| 500 | 100 | 10–50 ms | Duplicate | 79.33 ms | 33.9683 ms | 0.5520 ms | 46.20% |
| 500 | 100 | 10–50 ms | Conflict | 83.05 ms | 37.2962 ms | 0.5925 ms | 49.80% |
| 1000 | 250 | 0 ms | Duplicate | 391.46 ms | 391.0031 ms | 0.5266 ms | 99.61% |
| 1000 | 250 | 0 ms | Conflict | 404.76 ms | 404.2706 ms | 0.5027 ms | 99.62% |

The highest observed hot-key contention was the 1,000-request, 250-concurrent no-jitter run. Its p99 emulated lock wait was 414.3515 ms for duplicates and 421.0190 ms for conflicts. The transaction work p99 remained 1.5549 ms and 1.4346 ms respectively, confirming that queueing—not the SQLite indexed lookup/insert/commit path—was the dominant measured cost.

## Exact SQLite bottlenecks

The first bottleneck is the process-local named mutex keyed by `provider:provider_account_key`. Because every request in the workload uses the same key, the mutex creates one serial queue. This is intentional and models the application-level meaning of the production provider-account advisory lock. It also means the local benchmark cannot expose parallelism between different provider accounts.

The second bottleneck is request arrival synchronization. With zero jitter, 100 or 250 worker threads become runnable together and queue on the same mutex. The resulting p95 wait grows sharply with concurrency. Adding 10–50 ms of pre-lock jitter spreads arrivals, reducing p95 mutex wait even though each request receives extra delay. This is a workload-shaping effect, not a database optimization.

The third potential bottleneck is SQLite’s single-writer boundary. The emulator enables WAL mode and then opens `BEGIN IMMEDIATE` after acquiring the process-local mutex. SQLite’s WAL mode allows readers and a writer to proceed concurrently, but only one writer can exist at a time [2]. Because the mutex already permits only one local claim into the transaction path, the measured `BEGIN IMMEDIATE` p95 stays near 0.2 ms. A multi-process benchmark without the shared Python mutex would likely expose SQLite writer contention, busy handling, and filesystem scheduling that this run intentionally suppresses.

The fourth cost is normal SQLite transaction work: indexed replay lookup, provider-identity lookup, optional conflict update or insert, and commit. Its p95 stayed below 0.8 ms for all reported configurations, so it is not the limiting component in this synthetic local environment. This result should not be generalized to a larger database, slower disk, `synchronous=FULL`, checkpoint-heavy workloads, or a network filesystem.

## PostgreSQL `pg_advisory_xact_lock` contrast

The deployed design uses a transaction-level PostgreSQL advisory lock for the provider/account scope. PostgreSQL documents transaction-level advisory locks as automatically released at transaction end, without an explicit unlock operation [1]. Requests for the same lock identifier block each other, while requests for different identifiers can proceed independently. This gives PostgreSQL a server-coordinated hot-key queue across all database sessions and application instances, whereas the local emulator coordinates only threads in one Python process.

| Dimension | Local SQLite emulator | Expected PostgreSQL behavior |
|---|---|---|
| Lock owner | Python process-local mutex | PostgreSQL lock manager across sessions and hosts |
| Same provider account | One local serial queue | One database-wide serial queue for the same advisory key |
| Different provider accounts | Not exercised; separate mutexes would run concurrently within one process | Can run concurrently subject to database/server resources |
| Release | Python `finally` block | Automatic at transaction end for `pg_advisory_xact_lock` [1] |
| Observability | Per-request measured mutex wait in the emulator | Inspectable through PostgreSQL lock views such as `pg_locks` [1] |
| Database write behavior | SQLite WAL with a single writer [2] | PostgreSQL MVCC, row/index locks, WAL, and shared server resources |
| Cross-instance safety | Not provided by a process-local mutex | Provided when all callers use the same advisory-key derivation |
| Network cost | No network hop; local thread scheduling | Supabase HTTP/client connection, pool, server execution, and response latency |
| Failure mode | Python exception or SQLite error | Transaction abort, lock timeout/statement timeout policy, deadlock detection where applicable, or connection failure |

Under identical concurrency and one provider/account key, PostgreSQL should exhibit the same **logical serialization invariant**: one caller enters the protected critical section at a time, and duplicate/conflicting identity checks become deterministic. The numeric latency cannot be predicted from this SQLite run. PostgreSQL may have lower database-side contention than SQLite’s single-writer model for unrelated keys, but the measured request latency will include network, connection-pool, server CPU, index/WAL I/O, and transaction scheduling. A PostgreSQL advisory lock is also only advisory: every trusted caller must use the same key and honor the contract [1].

The current benchmark therefore supports a precise conclusion: the service design’s hot-key serialization can create a queue under duplicate floods, and the queue is visible in p95/p99 wait. It does **not** establish a PostgreSQL capacity limit or prove that Supabase will match the measured numbers.

## Recommended PostgreSQL staging benchmark

The next valid comparison requires a disposable PostgreSQL or Supabase staging project with the applied migration. Run the same duplicate and conflict workloads using the real `public.bank_provider_webhook_claim` bridge, while collecting request latency, transaction duration, lock wait, database CPU, connection-pool saturation, errors, and `pg_locks` snapshots. Use at least two independent client processes or hosts to prove that serialization is database-wide rather than process-local.

The staging run should include both a hot-key workload and a mixed-key workload. The hot-key workload measures worst-case provider-account serialization. The mixed-key workload measures whether separate provider accounts proceed in parallel. It should also test a bounded lock/statement timeout policy, because an unbounded waiting request can amplify a provider retry storm. No production financial settlement should be enabled for this capacity test; use synthetic, non-settling claim evidence only.

## References

[1]: https://www.postgresql.org/docs/current/explicit-locking.html "PostgreSQL 18: Explicit Locking — Advisory Locks"
[2]: https://www.sqlite.org/wal.html "SQLite: Write-Ahead Logging — Concurrency and Performance Considerations"
