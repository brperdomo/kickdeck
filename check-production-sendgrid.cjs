/**
 * Check Production SendGrid Configuration
 * 
 * This script checks what SendGrid configuration the production deployment
 * is actually using and compares it to what we expect.
 */

const https = require('https');

/**
 * Check what SendGrid templates are accessible in production
 */
function checkProductionTemplates() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'app.kickdeck.io',
      port: 443,
      path: '/api/admin/sendgrid/templates',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Checking production SendGrid templates...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Production Templates Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('Available Templates:', response.length || 0);
          
          if (response.length > 0) {
            const passwordResetTemplate = response.find(t => t.name && t.name.includes('Password'));
            if (passwordResetTemplate) {
              console.log('Password Reset Template:', passwordResetTemplate.id);
            } else {
              console.log('Password reset template not found in:', response.map(t => t.name));
            }
          }
          
          resolve(response);
        } catch (e) {
          console.log('Raw response:', data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Template check error:', error.message);
      reject(error);
    });

    req.end();
  });
}

/**
 * Test sending a direct email through production API
 */
function testProductionEmailSend() {
  return new Promise((resolve, reject) => {
    const emailData = {
      to: 'bperdomo@zoho.com',
      templateType: 'password_reset',
      templateData: {
        username: 'bperdomo',
        resetUrl: 'https://app.kickdeck.io/reset-password?token=test-123',
        token: 'test-123',
        expiryHours: 24
      }
    };

    const postData = JSON.stringify(emailData);

    const options = {
      hostname: 'app.kickdeck.io',
      port: 443,
      path: '/api/admin/sendgrid/send-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('\nTesting direct email send through production...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Direct Email Send Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('Direct Email Response:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('Direct Email Raw Response:', data);
        }

        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Direct email send error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runProductionCheck() {
  console.log('=== PRODUCTION SENDGRID CONFIGURATION CHECK ===\n');

  try {
    // Check what templates are available
    await checkProductionTemplates();
    
    // Test direct email sending
    await testProductionEmailSend();

    console.log('\n=== ANALYSIS ===');
    console.log('If templates are available but direct email fails,');
    console.log('the issue is in the production SendGrid API key or configuration.');
    console.log('If both work, the issue is specific to the password reset flow.');

  } catch (error) {
    console.error('\nCheck failed:', error.message);
  }
}

runProductionCheck();