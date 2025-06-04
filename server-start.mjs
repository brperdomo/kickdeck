#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read package.json to get the correct start command
const packagePath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

console.log('Starting server with corrected module resolution...');

// Use a simplified approach that doesn't require tsx import
const serverProcess = spawn('node', [
  '--experimental-specifier-resolution=node',
  '--loader', './node_modules/tsx/esm/index.mjs',
  'server/index.ts'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-modules'
  }
});

serverProcess.on('error', (err) => {
  console.error('Server startup error:', err.message);
  
  // Fallback: try direct node execution
  console.log('Attempting fallback startup method...');
  const fallbackProcess = spawn('node', [
    'server/index.js'
  ], {
    stdio: 'inherit',
    env: process.env
  });
  
  fallbackProcess.on('error', (fallbackErr) => {
    console.error('Fallback startup failed:', fallbackErr.message);
    process.exit(1);
  });
});

serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`Server process exited with code ${code}`);
  }
});