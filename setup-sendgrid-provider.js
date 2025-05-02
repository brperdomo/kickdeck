/**
 * Set up SendGrid as Primary Email Provider
 * 
 * This script creates or updates the email provider settings in the database
 * to make SendGrid the primary and only email provider.
 */

import { db } from './db/index.js';
import { emailProviderSettings } from './db/schema/index.js';
import { eq } from 'drizzle-orm';

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
            from: 'support@matchpro.ai'
          },
          updatedAt: new Date().toISOString()
        })
        .where(eq(emailProviderSettings.id, sendGridProvider.id));
        
      // Deactivate all other providers
      for (const provider of existingProviders) {
        if (provider.id !== sendGridProvider.id) {
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
      
      console.log('SendGrid provider updated successfully!');
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
            from: 'support@matchpro.ai'
          },
          isActive: true,
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
      // Deactivate all other providers
      for (const provider of existingProviders) {
        await db
          .update(emailProviderSettings)
          .set({
            isActive: false,
            isDefault: false,
            updatedAt: new Date().toISOString()
          })
          .where(eq(emailProviderSettings.id, provider.id));
      }
      
      console.log('SendGrid provider created successfully!');
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
  } catch (error) {
    console.error('Error setting up SendGrid provider:', error);
  }
}

// Run the function
setupSendGridProvider()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Unhandled error:', err))
  .finally(() => process.exit(0));