/**
 * Verify SendGrid Password Reset Email Configuration
 * 
 * This script verifies that password reset emails are properly 
 * configured to use SendGrid and sends a test email.
 */

import { MailService } from '@sendgrid/mail';
import { db } from './server/db.js';
import { emailProviderSettings } from './server/models/emailProvider.js';
import { emailTemplates } from './server/models/emailTemplates.js';
import { eq } from 'drizzle-orm';

// Get the test email from command line arguments
const testEmail = process.argv[2];

if (!testEmail) {
  console.error('Error: Test email address is required');
  console.log('Usage: node verify-sendgrid-password-reset.js your-email@example.com');
  process.exit(1);
}

console.log(`
==============================================
    VERIFY SENDGRID PASSWORD RESET CONFIG
==============================================
`);

async function verifyConfig() {
  try {
    // 1. Check if SendGrid API key is set
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY environment variable is not set');
      process.exit(1);
    }
    console.log('✅ SendGrid API key is configured');

    // 2. Check SendGrid provider in database
    const [provider] = await db
      .select()
      .from(emailProviderSettings)
      .where(eq(emailProviderSettings.providerType, 'sendgrid'));

    if (!provider) {
      console.error('❌ No SendGrid provider found in the database');
      process.exit(1);
    }

    console.log(`✅ SendGrid provider found: ${provider.providerName}`);
    console.log(`   Active: ${provider.isActive ? 'Yes' : 'No'}`);
    console.log(`   Default: ${provider.isDefault ? 'Yes' : 'No'}`);

    // 3. Check password reset template
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'password_reset'));

    if (!template) {
      console.error('❌ No password reset template found');
      process.exit(1);
    }

    console.log(`✅ Password reset template found: ${template.name}`);
    console.log(`   Provider ID: ${template.providerId}`);
    console.log(`   Sender: ${template.senderEmail}`);
    console.log(`   Active: ${template.isActive ? 'Yes' : 'No'}`);

    if (template.providerId !== provider.id) {
      console.error(`❌ Template is not using the SendGrid provider (${provider.id} vs ${template.providerId})`);
    } else {
      console.log('✅ Template is configured to use SendGrid provider');
    }

    // 4. Send a test email using SendGrid
    await sendTestEmail(provider, testEmail);

    console.log('\n✅ All checks passed. SendGrid is properly configured for password reset emails');
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

async function sendTestEmail(provider, recipient) {
  try {
    console.log(`\nSending test password reset email to ${recipient}...`);

    // Initialize SendGrid
    const mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);

    // Generate a fake reset token
    const resetToken = 'test-' + Math.random().toString(36).substring(2, 15);
    const resetLink = `https://app.kickdeck.io/reset-password?token=${resetToken}`;

    // Email message
    const msg = {
      to: recipient,
      from: 'support@kickdeck.io', // Must be the verified sender
      subject: 'KickDeck - Test Password Reset',
      text: `This is a test password reset email. If you received this, SendGrid is working correctly! Reset link: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0066cc;">KickDeck Password Reset - TEST</h2>
          <p>This is a test email to verify that password reset emails are configured correctly with SendGrid.</p>
          <p>If you received this email, the configuration is working properly!</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
              Test Reset Password Link
            </a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            This is just a test, not an actual password reset request.
          </p>
        </div>
      `,
    };

    // Send the email
    const response = await mailService.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log(`Response status code: ${response[0].statusCode}`);
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error(error);
    if (error.response) {
      console.error('SendGrid API error response:');
      console.error(error.response.body);
    }
    process.exit(1);
  }
}

verifyConfig().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});