/**
 * Email Configuration Update Route
 * 
 * Admin-only route that updates the email configuration to use SendGrid
 * and sets support@matchpro.ai as the sender for all templates.
 */

import { Router, Request, Response } from 'express';
import { db } from '@db';
import { emailProviderSettings, emailTemplates } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Constants
const SENDER_EMAIL = 'support@matchpro.ai';
const SENDER_NAME = 'MatchPro';

// Admin-only route to update email configuration
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Starting email configuration update...');
    
    // Step 1: Set up SendGrid as the primary email provider
    const sendGridId = await setupSendGridProvider();
    
    // Step 2: Update all email templates to use the standard sender
    const updatedTemplates = await updateEmailTemplates(sendGridId);
    
    res.json({
      success: true,
      message: 'Email configuration updated successfully',
      details: {
        sendGridProviderConfigured: !!sendGridId,
        templatesUpdated: updatedTemplates
      }
    });
  } catch (error) {
    console.error('Error updating email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email configuration',
      error: (error as Error).message
    });
  }
});

/**
 * Sets up SendGrid as the primary email provider
 * @returns The ID of the SendGrid provider
 */
async function setupSendGridProvider(): Promise<number | null> {
  try {
    console.log('Setting up SendGrid as the primary email provider...');
    
    // First, check if we already have a SendGrid provider
    const existingProviders = await db
      .select()
      .from(emailProviderSettings);
    
    console.log(`Found ${existingProviders.length} existing providers`);
    
    // Look for an existing SendGrid provider
    const sendGridProvider = existingProviders.find(p => p.providerType === 'sendgrid');
    
    let sendGridId: number | null = null;
    
    if (sendGridProvider) {
      console.log('Updating existing SendGrid provider...');
      // Update it to be active and default
      const [updated] = await db
        .update(emailProviderSettings)
        .set({
          is_active: true,
          is_default: true,
          settings: {
            apiKey: process.env.SENDGRID_API_KEY,
            from: SENDER_EMAIL
          },
          updated_at: new Date().toISOString()
        })
        .where(eq(emailProviderSettings.id, sendGridProvider.id))
        .returning();
      
      sendGridId = updated.id;
    } else {
      console.log('Creating new SendGrid provider...');
      // Create a new SendGrid provider
      const [inserted] = await db
        .insert(emailProviderSettings)
        .values({
          providerType: 'sendgrid',
          providerName: 'SendGrid Email Service',
          settings: {
            apiKey: process.env.SENDGRID_API_KEY,
            from: SENDER_EMAIL
          },
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .returning();
      
      sendGridId = inserted.id;
    }
    
    // Deactivate all other providers
    for (const provider of existingProviders) {
      if (!sendGridProvider || provider.id !== sendGridProvider.id) {
        await db
          .update(emailProviderSettings)
          .set({
            is_active: false,
            is_default: false,
            updated_at: new Date().toISOString()
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
    return sendGridId;
  } catch (error) {
    console.error('Error setting up SendGrid provider:', error);
    throw error;
  }
}

/**
 * Updates all email templates to use support@matchpro.ai as the sender
 * @param providerId The ID of the SendGrid provider
 * @returns The number of templates updated
 */
async function updateEmailTemplates(providerId: number | null): Promise<number> {
  try {
    console.log('Updating all email templates to use standard sender...');
    
    // Get all templates
    const templates = await db
      .select()
      .from(emailTemplates);
    
    console.log(`Found ${templates.length} email templates to update`);
    
    // Update each template
    let updatedCount = 0;
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
        
      updatedCount++;
    }
    
    console.log(`${updatedCount} email templates updated successfully!`);
    return updatedCount;
  } catch (error) {
    console.error('Error updating email templates:', error);
    throw error;
  }
}

export default router;