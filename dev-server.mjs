#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';

console.log('Starting development server...');

// Start the working server in the background
const serverProcess = spawn('node', ['working-server.mjs'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: process.env.PORT || 5000
  }
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down development server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down development server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

serverProcess.on('exit', (code) => {
  console.log(`Development server exited with code: ${code}`);
  process.exit(code || 0);
});