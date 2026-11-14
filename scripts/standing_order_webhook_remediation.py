#!/usr/bin/env python3
"""Fail-closed Standing Order webhook remediation worker.

The worker never writes application tables directly. It calls service-role-only
Supabase RPCs that own advisory locking, bounded leases, row locking, replay
checks, and financial idempotency.

Modes:
  dry-run                 Lease/classify only; no requeue or settlement.
  requeue-only            Requeue only SAFE_RETRY/SAFE_RECONCILE items.
  drain-safe-settlements  Requeue and process safe items through the normal
                          service-only settlement implementation.

The worker is intentionally conservative. It requires explicit provider-account
scope, hard caps, and a two-person approval for every mutating run. Approval
plaintext is read from an environment variable supplied by a secret manager,
hashed locally, and never sent to the database or logs in plaintext.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.request
import uuid
from dataclasses import dataclass
from typing import Any


MAX_ITEMS = 100
MAX_SETTLEMENTS = 25
MAX_BATCH = 10
MAX_LEASE_SECONDS = 600
DEFAULT_TIMEOUT_SECONDS = 30
SAFE_CLASSIFICATIONS = {"SAFE_RETRY", "SAFE_RECONCILE"}


class WorkerError(RuntimeError):
    """An expected fail-closed worker error."""


@dataclass(frozen=True)
class Config:
    supabase_url: str
    service_role_key: str
    provider: str
    provider_account_key: str
    environment: str
    mode: str
    max_items: int
    max_settlements: int
    requested_by: str | None
    approval_id: str | None
    approval_token: str | None
    request_timeout: float
    dry_run: bool = False

    @property
    def approval_token_hash(self) -> str | None:
        if self.approval_token is None:
            return None
        # The token must be generated as 32 random bytes by the approval
        # service. SHA-256 is sufficient for a 256-bit secret and keeps only a
        # lowercase digest in the database. Never log the token or digest.
        return hashlib.sha256(self.approval_token.encode("utf-8")).hexdigest()


class SupabaseRpcClient:
    def __init__(self, config: Config) -> None:
        self._base_url = config.supabase_url.rstrip("/")
        self._service_role_key = config.service_role_key
        self._timeout = config.request_timeout

    def call(self, function_name: str, payload: dict[str, Any]) -> Any:
        url = f"{self._base_url}/rest/v1/rpc/{function_name}"
        body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "apikey": self._service_role_key,
                "Authorization": f"Bearer {self._service_role_key}",
                "Content-Profile": "public",
                "Accept-Profile": "public",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:
                response_body = response.read()
                status = response.status
        except urllib.error.HTTPError as error:
            # Never include response bodies in logs; provider errors may contain
            # payload fragments or credentials. The status is enough for the
            # caller to open the circuit breaker.
            raise WorkerError(f"RPC {function_name} returned HTTP {error.code}") from error
        except (urllib.error.URLError, TimeoutError) as error:
            raise WorkerError(f"RPC {function_name} was unavailable") from error

        if status < 200 or status >= 300:
            raise WorkerError(f"RPC {function_name} returned HTTP {status}")
        try:
            return json.loads(response_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise WorkerError(f"RPC {function_name} returned invalid JSON") from error


class RemediationWorker:
    def __init__(self, config: Config, client: SupabaseRpcClient) -> None:
        self.config = config
        self.client = client
        self.execution_id = str(uuid.uuid4())
        self.drain_run_id: str | None = None
        self.claimed = 0
        self.requeued = 0
        self.settled = 0
        self.quarantined = 0
        self.failed = 0

    def log(self, event: str, **fields: Any) -> None:
        # Structured logs intentionally contain no service key, approval token,
        # approval hash, raw payload, signature, MSISDN, or provider secret.
        safe = {
            "event": event,
            "executionId": self.execution_id,
            "provider": self.config.provider,
            "providerAccountKey": self.config.provider_account_key,
            "environment": self.config.environment,
            "mode": self.config.mode,
        }
        safe.update(fields)
        print(json.dumps(safe, separators=(",", ":")), flush=True)

    def open_run(self) -> dict[str, Any]:
        result = self.client.call(
            "bank_webhook_remediation_open",
            {
                "p_provider": self.config.provider,
                "p_provider_account_key": self.config.provider_account_key,
                "p_environment": self.config.environment,
                "p_mode": self.config.mode,
                "p_max_items": self.config.max_items,
                "p_max_settlements": self.config.max_settlements,
                "p_approval_id": self.config.approval_id,
                "p_approval_token_hash": self.config.approval_token_hash,
                "p_requested_by": self.config.requested_by,
                "p_execution_id": self.execution_id,
            },
        )
        if not isinstance(result, dict) or not result.get("drainRunId"):
            raise WorkerError("remediation open returned no drain run")
        self.drain_run_id = str(result["drainRunId"])
        self.log("remediation_opened", drainRunId=self.drain_run_id)
        return result

    def lease_batch(self, limit: int) -> list[dict[str, Any]]:
        assert self.drain_run_id is not None
        result = self.client.call(
            "bank_webhook_remediation_lease",
            {"p_drain_run_id": self.drain_run_id, "p_limit": min(limit, MAX_BATCH)},
        )
        if not isinstance(result, dict) or not isinstance(result.get("items"), list):
            raise WorkerError("remediation lease returned an invalid batch")
        items: list[dict[str, Any]] = []
        for item in result["items"]:
            if not isinstance(item, dict) or not item.get("eventId") or not item.get("leaseToken"):
                raise WorkerError("remediation lease returned an invalid item")
            items.append(item)
        self.claimed += len(items)
        return items

    def classify(self, item: dict[str, Any]) -> dict[str, Any]:
        assert self.drain_run_id is not None
        result = self.client.call(
            "bank_webhook_remediation_classify",
            {
                "p_drain_run_id": self.drain_run_id,
                "p_event_id": item["eventId"],
                "p_lease_token": item["leaseToken"],
            },
        )
        if not isinstance(result, dict) or not result.get("classification"):
            raise WorkerError("remediation classify returned no classification")
        self.log(
            "remediation_classified",
            eventId=item["eventId"],
            classification=result["classification"],
            reasonCode=result.get("reasonCode"),
        )
        return result

    def mark_duplicate(self, item: dict[str, Any], reason: str) -> None:
        assert self.drain_run_id is not None
        self.client.call(
            "bank_webhook_remediation_mark_duplicate",
            {
                "p_drain_run_id": self.drain_run_id,
                "p_event_id": item["eventId"],
                "p_lease_token": item["leaseToken"],
                "p_reason": reason[:500],
            },
        )
        self.log("remediation_duplicate_closed", eventId=item["eventId"])

    def requeue(self, item: dict[str, Any], classification: dict[str, Any]) -> None:
        assert self.drain_run_id is not None
        expected_attempt = classification.get("expectedAttempt")
        if not isinstance(expected_attempt, int):
            raise WorkerError("safe classification returned no expected attempt")
        self.client.call(
            "bank_webhook_remediation_requeue",
            {
                "p_drain_run_id": self.drain_run_id,
                "p_event_id": item["eventId"],
                "p_lease_token": item["leaseToken"],
                "p_expected_attempt": expected_attempt,
                "p_classification": classification["classification"],
                "p_next_attempt_at": None,
            },
        )
        self.requeued += 1
        self.log(
            "remediation_requeued",
            eventId=item["eventId"],
            classification=classification["classification"],
        )

    def process(self, item: dict[str, Any]) -> dict[str, Any]:
        assert self.drain_run_id is not None
        result = self.client.call(
            "bank_webhook_remediation_process",
            {
                "p_drain_run_id": self.drain_run_id,
                "p_event_id": item["eventId"],
                "p_allow_settlement": self.config.mode == "DRAIN_SAFE_SETTLEMENTS",
                "p_execution_id": self.execution_id,
            },
        )
        if not isinstance(result, dict):
            raise WorkerError("remediation process returned an invalid result")
        status = str(result.get("status", "UNKNOWN"))
        self.log(
            "remediation_processed",
            eventId=item["eventId"],
            settlementStatus=status,
            replayed=bool(result.get("replayed", False)),
        )
        if status == "POSTED" and not bool(result.get("replayed", False)):
            self.settled += 1
        elif status == "FAILED" and not bool(result.get("replayed", False)):
            self.failed += 1
        return result

    def close(self, status: str, reason: str | None = None) -> None:
        if self.drain_run_id is None:
            return
        self.client.call(
            "bank_webhook_remediation_close",
            {
                "p_drain_run_id": self.drain_run_id,
                "p_status": status,
                "p_stop_reason": reason[:500] if reason else None,
            },
        )
        self.log("remediation_closed", drainRunId=self.drain_run_id, status=status, stopReason=reason)

    def run(self) -> dict[str, Any]:
        self.open_run()
        assert self.drain_run_id is not None
        try:
            while self.claimed < self.config.max_items:
                remaining = self.config.max_items - self.claimed
                items = self.lease_batch(min(MAX_BATCH, remaining))
                if not items:
                    break

                for item in items:
                    classification = self.classify(item)
                    kind = str(classification["classification"])

                    if kind == "DUPLICATE" or kind == "ALREADY_SETTLED":
                        self.mark_duplicate(item, str(classification.get("reasonCode", kind)))
                        continue
                    if kind not in SAFE_CLASSIFICATIONS:
                        self.quarantined += 1
                        self.log(
                            "remediation_left_quarantined",
                            eventId=item["eventId"],
                            classification=kind,
                            reasonCode=classification.get("reasonCode"),
                        )
                        continue

                    if self.config.mode == "DRY_RUN":
                        self.log("remediation_dry_run_safe_item", eventId=item["eventId"], classification=kind)
                        continue

                    self.requeue(item, classification)
                    if self.config.mode == "REQUEUE_ONLY":
                        continue

                    if self.settled >= self.config.max_settlements:
                        self.close("PAUSED", "settlement_cap_reached")
                        return self.summary("PAUSED", "settlement_cap_reached")

                    outcome = self.process(item)
                    if outcome.get("duplicatePostingDetected") or outcome.get("identityConflict") or outcome.get("amountMismatch") or outcome.get("currencyMismatch"):
                        raise WorkerError("financial safety circuit breaker opened")
                    if outcome.get("status") == "FAILED":
                        raise WorkerError("normal provider processor returned FAILED")

            self.close("COMPLETED")
            return self.summary("COMPLETED", None)
        except Exception as error:
            reason = self.redact_reason(str(error))
            try:
                self.close("ABORTED", reason)
            except Exception:
                self.log("remediation_close_failed")
            raise

    def summary(self, status: str, stop_reason: str | None) -> dict[str, Any]:
        return {
            "drainRunId": self.drain_run_id,
            "executionId": self.execution_id,
            "status": status,
            "stopReason": stop_reason,
            "claimed": self.claimed,
            "requeued": self.requeued,
            "settled": self.settled,
            "quarantined": self.quarantined,
            "failed": self.failed,
        }

    @staticmethod
    def redact_reason(reason: str) -> str:
        # RPC errors are already status-only, but retain a strict bounded reason
        # for the drain record and avoid accidentally persisting provider data.
        return " ".join(reason.split())[:500] or "worker_error"


def required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise WorkerError(f"missing required environment variable: {name}")
    return value


def validate_uuid(value: str, name: str) -> str:
    try:
        uuid.UUID(value)
    except ValueError as error:
        raise WorkerError(f"{name} must be a UUID") from error
    return value


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provider", required=True)
    parser.add_argument("--provider-account", required=True)
    parser.add_argument("--environment", choices=["STAGING", "PRODUCTION"], required=True)
    parser.add_argument(
        "--mode",
        choices=["DRY_RUN", "REQUEUE_ONLY", "DRAIN_SAFE_SETTLEMENTS"],
        default="DRY_RUN",
    )
    parser.add_argument("--max-items", type=int, default=25)
    parser.add_argument("--max-settlements", type=int, default=0)
    parser.add_argument("--requested-by", help="Requester profile UUID; required for mutating runs")
    parser.add_argument("--approval-id", help="Two-person approval UUID; required for mutating runs")
    parser.add_argument(
        "--approval-token-env",
        default="WEBHOOK_DRAIN_APPROVAL_TOKEN",
        help="Environment variable containing the one-use plaintext approval token",
    )
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT_SECONDS)
    return parser.parse_args(argv)


def build_config(args: argparse.Namespace) -> Config:
    if not args.provider.strip() or len(args.provider.strip()) > 80:
        raise WorkerError("provider must be non-empty and at most 80 characters")
    if not args.provider_account.strip() or len(args.provider_account.strip()) > 160:
        raise WorkerError("provider-account must be non-empty and at most 160 characters")
    if not 1 <= args.max_items <= MAX_ITEMS:
        raise WorkerError(f"max-items must be between 1 and {MAX_ITEMS}")
    if not 0 <= args.max_settlements <= MAX_SETTLEMENTS:
        raise WorkerError(f"max-settlements must be between 0 and {MAX_SETTLEMENTS}")
    if args.timeout <= 0 or args.timeout > 120:
        raise WorkerError("timeout must be greater than 0 and at most 120 seconds")

    mutating = args.mode != "DRY_RUN"
    if mutating:
        if not args.requested_by:
            raise WorkerError("requested-by is required for mutating runs")
        if not args.approval_id:
            raise WorkerError("approval-id is required for mutating runs")
        validate_uuid(args.requested_by, "requested-by")
        validate_uuid(args.approval_id, "approval-id")
        if args.mode == "DRAIN_SAFE_SETTLEMENTS" and args.max_settlements < 1:
            raise WorkerError("safe-settlement mode requires max-settlements >= 1")
        if args.mode == "REQUEUE_ONLY" and args.max_settlements != 0:
            raise WorkerError("requeue-only mode requires max-settlements = 0")
    elif args.max_settlements != 0:
        raise WorkerError("dry-run requires max-settlements = 0")

    approval_token = os.environ.get(args.approval_token_env) if mutating else None
    if mutating:
        if not approval_token:
            raise WorkerError(f"missing approval token environment variable: {args.approval_token_env}")
        if len(approval_token.encode("utf-8")) < 32:
            raise WorkerError("approval token must contain at least 32 UTF-8 bytes")

    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SECRET_KEY")
    if not service_role_key:
        raise WorkerError("missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY")

    return Config(
        supabase_url=required_env("SUPABASE_URL"),
        service_role_key=service_role_key,
        provider=args.provider.strip(),
        provider_account_key=args.provider_account.strip(),
        environment=args.environment,
        mode=args.mode,
        max_items=args.max_items,
        max_settlements=args.max_settlements,
        requested_by=args.requested_by,
        approval_id=args.approval_id,
        approval_token=approval_token,
        request_timeout=args.timeout,
    )


def main(argv: list[str] | None = None) -> int:
    try:
        args = parse_args(argv or sys.argv[1:])
        config = build_config(args)
        worker = RemediationWorker(config, SupabaseRpcClient(config))
        summary = worker.run()
        print(json.dumps(summary, separators=(",", ":")), flush=True)
        return 0
    except WorkerError as error:
        print(json.dumps({"event": "remediation_failed", "reason": str(error)}), file=sys.stderr, flush=True)
        return 2
    except KeyboardInterrupt:
        print(json.dumps({"event": "remediation_interrupted"}), file=sys.stderr, flush=True)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
