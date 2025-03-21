/**
 * Deployment script for Replit - handles build process with ESM compatibility
 */

import { exec } from 'child_process';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting deployment build process...');

// Run the vite build
console.log('Building frontend with Vite...');
const viteBuild = () => {
  return new Promise((resolve, reject) => {
    exec('npx vite build', (error, stdout, stderr) => {
      if (error) {
        console.error('Error during Vite build:', error);
        return reject(error);
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve();
    });
  });
};

// Build the server files
console.log('Building server files with esbuild...');
const serverBuild = () => {
  return new Promise((resolve, reject) => {
    // Build both server files
    const buildCmd = 'npx esbuild server/index.js server/server-prod.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server';
    
    exec(buildCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Error during server build:', error);
        return reject(error);
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve();
    });
  });
};

// Generate server startup file for production
console.log('Generating production startup files...');
const generateStartupFile = async () => {
  const startupFile = `
// ESM entry point for the server in production
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
  `.trim();
  
  await writeFile(join(__dirname, 'dist', 'index.js'), startupFile, 'utf8');
  console.log('Production startup file created');
};

// Run the build process
async function runBuild() {
  try {
    await viteBuild();
    await serverBuild();
    await generateStartupFile();
    
    console.log('Build complete! The application is ready for deployment.');
    console.log('To start the server in production mode, run: NODE_ENV=production node dist/index.js');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();