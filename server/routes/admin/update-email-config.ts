/**
 * Email Configuration Update Route
 *
 * Admin-only route that updates the email configuration to use Brevo
 * and sets support@kickdeck.io as the sender for all templates.
 */

import { Router, Request, Response } from 'express';
import { db } from '@db';
import { emailProviderSettings, emailTemplates } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Constants
const SENDER_EMAIL = 'support@kickdeck.io';
const SENDER_NAME = 'KickDeck';

// Admin-only route to update email configuration
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Starting email configuration update...');

    // Step 1: Set up Brevo as the primary email provider
    const brevoId = await setupBrevoProvider();

    // Step 2: Update all email templates to use the standard sender
    const updatedTemplates = await updateEmailTemplates(brevoId);

    res.json({
      success: true,
      message: 'Email configuration updated successfully',
      details: {
        brevoProviderConfigured: !!brevoId,
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
 * Sets up Brevo as the primary email provider
 * @returns The ID of the Brevo provider
 */
async function setupBrevoProvider(): Promise<number | null> {
  try {
    console.log('Setting up Brevo as the primary email provider...');

    // First, check if we already have a Brevo provider
    const existingProviders = await db
      .select()
      .from(emailProviderSettings);

    console.log(`Found ${existingProviders.length} existing providers`);

    // Look for an existing Brevo provider
    const brevoProvider = existingProviders.find(p => p.providerType === 'brevo');

    let brevoId: number | null = null;

    if (brevoProvider) {
      console.log('Updating existing Brevo provider...');
      // Update it to be active and default
      const [updated] = await db
        .update(emailProviderSettings)
        .set({
          is_active: true,
          is_default: true,
          settings: {
            apiKey: process.env.BREVO_API_KEY,
            from: SENDER_EMAIL
          },
          updated_at: new Date().toISOString()
        })
        .where(eq(emailProviderSettings.id, brevoProvider.id))
        .returning();

      brevoId = updated.id;
    } else {
      console.log('Creating new Brevo provider...');
      // Create a new Brevo provider
      const [inserted] = await db
        .insert(emailProviderSettings)
        .values({
          providerType: 'brevo',
          providerName: 'Brevo Email Service',
          settings: {
            apiKey: process.env.BREVO_API_KEY,
            from: SENDER_EMAIL
          },
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .returning();

      brevoId = inserted.id;
    }

    // Deactivate all other providers
    for (const provider of existingProviders) {
      if (!brevoProvider || provider.id !== brevoProvider.id) {
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

    console.log('Brevo is now set as the primary email provider!');
    return brevoId;
  } catch (error) {
    console.error('Error setting up Brevo provider:', error);
    throw error;
  }
}

/**
 * Updates all email templates to use support@kickdeck.io as the sender
 * @param providerId The ID of the Brevo provider
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
          provider_id: providerId,
          updated_at: new Date()
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
