#!/bin/bash

# Simplified deployment script for Replit
# This script skips the full build process and just creates minimal deployment structure

echo "Setting up minimal deployment structure for Replit..."

# Create necessary directories
mkdir -p dist/server dist/public

# Create a basic index.html file if it doesn't exist
if [ ! -f dist/public/index.html ]; then
  echo "Creating placeholder index.html..."
  cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MatchPro - Soccer Management</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      display: flex; 
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      text-align: center;
      padding: 0 20px;
    }
    h1 { color: #333; margin-bottom: 10px; }
    p { color: #666; margin: 5px 0; }
    .container { 
      max-width: 800px; 
      background: white; 
      padding: 40px; 
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .status { margin-top: 30px; font-size: 14px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>MatchPro Soccer Management</h1>
    <p>The application is running in deployment mode.</p>
    <p>Please check back soon for the complete interface.</p>
    <div class="status">Server Status: Running</div>
  </div>
</body>
</html>
EOF
fi

# Create ESM-compatible server index.js
echo "Creating ESM-compatible server module..."
cat > dist/server/index.js << 'EOF'
// ESM server adapter
import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const server = createServer(app);

// Basic JSON and form parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist/public
const publicPath = join(process.cwd(), 'dist', 'public');
if (fs.existsSync(publicPath)) {
  console.log(`Serving static files from ${publicPath}`);
  app.use(express.static(publicPath));
  
  // SPA fallback for client-side routing
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const indexPath = join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    
    res.status(404).send('Not found');
  });
}

// Add diagnostic endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

// Export server setup function for compatibility
export function setupServer(app, server) {
  console.log('Setup server called');
  return Promise.resolve();
}
EOF

# Create main entry point
echo "Creating ESM entry point..."
cat > dist/index.js << 'EOF'
// ESM entry point for production
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the server module
import('./server/index.js').catch(err => {
  console.error('Failed to load server:', err);
  process.exit(1);
});
EOF

echo "Deployment structure set up successfully."
echo "To run in production mode: NODE_ENV=production node dist/index.js"