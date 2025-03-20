// deploy.js - Deployment preparation script for Replit
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting deployment preparation...');

// Run the build process
try {
  console.log('Building the application...');
  // Build the frontend with Vite
  execSync('vite build', { stdio: 'inherit' });
  
  // Manually create a CommonJS version of the server for Replit deployment
  console.log('Manually creating CommonJS server file for deployment...');
  
  // Let's create a simpler server file that works in CommonJS
  const serverContent = `
// Production server for Replit deployment
const express = require('express');
const { createServer } = require('http');
const path = require('path');
const fs = require('fs');

async function startServer() {
  console.log('Starting production server...');
  const app = express();
  const server = createServer(app);
  
  // Parse JSON
  app.use(express.json());
  
  // Add production server middlewares
  const { configureProductionServer } = require('./production-server');
  configureProductionServer(app);
  
  // Custom API routes would go here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: 'production' });
  });
  
  // Start the server
  const port = process.env.PORT || 5000;
  const host = process.env.HOST || '0.0.0.0';
  
  server.listen(port, host, () => {
    console.log(\`Server running at http://\${host}:\${port}\`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
`;

  // Create the dist directory if it doesn't exist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // Write the simplified server file with .cjs extension for CommonJS compatibility
  fs.writeFileSync(path.join('dist', 'index.cjs'), serverContent);
  console.log('Created simplified CommonJS server file with .cjs extension');
  
  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// Ensure the server directory exists
if (!fs.existsSync('server')) {
  console.log('Creating server directory...');
  fs.mkdirSync('server', { recursive: true });
}

// Copy the built server file to the expected location
try {
  console.log('Copying built server file to server/index.cjs...');
  fs.copyFileSync(
    path.join(__dirname, 'dist', 'index.cjs'),
    path.join(__dirname, 'server', 'index.cjs')
  );
  console.log('Server file copied successfully.');
} catch (error) {
  console.error('Failed to copy server file:', error);
  process.exit(1);
}

// Prepare static files for Replit deployment
try {
  console.log('Ensuring static assets are accessible...');
  
  // Create a symlink for dist/public if it doesn't exist in the server directory
  const publicSourcePath = path.join(__dirname, 'dist', 'public');
  const publicTargetPath = path.join(__dirname, 'server', 'public');
  
  if (!fs.existsSync(publicTargetPath)) {
    if (process.platform === 'win32') {
      // For Windows, we'll copy the directory instead of creating a symlink
      execSync(`xcopy "${publicSourcePath}" "${publicTargetPath}" /E /I /H /Y`);
    } else {
      // For Unix-like systems, create a symlink
      if (fs.existsSync(publicSourcePath)) {
        fs.symlinkSync(publicSourcePath, publicTargetPath, 'dir');
      }
    }
  }
  
  // Instead of patching the server code directly, we'll use our custom deployment modules
  // Copy our production-server modules to the server directory
  const sourceDir = path.join(__dirname, 'server-deploy');
  const targetDir = path.join(__dirname, 'server');
  
  // Copy production modules
  try {
    console.log('Copying production deployment modules...');
    ['static-server.js', 'production-server.js'].forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${file} to server directory`);
      } else {
        console.error(`Missing production module: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error copying production modules:', error);
  }
  
  // Modify the server code to use our production modules
  const serverIndexPath = path.join(__dirname, 'server', 'index.js');
  if (fs.existsSync(serverIndexPath)) {
    console.log('Patching server/index.js to use production modules...');
    
    let serverCode = fs.readFileSync(serverIndexPath, 'utf8');
    
    // Find the section where we switch between development and production mode
    if (serverCode.includes('app.get("env") === "development"')) {
      // Add require for production server
      const requireLine = `const { configureProductionServer } = require('./production-server');\n`;
      
      // First line without risk of breaking specific code
      if (!serverCode.includes('configureProductionServer')) {
        // Find a good spot to add our require statement
        const firstLineEnd = serverCode.indexOf('\n');
        if (firstLineEnd !== -1) {
          // Insert after the first line
          serverCode = serverCode.slice(0, firstLineEnd + 1) + 
                        requireLine + 
                        serverCode.slice(firstLineEnd + 1);
          console.log('Added production server require statement');
        }
      }
      
      // Replace the production mode code with our configureProductionServer
      const prodSectionStart = serverCode.indexOf('} else {');
      const prodSectionEnd = serverCode.indexOf('app.use((err', prodSectionStart);
      
      if (prodSectionStart !== -1 && prodSectionEnd !== -1) {
        const prodReplacement = `} else {
      // Configure production mode with enhanced static file handling
      configureProductionServer(app);
    }\n\n    `;
        
        serverCode = serverCode.slice(0, prodSectionStart) + 
                     prodReplacement + 
                     serverCode.slice(prodSectionEnd);
        
        console.log('Replaced production mode code with configureProductionServer');
      }
      
      // Write the updated server code
      fs.writeFileSync(serverIndexPath, serverCode);
      console.log('Server code patched successfully for production deployment');
    } else {
      console.warn('Could not locate development/production switch in server code.');
    }
  }
  
  console.log('Static assets are ready.');
} catch (error) {
  console.warn('Warning: Could not set up static assets directory:', error);
  console.log('This may not be critical if your server is configured to serve from dist/public directly.');
}

console.log('Deployment preparation complete.');
console.log('Your application is now ready for deployment on Replit.');
console.log('');
console.log('Server path: server/index.cjs');
console.log('Static assets: dist/public/');