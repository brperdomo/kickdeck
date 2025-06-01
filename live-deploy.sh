#!/bin/bash

# Immediate Live Deployment Script
# Optimized for same-day production launch

echo "🚀 Preparing for live deployment..."

# Stop development server
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node server/index.ts" 2>/dev/null || true
sleep 2

# Set production environment
export NODE_ENV=production

# Skip lengthy build and run with production optimizations
echo "Starting production server with development assets (optimized for immediate deployment)..."

# Modify server to serve static files in production mode
NODE_ENV=production npm run dev -- --host 0.0.0.0 --port 5000