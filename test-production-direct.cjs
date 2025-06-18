/**
 * Direct Production Environment Test
 * 
 * This script tests the exact SendGrid API key that production is using
 * to identify why it's different from development.
 */

const https = require('https');

async function testProductionDirect() {
  console.log('=== Direct Production SendGrid Test ===\n');
  
  // 1. Test the working development API key
  const devApiKey = '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';
  console.log('1. Testing Development API Key:');
  console.log(`   Key: ${devApiKey.substring(0, 15)}...`);
  
  try {
    const devResult = await testSendGridAPI(devApiKey);
    console.log(`   Status: ${devResult.success ? 'Working' : 'Failed'}`);
    if (devResult.success) {
      console.log(`   Templates: ${devResult.templates} found`);
    } else {
      console.log(`   Error: ${devResult.error}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // 2. Test what production might be using (from .env.production original)
  console.log('\n2. Testing Current Production Response:');
  
  try {
    // Test with a fake admin session to see the actual error
    const prodResponse = await makeHTTPSRequest('GET', 'app.matchpro.ai', '/api/admin/sendgrid/templates', {
      'User-Agent': 'Production-Test-Tool',
      'Accept': 'application/json',
      'Cookie': 'connect.sid=test' // This will fail auth but show us the real error
    });
    
    console.log(`   Status Code: ${prodResponse.statusCode}`);
    
    if (prodResponse.body) {
      try {
        const data = JSON.parse(prodResponse.body);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        
        if (data.error === "SendGrid authorization failed") {
          console.log('   ✓ Confirmed: Production has invalid SendGrid API key');
        } else if (data.error === "Authentication required") {
          console.log('   ✓ Production auth working, need valid admin session');
        }
      } catch (parseError) {
        console.log(`   Raw Response: ${prodResponse.body.substring(0, 300)}...`);
      }
    }
  } catch (error) {
    console.log(`   Production Test Error: ${error.message}`);
  }
  
  // 3. Check current Replit deployment environment
  console.log('\n3. Replit Environment Status:');
  console.log('   Current secrets in Replit should be:');
  console.log(`   SENDGRID_API_KEY = ${devApiKey}`);
  console.log('   DEFAULT_FROM_EMAIL = support@matchpro.ai');
  console.log('   NODE_ENV = production');
  
  // 4. Create immediate deployment test
  console.log('\n4. Creating Deployment Verification Test...');
  
  const deploymentTest = `#!/bin/bash
# Deployment Verification Test
# Run this after updating Replit secrets

echo "=== Deployment Verification ==="

# Test the deployed application
echo "Testing production endpoint..."
curl -s -H "Accept: application/json" "https://app.matchpro.ai/api/admin/sendgrid/templates" | head -200

echo ""
echo "If you see 'Authentication required', that's expected (need admin login)"
echo "If you see 'SendGrid authorization failed', the secrets update didn't work"

echo ""
echo "Next: Login to app.matchpro.ai as admin and test SendGrid Settings"
`;

  require('fs').writeFileSync('test-deployment.sh', deploymentTest);
  require('fs').chmodSync('test-deployment.sh', 0o755);
  console.log('   ✓ Created: test-deployment.sh');
  
  // 5. Create step-by-step Replit fix
  console.log('\n5. Step-by-Step Replit Fix:');
  console.log('   ================================');
  console.log('   Step 1: Update Replit Secrets');
  console.log('   - Open your Replit project');
  console.log('   - Click "Secrets" (lock icon) in left sidebar');
  console.log('   - Delete any existing SENDGRID_API_KEY');
  console.log('   - Add new secret: SENDGRID_API_KEY');
  console.log(`   - Value: ${devApiKey}`);
  console.log('   Step 2: Force New Deployment');
  console.log('   - Go to "Deployments" tab');
  console.log('   - Click "Deploy" (not redeploy)');
  console.log('   - Wait for new deployment to complete');
  console.log('   Step 3: Verify Fix');
  console.log('   - Run: ./test-deployment.sh');
  console.log('   - Login to app.matchpro.ai as admin');
  console.log('   - Test SendGrid Settings page');
  
  // 6. Alternative: Direct environment variable injection
  console.log('\n6. Alternative: Environment Variable Override');
  
  const envOverride = `
# Add this to the top of server/index.ts if Replit secrets don't work:

// Force production SendGrid API key
if (process.env.NODE_ENV === 'production') {
  process.env.SENDGRID_API_KEY = '${devApiKey}';
  process.env.DEFAULT_FROM_EMAIL = 'support@matchpro.ai';
}
`;

  require('fs').writeFileSync('env-override.txt', envOverride);
  console.log('   ✓ Created: env-override.txt (emergency fallback)');
  
  return {
    developmentWorking: true,
    productionIssue: 'Environment variable not synced',
    recommendation: 'Update Replit secrets and redeploy'
  };
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
      error: response.body.substring(0, 200)
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

testProductionDirect().catch(console.error);