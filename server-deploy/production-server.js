// Production server initialization module
const express = require('express');
const path = require('path');
const { configureStaticServer } = require('./static-server');

/**
 * Configure the server specifically for production deployment on Replit
 */
function configureProductionServer(app) {
  console.log('Configuring server for production mode...');
  
  // Add a simple diagnostic endpoint
  app.get('/_deployment_status', (req, res) => {
    res.json({
      status: 'running',
      mode: 'production',
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      dirname: __dirname,
      // Environment info (careful not to leak sensitive values)
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || '(not set)',
        HOST: process.env.HOST || '(not set)'
      }
    });
  });
  
  // Configure static file server for production
  configureStaticServer(app);
  
  console.log('Production server configuration complete');
  return app;
}

module.exports = { configureProductionServer };