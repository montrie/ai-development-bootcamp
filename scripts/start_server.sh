#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

nohup python3 -m http.server 8080 \
  --directory "$ROOT_DIR/src" \
  >> "$ROOT_DIR/server.log" 2>&1 &
printf '%s\n' "$!" > "$ROOT_DIR/server.pid"
echo "Server started on port 8080 (PID $(cat "$ROOT_DIR/server.pid"))"
