/**
 * Debug Production Email Issue
 * 
 * This script tests the actual SendGrid API call that production should be making
 * to identify why emails aren't being sent.
 */

const https = require('https');

const SENDGRID_API_KEY = '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';
const TEMPLATE_ID = 'd-7eb7ea1c19ca4090a0cefa3a2be75088';

/**
 * Make direct SendGrid API call to test email sending
 */
function sendGridDirectTest() {
  return new Promise((resolve, reject) => {
    const emailData = {
      personalizations: [{
        to: [{ email: 'bperdomo@zoho.com' }],
        dynamic_template_data: {
          username: 'bperdomo',
          resetUrl: 'https://app.kickdeck.io/reset-password?token=test-token-123',
          token: 'test-token-123',
          expiryHours: 24
        }
      }],
      from: { email: 'support@kickdeck.io', name: 'KickDeck' },
      template_id: TEMPLATE_ID
    };

    const postData = JSON.stringify(emailData);

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Making direct SendGrid API call...');
    console.log('Template ID:', TEMPLATE_ID);
    console.log('API Key (first 15 chars):', SENDGRID_API_KEY.substring(0, 15) + '...');
    console.log('Request data:', JSON.stringify(emailData, null, 2));

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n=== SendGrid Response ===');
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        
        if (data) {
          try {
            const response = JSON.parse(data);
            console.log('Response Body:', JSON.stringify(response, null, 2));
          } catch (e) {
            console.log('Response Body (raw):', data);
          }
        } else {
          console.log('Empty response body');
        }

        if (res.statusCode === 202) {
          console.log('\n✅ EMAIL SENT SUCCESSFULLY');
          console.log('Check bperdomo@zoho.com inbox for test email');
        } else {
          console.log('\n❌ EMAIL FAILED');
          console.log('Status indicates SendGrid rejected the request');
        }

        resolve({ statusCode: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ REQUEST ERROR:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test production email endpoint
 */
function testProductionEndpoint() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email: 'bperdomo@zoho.com' });

    const options = {
      hostname: 'app.kickdeck.io',
      port: 443,
      path: '/api/auth/forgot-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('\n=== Testing Production Endpoint ===');
    console.log('URL: https://app.kickdeck.io/api/auth/forgot-password');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Production API Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('Production API Response:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('Production API Response (raw):', data);
        }

        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Production API Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== PRODUCTION EMAIL DEBUG TEST ===\n');

  try {
    // Test 1: Direct SendGrid API call
    console.log('TEST 1: Direct SendGrid API Call');
    console.log('-----------------------------------');
    await sendGridDirectTest();

    // Test 2: Production endpoint
    await testProductionEndpoint();

    console.log('\n=== SUMMARY ===');
    console.log('If direct SendGrid call succeeds but production endpoint fails,');
    console.log('the issue is in the production deployment configuration.');
    console.log('If both fail, the issue is with SendGrid API key or account.');

  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
}

runTests();