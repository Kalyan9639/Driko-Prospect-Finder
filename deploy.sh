#!/usr/bin/env bash
# deploy.sh — 1-Click Cloud Run Deployment Script for Bash / Cloud Shell
set -e

PROJECT_ID="${1:-hireforge-ai}"
SERVICE_NAME="${2:-kriu-icp-lab}"
GEMINI_API_KEY="${3:-}"
GROQ_API_KEY="${4:-}"

echo "=========================================================="
echo "   Deploying $SERVICE_NAME to Google Cloud Run"
echo "   Project: $PROJECT_ID | Region: us-central1"
echo "   Specs: 2 vCPU | 2 GiB RAM | Timeout: 300s"
echo "=========================================================="

if [ -f ".env" ]; then
    if [ -z "$GEMINI_API_KEY" ]; then
        GEMINI_API_KEY=$(grep -E "^GEMINI_API_KEY=" .env | cut -d '=' -f2- | tr -d ' "\r\n')
    fi
    if [ -z "$GROQ_API_KEY" ]; then
        GROQ_API_KEY=$(grep -E "^GROQ_API_KEY=" .env | cut -d '=' -f2- | tr -d ' "\r\n')
    fi
fi

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project "$PROJECT_ID"

gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --cpu 2 \
    --memory 2Gi \
    --timeout 300 \
    --concurrency 80 \
    --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY},GROQ_API_KEY=${GROQ_API_KEY},GEMINI_MODEL=gemini-2.5-flash-lite,ENABLE_CACHE=true" \
    --project "$PROJECT_ID"

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region us-central1 --format "value(status.url)")
echo ""
echo "Deployment successful!"
echo "Landing Page:  $SERVICE_URL"
echo "GTM Workbench: $SERVICE_URL/app"
echo "API Health:    $SERVICE_URL/api/health"
