/**
 * CommonJS entry point specifically for Replit deployment
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Setup database connection
async function setupDatabase() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    console.log('Database connected successfully');
    return { client, connected: true };
  } catch (error) {
    console.error('Database connection error:', error);
    return { client: null, connected: false };
  }
}

// Check if dist/public/index.html exists
function distExists() {
  return fs.existsSync(path.join(__dirname, 'dist/public/index.html'));
}

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/public')));

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0', 
    mode: 'replit-commonjs',
    distExists: distExists() 
  });
});

// API deployment status endpoint
app.get('/api/deployment/status', (req, res) => {
  res.json({
    status: 'ok',
    entryPoint: 'replit.cjs (CommonJS)',
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    distExists: distExists(),
    files: fs.readdirSync(path.join(__dirname)).slice(0, 10)
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  // Check if the request looks like an API call
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  if (distExists()) {
    // Serve the index.html for all other routes
    res.sendFile(path.join(__dirname, 'dist/public/index.html'));
  } else {
    // Return error if dist doesn't exist
    res.status(500).send('Frontend build not found. Please run deployment script first.');
  }
});

// Start the server
async function startServer() {
  // Initialize database
  const { client, connected } = await setupDatabase();
  
  // Start listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Database connection: ${connected ? 'successful' : 'failed'}`);
    console.log(`Dist exists: ${distExists()}`);
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
});
