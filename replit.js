/**
 * ES Module entry point specifically for Replit deployment
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/pg-core';

// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Setup database connection
async function setupDatabase() {
  try {
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    const db = drizzle(client);
    return { db, client, connected: true };
  } catch (error) {
    console.error('Database connection error:', error);
    return { db: null, client: null, connected: false };
  }
}

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, 'dist/public')));

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', mode: 'replit-esm' });
});

// API deployment status endpoint
app.get('/api/deployment/status', (req, res) => {
  res.json({
    status: 'ok',
    entryPoint: 'replit.js (ESM)',
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  // Check if the request looks like an API call
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve the index.html for all other routes
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

// Start the server
async function startServer() {
  // Initialize database
  const { db, client, connected } = await setupDatabase();
  
  // Start listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Database connection: ${connected ? 'successful' : 'failed'}`);
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
});
