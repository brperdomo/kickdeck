// Production static file server configuration
const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Configure the server to serve static files in production mode
 * This addresses the specific requirements for Replit deployment
 */
function configureStaticServer(app) {
  console.log('Setting up production static file server...');
  
  // Check multiple possible locations for static assets
  const possiblePaths = [
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'dist', 'public'),
    path.join(process.cwd(), 'server', 'public')
  ];
  
  // Log all the paths we're checking
  console.log('Checking for static files in:');
  possiblePaths.forEach(p => console.log(` - ${p}`));
  
  // Configure static file serving from all possible paths
  possiblePaths.forEach(staticPath => {
    if (fs.existsSync(staticPath)) {
      console.log(`Found static files at: ${staticPath}`);
      app.use(express.static(staticPath));
    } else {
      console.log(`Static path not found: ${staticPath}`);
    }
  });
  
  // Serve uploads directory if it exists
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsPath)) {
    console.log(`Setting up uploads directory: ${uploadsPath}`);
    app.use('/uploads', express.static(uploadsPath));
  }
  
  // Add health check endpoint for monitoring
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'running',
      mode: 'production',
      static: true,
      timestamp: new Date().toISOString()
    });
  });

  // Set up SPA fallback - serve index.html for all unmatched routes
  app.get('*', (req, res) => {
    // Skip API routes - they should be handled elsewhere or return 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
    }
    
    // Try to find index.html in multiple locations
    for (const basePath of possiblePaths) {
      const indexPath = path.join(basePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`Serving SPA fallback from: ${indexPath}`);
        return res.sendFile(indexPath);
      }
    }
    
    // If index.html isn't found anywhere, send a helpful error
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Configuration Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .error-container {
              background: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #e53e3e; }
            h2 { color: #3182ce; }
            pre, code {
              background: #f8f8f8;
              padding: 2px 5px;
              border-radius: 3px;
              font-family: monospace;
            }
            .info { color: #4299e1; }
            .warning { color: #ed8936; }
            .error { color: #e53e3e; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Static Files Not Found</h1>
            <p>The application could not locate the required static files. This might be due to a deployment configuration issue.</p>
            
            <h2>Debug Information:</h2>
            <ul>
              <li><strong>Current working directory:</strong> ${process.cwd()}</li>
              <li><strong>Node Environment:</strong> ${process.env.NODE_ENV || 'not set'}</li>
              <li><strong>Checked paths:</strong>
                <ul>
                  ${possiblePaths.map(p => `<li>${p}: ${fs.existsSync(p) ? '✅ exists' : '❌ missing'}</li>`).join('')}
                </ul>
              </li>
            </ul>
            
            <h2>Troubleshooting Steps:</h2>
            <ol>
              <li>Make sure you've run the deployment script: <code>./deploy-replit.sh</code></li>
              <li>Check that the frontend build was successful</li>
              <li>Verify that <code>dist/public/index.html</code> exists</li>
              <li>Check server logs for more detailed error information</li>
            </ol>
          </div>
        </body>
      </html>
    `);
  });
  
  console.log('Production static file server configured successfully');
}

module.exports = { configureStaticServer };