#!/bin/bash

# Replit startup script to ensure proper production setup

echo "📦 Verifying deployment files..."

# Check if we need to deploy first
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
  echo "🔨 No deployment found. Running deployment script first..."
  ./deploy-server-only.sh
fi

# Set environment for production
export NODE_ENV=production

# Start the server
echo "🚀 Starting server for Replit deployment..."
node server/index.js