/**
 * SendGrid Template Service
 * 
 * This service provides functionality to interact with SendGrid's dynamic templates API
 * and map them to our application's email templates.
 */

import fetch from 'node-fetch';
import { db } from '../../db/index.js';
import { emailTemplates } from '../../db/schema/emailTemplates.js';
import { emailProviderSettings } from '../../db/schema.js';
import { eq, and, isNull, ne } from 'drizzle-orm';

// Ensure the SendGrid API key is available
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY environment variable is not set. SendGrid template features will be unavailable.');
}

/**
 * Get all dynamic templates from SendGrid
 * @returns {Promise<Array>} Array of template objects
 */
export async function getTemplatesFromSendGrid() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }

    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API error:', errorText);
      throw new Error(`SendGrid API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.templates || [];
  } catch (error) {
    console.error('Error fetching SendGrid templates:', error);
    throw error;
  }
}

/**
 * Get all email templates with their SendGrid template mappings
 * @returns {Promise<Array>} Array of email templates with SendGrid mappings
 */
export async function listEmailTemplatesWithSendGridMapping() {
  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.name);
    return templates;
  } catch (error) {
    console.error('Error fetching email templates with mappings:', error);
    throw error;
  }
}

/**
 * Map a SendGrid template to an email template type
 * @param {string} templateType - Email template type (e.g., 'welcome', 'password_reset')
 * @param {string|null} sendgridTemplateId - SendGrid template ID or null to remove mapping
 * @returns {Promise<Object>} Updated template
 */
export async function mapSendGridTemplateToEmailType(templateType, sendgridTemplateId) {
  try {
    // Find all templates of this type
    const templatesOfType = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, templateType));

    if (templatesOfType.length === 0) {
      throw new Error(`No email templates found with type: ${templateType}`);
    }

    // Update all templates of this type
    const updatePromises = templatesOfType.map(template => 
      db.update(emailTemplates)
        .set({ 
          sendgridTemplateId: sendgridTemplateId,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, template.id))
        .returning()
    );

    const results = await Promise.all(updatePromises);
    return {
      success: true,
      updatedCount: results.length,
      templateType,
      sendgridTemplateId
    };
  } catch (error) {
    console.error('Error mapping SendGrid template:', error);
    throw error;
  }
}

/**
 * Get SendGrid provider status and metrics
 * @returns {Promise<Object>} Provider status information
 */
export async function getSendGridStatus() {
  try {
    // Get SendGrid provider from email_provider_settings table
    const providers = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.providerType, 'sendgrid'),
        eq(emailProviderSettings.isActive, true)
      ));

    const provider = providers.length > 0 ? providers[0] : null;

    // Get count of templates with SendGrid mappings
    const templatesWithSendGrid = await db
      .select()
      .from(emailTemplates)
      .where(isNull(emailTemplates.sendgridTemplateId).not());

    return {
      provider,
      templatesWithSendGrid,
      hasApiKey: !!process.env.SENDGRID_API_KEY
    };
  } catch (error) {
    console.error('Error getting SendGrid status:', error);
    throw error;
  }
}

/**
 * Send a test email using a SendGrid dynamic template
 * @param {string} templateId - SendGrid template ID
 * @param {string} recipientEmail - Email address to send the test to
 * @param {Object} testData - Test data to use in the template
 * @returns {Promise<boolean>} True if email was sent successfully
 */
export async function testSendGridTemplate(templateId, recipientEmail, testData) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }

    // Default sender email to support@matchpro.ai if not specified
    const senderEmail = process.env.DEFAULT_FROM_EMAIL || 'support@matchpro.ai';

    const mailData = {
      personalizations: [
        {
          to: [{ email: recipientEmail }],
          dynamic_template_data: testData || {}
        }
      ],
      from: { email: senderEmail, name: 'MatchPro.ai' },
      template_id: templateId
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mailData)
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch (e) {
        errorMessage = await response.text();
      }
      throw new Error(`SendGrid API returned ${response.status}: ${errorMessage}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending test email with SendGrid:', error);
    throw error;
  }
}