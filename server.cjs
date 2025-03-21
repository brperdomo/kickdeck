/**
 * CommonJS entry point for the server
 */
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// Import the main server file
require('./index.js');
