#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""

cleanup() {
    if [[ -n "$BACKEND_PID" ]]; then
        echo "Stopping backend (PID $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

backend_running() {
    curl -sf http://localhost:8080/api/todos > /dev/null 2>&1
}

echo "=== Cycle 1: Backend Tests (JUnit 5) ==="
mvn -f "$ROOT_DIR/apps/backend/pom.xml" --no-transfer-progress test

echo ""
echo "=== Cycle 2: Frontend Unit Tests (Vitest) ==="
(cd "$ROOT_DIR/apps/frontend" && npm run test:unit)

echo ""
echo "=== Cycle 3: E2E Tests (Playwright) ==="
if backend_running; then
    echo "Backend already running on port 8080."
else
    echo "Starting Spring Boot backend..."
    mvn -f "$ROOT_DIR/apps/backend/pom.xml" --no-transfer-progress spring-boot:run &
    BACKEND_PID=$!
    echo "Waiting for backend..."
    until backend_running; do sleep 2; done
    echo "Backend ready."
fi

(cd "$ROOT_DIR/apps/frontend" && npm run test:e2e)

echo ""
echo "All test cycles passed."
