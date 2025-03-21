#!/bin/bash
# Enhanced build-frontend.sh script with better error handling
set -e

echo "========================================"
echo "   Building MatchPro frontend assets"
echo "========================================"

# Ensure the dist directory exists and is clean
mkdir -p dist
rm -rf dist/public

# Create the public directory to receive the static assets
mkdir -p dist/public

# Set NODE_ENV to production
export NODE_ENV=production

echo "✓ Environment prepared"

# Build the frontend assets with Vite - need to run from client directory
echo "Building frontend assets with Vite..."
cd client && npx vite build --outDir ../dist/public && cd ..

# Check if the build was successful
if [ -f "dist/public/index.html" ]; then
  echo "✓ Frontend build completed successfully!"
  echo "✓ Assets written to dist/public/"
  
  # Count the number of files in dist/public
  FILE_COUNT=$(find dist/public -type f | wc -l)
  echo "✓ Generated $FILE_COUNT files"
  
  # List key files
  echo "Key files:"
  ls -lh dist/public/index.html
  ls -lh dist/public/assets/ | head -5
  
  # Check for essential files
  if [ ! -d "dist/public/assets" ]; then
    echo "⚠ Warning: assets directory not found!"
  fi
  
  JS_COUNT=$(find dist/public/assets -name "*.js" | wc -l)
  CSS_COUNT=$(find dist/public/assets -name "*.css" | wc -l)
  
  echo "✓ JavaScript files: $JS_COUNT"
  echo "✓ CSS files: $CSS_COUNT"
  
  echo "Build verification complete. Ready for deployment!"
else
  echo "❌ Build failed: dist/public/index.html not found"
  echo "Checking if client build was created in client/dist/public..."
  
  # If the file was created in client/dist/public, copy it to dist/public
  if [ -f "client/dist/public/index.html" ]; then
    echo "Found build in client/dist/public, copying to dist/public..."
    cp -r client/dist/public/* dist/public/
    echo "✓ Files copied from client/dist/public to dist/public"
    
    # Check if the copy was successful
    if [ -f "dist/public/index.html" ]; then
      echo "✓ Copy successful!"
    else
      echo "❌ Copy failed"
      exit 1
    fi
  else
    echo "❌ Build not found in client/dist/public either"
    echo "Please check the build logs for errors"
    exit 1
  fi
fi

# Success!
echo "========================================"
echo "   Frontend build complete!"
echo "========================================"
echo "To deploy, run: ./deploy-simplified.sh"
echo "========================================"