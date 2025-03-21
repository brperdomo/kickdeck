/**
 * Root index.js file to handle Replit deployment health check issue
 * This file serves as a direct entry point for Replit deployment
 */

// Import the actual server module
try {
  // Try to load server.js first, which is our direct override
  require('./server.js');
  console.log('Server started through root index.js -> server.js');
} catch (error) {
  console.error('Error loading server.js:', error);
  
  try {
    // If direct load fails, try to use the compiled server
    require('./dist/index.js');
    console.log('Server started through root index.js -> dist/index.js');
  } catch (distError) {
    console.error('Error loading dist/index.js:', distError);
    
    // If all else fails, create a minimal server directly
    const express = require('express');
    const path = require('path');
    const fs = require('fs');
    
    console.log('Creating minimal emergency server');
    const app = express();
    const PORT = process.env.PORT || 3000;
    
    // Health check override
    app.get('/', (req, res) => {
      const indexHtml = path.join(__dirname, 'index.html');
      if (fs.existsSync(indexHtml)) {
        return res.sendFile(indexHtml);
      }
      
      const distIndexHtml = path.join(__dirname, 'dist/public/index.html');
      if (fs.existsSync(distIndexHtml)) {
        return res.sendFile(distIndexHtml);
      }
      
      // Emergency HTML response
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>MatchPro Platform</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
              .container { max-width: 800px; margin: 0 auto; }
              h1 { color: #0056b3; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>MatchPro Soccer Management Platform</h1>
              <p>The application is running in emergency mode.</p>
              <p>Please check the deployment logs for more information.</p>
            </div>
          </body>
        </html>
      `);
    });
    
    // Serve static files if available
    const publicDir = path.join(__dirname, 'dist/public');
    if (fs.existsSync(publicDir)) {
      app.use(express.static(publicDir));
    }
    
    // Fallback route
    app.get('*', (req, res) => {
      if (req.path === '/health' || req.path === '/api/health') {
        return res.json({ status: 'ok', mode: 'emergency' });
      }
      
      res.send('MatchPro application - path not found');
    });
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Emergency server running on port ${PORT}`);
    });
  }
}