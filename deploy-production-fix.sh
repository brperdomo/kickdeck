#!/bin/bash
# Production Deployment Script for SendGrid Fix

echo "=== Production SendGrid Fix Deployment ==="

# Set environment variables for Cloud Run deployment
export NODE_ENV=production
export SENDGRID_API_KEY="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"

# Build the application
echo "Building application..."
npm run build

echo "Deployment script created. Run this on your production server."
echo "Or update your Cloud Run deployment environment variables."
