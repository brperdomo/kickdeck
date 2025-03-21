/**
 * CommonJS entrypoint for server/index.js
 * This file bridges between Replit's deployment environment and our application
 */

// Since Replit runs 'node server/index.js' for deployment,
// we need this CJS wrapper to handle ES modules correctly
console.log('Starting server using CommonJS bridge...');

try {
  // Import the main replit.cjs entry point
  const path = require('path');
  const fs = require('fs');
  
  // Check if replit.cjs exists
  const replitPath = path.join(process.cwd(), 'replit.cjs');
  
  if (fs.existsSync(replitPath)) {
    console.log('Loading production server from replit.cjs');
    // Load the production server configuration
    require('../replit.cjs');
  } else {
    console.error('ERROR: replit.cjs not found!');
    console.error('Please run deployment script first: node deploy-starter.cjs');
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}