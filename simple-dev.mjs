#!/usr/bin/env node

// Simple development server using esbuild to compile TypeScript
import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('Creating temporary compiled server...');

// Create a simple build script using esbuild if available
try {
  const child = spawn('npx', ['esbuild', 'server/index.ts', '--bundle', '--platform=node', '--format=esm', '--outfile=temp-server.mjs', '--external:vite', '--external:express', '--external:@db', '--external:@db/schema'], {
    stdio: 'pipe'
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('Successfully compiled TypeScript. Starting server...');
      
      // Run the compiled server
      const serverChild = spawn('node', ['temp-server.mjs'], {
        stdio: 'inherit',
        env: { ...process.env }
      });

      serverChild.on('error', (err) => {
        console.error('Failed to start server:', err.message);
        process.exit(1);
      });

      serverChild.on('exit', (code) => {
        process.exit(code || 0);
      });

    } else {
      console.error('Failed to compile TypeScript');
      process.exit(1);
    }
  });

  child.stderr.on('data', (data) => {
    console.error('Build error:', data.toString());
  });

} catch (error) {
  console.error('Error starting build:', error.message);
  process.exit(1);
}