/**
 * Diagnose Email Production Issue
 * 
 * This script tests SendGrid configuration and email delivery
 * to identify why emails work in development but not in production.
 */

import { db } from './db/index.js';
import { emailProviderSettings, emailTemplates } from './db/schema.js';
import { eq, and } from 'drizzle-orm';
import { MailService } from '@sendgrid/mail';

const TEST_EMAIL = 'bperdomo@zoho.com'; // Use the same email from the logs

async function diagnoseEmailIssue() {
  console.log('\n🔍 DIAGNOSING EMAIL PRODUCTION ISSUE');
  console.log('=====================================\n');

  // 1. Check environment variables
  console.log('1. Environment Configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   SENDGRID_API_KEY present: ${process.env.SENDGRID_API_KEY ? 'Yes (' + process.env.SENDGRID_API_KEY.substring(0, 6) + '...)' : 'No'}`);
  console.log(`   SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL || 'Not set'}`);
  console.log(`   PRODUCTION_URL: ${process.env.PRODUCTION_URL || 'Not set'}`);
  console.log('');

  // 2. Check database email provider configuration
  console.log('2. Database Email Provider Configuration:');
  try {
    const providers = await db
      .select()
      .from(emailProviderSettings)
      .where(eq(emailProviderSettings.providerType, 'sendgrid'));
    
    if (providers.length === 0) {
      console.log('   ❌ No SendGrid providers found in database');
    } else {
      providers.forEach((provider, index) => {
        console.log(`   Provider ${index + 1}:`);
        console.log(`     Name: ${provider.providerName}`);
        console.log(`     Active: ${provider.isActive}`);
        console.log(`     Default: ${provider.isDefault}`);
        console.log(`     API Key: ${provider.settings?.apiKey ? 'Present (' + provider.settings.apiKey.substring(0, 6) + '...)' : 'Missing'}`);
        console.log(`     From Email: ${provider.settings?.from || 'Not set'}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error checking database providers: ${error.message}`);
  }
  console.log('');

  // 3. Test SendGrid API directly
  console.log('3. Direct SendGrid API Test:');
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('   ❌ No SendGrid API key found in environment');
      return;
    }

    const mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);

    const testMessage = {
      to: TEST_EMAIL,
      from: 'support@kickdeck.io',
      subject: `Production Email Test - ${new Date().toISOString()}`,
      text: 'This is a direct SendGrid API test from the production environment.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a90e2;">Production Email Test</h2>
          <p>This email was sent directly through SendGrid API to test production configuration.</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>API Key (first 6 chars):</strong> ${process.env.SENDGRID_API_KEY.substring(0, 6)}...</p>
        </div>
      `
    };

    console.log(`   Sending test email to: ${TEST_EMAIL}`);
    console.log(`   From: ${testMessage.from}`);
    console.log(`   Subject: ${testMessage.subject}`);

    const response = await mailService.send(testMessage);
    console.log(`   ✅ SendGrid API responded with status: ${response[0].statusCode}`);
    
    if (response[0].statusCode >= 200 && response[0].statusCode < 300) {
      console.log('   ✅ Email sent successfully via direct API call');
    } else {
      console.log(`   ⚠️  Unexpected status code: ${response[0].statusCode}`);
    }

  } catch (error) {
    console.log(`   ❌ SendGrid API error: ${error.message}`);
    if (error.response && error.response.body) {
      console.log(`   Error details: ${JSON.stringify(error.response.body, null, 2)}`);
    }
  }
  console.log('');

  // 4. Check email templates
  console.log('4. Email Templates Configuration:');
  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true));

    console.log(`   Found ${templates.length} active email templates`);
    
    const passwordResetTemplate = templates.find(t => t.type === 'password_reset');
    if (passwordResetTemplate) {
      console.log('   Password Reset Template:');
      console.log(`     SendGrid Template ID: ${passwordResetTemplate.sendgridTemplateId || 'Not set'}`);
      console.log(`     Sender: ${passwordResetTemplate.senderName} <${passwordResetTemplate.senderEmail}>`);
    } else {
      console.log('   ❌ No password reset template found');
    }

    const registrationTemplates = templates.filter(t => t.type.includes('registration'));
    console.log(`   Registration-related templates: ${registrationTemplates.length}`);
    registrationTemplates.forEach(template => {
      console.log(`     ${template.type}: ${template.sendgridTemplateId ? 'Has SendGrid ID' : 'Local template only'}`);
    });

  } catch (error) {
    console.log(`   ❌ Error checking email templates: ${error.message}`);
  }
  console.log('');

  // 5. Test the actual email service functions
  console.log('5. Testing Email Service Functions:');
  try {
    // Import the email service functions
    const { sendEmail, sendTemplatedEmail } = await import('./server/services/emailService.js');

    // Test basic email sending
    console.log('   Testing basic sendEmail function...');
    await sendEmail({
      to: TEST_EMAIL,
      subject: `Production Email Service Test - ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Service Test</h2>
          <p>This email was sent using the application's email service in production.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
      from: 'support@kickdeck.io'
    });
    console.log('   ✅ Basic email service test completed');

    // Test templated email
    console.log('   Testing templated email function...');
    await sendTemplatedEmail(TEST_EMAIL, 'password_reset', {
      resetUrl: 'https://kickdeck.io/reset-password?token=test-token',
      userName: 'Test User'
    });
    console.log('   ✅ Templated email service test completed');

  } catch (error) {
    console.log(`   ❌ Email service test error: ${error.message}`);
    console.error(error);
  }
  console.log('');

  // 6. Check SendGrid account status
  console.log('6. SendGrid Account Status Check:');
  try {
    const mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);

    // Try to get user information (this will validate the API key)
    const userInfo = await mailService.request({
      method: 'GET',
      url: '/v3/user/account'
    });

    console.log('   ✅ SendGrid account accessible');
    console.log(`   Account type: ${userInfo[1].body.type || 'Unknown'}`);
    
  } catch (error) {
    console.log(`   ❌ SendGrid account check failed: ${error.message}`);
    if (error.response && error.response.body) {
      console.log(`   Error details: ${JSON.stringify(error.response.body, null, 2)}`);
    }
  }

  console.log('\n🏁 Diagnosis Complete');
  console.log('====================');
  console.log('\nNext steps:');
  console.log('1. Check your email inbox for test emails');
  console.log('2. Check SendGrid activity feed for delivery status');
  console.log('3. Verify sender authentication in SendGrid dashboard');
  console.log('4. Check spam/junk folders');
}

// Run the diagnosis
diagnoseEmailIssue().catch(console.error);