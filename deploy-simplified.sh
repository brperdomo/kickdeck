#!/bin/bash
# Simplified deployment script for MatchPro
set -e

echo "========================================"
echo "   MatchPro Simplified Deployment"
echo "========================================"

# Make sure our scripts are executable
chmod +x build-frontend.sh
chmod +x make-executable.sh

# Step 1: Build the frontend
echo "Step 1: Building frontend..."
./build-frontend.sh

# Step 2: Ensure our server-side entry points are executable
echo "Step 2: Making entry points executable..."
./make-executable.sh

# Step 3: Create dist/server directory if it doesn't exist
echo "Step 3: Preparing server structure..."
mkdir -p dist/server

# Step 4: Copy required server files
echo "Step 4: Copying server files..."
cp -r server dist/

# Step 5: Copy backend entry points
echo "Step 5: Copying entry points..."
cp index.js dist/
cp index.cjs dist/
cp package.json dist/
cp package-lock.json dist/

# Step 6: Verify deployment structure
echo "Step 6: Verifying deployment structure..."
if [ -f "dist/index.js" ] && [ -f "dist/index.cjs" ] && [ -d "dist/public" ] && [ -f "dist/public/index.html" ]; then
  echo "✓ Deployment structure verified!"
else
  echo "❌ Deployment structure verification failed!"
  echo "Missing required files in dist directory."
  exit 1
fi

# Success!
echo "========================================"
echo "   Deployment preparation complete!"
echo "========================================"
echo "Your application is ready for deployment."
echo "The dist/ directory contains all required files."
echo "========================================"