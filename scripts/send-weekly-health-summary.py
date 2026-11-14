#!/usr/bin/env python3
"""Send a weekly, read-only summary of daily schema-health workflow outcomes.

All mail-routing values are supplied at runtime as GitHub Actions secrets. This
script performs no database access, GitHub mutation, or remediation action.
"""

from __future__ import annotations

import json
import os
import smtplib
import ssl
import sys
from collections import Counter
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage
from pathlib import Path


REQUIRED_ENVIRONMENT = (
    "SCHEMA_HEALTH_WEEKLY_EMAIL_TO",
    "SCHEMA_HEALTH_SMTP_FROM",
    "SCHEMA_HEALTH_SMTP_HOST",
    "SCHEMA_HEALTH_SMTP_PORT",
    "SCHEMA_HEALTH_SMTP_USERNAME",
    "SCHEMA_HEALTH_SMTP_PASSWORD",
)


def require_environment() -> dict[str, str]:
    missing = [name for name in REQUIRED_ENVIRONMENT if not os.environ.get(name)]
    if missing:
        print(
            "BLOCKED: configure the required encrypted GitHub Actions secrets: "
            + ", ".join(missing),
            file=sys.stderr,
        )
        raise SystemExit(64)
    return {name: os.environ[name] for name in REQUIRED_ENVIRONMENT}


def read_runs(path: Path) -> list[dict[str, object]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"BLOCKED: cannot read weekly health-run metadata: {error}", file=sys.stderr)
        raise SystemExit(65) from error

    runs = payload.get("workflow_runs")
    if not isinstance(runs, list):
        print("BLOCKED: GitHub Actions response has no workflow_runs list.", file=sys.stderr)
        raise SystemExit(65)
    return [run for run in runs if isinstance(run, dict)]


def build_report(runs: list[dict[str, object]]) -> str:
    now = datetime.now(UTC)
    window_start = now - timedelta(days=7)
    conclusions = Counter(str(run.get("conclusion") or "in_progress") for run in runs)
    completed = sum(count for conclusion, count in conclusions.items() if conclusion != "in_progress")
    successful = conclusions["success"]
    failed = sum(
        count
        for conclusion, count in conclusions.items()
        if conclusion not in {"success", "in_progress"}
    )
    repository = os.environ.get("GITHUB_REPOSITORY", "SMART MANAGER repository")
    revision = os.environ.get("GITHUB_SHA", "unknown")

    detail_lines = []
    for run in sorted(runs, key=lambda item: str(item.get("created_at", "")), reverse=True):
        created = str(run.get("created_at", "unknown time"))
        conclusion = str(run.get("conclusion") or "in progress")
        url = str(run.get("html_url") or "unavailable")
        detail_lines.append(f"- {created}: {conclusion} — {url}")

    status = "ATTENTION REQUIRED" if failed else "HEALTHY"
    report = [
        f"SMART MANAGER weekly verification summary — {status}",
        "",
        f"Reporting window: {window_start:%Y-%m-%d %H:%M UTC} to {now:%Y-%m-%d %H:%M UTC}",
        f"Repository: {repository}",
        f"Reporting revision: {revision}",
        "",
        "Daily read-only schema-health and GitHub synchronization workflow:",
        f"- Runs observed: {len(runs)}",
        f"- Completed: {completed}",
        f"- Successful: {successful}",
        f"- Attention required: {failed}",
        f"- Still in progress: {conclusions['in_progress']}",
        "",
    ]

    if detail_lines:
        report.extend(["Run details:", *detail_lines, ""])
    else:
        report.extend(
            [
                "No daily workflow runs were observed in this window.",
                "Confirm that the daily workflow is enabled and that its required read-only database secret is configured.",
                "",
            ]
        )

    report.extend(
        [
            "Operating boundary:",
            "This summary is informational only. It performs no migration, seed, database mutation, permission change, commit, push, release, deployment, or automatic remediation.",
            "Investigate any non-successful run through a separate manually approved change process.",
        ]
    )
    return "\n".join(report)


def send_message(environment: dict[str, str], report: str) -> None:
    message = EmailMessage()
    attention_required = "ATTENTION REQUIRED" in report
    message["Subject"] = (
        "[Action required] SMART MANAGER weekly health summary"
        if attention_required
        else "SMART MANAGER weekly health summary"
    )
    message["From"] = environment["SCHEMA_HEALTH_SMTP_FROM"]
    message["To"] = environment["SCHEMA_HEALTH_WEEKLY_EMAIL_TO"]
    message.set_content(report)

    port = int(environment["SCHEMA_HEALTH_SMTP_PORT"])
    context = ssl.create_default_context()
    if port == 465:
        with smtplib.SMTP_SSL(environment["SCHEMA_HEALTH_SMTP_HOST"], port, context=context) as server:
            server.login(
                environment["SCHEMA_HEALTH_SMTP_USERNAME"],
                environment["SCHEMA_HEALTH_SMTP_PASSWORD"],
            )
            server.send_message(message)
    else:
        with smtplib.SMTP(environment["SCHEMA_HEALTH_SMTP_HOST"], port) as server:
            server.starttls(context=context)
            server.login(
                environment["SCHEMA_HEALTH_SMTP_USERNAME"],
                environment["SCHEMA_HEALTH_SMTP_PASSWORD"],
            )
            server.send_message(message)


def main() -> None:
    environment = require_environment()
    runs_path = Path(os.environ.get("HEALTH_RUNS_FILE", "weekly-health-runs.json"))
    report = build_report(read_runs(runs_path))
    send_message(environment, report)
    print("Weekly health summary email sent.")


if __name__ == "__main__":
    main()
