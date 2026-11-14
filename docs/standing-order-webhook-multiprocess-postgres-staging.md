# Standing-Order Webhook Multi-Process and PostgreSQL Staging Benchmark

**Author:** Manus AI  
**Purpose:** Validate cross-process database contention using independent connections, then measure real `pg_advisory_xact_lock` waits in a disposable PostgreSQL staging environment.

## Scope and safety boundary

This package tests only synthetic webhook-evidence claims. It does not call the production webhook endpoint, invoke settlement, post ledger entries, drain remediation queues, or mutate the live Supabase project. The PostgreSQL path is intentionally fail-closed unless `--environment staging` is supplied. The container provisioning script additionally requires `ENVIRONMENT=staging`, a disposable password, and a local Docker PostgreSQL service; it refuses DSNs that look like the managed Supabase project or a production endpoint.

The local multi-process run is useful even without PostgreSQL. Unlike the earlier local harness, it uses the operating system’s process boundary and opens one SQLite connection per worker process. There is no shared Python `threading.Lock`. SQLite lock waiting is therefore measured around the actual `BEGIN IMMEDIATE` attempt. This remains a SQLite result, not a PostgreSQL capacity target.

## Files

| File | Role |
|---|---|
| `scripts/standing_order_webhook_multiprocess_load_test.py` | Cross-process benchmark with SQLite and PostgreSQL backends. Each worker opens an independent database connection. |
| `scripts/pg_lock_staging/docker-compose.yml` | One disposable PostgreSQL service plus two independently configured benchmark instances. |
| `scripts/pg_lock_staging/Dockerfile` | Runner image with `psycopg` installed. |
| `scripts/pg_lock_staging/instance_entrypoint.py` | Converts environment variables into a staging-only benchmark command. |
| `scripts/pg_lock_staging/provision.sh` | Fail-closed lifecycle wrapper for `up`, `run`, `status`, `logs`, `down`, and explicitly confirmed volume destruction. |
| `scripts/pg_lock_staging/.env.example` | Non-secret configuration template. Copy it to an untracked local file and replace the password. |

## Local cross-process SQLite validation

From the repository root, run a small synthetic workload first:

```bash
python3 scripts/standing_order_webhook_multiprocess_load_test.py \
  --backend sqlite \
  --environment local \
  --processes 4 \
  --batch-size 100 \
  --hold-lock-ms 2 \
  --mode both \
  --output /tmp/standing-order-multiprocess-sqlite.json
```

The duplicate batch should report one unique event and at least `batchSize - 1` replayed responses. The conflicting-identity batch should report one unique event and at least `batchSize - 1` conflict responses. Inspect `databaseLockWaitMs` for cross-process SQLite writer queueing and `transactionWorkMs` for time spent after the database write lock has been obtained.

The benchmark uses SQLite WAL mode. SQLite documents that WAL permits readers and a writer to proceed concurrently but still has a single writer at a time [2]. Consequently, a hot account key with a deliberate `--hold-lock-ms` produces a visible writer queue. Use `--jitter-min-ms` and `--jitter-max-ms` to test arrival spreading, not to model a particular network provider.

## Disposable two-instance PostgreSQL staging topology

The Compose topology is intentionally small:

```text
instance_a ─┐
             ├── PostgreSQL 16 / lockbench database
instance_b ─┘
```

`instance_a` and `instance_b` are separate containers and each creates its own worker processes and PostgreSQL connections. Both receive the same `RUN_ID`, provider account key, and deterministic synthetic identifiers. This makes them exercise the same advisory-lock key and the same replay/conflict invariants while retaining independent process and connection state.

The benchmark acquires the transaction-level lock with the same keying strategy used by the webhook claim path:

```sql
SELECT pg_advisory_xact_lock(
  hashtextextended(provider || ':' || provider_account_key, 0)
);
```

The lock is acquired inside the transaction and is released automatically when that transaction commits or rolls back. PostgreSQL documents transaction-level advisory locks and their visibility through `pg_locks` in its explicit-locking chapter [1]. The test table is isolated under the `webhook_lock_test` schema and contains only synthetic evidence rows.

## Provision and execute

Docker and Docker Compose v2 are required on the machine that runs the staging package. The current sandbox does not have Docker, so provisioning was drafted but not executed here. The Compose file requires an explicit `ENVIRONMENT=staging` value for both runner containers and does not provide a production fallback.

```bash
cd scripts/pg_lock_staging
cp .env.example .env.pg-lock-staging
# Edit .env.pg-lock-staging and set a disposable random POSTGRES_PASSWORD using at least 16 letters, digits, dot, underscore, or hyphen characters.
set -a
. ./.env.pg-lock-staging
set +a

# Start only the disposable PostgreSQL database.
ENVIRONMENT=staging POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  ./provision.sh up

# Run both independent benchmark instances.
ENVIRONMENT=staging POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  ./provision.sh run
```

The default Compose workload is 250 requests per instance, four worker processes per instance, a two-millisecond critical-section hold, and zero jitter. The provisioning wrapper requires the exported `ENVIRONMENT=staging` value and rejects short or DSN-breaking passwords; direct Compose users must also export `ENVIRONMENT=staging` because the runner refuses an empty or non-staging environment. Use separate runs for duplicate delivery and conflicting identity, for example:

```bash
MODE=duplicates RUN_ID=pg-lock-dup-001 \
  ENVIRONMENT=staging POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  ./provision.sh run

MODE=conflicts RUN_ID=pg-lock-conflict-001 \
  ENVIRONMENT=staging POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  ./provision.sh run
```

To evaluate arrival spreading, set the same deterministic jitter configuration in both instances:

```bash
MODE=duplicates RUN_ID=pg-lock-jitter-001 \
JITTER_MIN_MS=10 JITTER_MAX_MS=50 JITTER_SEED=20260825 \
ENVIRONMENT=staging POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  ./provision.sh run
```

The results volume contains `instance-a.json` and `instance-b.json`. Preserve those files with the run identifier and configuration metadata. Do not publish DSNs, passwords, raw webhook payloads, or personally identifying data.

## PostgreSQL observations

During an intentionally held critical section, an operator may observe lock waiters from a staging-only `psql` session:

```sql
SELECT
  pid,
  wait_event_type,
  wait_event,
  state,
  query_start,
  left(query, 180) AS query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND query ILIKE '%pg_advisory_xact_lock%'
ORDER BY query_start
LIMIT 100;
```

Advisory locks are exposed through `pg_locks`. The following query is scoped to the benchmark’s backend sessions and reports advisory-lock state without exposing credentials or payloads:

```sql
SELECT
  l.pid,
  l.locktype,
  l.mode,
  l.granted,
  l.waitstart,
  a.state,
  a.query_start,
  left(a.query, 180) AS query_preview
FROM pg_locks AS l
JOIN pg_stat_activity AS a USING (pid)
WHERE l.locktype = 'advisory'
  AND a.datname = current_database()
ORDER BY l.granted, l.waitstart NULLS LAST
LIMIT 100;
```

The benchmark’s `databaseLockWaitMs` is measured around the advisory-lock call. `transactionWorkMs` begins after the lock is acquired and includes the synthetic read/write work plus the deliberate hold before commit. `latencyMs` includes deterministic jitter and connection/database time for that claim. A real staging comparison should collect these JSON reports together with connection-pool size, PostgreSQL version, instance CPU/memory, network placement, and timestamps.

## Interpretation and required controls

A hot provider-account key should serialize claims for that key while unrelated provider-account keys remain eligible for parallel progress. This is the expected semantic behavior of an application-defined advisory lock [1]. The two-instance test is specifically intended to detect an incorrect process-local implementation: if two instances can both insert the same semantic event or fail to classify the conflicting identity, the test fails its invariants.

The benchmark must not be used to set production SLOs from one run. Repeat each configuration at least three times, include a cold and warm connection-pool run, test one hot key versus many independent keys, and record PostgreSQL server-side wait observations. Keep batch sizes bounded, run only against a disposable or explicitly approved staging project, and destroy the database volume after exporting sanitized reports.

To remove the disposable database and its data:

```bash
ENVIRONMENT=staging POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
CONFIRM_DESTROY_STAGING_DATA=YES ./provision.sh destroy-data
```

## References

[1]: https://www.postgresql.org/docs/current/explicit-locking.html "PostgreSQL 16 Documentation — Explicit Locking"

[2]: https://www.sqlite.org/wal.html "SQLite Documentation — Write-Ahead Logging"
