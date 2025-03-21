/**
 * ESM deployment script for direct execution
 */

import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Setting up ESM-compatible deployment structure...');

async function setupDeployment() {
  try {
    // Create server directory structure in dist if it doesn't exist
    const serverDir = join(__dirname, 'dist', 'server');
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    
    // Create a simplified server/index.js for the dist directory
    const serverIndexContent = `
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
  console.log(\`Serving static files from \${publicPath}\`);
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
  console.log(\`Server running on port \${port}\`);
});

// Export server setup function for compatibility
export function setupServer(app, server) {
  console.log('Setup server called');
  return Promise.resolve();
}
`;
    
    await writeFile(join(serverDir, 'index.js'), serverIndexContent, 'utf8');
    console.log('Created ESM-compatible server/index.js in dist directory');
    
    // Create main entry point in dist directory
    const mainIndexContent = `
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
`;
    
    await writeFile(join(__dirname, 'dist', 'index.js'), mainIndexContent, 'utf8');
    console.log('Created ESM-compatible entry point in dist directory');
    
    console.log('Deployment setup complete. To start the server in production:');
    console.log('  NODE_ENV=production node dist/index.js');
    
  } catch (error) {
    console.error('Error setting up deployment:', error);
    process.exit(1);
  }
}

setupDeployment();