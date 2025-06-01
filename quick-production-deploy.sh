#!/bin/bash

# Quick Production Deploy - Optimized for Live Launch
set -e

echo "🚀 Quick production deployment starting..."

# Stop development server
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node server/index.ts" 2>/dev/null || true
sleep 3

# Clean and prepare
rm -rf dist/ client/dist/
export NODE_ENV=production

# Fast build with optimizations
echo "Building for production (optimized)..."
npm run build

# Verify build
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed"
    exit 1
fi

echo "✅ Production build complete!"
echo "Starting production server..."

# Start production server
NODE_ENV=production nohup node dist/index.js > server.log 2>&1 &
echo $! > server.pid

echo "✅ Production server started!"
echo "Server running on port 5000"
echo "Logs: tail -f server.log"
echo "Stop: kill \$(cat server.pid)"