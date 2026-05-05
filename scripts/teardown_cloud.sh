#!/usr/bin/env bash
# Exit immediately on error, treat unset variables as errors, propagate pipe failures.
set -euo pipefail

# ── GCP config ────────────────────────────────────────────────────────────────
PROJECT_ID="todo-app-495408"
REGION="europe-west3"
# ──────────────────────────────────────────────────────────────────────────────

echo "==> Deleting Cloud Run services..."
# Delete the frontend Cloud Run service. --quiet skips the confirmation prompt.
gcloud run services delete todo-frontend \
  --region="${REGION}" --project="${PROJECT_ID}" --quiet
# Delete the backend Cloud Run service.
# Cloud Run scales to zero when idle so there is no ongoing compute charge
# even while the services exist, but deleting them removes them from the
# console and prevents accidental traffic.
gcloud run services delete todo-backend \
  --region="${REGION}" --project="${PROJECT_ID}" --quiet

echo ""
echo "==> Teardown complete."
echo "    Cloud SQL instance is still running (~\$10.80/month)."
# Stopping the instance sets activationPolicy=NEVER: no compute charge,
# but storage (~$1.70/month) is still billed and data is preserved.
echo "    To stop it: gcloud sql instances patch todo-db --activation-policy=NEVER --project=${PROJECT_ID}"
echo "    To bring the app back up: bash scripts/deploy_cloud.sh"
