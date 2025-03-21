/**
 * Replit production server entry point
 * ESM version that dynamically imports necessary components
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if required files exist for proper deployment
 */
function checkDeploymentFiles() {
  const requiredFiles = [
    { path: './prod-server.js', name: 'Production Server Module' },
    { path: '../db/index.js', name: 'Database Module' }
  ];
  
  let allFilesExist = true;
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, file.path);
    if (!fs.existsSync(fullPath)) {
      allFilesExist = false;
      missingFiles.push(`${file.name} (${fullPath})`);
    }
  }
  
  return { success: allFilesExist, missingFiles };
}

/**
 * Simple debug endpoint to report server status
 */
function setupDebugEndpoints(app) {
  app.get('/api/debug', (req, res) => {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      dirname: __dirname,
      files: {
        prodServer: fs.existsSync(path.join(__dirname, './prod-server.js')),
        dbModule: fs.existsSync(path.join(__dirname, '../db/index.js')),
        publicDir: fs.existsSync(path.join(__dirname, '../public'))
      }
    });
  });
}

async function startServer() {
  console.log('🚀 Starting production server with ESM imports...');
  const app = express();
  const server = http.createServer(app);
  
  // Set up basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
  
  // Always set up debug endpoints for troubleshooting
  setupDebugEndpoints(app);
  
  // Check for required deployment files
  const fileCheck = checkDeploymentFiles();
  if (!fileCheck.success) {
    console.error('❌ Missing required deployment files:', fileCheck.missingFiles);
    return setupFallbackServer(app, server, {
      errorType: 'MISSING_FILES',
      details: fileCheck.missingFiles
    });
  }

  try {
    console.log('Attempting to import production server module...');
    // Import the setupServer function from prod-server.js
    const { setupServer } = await import('./prod-server.js');
    
    console.log('Setting up production server...');
    // Setup the server with the imported function
    await setupServer(app, server);
    
    // Start listening on the appropriate port
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Setup a fallback server to show the error
    setupFallbackServer(app, server, {
      errorType: 'RUNTIME_ERROR',
      error: error.toString(),
      stack: error.stack
    });
  }
}

function setupFallbackServer(app, server, errorInfo = {}) {
  console.log('⚠️ Setting up fallback server due to startup error...');
  
  // Health check endpoint for monitoring
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: errorInfo.errorType || 'UNKNOWN_ERROR'
    });
  });
  
  app.get('*', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    
    // Generate appropriate error information
    let errorDetails = '';
    if (errorInfo.errorType === 'MISSING_FILES') {
      errorDetails = `
        <div class="error-details">
          <h3>Missing Deployment Files:</h3>
          <ul>
            ${errorInfo.details.map(file => `<li>${file}</li>`).join('')}
          </ul>
          <p>Run the deployment script again to generate these files.</p>
        </div>
      `;
    } else if (errorInfo.errorType === 'RUNTIME_ERROR') {
      errorDetails = `
        <div class="error-details">
          <h3>Runtime Error:</h3>
          <pre>${errorInfo.error}</pre>
          ${errorInfo.stack ? `<details><summary>Error Stack</summary><pre>${errorInfo.stack}</pre></details>` : ''}
        </div>
      `;
    }
    
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
              white-space: pre-wrap;
            }
            .error-details {
              margin-top: 20px;
              padding: 10px;
              background: #fff5f5;
              border-left: 4px solid #e53e3e;
            }
            ul { padding-left: 20px; }
            details { margin-top: 15px; }
            summary { cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Server Error</h1>
            <p>The server encountered an error during startup. Please check the server logs for details.</p>
            <p>This is likely due to an issue with the ES modules configuration or database connection.</p>
            
            ${errorDetails}
            
            <div>
              <h3>Troubleshooting Steps:</h3>
              <ol>
                <li>Check the database connection string in environment variables</li>
                <li>Make sure all required dependencies are installed</li>
                <li>Verify the server files were properly built for ESM compatibility</li>
                <li>Run the deployment script again: <code>./deploy-replit.sh</code></li>
                <li>Check the <a href="/api/debug" target="_blank">server debug endpoint</a> for more information</li>
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

// Start the server
startServer();