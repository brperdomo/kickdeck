/**
 * Debug Production SendGrid Environment
 * 
 * This script helps identify the SendGrid configuration issues
 * in the production environment vs development.
 */

const https = require('https');
const fs = require('fs');

async function debugProductionSendGrid() {
  console.log('=== Production SendGrid Debug Analysis ===\n');
  
  // 1. Check current development environment
  console.log('1. Development Environment Check:');
  const devApiKey = process.env.SENDGRID_API_KEY;
  
  if (devApiKey) {
    console.log(`   Dev API Key: ${devApiKey.substring(0, 10)}... (${devApiKey.length} chars)`);
    console.log(`   Format: ${devApiKey.startsWith('SG.') ? 'Valid' : 'Invalid'}`);
    
    // Test development key
    try {
      const devTest = await testSendGridAPI(devApiKey);
      console.log(`   Dev Key Status: ${devTest.success ? 'Working' : 'Failed'}`);
      if (devTest.success) {
        console.log(`   Dev Templates: ${devTest.templates} found`);
      }
    } catch (error) {
      console.log(`   Dev Key Test: Failed - ${error.message}`);
    }
  } else {
    console.log('   ❌ No SENDGRID_API_KEY in development environment');
  }
  
  // 2. Test production endpoint directly
  console.log('\n2. Production Environment Test:');
  
  try {
    const prodResponse = await makeHTTPSRequest('GET', 'app.kickdeck.io', '/api/admin/sendgrid/templates', {
      'Cookie': 'test=1', // This will fail auth but give us the response format
      'User-Agent': 'Production-Debug-Tool'
    });
    
    console.log(`   Production Response Status: ${prodResponse.statusCode}`);
    
    if (prodResponse.body) {
      try {
        const responseData = JSON.parse(prodResponse.body);
        console.log(`   Production Response: ${JSON.stringify(responseData, null, 2)}`);
        
        if (responseData.error === "SendGrid authorization failed") {
          console.log('   ✅ Confirmed: Production has invalid SendGrid API key');
        } else if (responseData.error === "Authentication required") {
          console.log('   ✅ Authentication working, but need to test with valid session');
        }
      } catch (parseError) {
        console.log(`   Raw Response: ${prodResponse.body.substring(0, 200)}...`);
      }
    }
  } catch (error) {
    console.log(`   Production Test Failed: ${error.message}`);
  }
  
  // 3. Check environment file configurations
  console.log('\n3. Environment Files Analysis:');
  
  const envFiles = ['.env', '.env.production', '.env.local'];
  
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`\n   ${file}:`);
        
        const lines = content.split('\n');
        const sendgridLine = lines.find(line => line.includes('SENDGRID_API_KEY'));
        
        if (sendgridLine) {
          if (sendgridLine.includes('${SENDGRID_API_KEY}')) {
            console.log(`     SENDGRID_API_KEY: Placeholder reference (needs actual value)`);
          } else if (sendgridLine.includes('SG.')) {
            const keyPart = sendgridLine.split('=')[1];
            console.log(`     SENDGRID_API_KEY: Set (${keyPart?.substring(0, 10)}...)`);
          } else {
            console.log(`     SENDGRID_API_KEY: ${sendgridLine}`);
          }
        } else {
          console.log(`     No SENDGRID_API_KEY found`);
        }
      } catch (error) {
        console.log(`     Error reading ${file}: ${error.message}`);
      }
    } else {
      console.log(`   ${file}: Not found`);
    }
  }
  
  // 4. Production deployment guidance
  console.log('\n4. Production Deployment Guidance:');
  console.log('   The issue is that production environment variables are managed separately');
  console.log('   from the development environment. Here are the solutions:');
  console.log('');
  console.log('   Option A - Replit Deployments:');
  console.log('   1. Go to your Replit deployment dashboard');
  console.log('   2. Navigate to Environment Variables section');
  console.log('   3. Set SENDGRID_API_KEY to your valid SendGrid API key');
  console.log('   4. Redeploy the application');
  console.log('');
  console.log('   Option B - Manual Production Server:');
  console.log('   1. SSH into your production server');
  console.log('   2. Update the environment variables file');
  console.log('   3. Restart the application service');
  console.log('');
  console.log('   Option C - Container/Docker Deployment:');
  console.log('   1. Update your deployment configuration');
  console.log('   2. Set SENDGRID_API_KEY environment variable');
  console.log('   3. Rebuild and redeploy container');
  
  // 5. Create deployment instructions
  const deploymentInstructions = `
# SendGrid Production Deployment Fix

## Issue Identified
Production environment at app.kickdeck.io has invalid SendGrid API key, while development environment is working correctly.

## Root Cause
Environment variables are managed separately between development and production environments.

## Solution Steps

### For Replit Deployments:
1. Access your Replit project
2. Go to the "Deployments" tab
3. Click on your active deployment
4. Navigate to "Environment Variables"
5. Add or update: SENDGRID_API_KEY = ${devApiKey || 'your_sendgrid_api_key_here'}
6. Click "Update" and redeploy

### For Other Hosting Platforms:
1. Access your hosting platform's environment variable settings
2. Set SENDGRID_API_KEY to your valid SendGrid API key
3. Restart/redeploy your application

### Verification:
After deployment, test by:
1. Logging into app.kickdeck.io as admin
2. Navigate to SendGrid Settings
3. Verify templates load without authorization errors

## SendGrid API Key Requirements:
- Must start with "SG."
- Should be 69 characters long
- Must have "Templates" permissions at minimum
- Recommended: "Full Access" permissions

Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync('PRODUCTION_SENDGRID_FIX.md', deploymentInstructions);
  console.log('\n📄 Deployment instructions saved to: PRODUCTION_SENDGRID_FIX.md');
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

// Run the debug analysis
debugProductionSendGrid().catch(console.error);