#!/bin/bash

# Run the production server for testing
# This script ensures the server runs with the right environment configuration

# Kill any running Node.js processes
echo "Cleaning up any running Node.js processes..."
pkill -f "node dist/index.js" 2>/dev/null

# Set environment to production
export NODE_ENV=production

# Run with full stack trace and no warning deprecation notices
echo "Starting production server..."
node --trace-warnings --no-deprecation dist/index.js

# This script should be run after running ./deploy-replit.sh to build the production files