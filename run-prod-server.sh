#!/bin/bash

# Script to run the production server for testing

# Create a log file
LOG_FILE="server.log"
echo "Starting production server at $(date)" > $LOG_FILE

# Environment settings
export NODE_ENV=production

# Check if dist/index.js exists
if [ ! -f dist/index.js ]; then
  echo "❌ Production build not found! Please run ./deploy-server-only.sh first."
  exit 1
fi

# Kill any existing node processes (optional, uncomment if needed)
# pkill -f "node server/index.js" || true
# pkill -f "node dist/index.js" || true

echo "📝 Logs will be written to $LOG_FILE"
echo "📊 API server will be available at http://localhost:3000"
echo ""
echo "🚀 Starting production server..."

# Run the server through the bridge for maximum compatibility
node server/index.js >> $LOG_FILE 2>&1