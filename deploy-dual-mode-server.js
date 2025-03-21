/**
 * Dual-mode server with automatic ESM/CommonJS detection
 * This server can run in both ESM and CommonJS environments
 */

// Determine if we're running in ESM mode
const isESM = typeof require === 'undefined' || !require.main || Object.prototype.toString.call(require.main) !== '[object Object]';

console.log(`Starting server in ${isESM ? 'ESM' : 'CommonJS'} mode`);

/**
 * ESM imports
 */
async function loadESMImports() {
  const { createServer } = await import('http');
  const { default: express } = await import('express');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const { pgClient, db } = await import('./dist/server/db.js');
  
  return {
    createServer,
    express,
    join,
    dirname,
    fileURLToPath,
    pgClient,
    db
  };
}

/**
 * CommonJS imports
 */
function loadCJSImports() {
  const { createServer } = require('http');
  const express = require('express');
  const { join, dirname } = require('path');
  const { pgClient, db } = require('./dist/server/db.js');
  
  return {
    createServer,
    express,
    join,
    dirname,
    fileURLToPath: (url) => url.replace('file://', ''),
    pgClient,
    db
  };
}

/**
 * The main API handler that gets loaded
 */
async function loadApiHandler() {
  if (isESM) {
    const { setupServer } = await import('./dist/server/prod-server.js');
    return setupServer;
  } else {
    const { setupServer } = require('./dist/server/prod-server.js');
    return setupServer;
  }
}

/**
 * Start the application server
 * @param {boolean} isESM - Whether we're running in ESM mode
 */
async function startApp(isESM) {
  let modules;
  
  if (isESM) {
    modules = await loadESMImports();
  } else {
    modules = loadCJSImports();
  }
  
  const { createServer, express, join, dirname, fileURLToPath, pgClient, db } = modules;
  
  // Create Express app and HTTP server
  const app = express();
  const server = createServer(app);
  
  // Serve static files
  const __dirname = isESM ? dirname(fileURLToPath(import.meta.url)) : __dirname;
  const distPath = join(__dirname, 'dist');
  
  app.use(express.static(distPath));
  app.use(express.json());
  
  // Set up API routes
  try {
    console.log('Loading API handler...');
    const setupServer = await loadApiHandler();
    
    // Test database connection first
    let dbConnected = false;
    try {
      console.log('Testing database connection...');
      await pgClient.connect();
      dbConnected = true;
      console.log('Database connection successful');
    } catch (err) {
      console.error('Database connection failed:', err.message);
      console.log('Continuing with limited functionality');
    }
    
    // Setup server with API routes
    await setupServer(app, server, dbConnected);
    console.log('API routes configured successfully');
  } catch (err) {
    console.error('Failed to set up API routes:', err);
    // Provide a fallback API for testing
    app.get('/api/generate-id', (req, res) => {
      res.json({ id: Math.floor(Math.random() * 1000000) });
    });
    
    app.get('/api/user', (req, res) => {
      res.json({ 
        id: 1, 
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      });
    });
    
    app.post('/api/login', (req, res) => {
      res.json({ success: true, user: { id: 1, email: 'admin@example.com' } });
    });
  }
  
  // Handle all routes for SPA
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
  
  // Start server
  const port = process.env.PORT || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
  
  return { app, server };
}

// Start the server based on the detected module type
if (isESM) {
  startApp(true).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
} else {
  startApp(false).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Export for potential CommonJS usage
if (!isESM) {
  module.exports = { startApp };
}