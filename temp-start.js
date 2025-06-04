// Temporary startup script to bypass tsx dependency issues
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Setting up temporary development environment...');

// Check if we can use npx tsx directly
try {
  console.log('Attempting to start server with npx tsx...');
  execSync('npx tsx server/index.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('Failed to start with npx tsx:', error.message);
  
  // Try alternative approach with node and esbuild
  try {
    console.log('Attempting to compile and run with esbuild...');
    
    // First, compile the TypeScript
    execSync('npx esbuild server/index.ts --bundle --platform=node --format=cjs --outfile=temp-server.js --external:pg --external:express --external:passport --external:stripe --external:@sendgrid/mail', {
      stdio: 'pipe'
    });
    
    // Then run the compiled JavaScript
    execSync('node temp-server.js', {
      stdio: 'inherit'
    });
    
  } catch (buildError) {
    console.error('Build approach also failed:', buildError.message);
    console.log('Please check your dependencies and try running: npm install');
    process.exit(1);
  }
}