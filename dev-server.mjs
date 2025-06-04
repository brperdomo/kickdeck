#!/usr/bin/env node

// Simple development server that compiles TypeScript on the fly
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting development server...');

// Use npx to run tsx directly
const child = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env },
  cwd: __dirname
});

child.on('error', (err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle cleanup
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});