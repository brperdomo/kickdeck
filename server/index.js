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

// Log start message
console.log('🔄 Redirecting to production server...');

// Use dynamic import for ESM compatibility
import('../dist/index.js').catch(error => {
  console.error('❌ Failed to load production server:', error);
  
  // If we can't import the production server, set up a minimal HTTP server
  // to show an error message
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
            <h1>Deployment Error</h1>
            <p>Could not load the production server from dist/index.js</p>
            
            <h3>Error details:</h3>
            <pre>${error.stack || error}</pre>
            
            <h3>Troubleshooting:</h3>
            <ol>
              <li>Make sure you've run the deployment script: <code>./deploy-server-only.sh</code></li>
              <li>Check that the dist directory exists and contains the production files</li>
              <li>Ensure the DATABASE_URL environment variable is correctly set</li>
            </ol>
          </div>
        </body>
      </html>
    `);
  });
  
  server.listen(3000, '0.0.0.0', () => {
    console.log('⚠️ Emergency error server running on port 3000');
  });
});
