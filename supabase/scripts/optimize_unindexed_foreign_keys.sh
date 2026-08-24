#!/usr/bin/env bash
set -Eeuo pipefail

# Generate or apply indexes for Supabase-reported unindexed foreign keys.
# Safety defaults: plan only, public schema only, advisor allowlist only,
# no partial-index assumptions, max 25 indexes per run, and no DDL unless
# CONFIRM_FK_INDEX_DDL=YES is explicitly present.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_TARGETS_FILE="$SCRIPT_DIR/fk-index-advisor-targets-20260823.txt"
CONNECTION_STRING="${DATABASE_URL:-${SUPABASE_DB_URL:-}}"
TARGETS_FILE="$DEFAULT_TARGETS_FILE"
MODE="plan"
INCLUDE_EMPTY=0
MIN_ROWS=100
MAX_INDEXES=25
OUTPUT_FILE=""

usage() {
  cat <<'USAGE'
Usage:
  optimize_unindexed_foreign_keys.sh [options]

Modes:
  --plan                    Generate an SQL plan only (default).
  --apply                   Execute selected CREATE INDEX statements.

Options:
  --targets-file PATH       Allowlisted table|constraint manifest.
  --catalog                 Discover all catalog gaps instead of the advisor manifest.
  --include-empty           Include tables with zero estimated live rows when applying.
  --min-rows N              Minimum estimated live rows for apply mode (default: 100).
  --max-indexes N           Maximum indexes to create in one run (default: 25).
  --output PATH             Write the generated plan to PATH.
  --help                    Show this help.

Required for --apply:
  DATABASE_URL or SUPABASE_DB_URL must contain a PostgreSQL connection string.
  CONFIRM_FK_INDEX_DDL=YES must be set explicitly.

The script never changes foreign keys, RLS, grants, or existing indexes. It only
creates a missing, non-partial B-tree index whose leading columns exactly match
the referenced foreign-key columns. It processes one CREATE INDEX CONCURRENTLY
statement at a time and stops on the first failure.
USAGE
}

USE_CATALOG=0
while (($#)); do
  case "$1" in
    --plan) MODE="plan" ;;
    --apply) MODE="apply" ;;
    --targets-file) TARGETS_FILE="${2:?Missing path after --targets-file}"; shift ;;
    --catalog) USE_CATALOG=1 ;;
    --include-empty) INCLUDE_EMPTY=1 ;;
    --min-rows) MIN_ROWS="${2:?Missing integer after --min-rows}"; shift ;;
    --max-indexes) MAX_INDEXES="${2:?Missing integer after --max-indexes}"; shift ;;
    --output) OUTPUT_FILE="${2:?Missing path after --output}"; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

if ! [[ "$MIN_ROWS" =~ ^[0-9]+$ && "$MAX_INDEXES" =~ ^[0-9]+$ && "$MAX_INDEXES" -gt 0 ]]; then
  echo "--min-rows and --max-indexes must be non-negative integers; --max-indexes must be > 0." >&2
  exit 2
fi

if [[ "$MODE" == "apply" && "${CONFIRM_FK_INDEX_DDL:-}" != "YES" ]]; then
  echo "Refusing to apply DDL. Re-run with CONFIRM_FK_INDEX_DDL=YES after reviewing the generated plan." >&2
  exit 3
fi

if [[ -z "$CONNECTION_STRING" ]]; then
  echo "Missing DATABASE_URL or SUPABASE_DB_URL. The script requires a PostgreSQL connection string." >&2
  exit 3
fi

if [[ "$USE_CATALOG" -eq 0 && ! -f "$TARGETS_FILE" ]]; then
  echo "Target manifest not found: $TARGETS_FILE" >&2
  exit 3
fi

PSQL=(psql "$CONNECTION_STRING" -X -v ON_ERROR_STOP=1 -qAt)

# Return tab-separated rows:
# status | table | constraint | columns | estimated rows | deterministic index name | CREATE statement
# The pg_index indkey vector is zero-based, hence the [0:n-1] slice.
CATALOG_SQL=$(cat <<'SQL'
WITH foreign_keys AS (
  SELECT
    c.oid AS constraint_oid,
    c.conname,
    c.conkey,
    child.oid AS child_oid,
    child.relname AS table_name,
    GREATEST(COALESCE(st.n_live_tup, 0), 0)::bigint AS estimated_rows
  FROM pg_constraint c
  JOIN pg_class child ON child.oid = c.conrelid
  JOIN pg_namespace ns ON ns.oid = child.relnamespace
  LEFT JOIN pg_stat_user_tables st ON st.relid = child.oid
  WHERE c.contype = 'f'
    AND ns.nspname = 'public'
), resolved AS (
  SELECT
    fk.*,
    string_agg(format('%I', a.attname), ', ' ORDER BY k.ordinality) AS index_columns,
    bool_or(
      i.indexrelid IS NOT NULL
      AND i.indisvalid
      AND i.indpred IS NULL
      AND i.indnkeyatts >= cardinality(fk.conkey)
      AND i.indkey[0:cardinality(fk.conkey) - 1]::int[] = fk.conkey::int[]
    ) AS is_covered
  FROM foreign_keys fk
  CROSS JOIN LATERAL unnest(fk.conkey) WITH ORDINALITY AS k(attnum, ordinality)
  JOIN pg_attribute a ON a.attrelid = fk.child_oid AND a.attnum = k.attnum
  LEFT JOIN pg_index i ON i.indrelid = fk.child_oid
  GROUP BY fk.constraint_oid, fk.conname, fk.conkey, fk.child_oid, fk.table_name, fk.estimated_rows
), candidates AS (
  SELECT
    CASE WHEN is_covered THEN 'covered' ELSE 'missing' END AS status,
    table_name,
    conname AS constraint_name,
    index_columns,
    estimated_rows,
    left(format('%s_%s_fk_idx', table_name, conname), 54)
      || '_' || substr(md5(table_name || ':' || conname), 1, 8) AS index_name
  FROM resolved
), missing AS (
  SELECT
    CASE WHEN existing_ns.oid IS NULL THEN 'missing' ELSE 'name_conflict' END AS status,
    c.table_name,
    c.constraint_name,
    c.index_columns,
    c.estimated_rows,
    c.index_name,
    format('CREATE INDEX CONCURRENTLY IF NOT EXISTS %I ON public.%I (%s);', c.index_name, c.table_name, c.index_columns) AS statement
  FROM candidates c
  LEFT JOIN pg_class existing ON existing.relname = c.index_name
  LEFT JOIN pg_namespace existing_ns ON existing_ns.oid = existing.relnamespace AND existing_ns.nspname = 'public'
  WHERE c.status = 'missing'
)
SELECT
  status || E'\t' || table_name || E'\t' || constraint_name || E'\t' || index_columns || E'\t'
  || estimated_rows::text || E'\t' || index_name || E'\t' || statement
FROM missing
ORDER BY estimated_rows DESC, table_name, constraint_name;
SQL
)

FILTER_SQL=""
if [[ "$USE_CATALOG" -eq 0 ]]; then
  FILTER_SQL=$(cat <<SQL
AND EXISTS (
  SELECT 1
  FROM regexp_split_to_table(:'targets', E'\\n') AS target(line)
  WHERE btrim(target.line) <> ''
    AND split_part(target.line, '|', 1) = table_name
    AND split_part(target.line, '|', 2) = constraint_name
)
SQL
  )
fi

# Inject the allowlist predicate into the candidate query before the final ORDER BY.
if [[ "$USE_CATALOG" -eq 0 ]]; then
  CATALOG_SQL="${CATALOG_SQL/WHERE status = 'missing'/WHERE status = 'missing' $FILTER_SQL}"
fi

TARGETS_CONTENT=""
if [[ "$USE_CATALOG" -eq 0 ]]; then
  TARGETS_CONTENT="$(cat "$TARGETS_FILE")"
fi

# psql variables are passed without appearing in process arguments beyond the
# connection command; the manifest itself is a reviewed repository file.
PLAN_ROWS="$(printf '%s\n' "$TARGETS_CONTENT" | "${PSQL[@]}" -v targets="$TARGETS_CONTENT" -c "$CATALOG_SQL")"
PLAN_PATH="${OUTPUT_FILE:-${PWD}/fk-index-optimization-plan-$(date -u +%Y%m%dT%H%M%SZ).sql}"

{
  echo "-- Generated by supabase/scripts/optimize_unindexed_foreign_keys.sh"
  echo "-- Mode: $MODE"
  echo "-- Source: $([[ "$USE_CATALOG" -eq 1 ]] && echo catalog || echo advisor allowlist: "$TARGETS_FILE")"
  echo "-- Generated at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "-- This file is a review artifact. It is not executed automatically in plan mode."
  echo
} > "$PLAN_PATH"

candidate_count=0
eligible_count=0
while IFS=$'\t' read -r status table constraint columns estimated_rows index_name statement; do
  [[ -z "${table:-}" ]] && continue
  candidate_count=$((candidate_count + 1))
  if [[ "$status" == "name_conflict" ]]; then
    printf -- '-- skipped: generated index name already exists in public.%s (%s; index=%s)\n' "$table" "$constraint" "$index_name" >> "$PLAN_PATH"
  elif [[ "$INCLUDE_EMPTY" -eq 1 || "$estimated_rows" -ge "$MIN_ROWS" ]]; then
    eligible_count=$((eligible_count + 1))
    printf '%s\n' "$statement" >> "$PLAN_PATH"
  else
    printf -- '-- deferred: %s (%s; estimated rows=%s below min=%s)\n' "$statement" "$table" "$estimated_rows" "$MIN_ROWS" >> "$PLAN_PATH"
  fi
done <<< "$PLAN_ROWS"

if [[ "$MODE" == "plan" ]]; then
  echo "Wrote review plan: $PLAN_PATH"
  echo "Missing FK candidates discovered: $candidate_count"
  echo "Eligible under current apply threshold: $eligible_count (min rows=$MIN_ROWS; include empty=$INCLUDE_EMPTY)"
  echo "No production DDL was executed."
  exit 0
fi

if [[ "$eligible_count" -gt "$MAX_INDEXES" ]]; then
  echo "Refusing bulk apply: $eligible_count indexes are eligible but --max-indexes is $MAX_INDEXES." >&2
  echo "Review $PLAN_PATH and rerun with a smaller target manifest or a deliberate higher cap." >&2
  exit 4
fi

if [[ "$eligible_count" -eq 0 ]]; then
  echo "No eligible indexes under the current threshold. Review $PLAN_PATH." >&2
  exit 0
fi

echo "Applying $eligible_count CREATE INDEX CONCURRENTLY statements from $PLAN_PATH"
while IFS= read -r statement; do
  [[ -z "$statement" || "$statement" == --* ]] && continue
  echo "Applying: $statement"
  "${PSQL[@]}" -c "$statement"
done < "$PLAN_PATH"

echo "Applied $eligible_count indexes successfully. Re-run Supabase performance advisors and EXPLAIN plans before widening scope."
