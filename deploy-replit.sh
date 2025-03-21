#!/bin/bash

# Comprehensive deployment script for Replit
# This script handles proper ESM module conversion with path fixes

echo "---------------------------------------------"
echo "🚀 Starting Replit deployment process"
echo "---------------------------------------------"

# Create directories
echo "Creating directory structure..."
mkdir -p dist/server dist/db dist/db/schema dist/public

# Compile server files with ESBuild
echo "Compiling server files..."
npx esbuild server/prod-server.ts --platform=node --packages=external --format=esm --outfile=dist/server/prod-server.js

# Process db directory 
echo "Processing database files..."
npx esbuild db/index.ts --platform=node --packages=external --format=esm --outfile=dist/db/index.js
npx esbuild db/schema.ts --platform=node --packages=external --format=esm --outfile=dist/db/schema.js

# Check if emailTemplates.ts exists
if [ -f db/schema/emailTemplates.ts ]; then
  npx esbuild db/schema/emailTemplates.ts --platform=node --packages=external --format=esm --outfile=dist/db/schema/emailTemplates.js
fi

# Fix path aliases and .js extensions
echo "Fixing module imports..."
node -e "
const fs = require('fs');
const files = [
  'dist/server/prod-server.js',
  'dist/db/index.js',
  'dist/db/schema.js'
];

if (fs.existsSync('dist/db/schema/emailTemplates.js')) {
  files.push('dist/db/schema/emailTemplates.js');
}

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix path aliases
  content = content.replace(/from\s+['\"]@db\/([^'\"]+)['\"]/, (match, path) => {
    return \`from './\${path}.js'\`;
  });
  
  // Add .js extension to relative imports
  content = content.replace(/from\s+['\\\"](\\\.\\\.?\\/[^'\\\"]+)(?!\\.js)['\\\"]/, (match, path) => {
    return \`from '\${path}.js'\`;
  });
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(\`Fixed imports in \${file}\`);
});
"

# Create server entry file
echo "Creating server entry point..."
cat > dist/index.js << 'EOF'
/**
 * Replit production server entry point
 * ESM version with dynamic imports
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('🚀 Starting production server...');
  const app = express();
  const server = http.createServer(app);

  try {
    // Import the setupServer function
    const { setupServer } = await import('./server/prod-server.js');
    
    // Setup the server
    await setupServer(app, server);
    
    // Start listening
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Setup a fallback server
    app.get('*', (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Server Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: #f5f5f5;
                color: #333;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                padding: 20px;
              }
              h1 { color: #e53e3e; }
              pre {
                background: #f8f8f8;
                padding: 10px;
                border-radius: 3px;
                overflow-x: auto;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Server Error</h1>
              <p>The server encountered an error during startup. Please check the server logs for details.</p>
              <div>
                <h3>Troubleshooting Steps:</h3>
                <ol>
                  <li>Check the database connection string in environment variables</li>
                  <li>Make sure all required dependencies are installed</li>
                  <li>Verify the server files were properly built for ESM compatibility</li>
                  <li>Check server logs for detailed error messages</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `);
    });
    
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`⚠️ Fallback server running on port ${port}`);
    });
  }
}

startServer();
EOF

# Build frontend with Vite
echo "Building frontend with Vite..."
if ! npx vite build --outDir dist/public; then
  echo "⚠️ Frontend build failed or timed out. Will proceed with server-only deployment."
  # Create minimal index.html if frontend build fails
  mkdir -p dist/public
  cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #0f172a; }
    h2 { color: #334155; }
    pre {
      background: #e2e8f0;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>API Server Running</h1>
  <div class="card">
    <h2>API Endpoints Available</h2>
    <p>The server is running in API-only mode. Frontend assets were not built.</p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/health">/api/health</a> - Server health check</li>
      <li>/api/login - Authentication endpoint</li>
      <li>/api/user - Current user information</li>
      <li>/api/admin/* - Admin-only endpoints</li>
    </ul>
  </div>
  <div class="card">
    <h2>Deployment Information</h2>
    <p>This server was deployed using the enhanced ESM deployment script.</p>
    <pre>NODE_ENV=production node dist/index.js</pre>
  </div>
</body>
</html>
EOF
fi

# Final message
echo "---------------------------------------------"
echo "✅ Deployment process completed!"
echo "You can now run: NODE_ENV=production node dist/index.js"
echo "---------------------------------------------"