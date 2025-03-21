/**
 * Server-only deployment script - focuses on compiling prod-server.ts 
 * without the time-consuming frontend build
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
 * Create server entry point file
 */
async function createServerEntry(distDir) {
  const serverEntry = `/**
 * ESM server entry point for Replit deployment - server only
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
    console.error('This is likely due to missing frontend files. This is a server-only deployment.');
    
    // Basic error page
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.json({ message: 'API endpoint available. This is a server-only deployment.' });
      }
      
      res.send('<h1>Server Only Mode</h1><p>This is a server-only deployment for testing API endpoints.</p>');
    });
    
    server.listen(port, '0.0.0.0', () => {
      console.log(\`Server running in limited mode on port \${port}\`);
    });
  }
}

startServer();
`;

  await fs.writeFile(join(distDir, 'index.js'), serverEntry, 'utf8');
  console.log('Created server entry point at dist/index.js');
}

/**
 * Main deployment setup function - server only
 */
async function setupServerDeployment() {
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
    await fs.mkdir(join(distDir, 'db'), { recursive: true });
    await fs.mkdir(join(distDir, 'db', 'schema'), { recursive: true });
    
    // Copy core db files
    await convertToESM('db/index.ts', join(distDir, 'db', 'index.js'));
    await convertToESM('db/schema.ts', join(distDir, 'db', 'schema.js'));
    
    // Check if emailTemplates.ts exists and process it
    try {
      await convertToESM('db/schema/emailTemplates.ts', join(distDir, 'db', 'schema', 'emailTemplates.js'));
    } catch (error) {
      console.warn('Could not process emailTemplates.ts, skipping.');
    }
    
    // Create server entry point
    await createServerEntry(distDir);
    
    console.log('Server-only deployment setup completed successfully!');
    console.log('You can now test the server API endpoints. Note: No frontend files were built in this mode.');
  } catch (error) {
    console.error('Server-only deployment setup failed:', error);
    process.exit(1);
  }
}

// Run the deployment setup
setupServerDeployment();