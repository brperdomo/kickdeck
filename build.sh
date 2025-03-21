#!/bin/bash

# Enhanced build script for Replit deployment

echo "Starting enhanced build process for Replit deployment..."

# Ensure we're in the project root
cd "$(dirname "$0")"

# Create necessary directories
mkdir -p dist/server

# Build the frontend with Vite
echo "Building frontend with Vite..."
npx vite build

if [ $? -ne 0 ]; then
  echo "Frontend build failed!"
  exit 1
fi

echo "Frontend build completed successfully."

# Build server components with ESM compatibility
echo "Building server components..."
npx esbuild server/index.js --platform=node --packages=external --bundle --format=esm --outdir=dist/server

if [ $? -ne 0 ]; then
  echo "Server build failed!"
  exit 1
fi

echo "Building production server adapter..."
npx esbuild server/server-prod.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

if [ $? -ne 0 ]; then
  echo "Server adapter build failed!"
  exit 1
fi

# Create ESM entry point for production
echo "Generating production entry point..."
cat > dist/index.js << 'EOF'
// ESM entry point for the server in production
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the server module
import('./server/index.js').catch(err => {
  console.error('Failed to load server:', err);
  process.exit(1);
});
EOF

echo "Build process completed successfully."
echo "To run the application in production mode, use: NODE_ENV=production node dist/index.js"