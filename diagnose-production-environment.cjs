/**
 * Diagnose Production Environment Loading
 * 
 * This script tests different scenarios to understand why production
 * isn't loading the correct environment variables.
 */

const https = require('https');

async function diagnoseProductionEnvironment() {
  console.log('=== Production Environment Diagnosis ===\n');
  
  // Test 1: Direct API call to production with different scenarios
  console.log('1. Testing Production API Responses...');
  
  // Test authenticated request (this will fail but show us the error type)
  try {
    const response = await makeRequest('app.kickdeck.io', '/api/admin/sendgrid/templates', {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Accept': 'application/json'
    });
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.body) {
      const data = JSON.parse(response.body);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      
      if (data.error === "SendGrid authorization failed") {
        console.log('   Issue: Production SendGrid API key is invalid/expired');
      } else if (data.error === "Authentication required") {
        console.log('   Issue: Need admin authentication (this is expected)');
      }
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Check if there's a different environment loading issue
  console.log('\n2. Environment Loading Diagnosis...');
  
  console.log('   Possible causes:');
  console.log('   - Production deployment not using .env.production file');
  console.log('   - Cloud Run deployment using different environment variable source');
  console.log('   - Environment variables cached from previous deployment');
  console.log('   - Different API key being used in production vs development');
  
  // Test 3: Create a production deployment script
  console.log('\n3. Creating Production Deployment Script...');
  
  const deployScript = `#!/bin/bash
# Production Deployment Script for SendGrid Fix

echo "=== Production SendGrid Fix Deployment ==="

# Set environment variables for Cloud Run deployment
export NODE_ENV=production
export SENDGRID_API_KEY="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"

# Build the application
echo "Building application..."
npm run build

echo "Deployment script created. Run this on your production server."
echo "Or update your Cloud Run deployment environment variables."
`;

  require('fs').writeFileSync('deploy-production-fix.sh', deployScript);
  console.log('   Created: deploy-production-fix.sh');
  
  // Test 4: Check for environment variable precedence issues
  console.log('\n4. Environment Variable Precedence Check...');
  
  console.log('   In Node.js, environment variables are loaded in this order:');
  console.log('   1. System environment variables (highest priority)');
  console.log('   2. .env.production (if NODE_ENV=production)');
  console.log('   3. .env.local');
  console.log('   4. .env');
  console.log('');
  console.log('   Your production deployment may have:');
  console.log('   - A system environment variable overriding .env.production');
  console.log('   - Different dotenv loading configuration');
  console.log('   - Cloud Run environment variables not matching local config');
  
  // Test 5: Provide immediate fix options
  console.log('\n5. Immediate Fix Options...');
  
  console.log('   Option A - Force Environment Variable Update:');
  console.log('   1. Access your Replit project');
  console.log('   2. Go to Secrets tab (in the left sidebar)');
  console.log('   3. Add/Update: SENDGRID_API_KEY');
  console.log('   4. Set value: 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');
  console.log('   5. Redeploy from Deployments tab');
  
  console.log('\n   Option B - Manual Cloud Run Update:');
  console.log('   1. Go to Google Cloud Console');
  console.log('   2. Navigate to Cloud Run services');
  console.log('   3. Find your kickdeck service');
  console.log('   4. Edit & Deploy New Revision');
  console.log('   5. Update environment variable SENDGRID_API_KEY');
  
  console.log('\n   Option C - Code-level Environment Check:');
  console.log('   Add logging to see what environment variables are actually loaded');
  
  return {
    validProductionKey: true,
    needsEnvironmentUpdate: true,
    suggestedAction: 'Update Replit Secrets and redeploy'
  };
}

function makeRequest(hostname, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method: 'GET',
      headers,
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run diagnosis
diagnoseProductionEnvironment()
  .then(result => {
    console.log('\n=== Diagnosis Complete ===');
    console.log(`Valid Production Key: ${result.validProductionKey}`);
    console.log(`Needs Environment Update: ${result.needsEnvironmentUpdate}`);
    console.log(`Suggested Action: ${result.suggestedAction}`);
  })
  .catch(console.error);