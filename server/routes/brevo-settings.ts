/**
 * Brevo Settings API Routes
 *
 * These routes handle Brevo-specific settings and configurations,
 * separated from the general email templates management.
 */

import { Request, Response } from 'express';
import { db } from '@db/index';
import { emailTemplates } from '@db/schema/emailTemplates';
import { emailProviderSettings } from '@db/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import * as brevoTemplateService from '../services/brevoTemplateService';

/**
 * Get Brevo configuration settings
 */
export async function getBrevoSettings(req: Request, res: Response) {
  try {
    console.log('Fetching Brevo settings...');

    // Get the Brevo provider settings
    const brevoProviders = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.providerType, 'brevo'),
        eq(emailProviderSettings.isActive, true)
      ));

    const provider = brevoProviders.length > 0
      ? brevoProviders.find(p => p.isDefault) || brevoProviders[0]
      : null;

    console.log(`Found ${brevoProviders.length} Brevo providers`);

    // Get all templates that have Brevo template IDs
    const templatesWithBrevo = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        type: emailTemplates.type,
        isActive: emailTemplates.isActive,
        brevoTemplateId: emailTemplates.brevoTemplateId
      })
      .from(emailTemplates)
      .where(
        isNotNull(emailTemplates.brevoTemplateId)
      );

    console.log(`Found ${templatesWithBrevo.length} templates with Brevo mappings`);

    res.json({
      apiKeySet: !!process.env.BREVO_API_KEY,
      apiKeyValid: true, // We'll validate this in a separate endpoint if needed
      provider: provider ? {
        id: provider.id,
        name: provider.providerName,
        isDefault: provider.isDefault,
        settings: provider.settings
      } : null,
      templatesWithBrevo
    });
  } catch (error) {
    console.error('Error fetching Brevo settings:', error);
    res.status(500).json({ error: "Failed to fetch Brevo settings" });
  }
}

/**
 * Update Brevo template mapping for a specific email template
 */
export async function updateBrevoTemplateMapping(req: Request, res: Response) {
  try {
    const { templateType, brevoTemplateId } = req.body;

    if (!templateType) {
      return res.status(400).json({ error: "Missing template type" });
    }

    const result = await brevoTemplateService.mapBrevoTemplateToEmailType(
      templateType,
      brevoTemplateId || null
    );

    res.json(result);
  } catch (error) {
    console.error('Error updating Brevo template mapping:', error);
    res.status(500).json({ error: "Failed to update Brevo template mapping" });
  }
}

/**
 * Get all Brevo dynamic templates
 */
export async function getBrevoTemplates(req: Request, res: Response) {
  try {
    console.log('Fetching Brevo templates...');

    // Check if API key is available
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY not found in environment');
      return res.status(500).json({
        error: "Brevo API key not configured",
        details: "BREVO_API_KEY environment variable is missing"
      });
    }

    const templates = await brevoTemplateService.getTemplatesFromBrevo();
    console.log(`Successfully fetched ${templates.length} Brevo templates`);

    res.json(templates);
  } catch (error: any) {
    console.error('Error fetching Brevo templates:', error);
    res.status(500).json({
      error: "Failed to fetch Brevo templates",
      details: error.message || 'Unknown error occurred'
    });
  }
}

/**
 * Test a Brevo dynamic template by sending a test email
 */
export async function testBrevoTemplate(req: Request, res: Response) {
  try {
    const { templateId, recipientEmail, testData } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: "Missing template ID" });
    }

    if (!recipientEmail) {
      return res.status(400).json({ error: "Missing recipient email" });
    }

    // Use the Brevo service to test the template
    const result = await brevoTemplateService.testBrevoTemplate(
      templateId,
      recipientEmail,
      testData || {}
    );

    if (result) {
      res.json({ success: true, message: "Test email sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send test email" });
    }
  } catch (error) {
    console.error('Error testing Brevo template:', error);
    res.status(500).json({ error: "Failed to test Brevo template" });
  }
}

/**
 * Get all application email templates with their mapped Brevo template IDs
 */
export async function getEmailTemplatesWithBrevoMapping(req: Request, res: Response) {
  try {
    const templates = await brevoTemplateService.listEmailTemplatesWithBrevoMapping();
    res.json(templates);
  } catch (error) {
    console.error('Error listing email templates with Brevo mappings:', error);
    res.status(500).json({ error: "Failed to list email templates with Brevo mappings" });
  }
}
