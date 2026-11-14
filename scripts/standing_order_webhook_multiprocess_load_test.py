#!/usr/bin/env python3
"""Cross-process webhook contention benchmark.

The benchmark never uses a shared Python mutex. Every worker process opens its
own database connection. With ``--backend sqlite`` it measures SQLite's actual
cross-process writer contention. With ``--backend postgres`` it acquires
``pg_advisory_xact_lock(hashtextextended(provider || ':' || account, 0))`` on
each transaction and measures the real database-side lock wait.

Use PostgreSQL only with a disposable or staging database. The script creates
synthetic evidence rows and never invokes financial settlement.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import multiprocessing as mp
import os
import random
import sqlite3
import statistics
import sys
import tempfile
import time
import uuid
from dataclasses import dataclass
from typing import Any

SCHEMA = "webhook_lock_test"
TABLE = f"{SCHEMA}.provider_webhook_events"


@dataclass(frozen=True)
class Claim:
    sequence: int
    payload: dict[str, Any]


@dataclass
class Outcome:
    process_index: int
    sequence: int
    latency_ms: float
    lock_wait_ms: float | None
    database_begin_wait_ms: float | None
    transaction_work_ms: float | None
    jitter_ms: float
    status_code: str
    event_id: str | None
    replayed: bool = False
    conflict: bool = False
    error: str | None = None


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256_hex(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def jitter_for(sequence: int, minimum_ms: float, maximum_ms: float, seed: int) -> float:
    if maximum_ms <= minimum_ms:
        return minimum_ms
    return random.Random(seed + sequence).uniform(minimum_ms, maximum_ms)


def build_payload(
    *,
    provider: str,
    account: str,
    run_id: str,
    event_id: str,
    provider_uuid: str,
    provider_reference: str,
    client_reference: str,
    amount: str,
    currency: str,
    status: str,
    marker: str,
) -> dict[str, Any]:
    semantic = {
        "provider": provider,
        "providerAccountKey": account,
        "providerEventId": event_id,
        "providerUuid": provider_uuid,
        "providerReference": provider_reference,
        "clientReference": client_reference,
        "status": status,
        "amount": amount,
        "currency": currency,
    }
    return {
        "provider": provider,
        "account": account,
        "event_id": event_id,
        "provider_uuid": provider_uuid,
        "provider_reference": provider_reference,
        "client_reference": client_reference,
        "semantic_fingerprint": sha256_hex(canonical_json(semantic)),
        "raw_payload_hash": sha256_hex(canonical_json({"semantic": semantic, "marker": marker})),
        "marker": marker,
        "amount": amount,
        "currency": currency,
        "status": status,
        "run_id": run_id,
    }


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return parsed


def nonnegative_float(value: str) -> float:
    parsed = float(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("must be non-negative")
    return parsed


def sqlite_prepare(path: str) -> None:
    connection = sqlite3.connect(path, timeout=30)
    try:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=NORMAL")
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS provider_webhook_events (
                event_id TEXT PRIMARY KEY,
                provider TEXT NOT NULL,
                provider_account_key TEXT NOT NULL,
                provider_event_id TEXT NOT NULL,
                provider_uuid TEXT NOT NULL,
                provider_reference TEXT NOT NULL,
                client_reference TEXT NOT NULL,
                semantic_fingerprint TEXT NOT NULL,
                raw_payload_hash TEXT NOT NULL,
                processing_status TEXT NOT NULL,
                conflict INTEGER NOT NULL DEFAULT 0,
                created_at REAL NOT NULL DEFAULT (julianday('now')),
                UNIQUE(provider, provider_account_key, semantic_fingerprint)
            );
            CREATE INDEX IF NOT EXISTS provider_webhook_identity_idx
              ON provider_webhook_events(provider, provider_account_key, provider_reference);
            """
        )
        connection.commit()
    finally:
        connection.close()


def postgres_prepare(dsn: str) -> None:
    try:
        import psycopg
    except ImportError as error:
        raise RuntimeError("PostgreSQL backend requires psycopg; install psycopg[binary] in the staging environment") from error
    with psycopg.connect(dsn) as connection:
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA}")
            cursor.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {TABLE} (
                    event_id uuid PRIMARY KEY,
                    provider text NOT NULL,
                    provider_account_key text NOT NULL,
                    provider_event_id text NOT NULL,
                    provider_uuid text NOT NULL,
                    provider_reference text NOT NULL,
                    client_reference text NOT NULL,
                    semantic_fingerprint text NOT NULL,
                    raw_payload_hash text NOT NULL,
                    processing_status text NOT NULL,
                    conflict boolean NOT NULL DEFAULT false,
                    created_at timestamptz NOT NULL DEFAULT now(),
                    UNIQUE(provider, provider_account_key, semantic_fingerprint)
                )
                """
            )
            cursor.execute(
                f"CREATE INDEX IF NOT EXISTS provider_webhook_identity_idx ON {TABLE}(provider, provider_account_key, provider_reference)"
            )
        connection.commit()


def sqlite_claim(connection: sqlite3.Connection, claim: Claim, hold_lock_ms: float) -> tuple[str, str | None, bool, bool, float, float]:
    begin_started = time.perf_counter()
    connection.execute("BEGIN IMMEDIATE")
    begin_wait_ms = (time.perf_counter() - begin_started) * 1000
    transaction_started = time.perf_counter()
    payload = claim.payload
    same = connection.execute(
        f"SELECT event_id, conflict FROM provider_webhook_events WHERE provider = ? AND provider_account_key = ? AND semantic_fingerprint = ?",
        (payload["provider"], payload["account"], payload["semantic_fingerprint"]),
    ).fetchone()
    identity = connection.execute(
        f"""SELECT event_id FROM provider_webhook_events
            WHERE provider = ? AND provider_account_key = ?
              AND (provider_reference = ? OR provider_uuid = ? OR provider_event_id = ?)
            ORDER BY created_at LIMIT 1""",
        (payload["provider"], payload["account"], payload["provider_reference"], payload["provider_uuid"], payload["event_id"]),
    ).fetchone()
    if same:
        event_id, existing_conflict = str(same[0]), bool(same[1])
        status = "NEEDS_ATTENTION" if existing_conflict else "DUPLICATE"
        replayed, conflict = True, existing_conflict
    elif identity:
        event_id = str(identity[0])
        connection.execute("UPDATE provider_webhook_events SET conflict = 1, processing_status = 'NEEDS_ATTENTION' WHERE event_id = ?", (event_id,))
        status, replayed, conflict = "NEEDS_ATTENTION", False, True
    else:
        event_id = str(uuid.uuid4())
        connection.execute(
            f"""INSERT INTO provider_webhook_events(
                event_id, provider, provider_account_key, provider_event_id, provider_uuid,
                provider_reference, client_reference, semantic_fingerprint, raw_payload_hash,
                processing_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED')""",
            (event_id, payload["provider"], payload["account"], payload["event_id"], payload["provider_uuid"], payload["provider_reference"], payload["client_reference"], payload["semantic_fingerprint"], payload["raw_payload_hash"]),
        )
        status, replayed, conflict = "RECEIVED", False, False
    if hold_lock_ms:
        time.sleep(hold_lock_ms / 1000)
    connection.commit()
    return status, event_id, replayed, conflict, begin_wait_ms, (time.perf_counter() - transaction_started) * 1000


def postgres_claim(connection: Any, claim: Claim, hold_lock_ms: float, lock_timeout_ms: int) -> tuple[str, str | None, bool, bool, float, float]:
    payload = claim.payload
    lock_key = f"{payload['provider']}:{payload['account']}"
    lock_started = time.perf_counter()
    with connection.cursor() as cursor:
        if lock_timeout_ms:
            cursor.execute("SELECT set_config('lock_timeout', %s, true)", (f"{lock_timeout_ms}ms",))
        cursor.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))", (lock_key,))
    lock_wait_ms = (time.perf_counter() - lock_started) * 1000
    transaction_started = time.perf_counter()
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT event_id, conflict FROM {TABLE} WHERE provider = %s AND provider_account_key = %s AND semantic_fingerprint = %s",
            (payload["provider"], payload["account"], payload["semantic_fingerprint"]),
        )
        same = cursor.fetchone()
        cursor.execute(
            f"""SELECT event_id FROM {TABLE}
                WHERE provider = %s AND provider_account_key = %s
                  AND (provider_reference = %s OR provider_uuid = %s OR provider_event_id = %s)
                ORDER BY created_at LIMIT 1""",
            (payload["provider"], payload["account"], payload["provider_reference"], payload["provider_uuid"], payload["event_id"]),
        )
        identity = cursor.fetchone()
        if same:
            event_id, existing_conflict = str(same[0]), bool(same[1])
            status = "NEEDS_ATTENTION" if existing_conflict else "DUPLICATE"
            replayed, conflict = True, existing_conflict
        elif identity:
            event_id = str(identity[0])
            cursor.execute(f"UPDATE {TABLE} SET conflict = true, processing_status = 'NEEDS_ATTENTION' WHERE event_id = %s", (event_id,))
            status, replayed, conflict = "NEEDS_ATTENTION", False, True
        else:
            event_id = str(uuid.uuid4())
            cursor.execute(
                f"""INSERT INTO {TABLE}(
                    event_id, provider, provider_account_key, provider_event_id, provider_uuid,
                    provider_reference, client_reference, semantic_fingerprint, raw_payload_hash,
                    processing_status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'RECEIVED')""",
                (event_id, payload["provider"], payload["account"], payload["event_id"], payload["provider_uuid"], payload["provider_reference"], payload["client_reference"], payload["semantic_fingerprint"], payload["raw_payload_hash"]),
            )
            status, replayed, conflict = "RECEIVED", False, False
    if hold_lock_ms:
        time.sleep(hold_lock_ms / 1000)
    connection.commit()
    return status, event_id, replayed, conflict, lock_wait_ms, (time.perf_counter() - transaction_started) * 1000


def worker_main(
    process_index: int,
    claims: list[Claim],
    backend: str,
    db_path: str | None,
    dsn: str | None,
    busy_timeout_ms: int,
    lock_timeout_ms: int,
    hold_lock_ms: float,
    jitter_min_ms: float,
    jitter_max_ms: float,
    jitter_seed: int,
    start_event: Any,
    ready_queue: Any,
    result_queue: Any,
) -> None:
    connection: Any = None
    try:
        if backend == "sqlite":
            connection = sqlite3.connect(db_path, timeout=busy_timeout_ms / 1000, check_same_thread=False)
            connection.execute(f"PRAGMA busy_timeout={busy_timeout_ms}")
            connection.execute("PRAGMA journal_mode=WAL")
        else:
            import psycopg
            connection = psycopg.connect(dsn, autocommit=False)
        ready_queue.put(process_index)
        start_event.wait(timeout=60)
        for claim in claims:
            started = time.perf_counter()
            jitter_ms = jitter_for(claim.sequence, jitter_min_ms, jitter_max_ms, jitter_seed)
            if jitter_ms:
                time.sleep(jitter_ms / 1000)
            try:
                if backend == "sqlite":
                    status, event_id, replayed, conflict, lock_wait_ms, transaction_work_ms = sqlite_claim(connection, claim, hold_lock_ms)
                    database_begin_wait_ms = lock_wait_ms
                else:
                    status, event_id, replayed, conflict, lock_wait_ms, transaction_work_ms = postgres_claim(connection, claim, hold_lock_ms, lock_timeout_ms)
                    database_begin_wait_ms = None
                result_queue.put(Outcome(process_index, claim.sequence, (time.perf_counter() - started) * 1000, lock_wait_ms, database_begin_wait_ms, transaction_work_ms, jitter_ms, status, event_id, replayed, conflict))
            except Exception as error:
                try:
                    connection.rollback()
                except Exception:
                    pass
                result_queue.put(Outcome(process_index, claim.sequence, (time.perf_counter() - started) * 1000, None, None, None, jitter_ms, "ERROR", None, error=f"{type(error).__name__}: {error}"))
    except Exception as error:
        result_queue.put(Outcome(process_index, -1, 0.0, None, None, None, 0.0, "PROCESS_ERROR", None, error=f"{type(error).__name__}: {error}"))
    finally:
        if connection is not None:
            connection.close()


def run_phase(
    claims: list[Claim],
    *,
    backend: str,
    db_path: str | None,
    dsn: str | None,
    processes: int,
    busy_timeout_ms: int,
    lock_timeout_ms: int,
    hold_lock_ms: float,
    jitter_min_ms: float,
    jitter_max_ms: float,
    jitter_seed: int,
) -> list[Outcome]:
    context = mp.get_context("spawn")
    process_count = min(processes, len(claims))
    assignments = [[] for _ in range(process_count)]
    for index, claim in enumerate(claims):
        assignments[index % process_count].append(claim)
    start_event = context.Event()
    ready_queue = context.Queue()
    result_queue = context.Queue()
    workers = [context.Process(target=worker_main, args=(index, assignment, backend, db_path, dsn, busy_timeout_ms, lock_timeout_ms, hold_lock_ms, jitter_min_ms, jitter_max_ms, jitter_seed, start_event, ready_queue, result_queue)) for index, assignment in enumerate(assignments)]
    for worker in workers:
        worker.start()
    for _ in workers:
        ready_queue.get(timeout=60)
    start_event.set()
    outcomes: list[Outcome] = []
    expected = len(claims)
    deadline = time.time() + max(120, expected * max(1.0, (hold_lock_ms + 10) / 1000) * 2)
    while len(outcomes) < expected and time.time() < deadline:
        try:
            outcomes.append(result_queue.get(timeout=1))
        except Exception:
            if not any(worker.is_alive() for worker in workers):
                break
    for worker in workers:
        worker.join(timeout=10)
        if worker.is_alive():
            worker.terminate()
    if len(outcomes) < expected:
        outcomes.extend([Outcome(-1, -1, 0, None, None, None, 0, "MISSING_RESULT", None, error="worker did not return an outcome") for _ in range(expected - len(outcomes))])
    return outcomes


def percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    return round(values[min(len(values) - 1, int(len(values) * fraction))], 4)


def summarize(outcomes: list[Outcome], label: str, batch_size: int) -> dict[str, Any]:
    successful = [outcome for outcome in outcomes if outcome.status_code not in ("ERROR", "PROCESS_ERROR", "MISSING_RESULT")]
    errors = [outcome for outcome in outcomes if outcome not in successful]
    latencies = sorted(outcome.latency_ms for outcome in outcomes)
    lock_waits = sorted(outcome.lock_wait_ms for outcome in successful if outcome.lock_wait_ms is not None)
    transaction_work = sorted(outcome.transaction_work_ms for outcome in successful if outcome.transaction_work_ms is not None)
    jitter = sorted(outcome.jitter_ms for outcome in outcomes)
    events = {outcome.event_id for outcome in successful if outcome.event_id}
    return {
        "label": label,
        "requests": len(outcomes),
        "successful": len(successful),
        "errors": len(errors),
        "uniqueEventCount": len(events),
        "replayedResponses": sum(outcome.replayed for outcome in successful),
        "conflictResponses": sum(outcome.conflict for outcome in successful),
        "statuses": {status: sum(outcome.status_code == status for outcome in successful) for status in sorted({outcome.status_code for outcome in successful})},
        "latencyMs": {"p50": percentile(latencies, .50), "p95": percentile(latencies, .95), "p99": percentile(latencies, .99), "mean": round(statistics.mean(latencies), 4) if latencies else None, "max": round(max(latencies), 4) if latencies else None},
        "databaseLockWaitMs": {"p50": percentile(lock_waits, .50), "p95": percentile(lock_waits, .95), "p99": percentile(lock_waits, .99), "mean": round(statistics.mean(lock_waits), 4) if lock_waits else None, "max": round(max(lock_waits), 4) if lock_waits else None},
        "transactionWorkMs": {"p50": percentile(transaction_work, .50), "p95": percentile(transaction_work, .95), "p99": percentile(transaction_work, .99), "mean": round(statistics.mean(transaction_work), 4) if transaction_work else None, "max": round(max(transaction_work), 4) if transaction_work else None},
        "jitterMs": {"p50": percentile(jitter, .50), "p95": percentile(jitter, .95), "p99": percentile(jitter, .99), "mean": round(statistics.mean(jitter), 4) if jitter else None, "max": round(max(jitter), 4) if jitter else None},
        "errorsSample": [outcome.error for outcome in errors[:5]],
        "invariantPassed": (
            not errors
            and len(events) == 1
            and (sum(outcome.replayed for outcome in successful) >= max(0, batch_size - 1) if label == "exact-duplicate-delivery" else sum(outcome.conflict for outcome in successful) >= max(0, batch_size - 1))
        ),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", choices=("sqlite", "postgres"), default="sqlite")
    parser.add_argument("--environment", choices=("local", "staging", "production"), default="local")
    parser.add_argument("--db-path", help="SQLite path; defaults to an ephemeral file")
    parser.add_argument("--dsn", help="PostgreSQL DSN; required for --backend postgres")
    parser.add_argument("--processes", type=positive_int, default=2)
    parser.add_argument("--batch-size", type=positive_int, default=100)
    parser.add_argument("--busy-timeout-ms", type=positive_int, default=5000)
    parser.add_argument("--lock-timeout-ms", type=int, default=0, help="PostgreSQL lock timeout; zero means no explicit timeout")
    parser.add_argument("--hold-lock-ms", type=nonnegative_float, default=0.0)
    parser.add_argument("--jitter-min-ms", type=nonnegative_float, default=0.0)
    parser.add_argument("--jitter-max-ms", type=nonnegative_float, default=0.0)
    parser.add_argument("--jitter-seed", type=int, default=20260825)
    parser.add_argument("--mode", choices=("duplicates", "conflicts", "both"), default="both")
    parser.add_argument("--provider", default="TEST_PROVIDER")
    parser.add_argument("--provider-account-key", default="local-cross-process-account")
    parser.add_argument("--run-id", help="Shared synthetic run identifier for coordinating multiple benchmark instances")
    parser.add_argument("--output")
    parser.add_argument("--keep-db", action="store_true")
    parser.add_argument("--cleanup-postgres-schema", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.backend == "postgres" and args.environment != "staging":
        print("error: PostgreSQL benchmark requires --environment staging", file=sys.stderr)
        return 2
    if args.backend == "postgres" and not args.dsn:
        print("error: --dsn is required for PostgreSQL backend", file=sys.stderr)
        return 2
    if args.backend == "sqlite" and args.environment != "local":
        print("error: SQLite benchmark requires --environment local", file=sys.stderr)
        return 2
    if args.jitter_max_ms < args.jitter_min_ms:
        print("error: --jitter-max-ms must be >= --jitter-min-ms", file=sys.stderr)
        return 2
    if args.lock_timeout_ms < 0:
        print("error: --lock-timeout-ms must be non-negative", file=sys.stderr)
        return 2
    if args.processes > 64 or args.batch_size > 5000 or args.hold_lock_ms > 5000:
        print("error: limits are processes<=64, batch-size<=5000, hold-lock-ms<=5000", file=sys.stderr)
        return 2

    run_id = args.run_id or uuid.uuid4().hex
    base = dict(provider=args.provider, account=args.provider_account_key, run_id=run_id, provider_reference=f"mp-load-{run_id}", client_reference=f"standing-order-mp-{run_id}", amount="1000.00", currency="TZS", status="SUCCESS")
    duplicate = build_payload(**base, event_id=f"event-{run_id}", provider_uuid=str(uuid.uuid5(uuid.NAMESPACE_URL, f'{run_id}:provider-event')), marker="exact-duplicate")
    conflict_base = {**base, "amount": "1001.00"}
    conflict = build_payload(**conflict_base, event_id=f"conflict-{run_id}", provider_uuid=str(uuid.uuid5(uuid.NAMESPACE_URL, f'{run_id}:conflicting-provider-event')), marker="conflicting-provider-identity")
    duplicate_claims = [Claim(i, duplicate) for i in range(args.batch_size)]
    conflict_claims = [Claim(i, conflict) for i in range(args.batch_size)]

    temporary_path: str | None = None
    if args.backend == "sqlite":
        if args.db_path:
            db_path = args.db_path
        else:
            handle, temporary_path = tempfile.mkstemp(prefix="standing-order-multiprocess-", suffix=".sqlite3")
            os.close(handle)
            db_path = temporary_path
        sqlite_prepare(db_path)
        dsn = None
    else:
        db_path = None
        postgres_prepare(args.dsn)

    report: dict[str, Any] = {
        "harness": "standing-order-webhook-multiprocess-load-test",
        "backend": args.backend,
        "environment": args.environment,
        "processes": args.processes,
        "batchSize": args.batch_size,
        "provider": args.provider,
        "providerAccountKey": args.provider_account_key,
        "holdLockMs": args.hold_lock_ms,
        "jitterMinMs": args.jitter_min_ms,
        "jitterMaxMs": args.jitter_max_ms,
        "notes": [
            "Every worker process opens an independent database connection; no shared Python mutex is used.",
            "No financial settlement routine is invoked; all records are synthetic webhook evidence.",
            "PostgreSQL lock wait is measured around pg_advisory_xact_lock; SQLite lock wait is measured around BEGIN IMMEDIATE.",
        ],
    }
    if args.mode in ("duplicates", "both"):
        report["duplicateBatch"] = summarize(run_phase(duplicate_claims, backend=args.backend, db_path=db_path, dsn=args.dsn, processes=args.processes, busy_timeout_ms=args.busy_timeout_ms, lock_timeout_ms=args.lock_timeout_ms, hold_lock_ms=args.hold_lock_ms, jitter_min_ms=args.jitter_min_ms, jitter_max_ms=args.jitter_max_ms, jitter_seed=args.jitter_seed), "exact-duplicate-delivery", args.batch_size)
    if args.mode in ("conflicts", "both"):
        if args.mode == "conflicts":
            run_phase([Claim(0, duplicate)], backend=args.backend, db_path=db_path, dsn=args.dsn, processes=1, busy_timeout_ms=args.busy_timeout_ms, lock_timeout_ms=args.lock_timeout_ms, hold_lock_ms=0, jitter_min_ms=0, jitter_max_ms=0, jitter_seed=args.jitter_seed)
        report["conflictBatch"] = summarize(run_phase(conflict_claims, backend=args.backend, db_path=db_path, dsn=args.dsn, processes=args.processes, busy_timeout_ms=args.busy_timeout_ms, lock_timeout_ms=args.lock_timeout_ms, hold_lock_ms=args.hold_lock_ms, jitter_min_ms=args.jitter_min_ms, jitter_max_ms=args.jitter_max_ms, jitter_seed=args.jitter_seed), "conflicting-provider-identity", args.batch_size)
    report["passed"] = all(report[key]["invariantPassed"] for key in ("duplicateBatch", "conflictBatch") if key in report)
    serialized = json.dumps(report, indent=2, sort_keys=True)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(serialized + "\n")
    print(serialized)

    if args.backend == "postgres" and args.cleanup_postgres_schema:
        try:
            import psycopg
            with psycopg.connect(args.dsn) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(f"DROP SCHEMA IF EXISTS {SCHEMA} CASCADE")
                connection.commit()
        except Exception as error:
            print(f"warning: PostgreSQL cleanup failed: {type(error).__name__}", file=sys.stderr)
    if temporary_path and not args.keep_db:
        try:
            os.unlink(temporary_path)
        except OSError:
            pass
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
