/**
 * Unified server with dual-mode (ESM and CommonJS) support
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

// Detect if we're running in ESM mode
const isESM = typeof require === 'undefined';
console.log(`Running in ${isESM ? 'ESM' : 'CommonJS'} mode`);

// Determine current directory
const __dirname = isESM 
  ? path.dirname(fileURLToPath(import.meta.url))
  : __dirname;

// Application setup
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Static file serving
app.use(express.static(path.join(__dirname, 'dist')));

// API routes
app.use('/api', async (req, res) => {
  try {
    let apiHandler;
    
    try {
      // Try to load the API handler
      const prodServerPath = './dist/server/prod-server.js';
      if (isESM) {
        apiHandler = await import(prodServerPath);
      } else {
        apiHandler = require(prodServerPath);
      }
      
      if (apiHandler && typeof apiHandler.handleApiRequest === 'function') {
        return apiHandler.handleApiRequest(req, res);
      }
    } catch (loadError) {
      console.error('Error loading API handler:', loadError);
    }
    
    // Fallback API handlers
    if (req.path === '/api/login' && req.method === 'POST') {
      const { email, password } = req.body;
      // Basic mock login (fallback)
      return res.json({
        success: true,
        user: {
          id: 1,
          username: 'admin',
          email: email || 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          isAdmin: true
        }
      });
    }
    
    if (req.path === '/api/user' && req.method === 'GET') {
      // Return mock user (fallback)
      return res.json({
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      });
    }
    
    // If no handler matched, return 404
    return res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'API error',
      message: error.message
    });
  }
});

// All other routes serve the index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create and start HTTP server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mode: ${isESM ? 'ESM' : 'CommonJS'}`);
  console.log(`http://localhost:${PORT}`);
});

// Export for potential use in CommonJS 
if (!isESM && typeof module !== 'undefined') {
  module.exports = { app, server };
}
