#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  echo "Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend..."
mvn -f "$ROOT_DIR/apps/backend/pom.xml" spring-boot:run &
BACKEND_PID=$!

echo "Waiting for backend on port 8080..."
until curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1 \
  || curl -sf http://localhost:8080/api/todos > /dev/null 2>&1; do
  sleep 2
done
echo "Backend ready."

echo "Starting frontend..."
(cd "$ROOT_DIR/apps/frontend" && npm run dev)
