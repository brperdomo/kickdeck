/**
 * Update Email Config Script
 * 
 * This script updates all email configurations to use SendGrid as the provider
 * and sets support@matchpro.ai as the sender email for all templates.
 * 
 * What it does:
 * 1. Sets up SendGrid as the primary email provider
 * 2. Updates all email templates to use support@matchpro.ai as the sender
 * 3. Deactivates any SMTP providers
 */

import { db } from '@db';
import { emailProviderSettings, emailTemplates } from '@db/schema';
import { eq } from 'drizzle-orm';

const SENDER_EMAIL = 'support@matchpro.ai';
const SENDER_NAME = 'MatchPro';

async function updateEmailConfig() {
  try {
    console.log('Starting email configuration update...');
    
    // Step 1: Set up SendGrid as the primary email provider
    await setupSendGridProvider();
    
    // Step 2: Update all email templates to use the standard sender
    await updateEmailTemplates();
    
    console.log('Email configuration update completed successfully!');
  } catch (error) {
    console.error('Error updating email configuration:', error);
  }
}

async function setupSendGridProvider() {
  try {
    console.log('Setting up SendGrid as the primary email provider...');
    
    // First, check if we already have a SendGrid provider
    const existingProviders = await db
      .select()
      .from(emailProviderSettings);
    
    console.log(`Found ${existingProviders.length} existing providers`);
    
    // Look for an existing SendGrid provider
    const sendGridProvider = existingProviders.find(p => p.providerType === 'sendgrid');
    
    if (sendGridProvider) {
      console.log('Updating existing SendGrid provider...');
      // Update it to be active and default
      await db
        .update(emailProviderSettings)
        .set({
          isActive: true,
          isDefault: true,
          settings: {
            apiKey: process.env.SENDGRID_API_KEY,
            from: SENDER_EMAIL
          },
          updatedAt: new Date().toISOString()
        })
        .where(eq(emailProviderSettings.id, sendGridProvider.id));
    } else {
      console.log('Creating new SendGrid provider...');
      // Create a new SendGrid provider
      await db
        .insert(emailProviderSettings)
        .values({
          providerType: 'sendgrid',
          providerName: 'SendGrid Email Service',
          settings: {
            apiKey: process.env.SENDGRID_API_KEY,
            from: SENDER_EMAIL
          },
          isActive: true,
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
    }
    
    // Deactivate all other providers
    for (const provider of existingProviders) {
      if (!sendGridProvider || provider.id !== sendGridProvider.id) {
        await db
          .update(emailProviderSettings)
          .set({
            isActive: false,
            isDefault: false,
            updatedAt: new Date().toISOString()
          })
          .where(eq(emailProviderSettings.id, provider.id));
      }
    }
    
    // Verify the changes
    const updatedProviders = await db
      .select()
      .from(emailProviderSettings);
      
    console.log('Updated providers:');
    for (const provider of updatedProviders) {
      console.log(`- ${provider.providerName} (${provider.providerType}): Active=${provider.isActive}, Default=${provider.isDefault}`);
    }
    
    console.log('SendGrid is now set as the primary email provider!');
    
    // Get the SendGrid provider ID for linking templates
    const sendGridId = updatedProviders.find(p => p.providerType === 'sendgrid')?.id;
    return sendGridId;
  } catch (error) {
    console.error('Error setting up SendGrid provider:', error);
    throw error;
  }
}

async function updateEmailTemplates() {
  try {
    console.log('Updating all email templates to use standard sender...');
    
    // Get all templates
    const templates = await db
      .select()
      .from(emailTemplates);
    
    console.log(`Found ${templates.length} email templates to update`);
    
    // Get the SendGrid provider ID
    const [sendGridProvider] = await db
      .select()
      .from(emailProviderSettings)
      .where(eq(emailProviderSettings.providerType, 'sendgrid'));
    
    const providerId = sendGridProvider?.id;
    
    // Update each template
    for (const template of templates) {
      console.log(`Updating template: ${template.name} (${template.type})`);
      
      await db
        .update(emailTemplates)
        .set({
          sender_email: SENDER_EMAIL,
          sender_name: SENDER_NAME,
          providerId: providerId,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, template.id));
    }
    
    console.log('All email templates updated successfully!');
  } catch (error) {
    console.error('Error updating email templates:', error);
    throw error;
  }
}

// Run the script
updateEmailConfig()
  .then(() => {
    console.log('Email configuration updated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running email config update:', error);
    process.exit(1);
  });