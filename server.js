// Minimal server runner that bypasses tsx dependency issues
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Try to load and run the server using different methods
async function startServer() {
  try {
    console.log('Starting server with alternative method...');
    
    // Check if we can run tsx via npx
    const { spawn } = await import('child_process');
    
    // Use npx tsx to run the server
    const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
      process.exit(1);
    });
    
    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Server exited with code ${code}`);
        process.exit(code || 1);
      }
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      serverProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log('\nShutting down server...');
      serverProcess.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('Startup error:', error);
  process.exit(1);
});