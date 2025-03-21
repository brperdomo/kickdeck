#!/bin/bash

# Deployment script for Replit with enhanced error handling
# This script handles both frontend and backend deployment

echo "---------------------------------------------"
echo "🚀 Starting Replit deployment process"
echo "---------------------------------------------"

# Create directories
echo "Creating directory structure..."
mkdir -p dist/server dist/db dist/db/schema

# Compile server files with ESBuild
echo "Compiling server files..."
npx esbuild server/prod-server.ts --platform=node --packages=external --format=esm --outfile=dist/server/prod-server.js

# Process database files 
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
    // Test database connection first
    const dbConnected = await testDbConnection();
    
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
              <pre>${error.stack || error.message || 'Unknown error'}</pre>
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

/**
 * Test database connection
 */
async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL environment variable is not set');
      return false;
    }
    
    // Import db module
    const { db } = await import('./db/index.js');
    const { users } = await import('./db/schema.js');
    
    // Try to query users
    const testUsers = await db.select().from(users).limit(1);
    console.log('Database connection successful:', testUsers);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

startServer();
EOF

# Build frontend with Vite
echo "Building frontend with Vite..."
npx vite build

# Create Replit bridge file
echo "Creating Replit bridge for deployment..."
# replit-bridge.js was already created separately
touch server/replit-bridge.js

# Final message
echo "---------------------------------------------"
echo "✅ Deployment process completed!"
echo "You can now run in production mode: node server/index.js"
echo "---------------------------------------------"