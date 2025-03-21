/**
 * ES Module entry point specifically for Replit deployment
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/pg-core';

// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app and server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup database connection
async function setupDatabase() {
  try {
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    console.log('Database connection successful');
    const db = drizzle(client);
    return { db, client, connected: true };
  } catch (error) {
    console.error('Database connection error:', error);
    return { db: null, client: null, connected: false };
  }
}

// Check for static file directory
const staticDir = path.join(__dirname, 'dist/public');
const staticDirExists = fs.existsSync(staticDir);
if (!staticDirExists) {
  console.error(`Static directory not found: ${staticDir}`);
  // Try to check parent directories to help with debugging
  const parentDir = path.dirname(staticDir);
  console.log(`Looking for files in parent directory: ${parentDir}`);
  if (fs.existsSync(parentDir)) {
    try {
      const files = fs.readdirSync(parentDir);
      console.log(`Files in ${parentDir}:`, files);
    } catch (err) {
      console.error(`Error reading parent directory: ${err.message}`);
    }
  }
}

// Add a special diagnostic endpoint
app.get('/deployment-status', (req, res) => {
  // Gather directory information
  const indexHtmlPath = path.join(staticDir, 'index.html');
  const indexHtmlExists = fs.existsSync(indexHtmlPath);
  const assetsDir = path.join(staticDir, 'assets');
  const assetsExist = fs.existsSync(assetsDir);
  
  // List files in directories to aid debugging
  let directories = {};
  
  // Check dist directory
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    try {
      directories.dist = fs.readdirSync(distDir);
    } catch (err) {
      directories.dist = `Error: ${err.message}`;
    }
  } else {
    directories.dist = 'Directory not found';
  }
  
  // Check public directory
  if (staticDirExists) {
    try {
      directories.public = fs.readdirSync(staticDir);
    } catch (err) {
      directories.public = `Error: ${err.message}`;
    }
  } else {
    directories.public = 'Directory not found';
  }
  
  // Check assets directory
  if (assetsExist) {
    try {
      directories.assets = fs.readdirSync(assetsDir);
    } catch (err) {
      directories.assets = `Error: ${err.message}`;
    }
  } else {
    directories.assets = 'Directory not found';
  }
  
  // Send diagnostic information
  res.json({
    status: 'alive',
    mode: 'replit-esm',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    directories: {
      currentDir: __dirname,
      staticDir: {
        path: staticDir,
        exists: staticDirExists
      },
      indexHtml: {
        path: indexHtmlPath,
        exists: indexHtmlExists
      },
      assets: {
        path: assetsDir,
        exists: assetsExist
      },
      fileList: directories
    }
  });
});

// Standalone root path handler - guaranteed to work for "/"
app.get('/', (req, res) => {
  const indexHtmlPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log('Serving index.html for root path');
    res.sendFile(indexHtmlPath);
  } else {
    // Fallback response if index.html doesn't exist
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MatchPro App</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .message { background: #f4f4f4; padding: 20px; border-radius: 4px; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>MatchPro Soccer Management Platform</h1>
            <div class="message">
              <p>The application is running but the static files couldn't be located.</p>
              <p>This is likely a deployment configuration issue.</p>
              <p>Please check the server logs for more information.</p>
              <p>Path checked: ${indexHtmlPath}</p>
            </div>
          </div>
        </body>
      </html>
    `);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', mode: 'replit-esm' });
});

// Deployment status endpoint
app.get('/api/deployment/status', (req, res) => {
  res.json({
    status: 'ok',
    entryPoint: 'replit.js (ESM)',
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    staticDirExists
  });
});

// Serve static files with high priority
app.use(express.static(staticDir, {
  index: 'index.html',
  maxAge: '1d' // Cache for 1 day
}));

// Fallback route for SPA - serve index.html for all other requests
app.get('*', (req, res) => {
  // Check if the request looks like an API call
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve the index.html for all other routes
  const indexHtmlPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log(`Serving index.html for path: ${req.path}`);
    res.sendFile(indexHtmlPath);
  } else {
    res.status(404).send('Application not properly deployed. Static files missing.');
  }
});

// Start the server
async function startServer() {
  // Initialize database
  const { db, client, connected } = await setupDatabase();
  
  // Start listening
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Database connection: ${connected ? 'successful' : 'failed'}`);
    console.log(`Static files directory: ${staticDir} (exists: ${staticDirExists})`);
    if (staticDirExists) {
      const indexPath = path.join(staticDir, 'index.html');
      console.log(`Index file: ${indexPath} (exists: ${fs.existsSync(indexPath)})`);
    }
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
});
