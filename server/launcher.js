import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to run with tsx directly using npx
const child = spawn('npx', ['tsx', path.join(__dirname, 'index.ts')], {
  stdio: 'inherit',
  env: { ...process.env }
});

child.on('error', (error) => {
  console.error('Failed to start server with tsx:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});