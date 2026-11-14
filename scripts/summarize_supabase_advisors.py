#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: summarize_supabase_advisors.py <advisor-json>")
    payload = json.loads(Path(sys.argv[1]).read_text())
    lints = payload.get("result", {}).get("lints", [])
    by_name = Counter(str(item.get("name", "unknown")) for item in lints)
    by_level = Counter(str(item.get("level", "unknown")) for item in lints)
    objects: dict[str, set[str]] = defaultdict(set)
    for item in lints:
        meta = item.get("metadata") or {}
        key = f"{meta.get('schema', '')}.{meta.get('name', '')}".strip('.')
        if key:
            objects[str(item.get("name", "unknown"))].add(key)
    print(json.dumps({
        "total": len(lints),
        "byName": dict(sorted(by_name.items())),
        "byLevel": dict(sorted(by_level.items())),
        "objectsByLint": {key: sorted(value)[:100] for key, value in sorted(objects.items())},
        "titles": sorted({str(item.get('title', '')) for item in lints}),
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
