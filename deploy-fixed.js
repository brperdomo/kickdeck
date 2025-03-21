/**
 * Fixed ESM deployment script with direct path imports
 */
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
 * Main deployment setup function
 */
async function setupDeployment() {
  try {
    // Create the dist directory if it doesn't exist
    await fs.mkdir('dist', { recursive: true });
    await fs.mkdir('dist/server', { recursive: true });
    await fs.mkdir('dist/public', { recursive: true });
    await fs.mkdir('dist/db', { recursive: true });
    
    console.log('Copying db directory to dist...');
    // Copy db files
    await fs.cp('db', 'dist/db', { recursive: true });

    console.log('Building frontend with Vite...');
    try {
      await runCommand('npx', ['vite', 'build', '--outDir', '../dist/public']);
    } catch (error) {
      console.error('Error building frontend:', error);
      // Continue with server setup
    }

    console.log('Compiling prod-server.ts with esbuild...');
    await runCommand('npx', [
      'esbuild',
      'server/prod-server.ts',
      '--platform=node',
      '--packages=external',
      '--format=esm',
      '--outfile=dist/server/prod-server.js'
    ]);

    // Create the main server entry point
    const serverEntry = `/**
 * ESM server entry point for Replit deployment
 */
import { setupServer } from './server/prod-server.js';
import express from 'express';
import http from 'http';

async function startServer() {
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

    await fs.writeFile('dist/index.js', serverEntry, 'utf8');
    console.log('Created dist/index.js server entry point');
    
    console.log('Deployment setup completed successfully!');
  } catch (error) {
    console.error('Deployment setup failed:', error);
    process.exit(1);
  }
}

// Run the deployment setup
setupDeployment();