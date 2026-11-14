#!/usr/bin/env python3
"""Aggregate local webhook load-test JSON reports."""
from __future__ import annotations

import glob
import json
import statistics

reports = []
for path in sorted(glob.glob("/tmp/webhook-local-c[0-9]*.json")):
    if path.endswith(".stdout.json"):
        continue
    with open(path, encoding="utf-8") as handle:
        report = json.load(handle)
    duplicate = report["duplicateBatch"]
    conflict = report["conflictBatch"]
    reports.append({
        "concurrency": report["concurrency"],
        "requests": report["requestsPerBatch"],
        "duplicate": duplicate,
        "conflict": conflict,
    })

summary = []
for item in reports:
    duplicate = item["duplicate"]
    conflict = item["conflict"]
    summary.append({
        "concurrency": item["concurrency"],
        "requests": item["requests"],
        "duplicateLatencyP50Ms": duplicate["latencyMs"]["p50"],
        "duplicateLatencyP95Ms": duplicate["latencyMs"]["p95"],
        "duplicateLatencyP99Ms": duplicate["latencyMs"]["p99"],
        "duplicateLockWaitP50Ms": duplicate["emulatedAdvisoryLockWaitMs"]["p50"],
        "duplicateLockWaitP95Ms": duplicate["emulatedAdvisoryLockWaitMs"]["p95"],
        "duplicateLockWaitP99Ms": duplicate["emulatedAdvisoryLockWaitMs"]["p99"],
        "conflictLatencyP50Ms": conflict["latencyMs"]["p50"],
        "conflictLatencyP95Ms": conflict["latencyMs"]["p95"],
        "conflictLatencyP99Ms": conflict["latencyMs"]["p99"],
        "conflictLockWaitP50Ms": conflict["emulatedAdvisoryLockWaitMs"]["p50"],
        "conflictLockWaitP95Ms": conflict["emulatedAdvisoryLockWaitMs"]["p95"],
        "conflictLockWaitP99Ms": conflict["emulatedAdvisoryLockWaitMs"]["p99"],
        "duplicateInvariantPassed": duplicate["errors"] == 0 and duplicate["uniqueEventCount"] == 1 and duplicate["replayedResponses"] == item["requests"] - 1,
        "conflictInvariantPassed": conflict["errors"] == 0 and conflict["uniqueEventCount"] == 1 and conflict["conflictResponses"] == item["requests"] and conflict["processingStatuses"].get("NEEDS_ATTENTION") == item["requests"],
    })

concurrency = [row["concurrency"] for row in summary]
max_duplicate_p95 = max(row["duplicateLatencyP95Ms"] for row in summary) if summary else None
max_conflict_p95 = max(row["conflictLatencyP95Ms"] for row in summary) if summary else None
result = {
    "backend": "local-sqlite-emulator",
    "reports": summary,
    "allDuplicateInvariantsPassed": all(row["duplicateInvariantPassed"] for row in summary),
    "allConflictInvariantsPassed": all(row["conflictInvariantPassed"] for row in summary),
    "maxDuplicateP95Ms": max_duplicate_p95,
    "maxConflictP95Ms": max_conflict_p95,
    "concurrencyLevels": concurrency,
    "interpretation": [
        "The named mutex emulates provider-account advisory-lock serialization; it is not PostgreSQL pg_advisory_xact_lock.",
        "Latency includes local Python scheduling, SQLite transaction work, and mutex wait.",
        "Results are algorithmic regression evidence only and must not be used as staging capacity targets.",
    ],
}
print(json.dumps(result, indent=2, sort_keys=True))
