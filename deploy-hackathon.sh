#!/usr/bin/env bash
set -e

# ==============================================================
# Deploy Tich Labs Incident Tracker to Cloud Run
# Prerequisites: gcloud CLI, a GCP project with billing enabled
# ==============================================================

PROJECT_ID="${1:?Usage: ./deploy-hackathon.sh <gcp-project-id>}"
SERVICE_NAME="tichlabs-tracker"
REGION="us-central1"

echo "=== Deploying frontend to Cloud Run ==="
gcloud run deploy "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --source frontend/ \
  --allow-unauthenticated \
  --set-env-vars "VITE_SUPABASE_URL=$VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY,VITE_MCP_SERVER_URL=$VITE_MCP_SERVER_URL,VITE_MCP_API_KEY=$VITE_MCP_API_KEY"

echo ""
echo "=== Done ==="
echo "Frontend URL: https://$SERVICE_NAME-$(gcloud run services describe $SERVICE_NAME --project $PROJECT_ID --region $REGION --format='value(status.url)' | sed 's|https://||' | cut -d. -f1)-uc.a.run.app"
