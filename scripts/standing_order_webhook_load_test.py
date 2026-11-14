#!/usr/bin/env python3
"""High-concurrency test harness for the Standing Order webhook claim bridge.

This harness targets the *post-authentication* Supabase RPC
``public.bank_provider_webhook_claim``. It deliberately sends
``p_signature_verified=true`` because cryptographic verification belongs to the
provider adapter/Edge Function and must not be bypassed by production callers.

The test creates synthetic webhook evidence in the selected target database;
HTTP RPC calls cannot be rolled back by this process. Use a disposable or
staging project. Production requires both ``--environment production`` and
``--allow-production`` as an explicit safety gate.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import random
import sqlite3
import statistics
import sys
import tempfile
import threading
import time
import uuid
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

RPC_NAME = "bank_provider_webhook_claim"


@dataclass(frozen=True)
class ClaimCall:
    sequence: int
    payload: dict[str, Any]


@dataclass
class ClaimOutcome:
    sequence: int
    latency_ms: float
    http_status: int | None
    body: dict[str, Any] | None
    error: str | None = None
    emulated_jitter_ms: float = 0.0


def sha256_hex(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def bounded_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return parsed


def bounded_nonnegative_float(value: str) -> float:
    parsed = float(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("must be non-negative")
    return parsed


def jitter_for(sequence: int, minimum_ms: float, maximum_ms: float, seed: int) -> float:
    if maximum_ms <= minimum_ms:
        return minimum_ms
    return random.Random(seed + sequence).uniform(minimum_ms, maximum_ms)


def build_claim_payload(
    *,
    provider: str,
    provider_account_key: str,
    provider_event_id: str,
    provider_uuid: str,
    provider_reference: str,
    client_reference: str,
    amount: str,
    currency: str,
    status: str,
    execution_id: str,
    conflict_marker: str | None = None,
) -> dict[str, Any]:
    redacted = {
        "status": status,
        "amount": amount,
        "currency": currency,
        "testMarker": conflict_marker or "duplicate-delivery",
    }
    semantic_material = {
        "provider": provider,
        "providerAccountKey": provider_account_key,
        "providerEventId": provider_event_id,
        "providerUuid": provider_uuid,
        "providerReference": provider_reference,
        "clientReference": client_reference,
        "status": status,
        "amount": amount,
        "currency": currency,
    }
    raw_material = {"semantic": semantic_material, "redacted": redacted}
    return {
        "p_provider": provider,
        "p_provider_account_key": provider_account_key,
        "p_provider_event_id": provider_event_id,
        "p_provider_uuid": provider_uuid,
        "p_provider_reference": provider_reference,
        "p_client_reference": client_reference,
        "p_raw_payload_hash": sha256_hex(canonical_json(raw_material)),
        "p_semantic_fingerprint": sha256_hex(canonical_json(semantic_material)),
        "p_signature_verified": True,
        "p_signature_key_version": "load-test-v1",
        "p_ingest_outcome": "ACCEPTED",
        "p_payload_redacted": redacted,
        "p_execution_id": execution_id,
    }


class LocalSQLiteRpcClient:
    """Disposable local emulator for the claim contract.

    SQLite has no PostgreSQL ``pg_advisory_xact_lock`` primitive. This backend
    therefore uses a named process-local mutex per provider account and a
    SQLite transaction for durable replay/conflict state. Its lock metrics are
    useful for algorithmic/concurrency regression testing only; they are not
    PostgreSQL advisory-lock or Supabase staging measurements.
    """

    def __init__(self, db_path: str, jitter_min_ms: float = 0.0, jitter_max_ms: float = 0.0, jitter_seed: int = 20260825) -> None:
        self.db_path = db_path
        self.jitter_min_ms = jitter_min_ms
        self.jitter_max_ms = jitter_max_ms
        self.jitter_seed = jitter_seed
        self._locks: dict[str, threading.Lock] = {}
        self._locks_guard = threading.Lock()
        connection = sqlite3.connect(self.db_path, timeout=30, check_same_thread=False)
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

    def _lock_for(self, key: str) -> threading.Lock:
        with self._locks_guard:
            return self._locks.setdefault(key, threading.Lock())

    def call(self, claim: ClaimCall) -> ClaimOutcome:
        started = time.perf_counter()
        jitter_ms = jitter_for(claim.sequence, self.jitter_min_ms, self.jitter_max_ms, self.jitter_seed)
        if jitter_ms:
            time.sleep(jitter_ms / 1000)
        payload = claim.payload
        lock_key = f"{payload['p_provider']}:{payload['p_provider_account_key']}"
        lock = self._lock_for(lock_key)
        lock_wait_started = time.perf_counter()
        lock.acquire()
        lock_wait_ms = (time.perf_counter() - lock_wait_started) * 1000
        critical_started = time.perf_counter()
        try:
            connection = sqlite3.connect(self.db_path, timeout=30, check_same_thread=False)
            try:
                begin_started = time.perf_counter()
                connection.execute("BEGIN IMMEDIATE")
                begin_ms = (time.perf_counter() - begin_started) * 1000
                same_fingerprint = connection.execute(
                    """SELECT event_id, provider_event_id, provider_uuid, provider_reference,
                              conflict, processing_status
                       FROM provider_webhook_events
                       WHERE provider = ? AND provider_account_key = ?
                         AND semantic_fingerprint = ?""",
                    (payload["p_provider"], payload["p_provider_account_key"], payload["p_semantic_fingerprint"]),
                ).fetchone()
                identity_match = connection.execute(
                    """SELECT event_id, semantic_fingerprint, provider_event_id, provider_uuid,
                              provider_reference, conflict, processing_status
                       FROM provider_webhook_events
                       WHERE provider = ? AND provider_account_key = ?
                         AND (provider_reference = ? OR provider_uuid = ? OR provider_event_id = ?)
                       ORDER BY created_at LIMIT 1""",
                    (payload["p_provider"], payload["p_provider_account_key"], payload["p_provider_reference"], payload["p_provider_uuid"], payload["p_provider_event_id"]),
                ).fetchone()
                if same_fingerprint:
                    event_id = same_fingerprint[0]
                    body = {
                        "eventId": event_id,
                        "replayed": True,
                        "conflict": bool(same_fingerprint[4]),
                        "processingStatus": "DUPLICATE" if not same_fingerprint[4] else "NEEDS_ATTENTION",
                        "lockWaitMs": round(lock_wait_ms, 4),
                    }
                elif identity_match:
                    event_id = identity_match[0]
                    body = {
                        "eventId": event_id,
                        "replayed": False,
                        "conflict": True,
                        "processingStatus": "NEEDS_ATTENTION",
                        "lockWaitMs": round(lock_wait_ms, 4),
                    }
                    connection.execute(
                        "UPDATE provider_webhook_events SET conflict = 1, processing_status = 'NEEDS_ATTENTION' WHERE event_id = ?",
                        (event_id,),
                    )
                else:
                    event_id = str(uuid.uuid4())
                    connection.execute(
                        """INSERT INTO provider_webhook_events(
                            event_id, provider, provider_account_key, provider_event_id,
                            provider_uuid, provider_reference, client_reference,
                            semantic_fingerprint, raw_payload_hash, processing_status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED')""",
                        (event_id, payload["p_provider"], payload["p_provider_account_key"], payload["p_provider_event_id"], payload["p_provider_uuid"], payload["p_provider_reference"], payload["p_client_reference"], payload["p_semantic_fingerprint"], payload["p_raw_payload_hash"]),
                    )
                    body = {
                        "eventId": event_id,
                        "replayed": False,
                        "conflict": False,
                        "processingStatus": "RECEIVED",
                        "lockWaitMs": round(lock_wait_ms, 4),
                    }
                connection.commit()
                body["sqliteBeginMs"] = round(begin_ms, 4)
                body["sqliteTxnWorkMs"] = round((time.perf_counter() - critical_started) * 1000, 4)
                body["sqliteCriticalSectionMs"] = body["sqliteTxnWorkMs"]
                return ClaimOutcome(
                    sequence=claim.sequence,
                    latency_ms=(time.perf_counter() - started) * 1000,
                    http_status=200,
                    body=body,
                    emulated_jitter_ms=round(jitter_ms, 4),
                )
            except Exception:
                connection.rollback()
                raise
            finally:
                connection.close()
        except (sqlite3.Error, OSError, ValueError) as error:
            return ClaimOutcome(
                sequence=claim.sequence,
                latency_ms=(time.perf_counter() - started) * 1000,
                http_status=None,
                                body=None,
                error=f"{type(error).__name__}: {error}",
                emulated_jitter_ms=round(jitter_ms, 4),
            )
        finally:
            lock.release()


def run_batch(client: Any, claims: list[ClaimCall], concurrency: int) -> list[ClaimOutcome]:
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(client.call, claim) for claim in claims]
        return [future.result() for future in futures]


class SupabaseRpcClient:
    def __init__(self, base_url: str, service_role_key: str, timeout_seconds: float, jitter_min_ms: float = 0.0, jitter_max_ms: float = 0.0, jitter_seed: int = 20260825) -> None:
        self.url = base_url.rstrip("/") + f"/rest/v1/rpc/{RPC_NAME}"
        self.service_role_key = service_role_key
        self.timeout_seconds = timeout_seconds
        self.jitter_min_ms = jitter_min_ms
        self.jitter_max_ms = jitter_max_ms
        self.jitter_seed = jitter_seed

    def call(self, claim: ClaimCall) -> ClaimOutcome:
        started = time.perf_counter()
        jitter_ms = jitter_for(claim.sequence, self.jitter_min_ms, self.jitter_max_ms, self.jitter_seed)
        if jitter_ms:
            time.sleep(jitter_ms / 1000)
        request = Request(
            self.url,
            data=canonical_json(claim.payload),
            method="POST",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "apikey": self.service_role_key,
                "Authorization": f"Bearer {self.service_role_key}",
                "X-Client-Info": "smartmanager-webhook-load-test",
            },
        )
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                raw = response.read()
                body = json.loads(raw.decode("utf-8")) if raw else {}
                if not isinstance(body, dict):
                    body = {"raw": body}
                return ClaimOutcome(
                    sequence=claim.sequence,
                    latency_ms=(time.perf_counter() - started) * 1000,
                    http_status=response.status,
                    body=body,
                    emulated_jitter_ms=round(jitter_ms, 4),
                )
        except HTTPError as error:
            try:
                raw_error = error.read().decode("utf-8", errors="replace")[:500]
            except Exception:
                raw_error = ""
            return ClaimOutcome(
                sequence=claim.sequence,
                latency_ms=(time.perf_counter() - started) * 1000,
                http_status=error.code,
                body=None,
                error=f"HTTP {error.code}: {raw_error}",
                emulated_jitter_ms=round(jitter_ms, 4),
            )
        except (URLError, TimeoutError, OSError, ValueError) as error:
            return ClaimOutcome(
                sequence=claim.sequence,
                latency_ms=(time.perf_counter() - started) * 1000,
                                http_status=None,
                body=None,
                error=f"{type(error).__name__}: {error}",
                emulated_jitter_ms=round(jitter_ms, 4),
            )


def summarize(outcomes: list[ClaimOutcome], label: str) -> dict[str, Any]:
    latencies = sorted(outcome.latency_ms for outcome in outcomes)
    successful = [outcome for outcome in outcomes if outcome.http_status == 200 and outcome.body]
    errors = [outcome for outcome in outcomes if outcome.error or outcome.http_status != 200]
    event_ids = {str(outcome.body.get("eventId")) for outcome in successful if outcome.body.get("eventId")}
    replayed = sum(bool(outcome.body.get("replayed")) for outcome in successful)
    conflicts = sum(bool(outcome.body.get("conflict")) for outcome in successful)
    statuses: dict[str, int] = {}
    for outcome in successful:
        status = str(outcome.body.get("processingStatus", "UNKNOWN"))
        statuses[status] = statuses.get(status, 0) + 1
    percentile = lambda p: round(latencies[min(len(latencies) - 1, int(len(latencies) * p / 100))], 2) if latencies else None
    lock_waits = sorted(float(outcome.body.get("lockWaitMs", 0)) for outcome in successful)
    lock_percentile = lambda p: round(lock_waits[min(len(lock_waits) - 1, int(len(lock_waits) * p / 100))], 4) if lock_waits else None
    jitter_values = sorted(outcome.emulated_jitter_ms for outcome in outcomes)
    jitter_percentile = lambda p: round(jitter_values[min(len(jitter_values) - 1, int(len(jitter_values) * p / 100))], 4) if jitter_values else None
    critical_values = sorted(float(outcome.body.get("sqliteCriticalSectionMs", 0)) for outcome in successful)
    critical_percentile = lambda p: round(critical_values[min(len(critical_values) - 1, int(len(critical_values) * p / 100))], 4) if critical_values else None
    begin_values = sorted(float(outcome.body.get("sqliteBeginMs", 0)) for outcome in successful)
    begin_percentile = lambda p: round(begin_values[min(len(begin_values) - 1, int(len(begin_values) * p / 100))], 4) if begin_values else None
    return {
        "label": label,
        "requests": len(outcomes),
        "successfulHttp200": len(successful),
        "errors": len(errors),
        "eventIds": sorted(event_ids),
        "uniqueEventCount": len(event_ids),
        "replayedResponses": replayed,
        "conflictResponses": conflicts,
        "processingStatuses": statuses,
        "latencyMs": {
            "min": round(min(latencies), 2) if latencies else None,
            "p50": percentile(50),
            "p95": percentile(95),
            "p99": percentile(99),
            "max": round(max(latencies), 2) if latencies else None,
            "mean": round(statistics.mean(latencies), 2) if latencies else None,
        },
        "emulatedAdvisoryLockWaitMs": {
            "min": round(min(lock_waits), 4) if lock_waits else None,
            "p50": lock_percentile(50),
            "p95": lock_percentile(95),
            "p99": lock_percentile(99),
            "max": round(max(lock_waits), 4) if lock_waits else None,
            "mean": round(statistics.mean(lock_waits), 4) if lock_waits else None,
        },
        "networkJitterEmulatedMs": {
            "min": round(min(jitter_values), 4) if jitter_values else None,
            "p50": jitter_percentile(50),
            "p95": jitter_percentile(95),
            "p99": jitter_percentile(99),
            "max": round(max(jitter_values), 4) if jitter_values else None,
            "mean": round(statistics.mean(jitter_values), 4) if jitter_values else None,
        },
        "sqliteCriticalSectionMs": {
            "min": round(min(critical_values), 4) if critical_values else None,
            "p50": critical_percentile(50),
            "p95": critical_percentile(95),
            "p99": critical_percentile(99),
            "max": round(max(critical_values), 4) if critical_values else None,
            "mean": round(statistics.mean(critical_values), 4) if critical_values else None,
        },
        "sqliteBeginImmediateMs": {
            "min": round(min(begin_values), 4) if begin_values else None,
            "p50": begin_percentile(50),
            "p95": begin_percentile(95),
            "p99": begin_percentile(99),
            "max": round(max(begin_values), 4) if begin_values else None,
            "mean": round(statistics.mean(begin_values), 4) if begin_values else None,
        },
        "errorSamples": [outcome.error for outcome in errors[:5]],
    }


def assert_duplicate_invariants(summary: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    if summary["successfulHttp200"] != summary["requests"]:
        failures.append("not every duplicate claim returned HTTP 200")
    if summary["uniqueEventCount"] != 1:
        failures.append(f"expected one durable event ID, got {summary['uniqueEventCount']}")
    if summary["conflictResponses"] != 0:
        failures.append("exact duplicate batch returned a conflict")
    expected_replays = max(0, summary["requests"] - 1)
    if summary["replayedResponses"] != expected_replays:
        failures.append(f"expected {expected_replays} replay responses, got {summary['replayedResponses']}")
    return failures


def assert_conflict_invariants(summary: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    if summary["successfulHttp200"] != summary["requests"]:
        failures.append("not every conflicting claim returned HTTP 200")
    if summary["uniqueEventCount"] != 1:
        failures.append("conflicting identity did not resolve to the original durable event")
    if summary["conflictResponses"] != summary["requests"]:
        failures.append("conflicting identity was not consistently marked as conflict")
    if summary["processingStatuses"].get("NEEDS_ATTENTION", 0) != summary["requests"]:
        failures.append("conflicting identity was not quarantined as NEEDS_ATTENTION")
    return failures


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=os.getenv("SUPABASE_URL"), help="Supabase project URL")
    parser.add_argument("--service-role-key", default=os.getenv("SUPABASE_SERVICE_ROLE_KEY"), help="service-role key; never logged")
    parser.add_argument("--environment", choices=("local", "staging", "production"), default="staging")
    parser.add_argument("--allow-production", action="store_true", help="required additional gate for a production target")
    parser.add_argument("--mode", choices=("duplicates", "conflicts", "both"), default="both")
    parser.add_argument("--requests", "--batch-size", dest="batch_size", type=bounded_int, default=50, help="claims per batch (legacy alias: --requests)")
    parser.add_argument("--concurrency", type=bounded_int, default=25, help="maximum simultaneous HTTP calls")
    parser.add_argument("--timeout-seconds", type=bounded_nonnegative_float, default=15.0)
    parser.add_argument("--jitter-min-ms", type=bounded_nonnegative_float, default=0.0, help="minimum emulated network delay before each claim")
    parser.add_argument("--jitter-max-ms", type=bounded_nonnegative_float, default=0.0, help="maximum emulated network delay before each claim")
    parser.add_argument("--jitter-seed", type=int, default=20260825, help="deterministic seed for per-request jitter")
    parser.add_argument("--provider", default="TEST_PROVIDER")
    parser.add_argument("--provider-account-key", default="staging-load-test-account")
    parser.add_argument("--amount", default="1000.00")
    parser.add_argument("--currency", default="TZS")
    parser.add_argument("--status", default="SUCCESS")
    parser.add_argument("--output", help="optional JSON report path")
    parser.add_argument("--dry-run", action="store_true", help="build and validate payloads without making HTTP calls")
    parser.add_argument("--local-sqlite", nargs="?", const="", help="run against an ephemeral local SQLite emulator; optionally provide a database path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    local_mode = args.local_sqlite is not None
    if local_mode and args.environment != "local":
        print("error: --local-sqlite requires --environment local", file=sys.stderr)
        return 2
    if not local_mode and not args.base_url and not args.dry_run:
        print("error: --base-url or SUPABASE_URL is required", file=sys.stderr)
        return 2
    if not local_mode and not args.service_role_key and not args.dry_run:
        print("error: --service-role-key or SUPABASE_SERVICE_ROLE_KEY is required", file=sys.stderr)
        return 2
    if args.environment == "production" and not args.allow_production:
        print("error: production requires --allow-production; use staging by default", file=sys.stderr)
        return 2
    if args.jitter_max_ms < args.jitter_min_ms:
        print("error: --jitter-max-ms must be greater than or equal to --jitter-min-ms", file=sys.stderr)
        return 2
    if args.jitter_max_ms > 5000:
        print("error: --jitter-max-ms is capped at 5000 ms", file=sys.stderr)
        return 2
    if args.batch_size > 1000:
        print("error: --batch-size is capped at 1000 per batch", file=sys.stderr)
        return 2
    if args.concurrency > 250:
        print("error: --concurrency is capped at 250", file=sys.stderr)
        return 2
    if args.concurrency > args.batch_size:
        args.concurrency = args.batch_size

    run_id = uuid.uuid4().hex
    provider_reference = f"load-{run_id}"
    client_reference = f"standing-order-load-{run_id}"
    execution_id = str(uuid.uuid4())
    base_kwargs = {
        "provider": args.provider,
        "provider_account_key": args.provider_account_key,
        "provider_event_id": f"event-{run_id}",
        "provider_uuid": str(uuid.uuid4()),
        "provider_reference": provider_reference,
        "client_reference": client_reference,
        "amount": args.amount,
        "currency": args.currency.upper(),
        "status": args.status.upper(),
        "execution_id": execution_id,
    }
    duplicate_payload = build_claim_payload(**base_kwargs)
    duplicate_claims = [ClaimCall(sequence=i, payload=duplicate_payload) for i in range(args.batch_size)]
    report: dict[str, Any] = {
        "harness": "standing-order-webhook-load-test",
        "rpc": RPC_NAME,
        "environment": args.environment,
        "mode": args.mode,
        "requestsPerBatch": args.batch_size,
        "batchSize": args.batch_size,
        "concurrency": args.concurrency,
        "jitterMinMs": args.jitter_min_ms,
        "jitterMaxMs": args.jitter_max_ms,
        "jitterSeed": args.jitter_seed,
        "provider": args.provider,
        "providerAccountKey": args.provider_account_key,
        "syntheticRunId": run_id,
        "backend": "local-sqlite-emulator" if local_mode else "supabase-rpc",
        "notes": [
            "Targets the service-role webhook claim bridge after provider signature verification." if not local_mode else "Uses a disposable SQLite emulator with a named process-local mutex per provider account.",
            "Synthetic rows are durable until the local SQLite file is removed; no settlement routine is invoked.",
            "Local lock metrics are emulated advisory-lock wait measurements and must not be interpreted as PostgreSQL pg_advisory_xact_lock performance.",
        ],
    }

    if args.dry_run:
        report["dryRun"] = True
        report["payloadShapeValidated"] = all(
            len(duplicate_payload[key]) == 64 for key in ("p_raw_payload_hash", "p_semantic_fingerprint")
        )
        print(json.dumps(report, indent=2, sort_keys=True))
        return 0 if report["payloadShapeValidated"] else 1

    temporary_db_path: str | None = None
    if local_mode:
        if args.local_sqlite:
            db_path = args.local_sqlite
        else:
            handle, temporary_db_path = tempfile.mkstemp(prefix="standing-order-webhook-load-", suffix=".sqlite3")
            os.close(handle)
            db_path = temporary_db_path
        client: Any = LocalSQLiteRpcClient(db_path, args.jitter_min_ms, args.jitter_max_ms, args.jitter_seed)
        report["localDatabasePath"] = db_path
    else:
        client = SupabaseRpcClient(args.base_url, args.service_role_key, args.timeout_seconds, args.jitter_min_ms, args.jitter_max_ms, args.jitter_seed)
    failures: list[str] = []

    if args.mode in ("duplicates", "both"):
        duplicate_summary = summarize(run_batch(client, duplicate_claims, args.concurrency), "exact-duplicate-delivery")
        report["duplicateBatch"] = duplicate_summary
        failures.extend(f"duplicates: {failure}" for failure in assert_duplicate_invariants(duplicate_summary))

    if args.mode in ("conflicts", "both"):
        conflict_payload = build_claim_payload(
            **{
                **base_kwargs,
                "provider_event_id": f"conflict-event-{run_id}",
                "provider_uuid": str(uuid.uuid4()),
                "amount": args.amount + "1" if "." not in args.amount else f"{float(args.amount) + 1:.2f}",
                "conflict_marker": "same-provider-reference-different-fingerprint",
            }
        )
        conflict_claims = [ClaimCall(sequence=i, payload=conflict_payload) for i in range(args.batch_size)]
        conflict_summary = summarize(run_batch(client, conflict_claims, args.concurrency), "conflicting-provider-identity")
        report["conflictBatch"] = conflict_summary
        failures.extend(f"conflicts: {failure}" for failure in assert_conflict_invariants(conflict_summary))

    report["passed"] = not failures
    report["failures"] = failures
    serialized = json.dumps(report, indent=2, sort_keys=True)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(serialized + "\n")
    print(serialized)
    if temporary_db_path:
        try:
            os.unlink(temporary_db_path)
        except OSError:
            pass
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
