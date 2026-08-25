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
import statistics
import sys
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


def sha256_hex(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def bounded_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    return parsed


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


class SupabaseRpcClient:
    def __init__(self, base_url: str, service_role_key: str, timeout_seconds: float) -> None:
        self.url = base_url.rstrip("/") + f"/rest/v1/rpc/{RPC_NAME}"
        self.service_role_key = service_role_key
        self.timeout_seconds = timeout_seconds

    def call(self, claim: ClaimCall) -> ClaimOutcome:
        started = time.perf_counter()
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
            )
        except (URLError, TimeoutError, OSError, ValueError) as error:
            return ClaimOutcome(
                sequence=claim.sequence,
                latency_ms=(time.perf_counter() - started) * 1000,
                http_status=None,
                body=None,
                error=f"{type(error).__name__}: {error}",
            )


def run_batch(client: SupabaseRpcClient, claims: list[ClaimCall], concurrency: int) -> list[ClaimOutcome]:
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(client.call, claim) for claim in claims]
        return [future.result() for future in futures]


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
    parser.add_argument("--requests", type=bounded_int, default=50, help="claims per batch")
    parser.add_argument("--concurrency", type=bounded_int, default=25, help="maximum simultaneous HTTP calls")
    parser.add_argument("--timeout-seconds", type=float, default=15.0)
    parser.add_argument("--provider", default="TEST_PROVIDER")
    parser.add_argument("--provider-account-key", default="staging-load-test-account")
    parser.add_argument("--amount", default="1000.00")
    parser.add_argument("--currency", default="TZS")
    parser.add_argument("--status", default="SUCCESS")
    parser.add_argument("--output", help="optional JSON report path")
    parser.add_argument("--dry-run", action="store_true", help="build and validate payloads without making HTTP calls")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.base_url and not args.dry_run:
        print("error: --base-url or SUPABASE_URL is required", file=sys.stderr)
        return 2
    if not args.service_role_key and not args.dry_run:
        print("error: --service-role-key or SUPABASE_SERVICE_ROLE_KEY is required", file=sys.stderr)
        return 2
    if args.environment == "production" and not args.allow_production:
        print("error: production requires --allow-production; use staging by default", file=sys.stderr)
        return 2
    if args.requests > 1000:
        print("error: --requests is capped at 1000 per batch", file=sys.stderr)
        return 2
    if args.concurrency > 250:
        print("error: --concurrency is capped at 250", file=sys.stderr)
        return 2
    if args.concurrency > args.requests:
        args.concurrency = args.requests

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
    duplicate_claims = [ClaimCall(sequence=i, payload=duplicate_payload) for i in range(args.requests)]
    report: dict[str, Any] = {
        "harness": "standing-order-webhook-load-test",
        "rpc": RPC_NAME,
        "environment": args.environment,
        "mode": args.mode,
        "requestsPerBatch": args.requests,
        "concurrency": args.concurrency,
        "provider": args.provider,
        "providerAccountKey": args.provider_account_key,
        "syntheticRunId": run_id,
        "notes": [
            "Targets the service-role webhook claim bridge after provider signature verification.",
            "Synthetic rows are durable and require normal staging cleanup; no settlement routine is invoked.",
            "Latency is an end-to-end RPC measure; lock wait is inferred from duplicate serialization, not exposed as a separate database metric.",
        ],
    }

    if args.dry_run:
        report["dryRun"] = True
        report["payloadShapeValidated"] = all(
            len(duplicate_payload[key]) == 64 for key in ("p_raw_payload_hash", "p_semantic_fingerprint")
        )
        print(json.dumps(report, indent=2, sort_keys=True))
        return 0 if report["payloadShapeValidated"] else 1

    client = SupabaseRpcClient(args.base_url, args.service_role_key, args.timeout_seconds)
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
        conflict_claims = [ClaimCall(sequence=i, payload=conflict_payload) for i in range(args.requests)]
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
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
