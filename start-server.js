/**
 * Simple Server Starter
 * This bypasses the tsx module issue and starts the server directly
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting server with alternative method...');

const serverProcess = spawn('node', [
  '--loader', 'tsx/esm',
  join(__dirname, 'server/index.ts')
], {
  stdio: 'inherit',
  env: { ...process.env }
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
});