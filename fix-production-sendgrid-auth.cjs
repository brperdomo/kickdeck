/**
 * Production SendGrid Authentication Fix
 * 
 * This script creates a deployment configuration that ensures
 * the production environment has the correct SendGrid API key.
 */

const fs = require('fs');
const https = require('https');

async function fixProductionSendGrid() {
  console.log('=== Production SendGrid Authentication Fix ===\n');
  
  // 1. Verify the working API key from local environment
  require('dotenv').config({ path: '.env.production' });
  const workingApiKey = process.env.SENDGRID_API_KEY;
  
  if (!workingApiKey) {
    console.log('❌ No SendGrid API key found in .env.production');
    return;
  }
  
  console.log(`✅ Found working API key: ${workingApiKey.substring(0, 10)}...`);
  
  // 2. Test the API key to confirm it works
  try {
    const testResult = await testSendGridAPI(workingApiKey);
    if (testResult.success) {
      console.log(`✅ API key is valid and working (${testResult.templates} templates found)`);
    } else {
      console.log(`❌ API key test failed: ${testResult.error}`);
      return;
    }
  } catch (error) {
    console.log(`❌ API key test error: ${error.message}`);
    return;
  }
  
  // 3. Create production deployment script with environment variable override
  console.log('\n📝 Creating production deployment configuration...');
  
  const deploymentScript = `#!/bin/bash
# Production SendGrid Fix Deployment Script
# This script ensures the correct SendGrid API key is used in production

set -e

echo "=== Production SendGrid Deployment Fix ==="
echo "Timestamp: $(date)"

# Set critical environment variables for Cloud Run
export NODE_ENV="production"
export SENDGRID_API_KEY="${workingApiKey}"
export DEFAULT_FROM_EMAIL="support@matchpro.ai"

echo "Environment variables set:"
echo "- NODE_ENV: $NODE_ENV"
echo "- SENDGRID_API_KEY: ${workingApiKey.substring(0, 10)}..."
echo "- DEFAULT_FROM_EMAIL: $DEFAULT_FROM_EMAIL"

echo "Building application for production..."
npm run build

echo "Production build complete."
echo "Deploy this to your Cloud Run service with these environment variables."
`;

  fs.writeFileSync('deploy-production-sendgrid-fix.sh', deploymentScript);
  fs.chmodSync('deploy-production-sendgrid-fix.sh', 0o755);
  console.log('✅ Created: deploy-production-sendgrid-fix.sh');
  
  // 4. Create environment variable export file for Cloud Run
  const envVarsFile = `# Cloud Run Environment Variables
# Copy these to your Google Cloud Run deployment

NODE_ENV=production
SENDGRID_API_KEY=${workingApiKey}
DEFAULT_FROM_EMAIL=support@matchpro.ai
DATABASE_URL=\${DATABASE_URL}
SESSION_SECRET=\${SESSION_SECRET}
STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
`;

  fs.writeFileSync('production-env-vars.txt', envVarsFile);
  console.log('✅ Created: production-env-vars.txt');
  
  // 5. Create Replit deployment configuration
  const replitDeploymentConfig = {
    deployment: {
      environment: {
        NODE_ENV: 'production',
        SENDGRID_API_KEY: workingApiKey,
        DEFAULT_FROM_EMAIL: 'support@matchpro.ai'
      }
    }
  };
  
  fs.writeFileSync('replit-production-config.json', JSON.stringify(replitDeploymentConfig, null, 2));
  console.log('✅ Created: replit-production-config.json');
  
  // 6. Create immediate fix script for Replit secrets
  const secretsUpdateScript = `/**
 * Update Replit Secrets for Production
 * 
 * Run this to update your Replit deployment secrets.
 */

console.log('=== Replit Secrets Update Instructions ===');
console.log('');
console.log('1. Go to your Replit project');
console.log('2. Click on "Secrets" in the left sidebar (lock icon)');
console.log('3. Add or update these secrets:');
console.log('');
console.log('   SENDGRID_API_KEY = ${workingApiKey}');
console.log('   DEFAULT_FROM_EMAIL = support@matchpro.ai');
console.log('   NODE_ENV = production');
console.log('');
console.log('4. Go to "Deployments" tab');
console.log('5. Click "Deploy" to create a new deployment with updated secrets');
console.log('');
console.log('6. Test the deployment by visiting:');
console.log('   https://app.matchpro.ai/api/admin/sendgrid/templates');
console.log('   (After logging in as admin)');
console.log('');
console.log('The deployment should now use the correct SendGrid API key.');
`;

  fs.writeFileSync('update-replit-secrets.js', secretsUpdateScript);
  console.log('✅ Created: update-replit-secrets.js');
  
  // 7. Test production endpoint one more time to confirm current state
  console.log('\n🔍 Testing current production endpoint...');
  
  try {
    const prodResponse = await makeHTTPSRequest('GET', 'app.matchpro.ai', '/api/admin/sendgrid/templates', {
      'User-Agent': 'Production-Test-Tool'
    });
    
    console.log(`Current production status: ${prodResponse.statusCode}`);
    
    if (prodResponse.body) {
      try {
        const data = JSON.parse(prodResponse.body);
        if (data.error === "SendGrid authorization failed") {
          console.log('🎯 Confirmed: Production needs SendGrid API key update');
        } else if (data.error === "Authentication required") {
          console.log('ℹ️  Production authentication working, need admin login to test SendGrid');
        }
      } catch (parseError) {
        console.log('Production response received but not JSON');
      }
    }
  } catch (error) {
    console.log(`Production test error: ${error.message}`);
  }
  
  // 8. Provide final instructions
  console.log('\n📋 NEXT STEPS TO FIX PRODUCTION:');
  console.log('================================');
  console.log('');
  console.log('Option 1 - Replit Deployment (Recommended):');
  console.log('1. Run: node update-replit-secrets.js');
  console.log('2. Follow the instructions to update Replit secrets');
  console.log('3. Redeploy from Replit Deployments tab');
  console.log('');
  console.log('Option 2 - Direct Cloud Run Update:');
  console.log('1. Use the environment variables from production-env-vars.txt');
  console.log('2. Update your Google Cloud Run service environment variables');
  console.log('3. Deploy a new revision');
  console.log('');
  console.log('Option 3 - Build and Deploy:');
  console.log('1. Run: ./deploy-production-sendgrid-fix.sh');
  console.log('2. Deploy the built application to your hosting platform');
  console.log('');
  console.log('After deployment, verify by:');
  console.log('1. Login to app.matchpro.ai as admin');
  console.log('2. Navigate to SendGrid Settings');
  console.log('3. Confirm templates load without authorization errors');
}

async function testSendGridAPI(apiKey) {
  const response = await makeHTTPSRequest('GET', 'api.sendgrid.com', '/v3/templates?generations=dynamic', {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  });
  
  if (response.statusCode === 200) {
    const data = JSON.parse(response.body);
    return {
      success: true,
      templates: data.templates?.length || 0
    };
  } else {
    return {
      success: false,
      status: response.statusCode,
      error: response.body
    };
  }
}

function makeHTTPSRequest(method, hostname, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
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

// Run the fix
fixProductionSendGrid().catch(console.error);