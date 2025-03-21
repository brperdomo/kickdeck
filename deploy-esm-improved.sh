#!/bin/bash

# Improved Deployment Script for MatchPro with ES Module Support
set -e  # Exit on error

echo "========================================="
echo "       MatchPro Improved Deployment      "
echo "========================================="

# Make sure this script is executable
echo "Making script executable..."
chmod +x deploy-esm-improved.sh

# Step 1: Ensure directories exist
echo "Creating necessary directories..."
mkdir -p dist
mkdir -p dist/server
mkdir -p dist/public

# Step 2: Build frontend
echo "Building frontend assets..."
bash -c "cd client && npm run build"

# Step 3: Copy frontend assets to dist/public
echo "Copying frontend assets..."
cp -r client/dist/* dist/public/

# Step 4: Copy server files to dist/server
echo "Copying server files..."
cp -r server/* dist/server/

# Step 5: Create entry points
echo "Creating dual entry points (ES Module and CommonJS)..."

# ES Module Entry Point (index.js)
cat > dist/index.js << 'EOF'
/**
 * MatchPro Soccer Management Platform - ES Module Entry Point
 * 
 * This is the main entry point for the MatchPro application in ES Module format.
 */
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import server setup function using dynamic import
async function startServer() {
  try {
    console.log('Starting MatchPro server...');
    
    // Create Express app and HTTP server
    const app = express();
    const server = http.createServer(app);
    
    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Import server setup function
    const serverModule = await import('./server/prod-server.js');
    await serverModule.setupServer(app, server);
    
    // Route for diagnosing deployment issues
    app.get('/deployment-status', (req, res) => {
      res.json({
        status: 'ok',
        mode: 'esm',
        timestamp: new Date().toISOString(),
        publicDir: path.join(__dirname, 'public'),
        indexHtml: require('fs').existsSync(path.join(__dirname, 'public', 'index.html')),
        directories: {
          server: require('fs').existsSync(path.join(__dirname, 'server')),
          public: require('fs').existsSync(path.join(__dirname, 'public')),
        }
      });
    });
    
    // Fallback route - serve index.html for client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // Start the server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
EOF

# CommonJS Entry Point (index.cjs)
cat > dist/index.cjs << 'EOF'
/**
 * MatchPro Soccer Management Platform - CommonJS Entry Point
 * 
 * This is the main entry point for the MatchPro application in CommonJS format.
 */
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Create a function to start the server
async function startServer() {
  try {
    console.log('Starting MatchPro server (CommonJS mode)...');
    
    // Create Express app and HTTP server
    const app = express();
    const server = http.createServer(app);
    
    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Check for server files - attempt both ESM and CommonJS patterns
    let serverSetup;
    try {
      // First try CommonJS require
      const serverModule = require('./server/prod-server.js');
      serverSetup = serverModule.setupServer;
    } catch (e) {
      console.log('Could not load server using CommonJS, will try dynamic import:', e.message);
      // If CommonJS fails, try ESM dynamic import
      try {
        const serverModule = await import('./server/prod-server.js');
        serverSetup = serverModule.setupServer;
      } catch (e2) {
        console.error('Failed to load server module using ESM dynamic import:', e2);
        throw new Error('Could not load server module using either CommonJS or ESM');
      }
    }
    
    // Set up the server
    await serverSetup(app, server);
    
    // Route for diagnosing deployment issues
    app.get('/deployment-status', (req, res) => {
      res.json({
        status: 'ok',
        mode: 'commonjs',
        timestamp: new Date().toISOString(),
        publicDir: path.join(__dirname, 'public'),
        indexHtml: fs.existsSync(path.join(__dirname, 'public', 'index.html')),
        directories: {
          server: fs.existsSync(path.join(__dirname, 'server')),
          public: fs.existsSync(path.join(__dirname, 'public')),
        }
      });
    });
    
    // Fallback route - serve index.html for client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // Start the server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
EOF

# Create production server file
cat > dist/server/prod-server.js << 'EOF'
/**
 * Production server adapter with direct imports (no path aliases)
 * This file gets compiled to dist/server/prod-server.js during build
 */
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db, pgClient } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { crypto } from './crypto.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Setup the production server
 */
export async function setupServer(app, server) {
  console.log('Setting up production server...');
  
  // Test database connection first
  const dbConnected = await testDbConnection();
  console.log(`Database connection ${dbConnected ? 'successful' : 'failed'}`);
  
  // Setup middleware and auth
  await setupAuth(app);
  setupStaticFiles(app);
  setupApiRoutes(app, dbConnected);
  
  // Setup WebSocket server if needed
  try {
    const { setupWebSocketServer } = await import('./websocket.js');
    setupWebSocketServer(server);
    console.log('WebSocket server initialized');
  } catch (err) {
    console.warn('WebSocket server initialization skipped:', err.message);
  }
  
  console.log('Production server setup complete');
  return server;
}

/**
 * Test database connection
 */
async function testDbConnection() {
  try {
    await db.select().from(users).limit(1);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * Setup authentication
 */
async function setupAuth(app) {
  const memoryStore = MemoryStore(session);
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'matchpro-secret',
      resave: false,
      saveUninitialized: false,
      store: new memoryStore({
        checkPeriod: 86400000 // 24 hours
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Passport configuration
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const result = await db.select().from(users).where(eq(users.email, email));
          
          if (result.length === 0) {
            return done(null, false, { message: 'Incorrect email or password' });
          }
          
          const user = result[0];
          const isValid = await crypto.verify(password, user.password);
          
          if (!isValid) {
            return done(null, false, { message: 'Incorrect email or password' });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      const user = result.length > 0 ? result[0] : null;
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

/**
 * Setup static file serving
 */
function setupStaticFiles(app) {
  // Serve static files from the public directory
  app.use(express.static(path.join(dirname(__dirname), 'public')));
  
  // Serve public assets for client-side routing
  app.get('/', (req, res) => {
    res.sendFile(path.join(dirname(__dirname), 'public', 'index.html'));
  });
}

/**
 * Setup all API routes for production
 */
function setupApiRoutes(app, dbConnected) {
  app.use(express.json());
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // API routes from server/routes.js
  try {
    const routesModule = require('./routes.js');
    if (typeof routesModule.registerRoutes === 'function') {
      routesModule.registerRoutes(app);
      console.log('API routes registered successfully');
    } else {
      console.warn('registerRoutes function not found in routes module');
    }
  } catch (error) {
    console.error('Failed to register API routes:', error);
  }
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message
    });
  });
}
EOF

# Create the database connection module
cat > dist/db/index.js << 'EOF'
/**
 * Database connection module for production environment
 * Specially designed to work with ESM imports
 */
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// Create PostgreSQL client
const { Pool } = pg;
const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Create Drizzle instance
export const db = drizzle(client);
export const pgClient = client;
EOF

# Step 6: Make sure the entry points are executable
echo "Making all entry points executable..."
chmod +x dist/index.js
chmod +x dist/index.cjs

# Step 7: Create package.json in dist directory
cat > dist/package.json << EOF
{
  "name": "matchpro-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

# Step 8: Verify deployment structure
echo "Verifying deployment structure..."
if [ -f "dist/index.js" ] && [ -f "dist/index.cjs" ] && [ -d "dist/server" ] && [ -d "dist/public" ]; then
  echo "✅ Deployment structure verified successfully!"
  
  # Check for frontend assets
  if [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend assets are in place."
    
    # Show files in dist directory
    echo "Files in dist:"
    ls -la dist
    
    echo "Files in dist/public:"
    ls -la dist/public
    
    echo "========================================="
    echo "      Deployment preparation complete!   "
    echo "========================================="
    echo "Ready to deploy to Replit."
  else
    echo "❌ Frontend assets missing. Please check frontend build process."
    exit 1
  fi
else
  echo "❌ Deployment structure verification failed!"
  echo "Missing required files in dist directory."
  exit 1
fi