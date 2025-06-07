// Simple Node.js server starter that bypasses tsx
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// First compile the TypeScript server
console.log('Compiling TypeScript server...');
const compileProcess = spawn('npx', ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist'], {
  stdio: 'inherit',
  cwd: __dirname
});

compileProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Server compiled successfully. Starting server...');
    
    // Now run the compiled server
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env }
    });

    serverProcess.on('close', (code) => {
      console.log(`Server exited with code ${code}`);
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
    });
  } else {
    console.error('TypeScript compilation failed');
    process.exit(1);
  }
});

compileProcess.on('error', (err) => {
  console.error('Failed to compile TypeScript:', err);
  process.exit(1);
});