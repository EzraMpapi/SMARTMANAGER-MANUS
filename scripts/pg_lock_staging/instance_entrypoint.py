#!/usr/bin/env python3
"""Container entrypoint for one independent PostgreSQL lock-test instance."""

from __future__ import annotations

import os
import subprocess
import sys


def required(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"missing required environment variable: {name}")
    return value


def main() -> int:
    instance_name = sys.argv[1] if len(sys.argv) == 2 and sys.argv[1] == "--instance-name" else "instance"
    dsn = required("DATABASE_DSN")
    environment = os.environ.get("ENVIRONMENT", "staging")
    if environment != "staging":
        raise SystemExit("ENVIRONMENT must be staging; this image refuses local or production benchmark targets")

    output = os.environ.get("OUTPUT", f"/results/{instance_name}.json")
    command = [
        sys.executable,
        "/workspace/scripts/standing_order_webhook_multiprocess_load_test.py",
        "--backend", "postgres",
        "--environment", "staging",
        "--dsn", dsn,
        "--processes", os.environ.get("PROCESSES", "4"),
        "--batch-size", os.environ.get("BATCH_SIZE", "250"),
        "--hold-lock-ms", os.environ.get("HOLD_LOCK_MS", "2"),
        "--jitter-min-ms", os.environ.get("JITTER_MIN_MS", "0"),
        "--jitter-max-ms", os.environ.get("JITTER_MAX_MS", "0"),
        "--jitter-seed", os.environ.get("JITTER_SEED", "20260825"),
        "--mode", os.environ.get("MODE", "duplicates"),
        "--provider", os.environ.get("PROVIDER", "STAGING_TEST_PROVIDER"),
        "--provider-account-key", os.environ.get("PROVIDER_ACCOUNT_KEY", "staging-hot-account"),
        "--run-id", os.environ.get("RUN_ID", "pg-lock-staging-run"),
        "--output", output,
    ]
    print(f"{instance_name}: running isolated PostgreSQL benchmark; report={output}", flush=True)
    return subprocess.call(command)


if __name__ == "__main__":
    raise SystemExit(main())
