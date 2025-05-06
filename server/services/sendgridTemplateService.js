/**
 * SendGrid Template Service
 * 
 * This service provides functionality to interact with SendGrid's dynamic templates API
 * and map them to our application's email templates.
 */

import fetch from 'node-fetch';
import { db } from '../../db/index.js';
import { emailTemplates } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

// Ensure the SendGrid API key is available
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY environment variable is not set. SendGrid template features will be unavailable.');
}

/**
 * Get all dynamic templates from SendGrid
 * @returns {Promise<Array>} Array of template objects
 */
export async function getSendGridTemplates() {
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
export async function getEmailTemplatesWithMappings() {
  try {
    const templates = await db.query.emailTemplates.findMany();
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
export async function mapSendGridTemplate(templateType, sendgridTemplateId) {
  try {
    // Find all templates of this type
    const templatesOfType = await db.query.emailTemplates.findMany({
      where: eq(emailTemplates.type, templateType)
    });

    if (templatesOfType.length === 0) {
      throw new Error(`No email templates found with type: ${templateType}`);
    }

    // Update all templates of this type
    const updatePromises = templatesOfType.map(template => 
      db.update(emailTemplates)
        .set({ sendgridTemplateId: sendgridTemplateId })
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
    // Get SendGrid provider from email_providers table
    const providers = await db.query.emailProviders.findMany({
      where: eq(db.schema.emailProviders.name, 'SendGrid')
    });

    const provider = providers.length > 0 ? providers[0] : null;

    // Get count of templates with SendGrid mappings
    const templatesWithSendGrid = await db.query.emailTemplates.findMany({
      where: (emailTemplates, { ne, and, isNotNull }) => 
        and(
          isNotNull(emailTemplates.sendgridTemplateId),
          ne(emailTemplates.sendgridTemplateId, '')
        )
    });

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
 * @returns {Promise<Object>} Response from SendGrid
 */
export async function sendTestEmail(templateId, recipientEmail, testData) {
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
          dynamic_template_data: testData
        }
      ],
      from: { email: senderEmail },
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

    return {
      success: true,
      message: `Test email sent to ${recipientEmail}`,
      statusCode: response.status
    };
  } catch (error) {
    console.error('Error sending test email with SendGrid:', error);
    throw error;
  }
}