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
  
  // Set up SPA fallback - serve index.html for all unmatched routes
  app.get('*', (req, res) => {
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
      <html>
        <head><title>Configuration Error</title></head>
        <body>
          <h1>Static Files Not Found</h1>
          <p>The application could not locate the required static files. This might be due to a deployment configuration issue.</p>
          <h2>Debug Information:</h2>
          <ul>
            <li>Current working directory: ${process.cwd()}</li>
            <li>Checked paths: ${possiblePaths.join(', ')}</li>
          </ul>
        </body>
      </html>
    `);
  });
  
  console.log('Production static file server configured successfully');
}

module.exports = { configureStaticServer };