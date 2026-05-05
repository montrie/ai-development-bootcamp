#!/usr/bin/env bash
# Exit immediately on error, treat unset variables as errors, propagate pipe failures.
set -euo pipefail

# Resolve the repo root regardless of where the script is called from.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── GCP config ────────────────────────────────────────────────────────────────
PROJECT_ID="todo-app-495408"
REGION="europe-west3"
SA_EMAIL="todo-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Tag images with the current git commit SHA so each deploy is traceable.
SHORT_SHA=$(git -C "$ROOT_DIR" rev-parse --short HEAD)
BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/todo-app/backend:${SHORT_SHA}"
FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/todo-app/frontend:${SHORT_SHA}"
# ──────────────────────────────────────────────────────────────────────────────

echo "==> Ensuring Cloud SQL instance is running..."
# Read the current activation policy (ALWAYS = running, NEVER = stopped).
ACTIVATION=$(gcloud sql instances describe todo-db \
  --format="value(settings.activationPolicy)" --project="${PROJECT_ID}")
if [[ "${ACTIVATION}" != "ALWAYS" ]]; then
  # Start the instance. --async returns immediately instead of waiting for the
  # operation to complete (which can time out the gcloud CLI).
  gcloud sql instances patch todo-db \
    --activation-policy=ALWAYS --project="${PROJECT_ID}" --quiet --async
  echo "    Instance started. Waiting for it to become ready..."
  # Poll every 5 seconds until the instance reports RUNNABLE.
  until [[ "$(gcloud sql instances describe todo-db \
      --format='value(state)' --project="${PROJECT_ID}")" == "RUNNABLE" ]]; do
    sleep 5
  done
  echo "    Cloud SQL ready."
else
  echo "    Already running."
fi

# Authorise Docker to push images to this project's Artifact Registry.
# --quiet suppresses the confirmation prompt.
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "==> Building and pushing backend (${SHORT_SHA})..."
# Build the backend image using apps/backend/Dockerfile.
docker build -t "${BACKEND_IMAGE}" "${ROOT_DIR}/apps/backend/"
# Push the image to Artifact Registry so Cloud Run can pull it.
docker push "${BACKEND_IMAGE}"

echo "==> Building and pushing frontend (${SHORT_SHA})..."
# Build the production frontend image (nginx + React SPA) using Dockerfile.prod.
docker build -t "${FRONTEND_IMAGE}" -f "${ROOT_DIR}/apps/frontend/Dockerfile.prod" "${ROOT_DIR}/apps/frontend/"
docker push "${FRONTEND_IMAGE}"

# Fetch the Cloud SQL connection name (format: project:region:instance).
# Used in --add-cloudsql-instances and the JDBC URL below.
CONNECTION_NAME=$(gcloud sql instances describe todo-db \
  --format="value(connectionName)" --project="${PROJECT_ID}")

echo "==> Deploying backend to Cloud Run..."
# --allow-unauthenticated: make the service publicly accessible without authentication.
# --port=8080: Cloud Run routes external traffic to this container port.
# --add-cloudsql-instances: mounts the Cloud SQL Unix socket so the app connects without a public IP.
# --service-account: run as the deployer SA (least-privilege).
# --set-env-vars: override Spring Boot datasource config; socketFactory uses the Unix socket instead of TCP.
# --set-secrets: pull the DB password from Secret Manager at deploy time — never stored in plaintext.
gcloud run deploy todo-backend \
  --image="${BACKEND_IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --allow-unauthenticated \
  --port=8080 \
  --add-cloudsql-instances="${CONNECTION_NAME}" \
  --service-account="${SA_EMAIL}" \
  --set-env-vars="SPRING_DATASOURCE_URL=jdbc:postgresql:///todo_db?cloudSqlInstance=${CONNECTION_NAME}&socketFactory=com.google.cloud.sql.postgres.SocketFactory,SPRING_DATASOURCE_USERNAME=todo_app_user" \
  --set-secrets="SPRING_DATASOURCE_PASSWORD=todo-db-password:latest"

# Capture the backend's auto-provisioned Cloud Run HTTPS URL.
BACKEND_URL=$(gcloud run services describe todo-backend \
  --region="${REGION}" --format="value(status.url)" --project="${PROJECT_ID}")

echo "==> Deploying frontend to Cloud Run..."
# --set-env-vars BACKEND_URL: passed to nginx so it knows where to proxy /api/* requests.
# nginx.conf.template substitutes ${BACKEND_URL} at container startup.
gcloud run deploy todo-frontend \
  --image="${FRONTEND_IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --allow-unauthenticated \
  --port=8080 \
  --service-account="${SA_EMAIL}" \
  --set-env-vars="BACKEND_URL=${BACKEND_URL}"

# Capture the frontend's public URL for the summary output.
FRONTEND_URL=$(gcloud run services describe todo-frontend \
  --region="${REGION}" --format="value(status.url)" --project="${PROJECT_ID}")

echo ""
echo "==> Deployment complete."
echo "    Frontend: ${FRONTEND_URL}"
echo "    Backend:  ${BACKEND_URL}"
echo ""
echo "==> Verifying proxy..."
# A successful response (any 2xx) confirms nginx can reach the backend.
# -s silences progress output; -f treats HTTP errors as failures.
curl -sf "${FRONTEND_URL}/api/todos" && echo " OK (nginx → backend reachable)" || echo " FAIL (502 or unreachable)"
