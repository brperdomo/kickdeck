#!/usr/bin/env node

// Working development server that handles TypeScript compilation
import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting development server with dependency resolution...');

// Try different approaches to start the server
async function startServer() {
  // First, try using npx with explicit vite installation
  console.log('Installing vite globally for this session...');
  
  const installProcess = spawn('npm', ['install', '-g', 'vite', 'tsx', 'typescript'], {
    stdio: 'pipe'
  });
  
  installProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Dependencies installed. Starting server with npx tsx...');
      
      const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      serverProcess.on('error', (err) => {
        console.error('Server startup failed:', err.message);
        process.exit(1);
      });
      
    } else {
      console.log('Global installation failed. Trying alternative approach...');
      
      // Alternative: try to run with direct node if TypeScript files can be compiled
      console.log('Attempting to compile server manually...');
      
      const compileProcess = spawn('npx', ['esbuild', 'server/index.ts', '--bundle', '--platform=node', '--format=esm', '--outfile=compiled-server.mjs', '--external:vite', '--packages=external'], {
        stdio: 'pipe'
      });
      
      compileProcess.on('close', (compileCode) => {
        if (compileCode === 0 && existsSync('compiled-server.mjs')) {
          console.log('Server compiled successfully. Starting...');
          
          const runProcess = spawn('node', ['compiled-server.mjs'], {
            stdio: 'inherit',
            env: { ...process.env }
          });
          
          runProcess.on('error', (err) => {
            console.error('Compiled server failed:', err.message);
          });
          
        } else {
          console.error('All startup methods failed. Please check dependencies.');
          process.exit(1);
        }
      });
    }
  });
  
  installProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
}

startServer();