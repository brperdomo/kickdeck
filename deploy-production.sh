#!/bin/bash

# Production Deployment Script for MatchPro Live Launch
# This script ensures a clean, optimized production build

set -e  # Exit on any error

echo "🚀 Starting production deployment for MatchPro..."

# Stop any running processes
echo "Stopping existing processes..."
pkill -f "node server/index.ts" 2>/dev/null || true
pkill -f "vite build" 2>/dev/null || true
sleep 2

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/

# Set production environment
export NODE_ENV=production

# Optimize build process
echo "Building application for production (this may take 5-10 minutes)..."
echo "Building frontend..."
npx vite build --mode production

echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify

# Verify build success
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed! Backend build not found"
    exit 1
fi

if [ ! -d "dist/public" ] && [ ! -f "client/dist/index.html" ]; then
    echo "❌ Build failed! Frontend build not found"
    exit 1
fi

# Copy frontend build to correct location
if [ -d "client/dist" ]; then
    echo "Moving frontend build to production location..."
    cp -r client/dist/* dist/public/ 2>/dev/null || mkdir -p dist/public && cp -r client/dist/* dist/public/
fi

echo "✅ Build completed successfully!"

# Start production server
echo "🌟 Starting production server..."
NODE_ENV=production node dist/index.js