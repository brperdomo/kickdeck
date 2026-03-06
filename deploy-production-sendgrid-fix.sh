#!/bin/bash
# Production SendGrid Fix Deployment Script
# This script ensures the correct SendGrid API key is used in production

set -e

echo "=== Production SendGrid Deployment Fix ==="
echo "Timestamp: $(date)"

# Set critical environment variables for Cloud Run
export NODE_ENV="production"
export SENDGRID_API_KEY="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"
export DEFAULT_FROM_EMAIL="support@kickdeck.io"

echo "Environment variables set:"
echo "- NODE_ENV: $NODE_ENV"
echo "- SENDGRID_API_KEY: SG.M0vLlGK..."
echo "- DEFAULT_FROM_EMAIL: $DEFAULT_FROM_EMAIL"

echo "Building application for production..."
npm run build

echo "Production build complete."
echo "Deploy this to your Cloud Run service with these environment variables."
