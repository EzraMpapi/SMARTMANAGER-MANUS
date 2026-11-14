#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/scripts/pg_lock_staging/docker-compose.yml"
ACTION="${1:-up}"

if [[ "${ENVIRONMENT:-}" != "staging" ]]; then
  echo "Refusing to run: ENVIRONMENT must equal staging." >&2
  exit 2
fi
if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "Refusing to run: set POSTGRES_PASSWORD to a disposable staging-only value." >&2
  exit 2
fi
if [[ ! "$POSTGRES_PASSWORD" =~ ^[A-Za-z0-9._-]{16,}$ ]]; then
  echo "Refusing to run: POSTGRES_PASSWORD must be at least 16 characters using only A-Z, a-z, 0-9, dot, underscore, or hyphen." >&2
  exit 2
fi
if [[ "${DATABASE_DSN:-}" == *"rlhngsrihahhyxnjxrxm"* || "${DATABASE_DSN:-}" == *"supabase.co"* ]]; then
  echo "Refusing to run: managed/production-looking DATABASE_DSN is not permitted." >&2
  exit 2
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to provision this package; no changes were made." >&2
  exit 127
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required; no changes were made." >&2
  exit 127
fi

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

case "$ACTION" in
  up)
    compose up -d postgres
    compose ps
    ;;
  run)
    : "${RUN_ID:=pg-lock-staging-$(date -u +%Y%m%dT%H%M%SZ)}"
    export RUN_ID
    compose up -d postgres
    compose up --build instance_a instance_b
    a_id="$(compose ps -q --all instance_a)"
    b_id="$(compose ps -q --all instance_b)"
    a_code="$(docker inspect --format '{{.State.ExitCode}}' "$a_id")"
    b_code="$(docker inspect --format '{{.State.ExitCode}}' "$b_id")"
    if [[ "$a_code" != "0" || "$b_code" != "0" ]]; then
      echo "Benchmark instance failure: instance_a=$a_code instance_b=$b_code" >&2
      exit 1
    fi
    ;;
  status)
    compose ps
    ;;
  logs)
    compose logs --tail="${LOG_LINES:-200}" postgres instance_a instance_b
    ;;
  down)
    compose down
    ;;
  destroy-data)
    if [[ "${CONFIRM_DESTROY_STAGING_DATA:-}" != "YES" ]]; then
      echo "Refusing to remove the database volume. Set CONFIRM_DESTROY_STAGING_DATA=YES explicitly." >&2
      exit 2
    fi
    compose down --volumes
    ;;
  *)
    echo "Usage: ENVIRONMENT=staging POSTGRES_PASSWORD=... $0 {up|run|status|logs|down|destroy-data}" >&2
    exit 2
    ;;
esac
