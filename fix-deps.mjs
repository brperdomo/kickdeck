#!/usr/bin/env node

// Direct dependency fix and server start
import { spawn } from 'child_process';
import { existsSync, writeFileSync } from 'fs';

console.log('Fixing dependency installation...');

// Create a simple package.json with just the essential dependencies
const minimalPackageJson = {
  "name": "rest-express-fixed",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.21.2",
    "tsx": "^4.19.4",
    "vite": "^5.4.9",
    "typescript": "^5.6.3",
    "esbuild": "^0.24.0"
  }
};

// Write minimal package.json temporarily
writeFileSync('package-temp.json', JSON.stringify(minimalPackageJson, null, 2));

console.log('Installing essential dependencies...');

const installProcess = spawn('npm', ['install', '--package-lock-only=false'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

installProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Dependencies installed successfully. Starting server...');
    
    // Now try to start the server with tsx
    const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    serverProcess.on('error', (err) => {
      console.error('Server failed to start:', err.message);
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      serverProcess.kill('SIGINT');
      process.exit(0);
    });

  } else {
    console.error('Failed to install dependencies');
    process.exit(1);
  }
});

installProcess.on('error', (err) => {
  console.error('Installation process failed:', err.message);
  process.exit(1);
});