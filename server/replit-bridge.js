/**
 * Replit Bridge - Production Compatibility Layer
 * 
 * This module provides bridging functionality between Replit's expected entry point
 * and our actual production build structure. It should be imported by server/index.js
 * to provide compatibility between ESM and CommonJS modules.
 */

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Diagnostic information 
console.log('[Replit Bridge] Initializing bridge between server/index.js and dist/index.js');
console.log(`[Replit Bridge] Running in ${process.env.NODE_ENV} mode`);
console.log(`[Replit Bridge] Node version: ${process.version}`);

/**
 * Checks if the build files exist
 * @returns {boolean} Whether the build files exist
 */
function checkBuildExists() {
  const fs = require('fs');
  const path = require('path');
  
  const distPath = path.join(process.cwd(), 'dist', 'index.js');
  const serverDistPath = path.join(process.cwd(), 'dist', 'server', 'prod-server.js');
  
  const distExists = fs.existsSync(distPath);
  const serverDistExists = fs.existsSync(serverDistPath);
  
  console.log(`[Replit Bridge] Checking build files:`);
  console.log(`[Replit Bridge] - dist/index.js: ${distExists ? '✅ Found' : '❌ Missing'}`);
  console.log(`[Replit Bridge] - dist/server/prod-server.js: ${serverDistExists ? '✅ Found' : '❌ Missing'}`);
  
  return distExists && serverDistExists;
}

/**
 * Creates a fallback error server
 * @param {Error} error The error that occurred during startup
 */
function createFallbackServer(error) {
  console.error('[Replit Bridge] ❌ ERROR: Failed to load production server');
  console.error('[Replit Bridge] Error details:', error);
  
  try {
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Deployment Error</title>
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
              h2 { color: #3182ce; }
              pre {
                background: #f8f8f8;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
                white-space: pre-wrap;
              }
              .info { color: #4299e1; }
              .warning { color: #ed8936; }
              .error { color: #e53e3e; }
            </style>
          </head>
          <body>
            <div class="error-container">
              <h1>Deployment Error</h1>
              <p>Could not load the production server from dist/index.js</p>
              
              <h2>System Information:</h2>
              <ul>
                <li>Node Version: ${process.version}</li>
                <li>Environment: ${process.env.NODE_ENV}</li>
                <li>Working Directory: ${process.cwd()}</li>
                <li>Database Available: ${process.env.DATABASE_URL ? '✅' : '❌'}</li>
              </ul>
              
              <h2>Error details:</h2>
              <pre class="error">${error.stack || error}</pre>
              
              <h2>Troubleshooting:</h2>
              <ol>
                <li>Run deployment script: <code>./deploy-server-only.sh</code> or <code>./deploy-replit.sh</code></li>
                <li>Check that the dist directory exists and contains the production files</li>
                <li>Verify the DATABASE_URL environment variable is correctly set</li>
                <li>Check for proper module compatibility in production build files</li>
              </ol>
            </div>
          </body>
        </html>
      `);
    });
    
    // Start emergency server
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`[Replit Bridge] ⚠️ Emergency error server running on port ${port}`);
    });
  } catch (fallbackError) {
    console.error('[Replit Bridge] 💥 CRITICAL: Failed to create fallback server', fallbackError);
  }
}

/**
 * Provides bridge functionality for the Replit environment
 */
async function initializeBridge() {
  // Check if build exists
  if (!checkBuildExists()) {
    const error = new Error('Production build files not found. Please run the deployment script.');
    createFallbackServer(error);
    return;
  }
  
  // Attempt to load production server
  try {
    console.log('[Replit Bridge] Loading production server...');
    
    // Use dynamic import for ESM compatibility
    await import('../dist/index.js');
    
    // If we get here, the import succeeded
    console.log('[Replit Bridge] ✅ Production server loaded successfully');
  } catch (error) {
    createFallbackServer(error);
  }
}

// Export the bridge functionality
module.exports = {
  initializeBridge
};