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

// Import required modules
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __filename and __dirname equivalents in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Checks if the build files exist
 * @returns {boolean} Whether the build files exist
 */
function checkBuildExists() {
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
async function createFallbackServer(error) {
  console.error('[Replit Bridge] ❌ ERROR: Failed to load production server');
  console.error('[Replit Bridge] Error details:', error);
  
  try {
    // Import required modules using ESM dynamic imports
    const express_module = await import('express');
    const express = express_module.default;
    
    const app = express();
    
    // Check if we can serve the frontend build
    const publicPath = path.join(process.cwd(), 'dist', 'public');
    const indexPath = path.join(publicPath, 'index.html');
    const hasFrontend = fs.existsSync(indexPath);
    
    console.log(`[Replit Bridge] Frontend build: ${hasFrontend ? '✅ Found' : '❌ Missing'}`);
    
    if (hasFrontend) {
      // We have a frontend build, serve it
      console.log(`[Replit Bridge] Serving static files from ${publicPath}`);
      app.use(express.static(publicPath));
      
      // Add a health check endpoint
      app.get('/api/health', (req, res) => {
        res.json({
          status: 'limited',
          error: error.message || 'Server initialization failed',
          mode: 'bridge-fallback',
          timestamp: new Date().toISOString(),
          bridge: true
        });
      });
      
      // Catch-all for API endpoints
      app.use('/api/*', (req, res) => {
        res.status(503).json({
          error: 'API Unavailable',
          message: 'The server is running in emergency mode due to initialization errors',
          details: error.message || 'Unknown error'
        });
      });
      
      // SPA fallback for all other routes
      app.get('*', (req, res) => {
        // If this is an API route that wasn't caught by previous handlers
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'API endpoint not found' });
        }
        
        // Serve the SPA for client-side routing
        res.sendFile(indexPath);
      });
    } else {
      // No frontend, show helpful error page
      app.get('*', (req, res) => {
        // For API requests, return JSON error
        if (req.path.startsWith('/api/')) {
          return res.status(503).json({
            error: 'Server Error',
            message: 'The application server failed to initialize',
            details: error.message || 'Unknown error'
          });
        }
        
        // For web requests, show an HTML error page
        res.setHeader('Content-Type', 'text/html');
        res.status(500).send(`
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
                  <li>Frontend Build: ${hasFrontend ? '✅ Available' : '❌ Missing'}</li>
                </ul>
                
                <h2>Error details:</h2>
                <pre class="error">${error.stack || error}</pre>
                
                <h2>Troubleshooting:</h2>
                <ol>
                  <li>Run deployment script: <code>./deploy-replit.sh</code></li>
                  <li>Check that the dist directory exists and contains the production files</li>
                  <li>Verify the DATABASE_URL environment variable is correctly set</li>
                  <li>Check for proper module compatibility in production build files</li>
                </ol>
              </div>
            </body>
          </html>
        `);
      });
    }
    
    // Start emergency server
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`[Replit Bridge] ⚠️ Emergency server running on port ${port}`);
      if (hasFrontend) {
        console.log(`[Replit Bridge] ℹ️ Serving frontend in limited mode (API functionality disabled)`);
      } else {
        console.log(`[Replit Bridge] ⚠️ Showing error page (no frontend build available)`);
      }
    });
  } catch (fallbackError) {
    console.error('[Replit Bridge] 💥 CRITICAL: Failed to create fallback server', fallbackError);
    
    // Last resort - basic HTTP server
    try {
      const http_module = await import('http');
      const server = http_module.createServer((req, res) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Critical server error. Please check logs.');
      });
      server.listen(3000, '0.0.0.0', () => {
        console.log('[Replit Bridge] 🆘 Last-resort error server running on port 3000');
      });
    } catch (e) {
      console.error('[Replit Bridge] 💥 FATAL: Could not create any kind of server');
    }
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
export { initializeBridge };