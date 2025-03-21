
/**
 * Replit production server entry point
 * ESM version that dynamically imports necessary components
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import express from 'express';
import { createServer } from 'http';

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup process error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

async function startServer() {
  try {
    console.log('Starting server in ESM mode...');
    
    const app = express();
    const server = createServer(app);
    
    // Basic health check for diagnostics
    app.get('/_health', (req, res) => {
      res.json({
        status: 'ok',
        mode: 'esm',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      });
    });
    
    // Try to load the compiled server code
    const serverIndexPath = join(process.cwd(), 'dist', 'server', 'index.js');
    
    if (existsSync(serverIndexPath)) {
      console.log('Loading compiled server code from dist/server/index.js');
      try {
        const { setupServer } = await import(serverIndexPath);
        await setupServer(app, server);
        console.log('Server setup complete with compiled code');
      } catch (error) {
        console.error('Error loading compiled server code:', error);
        setupFallbackServer(app, server);
      }
    } else {
      // When compiled server not available, try development setup
      console.log('Compiled server not found, attempting to load development setup');
      try {
        const { setupVite } = await import('./vite.js');
        const { registerRoutes } = await import('./routes.js');
        const { setupAuth } = await import('./auth.js');
        const { createTables } = await import('./create-tables.js');
        const { createAdmin } = await import('./create-admin.js');
        
        // Setup auth
        setupAuth(app);
        
        // Setup routes
        registerRoutes(app);
        
        // Setup Vite (development mode)
        await setupVite(app, server);
        
        // Initialize database
        try {
          await createTables();
          await createAdmin();
          console.log('Database initialization complete');
        } catch (dbError) {
          console.error('Database initialization error:', dbError);
        }
        
        console.log('Development server setup complete');
      } catch (setupError) {
        console.error('Error setting up development server:', setupError);
        setupFallbackServer(app, server);
      }
    }
    
    // Handle static files for production
    if (process.env.NODE_ENV === 'production') {
      const distPath = join(process.cwd(), 'dist', 'public');
      if (existsSync(distPath)) {
        console.log(`Serving static files from ${distPath}`);
        app.use(express.static(distPath));
        
        // SPA fallback
        app.get('*', (req, res) => {
          if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
          }
          
          const indexPath = join(distPath, 'index.html');
          if (existsSync(indexPath)) {
            return res.sendFile(indexPath);
          }
          
          res.status(404).send('Not found');
        });
      }
    }
    
    // Start server
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
    
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

function setupFallbackServer(app, server) {
  console.log('Setting up fallback server...');
  
  // Basic health check
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head><title>Server Status</title></head>
        <body>
          <h1>Server Running in Fallback Mode</h1>
          <p>The application is running in a minimal fallback mode.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </body>
      </html>
    `);
  });
  
  // API status
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'limited',
      mode: 'fallback',
      message: 'Server running in fallback mode',
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('Fallback server configured');
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
