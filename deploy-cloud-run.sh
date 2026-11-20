#!/bin/bash
# ============================================================
#  Pluto Campus — Google Cloud Run Deployment Script
#  Run this from the project root: bash deploy-cloud-run.sh
# ============================================================

set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="asia-south1"

echo ""
echo "  🪐 Deploying Pluto Campus to Google Cloud Run"
echo "  ─────────────────────────────────────────────"
echo "  Project: $PROJECT_ID"
echo "  Region:  $REGION"
echo ""

# ── Step 1: Deploy Backend API ─────────────────────────
echo "  🔧 Deploying backend API..."
gcloud run deploy pluto-campus-api \
  --source ./backend \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "PORT=8080" \
  --memory 512Mi \
  --timeout 60

BACKEND_URL=$(gcloud run services describe pluto-campus-api --region "$REGION" --format='value(status.url)')
echo ""
echo "  ✅ Backend deployed: $BACKEND_URL"
echo ""

# ── Step 2: Deploy Web Frontend ────────────────────────
echo "  🌐 Deploying web frontend..."
gcloud run deploy pluto-campus-web \
  --source ./pluto_web \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 256Mi \
  --timeout 60

FRONTEND_URL=$(gcloud run services describe pluto-campus-web --region "$REGION" --format='value(status.url)')
echo ""
echo "  ✅ Frontend deployed: $FRONTEND_URL"
echo ""

echo "  ╔═══════════════════════════════════════════════╗"
echo "  ║       🪐 Pluto Campus — DEPLOYED!              ║"
echo "  ╠═══════════════════════════════════════════════╣"
echo "  ║  API:  $BACKEND_URL"
echo "  ║  Web:  $FRONTEND_URL"
echo "  ╚═══════════════════════════════════════════════╝"
echo ""
echo "  ⚠️  IMPORTANT: Set backend env vars with:"
echo "  gcloud run services update pluto-campus-api --region $REGION \\"
echo "    --set-env-vars SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...,RAZORPAY_KEY_ID=...,RAZORPAY_KEY_SECRET=...,PLUTO_OWNER_PIN=..."
echo ""
echo "  Then update pluto_web .env VITE_API_BASE=$BACKEND_URL and redeploy frontend."
