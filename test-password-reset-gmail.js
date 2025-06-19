/**
 * Test Password Reset with Gmail Address
 * 
 * This script tests the password reset flow with a Gmail address
 * to confirm the system works when not blocked by suppression lists.
 */

import { MailService } from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const TEST_EMAIL = 'test.matchpro@gmail.com'; // Use a clean Gmail address

async function testPasswordResetWithGmail() {
  console.log('Testing password reset flow with Gmail address...');
  console.log(`Test email: ${TEST_EMAIL}`);
  
  // Step 1: Check if test email is in any suppression lists
  console.log('\n1. Checking suppression status for Gmail address...');
  
  const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  let isClean = true;
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${TEST_EMAIL}`, {
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`❌ ${TEST_EMAIL} is in ${type} suppression list`);
        isClean = false;
      } else if (response.status === 404) {
        console.log(`✅ ${TEST_EMAIL} is clean from ${type}`);
      }
    } catch (error) {
      console.log(`⚠️  Error checking ${type}: ${error.message}`);
    }
  }
  
  if (!isClean) {
    console.log('\n⚠️  Test email is also suppressed. Using a different approach...');
  }
  
  // Step 2: Send a direct test email
  console.log('\n2. Testing direct email send to Gmail...');
  try {
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const testMessage = {
      to: TEST_EMAIL,
      from: 'support@matchpro.ai',
      subject: `MatchPro Test - ${new Date().toISOString()}`,
      text: 'This is a test email to verify MatchPro email delivery works with Gmail.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid blue;">
          <h2 style="color: blue;">MatchPro Email Test</h2>
          <p>This email confirms that MatchPro can successfully send emails to Gmail addresses.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> Production MatchPro System</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            If you receive this email, it means the MatchPro email system is working correctly
            and the issue is specifically with Zoho Mail delivery.
          </p>
        </div>
      `
    };
    
    const result = await mailService.send(testMessage);
    console.log('✅ Gmail test email sent successfully');
    console.log(`   Status: ${result[0].statusCode}`);
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('❌ Gmail test email failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
  }
  
  // Step 3: Test the password reset endpoint with Gmail
  console.log('\n3. Testing password reset endpoint with Gmail...');
  try {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
    
    const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });
    
    if (response.ok) {
      console.log('✅ Password reset endpoint works with Gmail');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log('❌ Password reset endpoint failed');
      console.log(`   Status: ${response.status}`);
      const responseText = await response.text();
      console.log(`   Response: ${responseText}`);
    }
  } catch (error) {
    console.log('❌ Password reset endpoint error');
    console.error(error.message);
  }
  
  console.log('\n=== GMAIL TEST COMPLETE ===');
  console.log('\nConclusion:');
  console.log('If the Gmail test succeeds, the issue is specifically with Zoho Mail.');
  console.log('If the Gmail test fails, there\'s a broader configuration issue.');
}

testPasswordResetWithGmail().catch(console.error);