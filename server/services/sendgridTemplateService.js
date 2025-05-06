/**
 * SendGrid Template Service
 * 
 * This service interacts with the SendGrid API to fetch dynamic templates
 * and manage template mappings in the application.
 */

import { db } from '@db/index';
import { emailTemplates } from '@db/schema/emailTemplates';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';

/**
 * Fetches all dynamic templates from SendGrid
 * @returns Array of template objects
 */
export async function getTemplatesFromSendGrid() {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }

    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.templates || []; // Array of templates
  } catch (error) {
    console.error('Error fetching SendGrid templates:', error);
    throw error;
  }
}

/**
 * Fetches a specific dynamic template by name
 * @param {string} templateName The name of the template to find
 * @returns Object with templateId and versionId
 */
export async function findSendGridTemplateByName(templateName) {
  const templates = await getTemplatesFromSendGrid();
  const template = templates.find(t => t.name === templateName);
  
  if (!template) {
    throw new Error(`Template "${templateName}" not found in SendGrid account`);
  }
  
  // Get the active version (assumes first version is active)
  if (!template.versions || template.versions.length === 0) {
    throw new Error(`No versions found for template "${templateName}"`);
  }
  
  // Return the template ID and the latest version ID
  return {
    templateId: template.id,
    versionId: template.versions[0].id
  };
}

/**
 * Maps a SendGrid template to an application email template type
 * @param {string} appTemplateType The application template type (e.g., 'welcome', 'password_reset')
 * @param {string} sendgridTemplateId The SendGrid template ID to map to this type
 * @returns The updated application template record
 */
export async function mapSendGridTemplateToEmailType(appTemplateType, sendgridTemplateId) {
  try {
    // Verify the template exists in our application
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, appTemplateType));
    
    if (!existingTemplate) {
      throw new Error(`Application template type "${appTemplateType}" not found in database`);
    }
    
    // Update the template with the SendGrid template ID
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({
        sendgridTemplateId: sendgridTemplateId,
        updatedAt: new Date()
      })
      .where(eq(emailTemplates.id, existingTemplate.id))
      .returning();
    
    console.log(`Mapped SendGrid template ${sendgridTemplateId} to application template type ${appTemplateType}`);
    return updatedTemplate;
  } catch (error) {
    console.error(`Error mapping SendGrid template to ${appTemplateType}:`, error);
    throw error;
  }
}

/**
 * Lists all application email templates with their mapped SendGrid template IDs
 * @returns Array of application templates with SendGrid mappings
 */
export async function listEmailTemplatesWithSendGridMapping() {
  try {
    const templates = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        type: emailTemplates.type,
        subject: emailTemplates.subject,
        isActive: emailTemplates.isActive,
        sendgridTemplateId: emailTemplates.sendgridTemplateId
      })
      .from(emailTemplates);
    
    return templates;
  } catch (error) {
    console.error('Error listing email templates with SendGrid mappings:', error);
    throw error;
  }
}

/**
 * Tests a SendGrid dynamic template by sending a test email
 * @param {string} templateId The SendGrid template ID to test
 * @param {string} recipientEmail The email address to send the test to
 * @param {object} testData The test data to use in the template
 * @returns {Promise<boolean>} Whether the test was successful
 */
export async function testSendGridTemplate(templateId, recipientEmail, testData = {}) {
  try {
    // Find the active SendGrid provider
    const [sendGridProvider] = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.providerType, 'sendgrid'),
        eq(emailProviderSettings.isActive, true)
      ));
    
    if (!sendGridProvider) {
      throw new Error('No active SendGrid provider found');
    }
    
    const fromEmail = (sendGridProvider.settings?.from || 'support@matchpro.ai');
    
    // Add some default test data if not provided
    const mergeData = {
      firstName: 'Test',
      lastName: 'User',
      email: recipientEmail,
      ...testData
    };
    
    // Import the sendgridService directly
    const sendgridService = await import('./sendgridService.js');
    
    // Send the test email using the dynamic template
    return await sendgridService.sendDynamicTemplateEmail({
      to: recipientEmail,
      from: fromEmail,
      templateId: templateId,
      dynamicTemplateData: mergeData
    });
  } catch (error) {
    console.error('Error testing SendGrid template:', error);
    throw error;
  }
}