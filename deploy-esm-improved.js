/**
 * Improved ESM deployment script for direct execution
 * This version properly integrates the compiled server-prod.ts file
 */
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Runs a system command and returns a promise
 */
function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const childProcess = exec(
      `${command} ${args.join(' ')}`,
      { cwd },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Command error: ${error.message}`);
          console.error(stderr);
          reject(error);
          return;
        }
        resolve(stdout);
      }
    );

    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

/**
 * Convert TypeScript file to JavaScript with proper ES module imports
 */
async function convertToESM(sourceFile, destFile) {
  try {
    console.log(`Converting ${sourceFile} to ${destFile} with ES module imports...`);
    
    // Use esbuild to compile TS to JS
    await runCommand('npx', [
      'esbuild',
      sourceFile,
      '--platform=node',
      '--packages=external',
      '--format=esm',
      '--outfile=' + destFile
    ]);
    
    // Additional processing for better paths if needed
    let content = await fs.readFile(destFile, 'utf8');
    
    // Fix imports to include .js extension where needed
    content = content.replace(/from\s+['"]([^'"]+)['"]/g, (match, path) => {
      // Skip external packages
      if (!path.startsWith('.') && !path.startsWith('/')) {
        return match;
      }
      
      // Add .js extension if not already present
      if (!path.endsWith('.js')) {
        return `from '${path}.js'`;
      }
      
      return match;
    });
    
    await fs.writeFile(destFile, content, 'utf8');
    console.log(`Successfully converted ${sourceFile} to ${destFile}`);
    
    return true;
  } catch (error) {
    console.error(`Error converting ${sourceFile} to ESM:`, error);
    return false;
  }
}

/**
 * Process directory structure and convert all TypeScript files
 */
async function processDirectory(sourceDir, destDir) {
  try {
    // Create destination directory if it doesn't exist
    await fs.mkdir(destDir, { recursive: true });
    
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = join(sourceDir, entry.name);
      const destPath = join(destDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules
        if (entry.name === 'node_modules') continue;
        
        // Process subdirectory
        await processDirectory(sourcePath, destPath);
      } else if (entry.isFile()) {
        // Process TypeScript files
        if (entry.name.endsWith('.ts')) {
          const destFile = destPath.replace(/\.ts$/, '.js');
          await convertToESM(sourcePath, destFile);
        } else if (entry.name.endsWith('.js') || !entry.name.includes('.')) {
          // Copy other files directly
          await fs.copyFile(sourcePath, destPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${sourceDir}:`, error);
  }
}

/**
 * Create entry point file for the server
 */
async function createServerEntry(distDir) {
  const serverEntry = `/**
 * ESM server entry point for Replit deployment
 */
import express from 'express';
import http from 'http';
import { setupServer } from './server/prod-server.js';

async function startServer() {
  console.log('Starting production server...');
  const app = express();
  const server = http.createServer(app);
  
  try {
    await setupServer(app, server);
    
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      console.log(\`Server running on port \${port}\`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
  }
}

startServer();
`;

  await fs.writeFile(join(distDir, 'index.js'), serverEntry, 'utf8');
  console.log('Created server entry point at dist/index.js');
}

/**
 * Main deployment setup function
 */
async function setupDeployment() {
  try {
    const distDir = resolve('dist');
    
    // Create the dist directory if it doesn't exist
    await fs.mkdir(distDir, { recursive: true });
    
    // Copy specific server file with proper paths
    console.log('Processing server/prod-server.ts...');
    await fs.mkdir(join(distDir, 'server'), { recursive: true });
    await convertToESM('server/prod-server.ts', join(distDir, 'server', 'prod-server.js'));
    
    // Copy db directory files
    console.log('Processing db directory...');
    await processDirectory('db', join(distDir, 'db'));
    
    // Build frontend with Vite
    console.log('Building frontend with Vite...');
    try {
      await runCommand('npx', ['vite', 'build', '--outDir', join('..', 'dist', 'public')]);
    } catch (error) {
      console.error('Error building frontend:', error);
    }
    
    // Create server entry point
    await createServerEntry(distDir);
    
    console.log('Deployment setup completed successfully!');
    console.log('You can now deploy your application on Replit.');
  } catch (error) {
    console.error('Deployment setup failed:', error);
    process.exit(1);
  }
}

// Run the deployment setup
setupDeployment();