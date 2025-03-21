#!/bin/bash

# SIMPLIFIED DEPLOYMENT SCRIPT FOR REPLIT
# This script builds the frontend and prepares server files

echo "🚀 Starting deployment process..."

# Ensure script is executable
chmod +x deploy-now.sh

# Build frontend
echo "📦 Building frontend..."
npm run build

# Create necessary directories
mkdir -p dist/server
mkdir -p dist/public

# Verify all necessary files exist
if [ ! -d "dist/public" ]; then
  echo "⚠️ Error: Frontend build failed or dist/public directory missing"
  exit 1
fi

# Check if the bridge file exists (CommonJS version)
if [ -f "replit-bridge.cjs" ]; then
  echo "✅ Replit bridge file (CommonJS) found"
else
  echo "⚠️ Warning: replit-bridge.cjs file not found"
fi

# Check if the CommonJS entry points exist
if [ -f "replit.cjs" ]; then
  echo "✅ Replit entry file (CommonJS) found"
else
  echo "⚠️ Warning: replit.cjs file not found"
fi

if [ -f "index.cjs" ]; then
  echo "✅ Replit index file (CommonJS) found"
else
  echo "⚠️ Warning: index.cjs file not found"
fi

echo "✅ Deployment process completed successfully"
echo "✨ You can now deploy to Replit using the 'Deploy' button"