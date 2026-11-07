#!/usr/bin/env python3
"""Generate a conservative repository-to-live Supabase inventory.

This is an audit aid, not a schema migrator. It reports probable table
references and flags candidates for manual review; it does not infer that every
missing candidate should be created.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIVE_TABLES_JSON = Path(
    "/home/ubuntu/.mcp/tool-results/2026-08-25_20-12-46.424883044_supabase_list_tables_4fe29167.json"
)
SOURCE_ROOTS = [ROOT / "client", ROOT / "server", ROOT / "shared"]
SOURCE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".mjs"}


def add_match(bucket: dict[str, set[str]], name: str, path: Path) -> None:
    normalized = name.strip().strip('"`\'').lower()
    if normalized:
        bucket.setdefault(normalized, set()).add(str(path.relative_to(ROOT)))


def source_files() -> list[Path]:
    return [
        path
        for root in SOURCE_ROOTS
        for path in root.rglob("*")
        if path.suffix in SOURCE_EXTENSIONS and "node_modules" not in path.parts
    ]


def source_references(known_tables: set[str]) -> dict[str, set[str]]:
    refs: dict[str, set[str]] = {}
    string_pattern = re.compile(r"\.from\(\s*['\"]([A-Za-z0-9_]+)['\"]\s*\)")
    public_pattern = re.compile(r"(?<![A-Za-z0-9_])public\.([A-Za-z][A-Za-z0-9_]*)(?![A-Za-z0-9_])", re.I)
    for path in source_files():
        try:
            text = path.read_text(errors="ignore")
        except OSError:
            continue
        for match in string_pattern.finditer(text):
            name = match.group(1).lower()
            if name in known_tables:
                add_match(refs, name, path)
        for match in public_pattern.finditer(text):
            name = match.group(1).lower()
            if name in known_tables:
                add_match(refs, name, path)
    return refs


def migration_tables() -> dict[str, set[str]]:
    tables: dict[str, set[str]] = {}
    pattern = re.compile(
        r"\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?"
        r"(?:(public|[A-Za-z][A-Za-z0-9_]*)\.)?['\"`]?"
        r"([A-Za-z][A-Za-z0-9_]*)['\"`]?\b",
        re.I,
    )
    for path in (ROOT / "supabase" / "migrations").glob("*.sql"):
        try:
            text = path.read_text(errors="ignore")
        except OSError:
            continue
        for match in pattern.finditer(text):
            schema = (match.group(1) or "public").lower()
            tables.setdefault(f"{schema}.{match.group(2).lower()}", set()).add(path.name)
    return tables


def live_tables() -> set[str]:
    if not LIVE_TABLES_JSON.exists():
        return set()
    payload = json.loads(LIVE_TABLES_JSON.read_text())
    return {
        str(row.get("name", "")).lower()
        for row in payload.get("tables", [])
        if row.get("name")
    }


def main() -> None:
    migrations = migration_tables()
    live = live_tables()
    known_public_tables = {name.split(".", 1)[1] for name in live if name.startswith("public.")}
    known_public_tables.update(
        name.split(".", 1)[1]
        for name in migrations
        if name.startswith("public.")
    )
    refs = source_references(known_public_tables)
    referenced_tables = {f"public.{name}" for name in refs}
    migration_missing = sorted(name for name in migrations if name not in live)
    references_missing = sorted(name for name in referenced_tables if name not in live)
    print(
        json.dumps(
            {
                "sourceFilesScanned": len(source_files()),
                "knownLivePublicTables": len(
                    {name for name in live if name.startswith("public.")}
                ),
                "tablesReferencedBySource": len(referenced_tables),
                "migrationDefinedTables": len(migrations),
                "liveTables": len(live),
                "migrationTablesMissingFromLive": migration_missing,
                "probableSourceReferencesMissingFromLive": references_missing,
                "probableSourceReferenceDetails": {
                    name: sorted(refs.get(name.split(".", 1)[1], set()))[:8]
                    for name in references_missing
                },
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
