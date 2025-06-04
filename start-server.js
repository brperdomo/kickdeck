// Simple server startup script to bypass tsx issues
import { spawn } from 'child_process';
import path from 'path';

// Try different methods to start the TypeScript server
const methods = [
  // Method 1: Try npx tsx
  () => spawn('npx', ['--yes', 'tsx', 'server/index.ts'], { stdio: 'inherit' }),
  
  // Method 2: Try local tsx if available
  () => spawn('./node_modules/.bin/tsx', ['server/index.ts'], { stdio: 'inherit' }),
  
  // Method 3: Try ts-node
  () => spawn('npx', ['--yes', 'ts-node', '--esm', 'server/index.ts'], { stdio: 'inherit' }),
  
  // Method 4: Try esbuild-register
  () => spawn('node', ['-r', 'esbuild-register', 'server/index.ts'], { stdio: 'inherit' })
];

async function startServer() {
  console.log('Attempting to start server...');
  
  for (let i = 0; i < methods.length; i++) {
    try {
      console.log(`Trying method ${i + 1}...`);
      const child = methods[i]();
      
      // Wait a bit to see if it starts successfully
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error('Timeout'));
        }, 5000);
        
        child.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
        
        child.on('spawn', () => {
          clearTimeout(timeout);
          console.log(`Server started successfully with method ${i + 1}`);
          resolve();
        });
      });
      
      // If we get here, the server started
      return;
      
    } catch (error) {
      console.log(`Method ${i + 1} failed:`, error.message);
      continue;
    }
  }
  
  console.error('All startup methods failed');
  process.exit(1);
}

startServer().catch(console.error);