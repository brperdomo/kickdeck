/**
 * Main entry point for MatchPro Soccer Management Platform on Replit
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Convert ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API endpoints for health checks
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    mode: 'production',
    timestamp: new Date().toISOString()
  });
});

// Status endpoint for debugging
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

// Serve static files from dist/public directory
const distPath = path.join(__dirname, 'dist/public');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
  console.log('Frontend build found, serving static files...');
  // Serve static files with appropriate cache headers
  app.use(express.static(distPath, {
    maxAge: '1h',
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        // Don't cache HTML files
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // Handle client-side routing - serve index.html for all paths except /api
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      console.log(`Serving index.html for route: ${req.path}`);
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  console.log('⚠ Frontend build not found in dist/public!');
  console.log('⚠ Please run build-frontend.sh first.');
  
  // Provide a helpful message if build is not found
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.status(500).send(`
        <html>
          <head><title>MatchPro - Build Required</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; line-height: 1.6;">
            <h1>MatchPro Soccer Management Platform</h1>
            <p>The frontend build is missing. Please run the build process first:</p>
            <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">
              ./build-frontend.sh
            </pre>
            <p>Or use the complete deployment script:</p>
            <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">
              ./deploy-simplified.sh
            </pre>
            <p>Current server time: ${new Date().toISOString()}</p>
          </body>
        </html>
      `);
    }
  });
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MatchPro server running on http://0.0.0.0:${PORT}`);
  console.log(`Frontend build path: ${distPath}`);
  console.log(`Build exists: ${fs.existsSync(indexPath)}`);
});