/**
 * Replit Production Bridge - Index.js
 * 
 * This file serves as a bridge between Replit's deployment configuration
 * (which expects server/index.js) and our actual production server in dist/index.js
 * 
 * DO NOT DELETE OR MODIFY THIS FILE - It's required for Replit deployment
 */

// Set environment to production
process.env.NODE_ENV = 'production';

// Log the current working directory to help with debugging path issues
console.log('🔍 Current working directory:', process.cwd());
console.log('📁 Running from:', __filename);

// Check if dist/public/index.html exists (built frontend)
const fs = require('fs');
const path = require('path');
const frontendPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
const frontendExists = fs.existsSync(frontendPath);
console.log(`🔍 Frontend build exists: ${frontendExists ? '✅' : '❌'} (${frontendPath})`);

try {
  // Try to require the bridge module (CommonJS approach)
  const bridge = require('./replit-bridge.js');
  
  console.log('🔄 Initializing Replit production bridge...');
  
  // Use the bridge to redirect to production server
  bridge.initializeBridge().catch(error => {
    console.error('❌ Bridge initialization failed:', error);
    startEmergencyServer(error);
  });
} catch (error) {
  console.error('❌ Failed to load bridge module:', error);
  
  // Fallback: try direct import approach
  console.log('⚠️ Falling back to direct import...');
  
  // Use dynamic import for ESM compatibility
  import('../dist/index.js').catch(importError => {
    console.error('❌ Direct import failed:', importError);
    startEmergencyServer(error, importError);
  });
}

/**
 * Start an emergency server in case of critical failures
 * This ensures something is always served rather than a connection error
 */
function startEmergencyServer(initialError, importError = null) {
  try {
    const http = require('http');
    const express = require('express');
    const app = express();
    
    // First check if we can serve the actual frontend build
    const publicPath = path.join(process.cwd(), 'dist', 'public');
    if (fs.existsSync(publicPath) && fs.existsSync(path.join(publicPath, 'index.html'))) {
      console.log('🚨 Starting emergency server with frontend assets...');
      app.use(express.static(publicPath));
      
      // Serve index.html for SPA routes
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'API unavailable in emergency mode' });
        }
        res.sendFile(path.join(publicPath, 'index.html'));
      });
    } else {
      // If we can't serve the frontend, show an error page
      console.log('🚨 Starting emergency server with error page...');
      app.get('*', (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Critical Deployment Error</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
                  background: #f5f5f5;
                }
                .error-container {
                  background: white;
                  border-radius: 8px;
                  padding: 20px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #e53e3e; }
                pre {
                  background: #f8f8f8;
                  padding: 10px;
                  border-radius: 5px;
                  overflow-x: auto;
                  white-space: pre-wrap;
                }
              </style>
            </head>
            <body>
              <div class="error-container">
                <h1>Critical Deployment Error</h1>
                <p>All methods of loading the production server have failed.</p>
                
                <h3>System Information:</h3>
                <ul>
                  <li>Node Version: ${process.version}</li>
                  <li>Environment: ${process.env.NODE_ENV}</li>
                  <li>Working Directory: ${process.cwd()}</li>
                  <li>Frontend Build: ${frontendExists ? 'Available' : 'Missing'}</li>
                </ul>
                
                <h3>Initial Error:</h3>
                <pre>${initialError ? (initialError.stack || initialError) : 'Unknown error'}</pre>
                
                ${importError ? `
                <h3>Import Error:</h3>
                <pre>${importError.stack || importError}</pre>
                ` : ''}
                
                <h3>Troubleshooting:</h3>
                <ol>
                  <li>Make sure you've run the deployment script: <code>./deploy-replit.sh</code></li>
                  <li>Check that the dist directory exists and contains the production files</li>
                  <li>Ensure the DATABASE_URL environment variable is correctly set</li>
                  <li>Review server logs for detailed error information</li>
                </ol>
              </div>
            </body>
          </html>
        `);
      });
    }
    
    // Start the emergency server
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`⚠️ Emergency server running on port ${port}`);
    });
  } catch (criticalError) {
    console.error('💥 CRITICAL: Failed to create emergency server', criticalError);
    
    // Absolute last resort - basic HTTP server
    const http = require('http');
    http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Critical server error. Please check logs.');
    }).listen(3000, '0.0.0.0');
  }
}