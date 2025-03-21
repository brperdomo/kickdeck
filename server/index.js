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

async function startServer() {
  console.log('Starting production server with ESM imports...');
  const app = express();
  const server = http.createServer(app);

  try {
    // Import the setupServer function from prod-server.js
    // This works because the deploy script converts TS to JS with proper extensions
    const { setupServer } = await import('./prod-server.js');
    
    // Setup the server with the imported function
    await setupServer(app, server);
    
    // Start listening on the appropriate port
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    
    // Setup a fallback server to show the error
    setupFallbackServer(app, server);
  }
}

function setupFallbackServer(app, server) {
  console.log('Setting up fallback server due to startup error...');
  
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
            <p>This is likely due to an issue with the ES modules configuration or database connection.</p>
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
    console.log(`Fallback server running on port ${port}`);
  });
}

// Start the server
startServer();