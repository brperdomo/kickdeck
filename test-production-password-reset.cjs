/**
 * Production Password Reset Test
 * 
 * This script tests the complete password reset flow in production
 * to verify emails are being sent correctly with proper URLs.
 */

const https = require('https');
const { performance } = require('perf_hooks');

// Test configuration
const PRODUCTION_URL = 'https://app.kickdeck.io';
const TEST_EMAIL = 'bperdomo@zoho.com';

/**
 * Make HTTP request to production API
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test password reset request
 */
async function testPasswordReset() {
  console.log('=== PRODUCTION PASSWORD RESET TEST ===\n');
  
  const startTime = performance.now();
  
  try {
    console.log(`Testing password reset for: ${TEST_EMAIL}`);
    console.log(`Production URL: ${PRODUCTION_URL}`);
    console.log('');
    
    const options = {
      hostname: 'app.kickdeck.io',
      port: 443,
      path: '/api/auth/forgot-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PasswordResetTest/1.0'
      }
    };
    
    const requestData = {
      email: TEST_EMAIL
    };
    
    console.log('Sending password reset request...');
    const response = await makeRequest(options, requestData);
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`Response received in ${duration}ms`);
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    // Check for success response
    if (response.statusCode === 200 && response.data.success) {
      console.log('\n✅ PASSWORD RESET REQUEST SUCCESSFUL');
      console.log('- API endpoint responded correctly');
      console.log('- Server returned success status');
      console.log('- Email should be sent to recipient');
      
      console.log('\n📧 EMAIL CHECK INSTRUCTIONS:');
      console.log(`1. Check ${TEST_EMAIL} inbox for password reset email`);
      console.log('2. Verify email contains reset link with app.kickdeck.io domain');
      console.log('3. Click the reset link to test functionality');
      console.log('4. Reset link should direct to: https://app.kickdeck.io/reset-password?token=...');
      
    } else {
      console.log('\n❌ PASSWORD RESET REQUEST FAILED');
      console.log(`- Status: ${response.statusCode}`);
      console.log(`- Response: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n=== TEST COMPLETED ===');
}

/**
 * Test multiple scenarios
 */
async function runCompleteTest() {
  console.log('Starting comprehensive password reset test...\n');
  
  // Test 1: Valid email
  await testPasswordReset();
  
  console.log('\n' + '='.repeat(50));
  console.log('ADDITIONAL VERIFICATION STEPS:');
  console.log('='.repeat(50));
  console.log('1. Check SendGrid Activity Feed at https://app.sendgrid.com');
  console.log('2. Verify email delivery status and opens');
  console.log('3. Test the actual password reset flow end-to-end');
  console.log('4. Confirm reset URLs use https://app.kickdeck.io domain');
}

// Run the test
runCompleteTest().catch(console.error);