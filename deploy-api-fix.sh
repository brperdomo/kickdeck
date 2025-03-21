#!/bin/bash

# deploy-api-fix.sh - Enhanced deployment script to fix API 404 issues

set -e
echo "Starting enhanced deployment process with API fixes..."

# Create necessary directories
mkdir -p dist/server dist/public

# 1. Build the frontend with Vite
echo "Building frontend with Vite..."
npx vite build

# 2. Compile TypeScript server code
echo "Compiling TypeScript server code..."
npx tsc --project tsconfig.json

# 3. Build server files
echo "Building server files with esbuild..."
npx esbuild server/index.js server/server-prod.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# 4. Copy server-prod.js to dist directory for direct access
echo "Copying production server files..."
cp dist/server/server-prod.js dist/

# 5. Create the main entry point
echo "Creating main entry point..."
cat > dist/index.js << 'EOL'
// ESM entry point for the server in production
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Display diagnostic information
console.log('Starting application in production mode');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'production');

// Try multiple possible paths for the server module
const possiblePaths = [
  join(process.cwd(), 'dist', 'server-prod.js'),
  join(process.cwd(), 'dist', 'server', 'server-prod.js'),
  join(process.cwd(), 'dist', 'server', 'index.js')
];

// Find the first valid path
let validPath = null;
for (const path of possiblePaths) {
  if (existsSync(path)) {
    validPath = path;
    console.log(`Found valid server module at: ${path}`);
    break;
  }
}

if (validPath) {
  // Import the server module
  import(validPath).catch(err => {
    console.error('Failed to load server:', err);
    process.exit(1);
  });
} else {
  console.error('No valid server module found. Checked:', possiblePaths);
  process.exit(1);
}
EOL

# 6. Create a minimal index.html for the dist/public directory
# This ensures we have something to serve if the main build fails
echo "Creating minimal index.html..."
cat > dist/public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Soccer Registration App</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f9fafb;
      color: #1e293b;
    }
    
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 90%;
    }
    
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 4px solid #3b82f6;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 2rem auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Soccer Registration App</h1>
    <div class="spinner"></div>
    <p>Application is loading, please wait...</p>
  </div>
  
  <script>
    // Redirect to the proper frontend when the backend is ready
    async function checkServerStatus() {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          // Reload page to load the real app
          window.location.href = '/';
        } else {
          // Retry again after a delay
          setTimeout(checkServerStatus, 2000);
        }
      } catch (error) {
        // Server not ready yet, retry
        setTimeout(checkServerStatus, 2000);
      }
    }
    
    // Start polling server status
    checkServerStatus();
  </script>
</body>
</html>
EOL

echo "Build complete!"
echo "To start in production mode: NODE_ENV=production node dist/index.js"
echo ""
echo "Your application should now properly handle the /api/login endpoint and other API routes in production."