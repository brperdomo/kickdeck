/**
 * Verify SendGrid Configuration Script
 * 
 * This script verifies that SendGrid is properly configured by:
 * 1. Checking that a SendGrid provider is set up in the database
 * 2. Ensuring that all templates use support@matchpro.ai as the sender
 * 3. Sending a test email using SendGrid to verify the integration works
 */

import { db } from '@db';
import { emailProviderSettings, emailTemplates } from '@db/schema';
import { eq } from 'drizzle-orm';
import { MailService } from '@sendgrid/mail';

const SENDER_EMAIL = 'support@matchpro.ai';
const TEST_RECIPIENT = process.argv[2] || 'test@example.com'; // Pass email address as command line argument

async function verifyConfig() {
  try {
    console.log('Verifying SendGrid configuration...');
    
    // Step 1: Check that SendGrid provider exists and is active
    const sendGridProvider = await verifySendGridProvider();
    if (!sendGridProvider) {
      throw new Error('SendGrid provider not found or not active');
    }
    
    // Step 2: Check that all templates use the standard sender
    await verifyEmailTemplates();
    
    // Step 3: Send a test email
    if (TEST_RECIPIENT !== 'test@example.com') {
      await sendTestEmail(sendGridProvider);
    } else {
      console.log('Skipping test email - no recipient specified');
      console.log('Run with recipient: node verify-sendgrid-config.js your-email@example.com');
    }
    
    console.log('✅ SendGrid configuration verified successfully!');
  } catch (error) {
    console.error('❌ SendGrid configuration verification failed:', error);
  }
}

async function verifySendGridProvider() {
  console.log('Checking SendGrid provider in database...');
  
  const providers = await db
    .select()
    .from(emailProviderSettings);
  
  console.log(`Found ${providers.length} email providers`);
  
  // Check if there's an active SendGrid provider
  const sendGridProvider = providers.find(p => 
    p.providerType === 'sendgrid' && p.isActive
  );
  
  if (sendGridProvider) {
    console.log('✅ SendGrid provider found and active');
    
    // Validate the provider has all required settings
    const settings = sendGridProvider.settings;
    if (!settings || !settings.apiKey) {
      console.error('❌ SendGrid provider missing API key');
      return null;
    }
    
    if (!settings.from || settings.from !== SENDER_EMAIL) {
      console.warn('⚠️ SendGrid provider "from" email does not match standard:', settings.from);
    }
    
    return sendGridProvider;
  } else {
    console.error('❌ No active SendGrid provider found');
    return null;
  }
}

async function verifyEmailTemplates() {
  console.log('Checking email templates for standard sender...');
  
  const templates = await db
    .select()
    .from(emailTemplates);
  
  console.log(`Found ${templates.length} email templates`);
  
  // Check each template
  const nonStandardTemplates = templates.filter(t => 
    t.sender_email !== SENDER_EMAIL
  );
  
  if (nonStandardTemplates.length > 0) {
    console.warn(`⚠️ Found ${nonStandardTemplates.length} templates not using standard sender email:`);
    for (const template of nonStandardTemplates) {
      console.warn(`  - ${template.name} (${template.type}): using ${template.sender_email}`);
    }
  } else {
    console.log('✅ All templates using standard sender email');
  }
}

async function sendTestEmail(provider) {
  console.log(`Sending test email to ${TEST_RECIPIENT}...`);
  
  try {
    // Initialize mail service
    const mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY || provider.settings.apiKey);
    
    // Prepare email
    const message = {
      to: TEST_RECIPIENT,
      from: SENDER_EMAIL,
      subject: 'SendGrid Configuration Test',
      text: 'This is a test email to verify your SendGrid configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a90e2;">SendGrid Configuration Test</h2>
          <p>This is a test email to verify your SendGrid configuration is working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    };
    
    // Send email
    const response = await mailService.send(message);
    console.log(`✅ Test email sent, status: ${response[0].statusCode}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    
    // Check for common SendGrid errors
    if (error.response && error.response.body) {
      console.error('SendGrid API error:', error.response.body);
      
      if (error.response.body.errors) {
        for (const err of error.response.body.errors) {
          if (err.message && err.message.includes('does not match a verified Sender Identity')) {
            console.error('');
            console.error('⚠️ SENDER IDENTITY ERROR: The from address is not verified in SendGrid');
            console.error('To fix this, you need to verify the domain or sender email in SendGrid:');
            console.error('1. Log into SendGrid dashboard');
            console.error('2. Go to Settings > Sender Authentication');
            console.error('3. Verify either the specific email or the entire domain');
            console.error('');
          }
        }
      }
    }
    
    return false;
  }
}

// Run the script
verifyConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });