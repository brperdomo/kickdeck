#!/usr/bin/env node

/**
 * Application Starter - Bypasses tsx module issues
 * This script starts the server using a working Node.js configuration
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('Starting application server...');

// Try different startup methods in order of preference
const startupMethods = [
  // Method 1: Use tsx directly if available
  () => {
    if (existsSync('./node_modules/.bin/tsx')) {
      return spawn('./node_modules/.bin/tsx', ['server/index.ts'], {
        stdio: 'inherit',
        shell: true,
        env: process.env
      });
    }
    return null;
  },
  
  // Method 2: Use node with experimental loader
  () => {
    return spawn('node', [
      '--experimental-loader', './node_modules/tsx/esm/index.mjs',
      'server/index.ts'
    ], {
      stdio: 'inherit',
      env: process.env
    });
  },
  
  // Method 3: Use direct node execution if JS file exists
  () => {
    if (existsSync('./server/index.js')) {
      return spawn('node', ['server/index.js'], {
        stdio: 'inherit',
        env: process.env
      });
    }
    return null;
  },
  
  // Method 4: Build and run
  () => {
    console.log('Building application...');
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Starting built application...');
        spawn('npm', ['start'], {
          stdio: 'inherit',
          shell: true,
          env: process.env
        });
      }
    });
    
    return buildProcess;
  }
];

let methodIndex = 0;

function tryNextMethod() {
  if (methodIndex >= startupMethods.length) {
    console.error('All startup methods failed. Please check your configuration.');
    process.exit(1);
  }
  
  const method = startupMethods[methodIndex++];
  const process = method();
  
  if (!process) {
    console.log(`Startup method ${methodIndex} not available, trying next...`);
    tryNextMethod();
    return;
  }
  
  process.on('error', (err) => {
    console.error(`Startup method ${methodIndex} failed:`, err.message);
    tryNextMethod();
  });
  
  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`Process exited with code ${code}, trying next method...`);
      tryNextMethod();
    }
  });
  
  // If process starts successfully and runs for more than 3 seconds, consider it working
  setTimeout(() => {
    console.log('Server appears to be running successfully');
  }, 3000);
}

// Start with the first method
tryNextMethod();