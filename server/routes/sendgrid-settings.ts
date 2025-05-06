/**
 * SendGrid Settings API Routes
 * 
 * These routes handle SendGrid-specific settings and configurations, 
 * separated from the general email templates management.
 */

import { Request, Response } from 'express';
import { db } from '@db/index';
import { emailTemplates } from '@db/schema/emailTemplates';
import { emailProviderSettings } from '@db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import * as sendgridTemplateService from '../services/sendgridTemplateService';

/**
 * Get SendGrid configuration settings
 */
export async function getSendGridSettings(req: Request, res: Response) {
  try {
    // Get the SendGrid provider settings
    const sendGridProviders = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.providerType, 'sendgrid'),
        eq(emailProviderSettings.isActive, true)
      ));
    
    const provider = sendGridProviders.length > 0 
      ? sendGridProviders.find(p => p.isDefault) || sendGridProviders[0]
      : null;
    
    // Get all templates that have SendGrid template IDs
    const templatesWithSendGrid = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        type: emailTemplates.type,
        isActive: emailTemplates.isActive,
        sendgridTemplateId: emailTemplates.sendgridTemplateId
      })
      .from(emailTemplates)
      .where(
        eq(isNull(emailTemplates.sendgridTemplateId), false)
      );
    
    res.json({
      provider: provider ? {
        id: provider.id,
        name: provider.providerName,
        isDefault: provider.isDefault,
        settings: provider.settings
      } : null,
      templatesWithSendGrid
    });
  } catch (error) {
    console.error('Error fetching SendGrid settings:', error);
    res.status(500).json({ error: "Failed to fetch SendGrid settings" });
  }
}

/**
 * Update SendGrid template mapping for a specific email template
 */
export async function updateSendGridTemplateMapping(req: Request, res: Response) {
  try {
    const { templateType, sendgridTemplateId } = req.body;
    
    if (!templateType) {
      return res.status(400).json({ error: "Missing template type" });
    }
    
    const result = await sendgridTemplateService.mapSendGridTemplateToEmailType(
      templateType,
      sendgridTemplateId || null
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating SendGrid template mapping:', error);
    res.status(500).json({ error: "Failed to update SendGrid template mapping" });
  }
}

/**
 * Get all SendGrid dynamic templates
 */
export async function getSendGridTemplates(req: Request, res: Response) {
  try {
    const templates = await sendgridTemplateService.getTemplatesFromSendGrid();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching SendGrid templates:', error);
    res.status(500).json({ error: "Failed to fetch SendGrid templates" });
  }
}

/**
 * Test a SendGrid dynamic template by sending a test email
 */
export async function testSendGridTemplate(req: Request, res: Response) {
  try {
    const { templateId, recipientEmail, testData } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ error: "Missing template ID" });
    }
    
    if (!recipientEmail) {
      return res.status(400).json({ error: "Missing recipient email" });
    }
    
    // Use the SendGrid service to test the template
    const result = await sendgridTemplateService.testSendGridTemplate(
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
    console.error('Error testing SendGrid template:', error);
    res.status(500).json({ error: "Failed to test SendGrid template" });
  }
}

/**
 * Get all application email templates with their mapped SendGrid template IDs
 */
export async function getEmailTemplatesWithSendGridMapping(req: Request, res: Response) {
  try {
    const templates = await sendgridTemplateService.listEmailTemplatesWithSendGridMapping();
    res.json(templates);
  } catch (error) {
    console.error('Error listing email templates with SendGrid mappings:', error);
    res.status(500).json({ error: "Failed to list email templates with SendGrid mappings" });
  }
}