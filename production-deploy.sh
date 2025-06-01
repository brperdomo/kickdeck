#!/bin/bash

# Production Deployment Script for MatchPro
# This script properly builds and starts the application in production mode

echo "Starting production deployment..."

# Stop any running development servers
echo "Stopping existing processes..."
pkill -f "node server/index.ts" 2>/dev/null || true
pkill -f "vite build" 2>/dev/null || true

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist/

# Set production environment
export NODE_ENV=production

# Build the application
echo "Building application for production..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "Build failed! dist/index.js not found"
    exit 1
fi

echo "Build successful!"

# Start production server
echo "Starting production server..."
npm run start
