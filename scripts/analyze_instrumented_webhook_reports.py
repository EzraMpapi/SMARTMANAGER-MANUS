#!/usr/bin/env python3
"""Aggregate instrumented local webhook benchmark reports."""
from __future__ import annotations

import glob
import json


def workload_row(report: dict, label: str) -> dict:
    batch = report[label]
    latency = batch["latencyMs"]
    lock = batch["emulatedAdvisoryLockWaitMs"]
    txn = batch["sqliteCriticalSectionMs"]
    begin = batch["sqliteBeginImmediateMs"]
    jitter = batch["networkJitterEmulatedMs"]
    return {
        "label": label,
        "batchSize": report["batchSize"],
        "concurrency": report["concurrency"],
        "jitterMinMs": report["jitterMinMs"],
        "jitterMaxMs": report["jitterMaxMs"],
        "requests": batch["requests"],
        "latencyP50Ms": latency["p50"],
        "latencyP95Ms": latency["p95"],
        "latencyP99Ms": latency["p99"],
        "latencyMeanMs": latency["mean"],
        "lockWaitP50Ms": lock["p50"],
        "lockWaitP95Ms": lock["p95"],
        "lockWaitP99Ms": lock["p99"],
        "lockWaitMeanMs": lock["mean"],
        "txnWorkP50Ms": txn["p50"],
        "txnWorkP95Ms": txn["p95"],
        "txnWorkP99Ms": txn["p99"],
        "txnWorkMeanMs": txn["mean"],
        "beginP95Ms": begin["p95"],
        "jitterP50Ms": jitter["p50"],
        "jitterP95Ms": jitter["p95"],
        "jitterP99Ms": jitter["p99"],
        "duplicateOrConflictCount": batch["replayedResponses"] + batch["conflictResponses"],
        "uniqueEventCount": batch["uniqueEventCount"],
        "errors": batch["errors"],
        "invariantPassed": (
            batch["errors"] == 0
            and batch["uniqueEventCount"] == 1
            and (batch["replayedResponses"] == report["batchSize"] - 1 if label == "duplicateBatch" else batch["conflictResponses"] == report["batchSize"])
        ),
        "approxMeanLockShare": round(lock["mean"] / latency["mean"], 4) if latency["mean"] else None,
    }

unique_reports: dict[tuple, dict] = {}
for path in glob.glob("/tmp/webhook-instrumented-[0-9]*.json"):
    if path.endswith(".stdout.json"):
        continue
    with open(path, encoding="utf-8") as handle:
        report = json.load(handle)
    key = (report["batchSize"], report["concurrency"], report["jitterMinMs"], report["jitterMaxMs"])
    unique_reports[key] = report

rows = []
for key in sorted(unique_reports):
    report = unique_reports[key]
    rows.extend([workload_row(report, "duplicateBatch"), workload_row(report, "conflictBatch")])

result = {
    "backend": "local-sqlite-emulator",
    "uniqueConfigurations": len(unique_reports),
    "rows": rows,
    "allInvariantsPassed": all(item["invariantPassed"] for item in rows),
    "interpretation": [
        "Mutex wait is the direct hot-key serialization component in this emulator.",
        "SQLite transaction work includes BEGIN IMMEDIATE, indexed replay/identity reads, writes, and commit.",
        "Injected jitter is deliberately outside the lock and models pre-claim network delay; it should not be mistaken for database contention.",
        "PostgreSQL comparison remains analytical because no PostgreSQL server was available for an identical run.",
    ],
}
print(json.dumps(result, indent=2, sort_keys=False))
