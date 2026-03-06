/**
 * Verify SendGrid Configuration Script
 * 
 * This script verifies that SendGrid is properly configured by:
 * 1. Checking that a SendGrid provider is set up in the database
 * 2. Ensuring that all templates use support@kickdeck.io as the sender
 * 3. Sending a test email using SendGrid to verify the integration works
 */

import { db } from "./db/index.js";
import { emailProviderSettings, emailTemplates } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { MailService } from '@sendgrid/mail';

// Constants
const SENDER_EMAIL = 'support@kickdeck.io';

async function verifyConfig() {
  try {
    console.log('=== SendGrid Configuration Verification ===');
    
    // Step 1: Verify SendGrid provider is set up
    const sendGridProvider = await verifySendGridProvider();
    
    // Step 2: Verify email templates are configured properly 
    await verifyEmailTemplates();
    
    // Step 3: Test sending an email
    if (sendGridProvider) {
      const testEmail = process.argv[2] || 'test@example.com';
      await sendTestEmail(sendGridProvider, testEmail);
    }
    
    console.log('=== Verification Complete ===');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

async function verifySendGridProvider() {
  console.log('\n📋 Checking SendGrid provider setup...');
  
  // Get all email providers
  const providers = await db
    .select()
    .from(emailProviderSettings);
  
  console.log(`Found ${providers.length} email providers`);
  
  // Look for SendGrid provider
  const sendGridProvider = providers.find(p => p.providerType === 'sendgrid');
  
  if (!sendGridProvider) {
    console.error('❌ No SendGrid provider found. Please run the update-email-config.js script first.');
    return null;
  }
  
  console.log('✅ SendGrid provider found:');
  console.log(`   - ID: ${sendGridProvider.id}`);
  console.log(`   - Name: ${sendGridProvider.providerName}`);
  console.log(`   - Active: ${sendGridProvider.is_active ? 'Yes' : 'No'}`);
  console.log(`   - Default: ${sendGridProvider.is_default ? 'Yes' : 'No'}`);
  
  if (!sendGridProvider.is_active || !sendGridProvider.is_default) {
    console.warn('⚠️ Warning: SendGrid provider is not set as active and default');
  }
  
  const settings = sendGridProvider.settings || {};
  
  if (!settings.apiKey) {
    console.error('❌ SendGrid API key is not configured');
    return null;
  }
  
  if (settings.from !== SENDER_EMAIL) {
    console.warn(`⚠️ Warning: Default sender email is ${settings.from}, expected ${SENDER_EMAIL}`);
  }
  
  return sendGridProvider;
}

async function verifyEmailTemplates() {
  console.log('\n📋 Checking email templates configuration...');
  
  // Get all email templates
  const templates = await db
    .select()
    .from(emailTemplates);
  
  console.log(`Found ${templates.length} email templates`);
  
  // Check if all templates use the standard sender
  const nonCompliantTemplates = templates.filter(t => t.sender_email !== SENDER_EMAIL);
  
  if (nonCompliantTemplates.length > 0) {
    console.warn(`⚠️ Warning: ${nonCompliantTemplates.length} templates do not use ${SENDER_EMAIL} as sender:`);
    for (const template of nonCompliantTemplates) {
      console.warn(`   - ${template.name}: ${template.sender_email}`);
    }
  } else {
    console.log(`✅ All templates use ${SENDER_EMAIL} as sender`);
  }
  
  return templates;
}

async function sendTestEmail(provider, recipient) {
  console.log(`\n📧 Sending test email to ${recipient}...`);
  
  try {
    const settings = provider.settings || {};
    
    if (!settings.apiKey) {
      throw new Error('SendGrid API key not found in provider settings');
    }
    
    // Initialize SendGrid client
    const mailService = new MailService();
    mailService.setApiKey(settings.apiKey);
    
    // Email message
    const msg = {
      to: recipient,
      from: SENDER_EMAIL,
      subject: 'KickDeck SendGrid Verification',
      text: 'This is a test email to verify SendGrid integration with KickDeck.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0066cc;">KickDeck SendGrid Verification</h2>
          <p>This is a test email to verify that SendGrid is properly integrated with KickDeck.</p>
          <p>If you received this email, it means that:</p>
          <ul>
            <li>SendGrid API key is valid</li>
            <li>The sender domain is verified</li>
            <li>The integration is working correctly</li>
          </ul>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };
    
    // Send the email
    const response = await mailService.send(msg);
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    if (error.response) {
      console.error('API response:', error.response.body);
    }
    throw error;
  }
}

// Run the verification
verifyConfig();