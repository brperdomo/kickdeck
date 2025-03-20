// deploy.js - Deployment preparation script for Replit
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting deployment preparation...');

// Run the build process
try {
  console.log('Building the application...');
  execSync('npm run build', { stdio: 'inherit' });
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
  console.log('Copying built server file to server/index.js...');
  fs.copyFileSync(
    path.join(__dirname, 'dist', 'index.js'),
    path.join(__dirname, 'server', 'index.js')
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
      // Add import for production server
      const importLine = `import { configureProductionServer } from './production-server.js';\n`;
      
      // First line without risk of breaking specific code
      if (!serverCode.includes('configureProductionServer')) {
        const importInsertPoint = serverCode.indexOf('import');
        if (importInsertPoint !== -1) {
          // Insert after the last import
          const lastImportIndex = serverCode.lastIndexOf('import');
          const nextLineAfterLastImport = serverCode.indexOf('\n', lastImportIndex);
          if (nextLineAfterLastImport !== -1) {
            serverCode = serverCode.slice(0, nextLineAfterLastImport + 1) + 
                          importLine + 
                          serverCode.slice(nextLineAfterLastImport + 1);
            console.log('Added production server import');
          }
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
console.log('Server path: server/index.js');
console.log('Static assets: dist/public/');