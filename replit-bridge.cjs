/**
 * Bridge file between different module formats for Replit deployment
 * This is a safety net to ensure the application starts regardless of module system
 */
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

/**
 * Checks if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

/**
 * Creates a basic Express server as a fallback
 */
function createFallbackServer() {
  try {
    const express = require('express');
    const app = express();
    const PORT = process.env.PORT || 3000;
    
    // Serve static files if they exist
    const distPath = path.join(__dirname, 'dist/public');
    if (fileExists(path.join(distPath, 'index.html'))) {
      app.use(express.static(distPath));
    }
    
    // Diagnostic endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        mode: 'fallback-server',
        message: 'Using fallback server because primary server failed to start'
      });
    });
    
    // Diagnostic endpoint with detailed info
    app.get('/api/deployment/status', (req, res) => {
      // Check for dist files
      const distExists = fileExists(path.join(__dirname, 'dist/public/index.html'));
      
      // List key files
      const rootFiles = fs.readdirSync(__dirname).filter(file => 
        !fs.statSync(path.join(__dirname, file)).isDirectory()
      ).slice(0, 20);
      
      res.json({
        status: 'fallback',
        entryPoint: 'replit-bridge.cjs (fallback)',
        nodeVersion: process.version,
        env: process.env.NODE_ENV || 'development',
        time: new Date().toISOString(),
        distExists,
        rootFiles,
        message: 'Using fallback server because primary server failed to start'
      });
    });
    
    // For SPA routing
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      if (distExists) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        res.status(500).send('Frontend files not found. Please run deployment script first.');
      }
    });
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Fallback server running on http://0.0.0.0:${PORT}`);
    });
    
  } catch (err) {
    console.error('Failed to create fallback server:', err);
    process.exit(1);
  }
}

/**
 * Try to start the application using different entry points in order
 */
async function startApplication() {
  console.log('🚀 Starting application via replit-bridge.cjs...');
  
  // Define entry points in priority order
  const entryPoints = [
    { file: 'replit.cjs', type: 'commonjs', command: 'node replit.cjs' },
    { file: 'index.cjs', type: 'commonjs', command: 'node index.cjs' },
    { file: 'replit.js', type: 'module', command: 'node --experimental-modules replit.js' },
    { file: 'index.js', type: 'module', command: 'node --experimental-modules index.js' }
  ];
  
  // Try each entry point
  for (const entry of entryPoints) {
    if (fileExists(path.join(__dirname, entry.file))) {
      console.log(`Attempting to start with ${entry.file} (${entry.type})...`);
      
      try {
        // For CommonJS entry points
        if (entry.type === 'commonjs') {
          console.log(`Starting server using ${entry.command}`);
          // We're running directly using fork
          const entryPath = path.join(__dirname, entry.file);
          return require(entryPath);
        }
        
        // For ES Module entry points, we need to spawn a new process
        const childProcess = spawn('node', ['--experimental-modules', entry.file], {
          stdio: 'inherit',
          cwd: __dirname
        });
        
        // Handle process events
        childProcess.on('error', (err) => {
          console.error(`Failed to start with ${entry.file}:`, err);
          // Continue to next entry point
        });
        
        // Successfully started
        console.log(`Successfully started with ${entry.file}`);
        return;
      } catch (err) {
        console.error(`Error starting ${entry.file}:`, err);
        // Continue to next entry point
      }
    }
  }
  
  // If all entry points failed, start fallback server
  console.error('All entry points failed, starting fallback server...');
  createFallbackServer();
}

// Start the application
startApplication();
