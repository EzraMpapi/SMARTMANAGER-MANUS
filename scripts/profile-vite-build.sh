#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.build-profile"
LOG_FILE="$LOG_DIR/vite-memory-samples.tsv"
BUILD_LOG="$LOG_DIR/vite-build.log"

rm -rf "$LOG_DIR"
mkdir -p "$LOG_DIR"
printf 'elapsed_seconds\tpid\tppid\trss_kib\tcommand\n' > "$LOG_FILE"

cd "$ROOT_DIR"
if [ "$#" -eq 0 ]; then
  set -- build --mode e2e
fi

NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2304}" pnpm exec vite "$@" >"$BUILD_LOG" 2>&1 &
BUILD_PID=$!
START_SECONDS=$SECONDS

while kill -0 "$BUILD_PID" 2>/dev/null; do
  ELAPSED=$((SECONDS - START_SECONDS))
  ps -eo pid=,ppid=,rss=,args= | awk -v root="$BUILD_PID" -v elapsed="$ELAPSED" '
    $1 == root || $2 == root || /node .*vite/ || /rollup/ {
      gsub(/\t/, " ", $0)
      printf "%s\t%s\t%s\t%s\t%s\n", elapsed, $1, $2, $3, substr($0, index($0, $4))
    }
  ' >> "$LOG_FILE"
  sleep 1
done

wait "$BUILD_PID"
