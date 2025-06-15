/**
 * Simple Email Production Test
 * Tests SendGrid configuration without database dependencies
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_EMAIL = 'bperdomo@zoho.com';

async function testProductionEmail() {
  console.log('\n🔍 PRODUCTION EMAIL TEST');
  console.log('========================\n');

  // 1. Check environment
  console.log('1. Environment Check:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? 'Present (' + process.env.SENDGRID_API_KEY.substring(0, 8) + '...)' : 'Missing'}`);
  console.log(`   API Key Length: ${process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0} characters`);
  console.log('');

  if (!process.env.SENDGRID_API_KEY) {
    console.log('❌ No SendGrid API key found. Cannot proceed with email test.');
    return;
  }

  // 2. Test SendGrid API directly
  console.log('2. Direct SendGrid API Test:');
  try {
    const mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);

    const testMessage = {
      to: TEST_EMAIL,
      from: 'support@matchpro.ai',
      subject: `Production Email Test - ${new Date().toISOString()}`,
      text: 'This is a direct SendGrid API test from production environment.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a90e2;">Production Email Test</h2>
          <p>This email was sent directly through SendGrid API to test production configuration.</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>From Production Server</strong></p>
        </div>
      `
    };

    console.log(`   Sending test email to: ${TEST_EMAIL}`);
    console.log(`   From: ${testMessage.from}`);
    
    const response = await mailService.send(testMessage);
    console.log(`   ✅ SendGrid responded with status: ${response[0].statusCode}`);
    console.log(`   ✅ Message ID: ${response[0].headers['x-message-id'] || 'Not provided'}`);

    if (response[0].statusCode >= 200 && response[0].statusCode < 300) {
      console.log('   ✅ Email sent successfully');
      console.log('   📧 Check your inbox for the test email');
    } else {
      console.log(`   ⚠️  Unexpected status: ${response[0].statusCode}`);
    }

  } catch (error) {
    console.log(`   ❌ SendGrid API error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Response status: ${error.response.status}`);
      if (error.response.body) {
        console.log(`   Error details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
    }
  }

  // 3. Test account status
  console.log('\n3. SendGrid Account Status:');
  try {
    const mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);

    const userInfo = await mailService.request({
      method: 'GET',
      url: '/v3/user/account'
    });

    console.log('   ✅ SendGrid account accessible');
    console.log(`   Account type: ${userInfo[1].body.type || 'Unknown'}`);
    console.log(`   Account email: ${userInfo[1].body.email || 'Unknown'}`);
    
  } catch (error) {
    console.log(`   ❌ Account check failed: ${error.message}`);
    if (error.response && error.response.body) {
      console.log(`   Details: ${JSON.stringify(error.response.body, null, 2)}`);
    }
  }

  // 4. Test with dynamic template (using known template ID from logs)
  console.log('\n4. Dynamic Template Test:');
  try {
    const mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);

    const templateMessage = {
      to: TEST_EMAIL,
      from: 'support@matchpro.ai',
      templateId: 'd-7eb7ea1c19ca4090a0cefa3a2be75088', // Password reset template ID from logs
      dynamicTemplateData: {
        resetUrl: 'https://matchpro.ai/reset-password?token=test-production-token',
        userName: 'Production Test User'
      }
    };

    console.log(`   Testing dynamic template: ${templateMessage.templateId}`);
    
    const response = await mailService.send(templateMessage);
    console.log(`   ✅ Dynamic template sent, status: ${response[0].statusCode}`);

  } catch (error) {
    console.log(`   ❌ Dynamic template error: ${error.message}`);
    if (error.response && error.response.body) {
      console.log(`   Details: ${JSON.stringify(error.response.body, null, 2)}`);
    }
  }

  console.log('\n🏁 Test Complete');
  console.log('================');
  console.log('Check your email inbox and SendGrid activity feed for results.');
}

testProductionEmail().catch(console.error);