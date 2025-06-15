/**
 * SendGrid Template Service
 * 
 * This service handles all SendGrid template operations including
 * fetching templates from SendGrid API and mapping them to email types.
 */

import sgMail from '@sendgrid/mail';
import { db } from '@db/index';
import { emailTemplates } from '@db/schema/emailTemplates';
import { eq } from 'drizzle-orm';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Fetch all dynamic templates from SendGrid
 */
export async function getTemplatesFromSendGrid() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }

    console.log('Making request to SendGrid API for templates...');
    
    const response = await sgMail.request({
      url: '/v3/templates',
      method: 'GET'
    });

    const templates = response[1]?.templates || [];
    console.log(`Successfully fetched ${templates.length} templates from SendGrid`);
    
    return templates.map((template: any) => ({
      id: template.id,
      name: template.name,
      generation: template.generation,
      updated_at: template.updated_at,
      versions: template.versions || []
    }));

  } catch (error: any) {
    console.error('SendGrid API Error:', error);
    
    // Handle different types of SendGrid errors
    if (error.response) {
      const statusCode = error.response.statusCode;
      const body = error.response.body;
      
      console.error('SendGrid API Response:', {
        statusCode,
        body: JSON.stringify(body, null, 2)
      });
      
      if (statusCode === 401) {
        throw new Error('SendGrid API authentication failed. Please check your API key.');
      } else if (statusCode === 403) {
        throw new Error('SendGrid API access forbidden. Please check your API key permissions.');
      } else {
        throw new Error(`SendGrid API error: ${statusCode} - ${body?.errors?.[0]?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to SendGrid API. Please check your internet connection.');
    } else {
      throw new Error(`SendGrid service error: ${error.message}`);
    }
  }
}

/**
 * Map a SendGrid template to an email type
 */
export async function mapSendGridTemplateToEmailType(
  emailType: string, 
  sendgridTemplateId: string | null
) {
  try {
    console.log(`Mapping SendGrid template ${sendgridTemplateId} to email type: ${emailType}`);
    
    // Find the email template by type
    const existingTemplates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, emailType));
    
    if (existingTemplates.length === 0) {
      throw new Error(`Email template type '${emailType}' not found`);
    }
    
    const template = existingTemplates[0];
    
    // Update the template with the SendGrid template ID
    await db
      .update(emailTemplates)
      .set({ 
        sendgridTemplateId: sendgridTemplateId,
        updatedAt: new Date().toISOString()
      })
      .where(eq(emailTemplates.id, template.id));
    
    console.log(`Successfully mapped SendGrid template to ${emailType}`);
    
    return {
      success: true,
      message: `SendGrid template ${sendgridTemplateId ? 'assigned' : 'removed'} for ${emailType}`,
      templateType: emailType,
      sendgridTemplateId
    };
    
  } catch (error: any) {
    console.error('Error mapping SendGrid template:', error);
    throw new Error(`Failed to map template: ${error.message}`);
  }
}

/**
 * Test a SendGrid template by sending a test email
 */
export async function testSendGridTemplate(
  templateId: string,
  recipientEmail: string,
  testData: Record<string, any> = {}
) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }
    
    console.log(`Testing SendGrid template ${templateId} to ${recipientEmail}`);
    
    const msg = {
      to: recipientEmail,
      from: process.env.FROM_EMAIL || 'noreply@matchpro.ai',
      templateId: templateId,
      dynamicTemplateData: {
        ...testData,
        subject: testData.subject || 'Test Email from MatchPro',
        test_mode: true
      }
    };
    
    await sgMail.send(msg);
    console.log(`Test email sent successfully to ${recipientEmail}`);
    
    return true;
    
  } catch (error: any) {
    console.error('Error sending test email:', error);
    
    if (error.response) {
      const statusCode = error.response.statusCode;
      const body = error.response.body;
      console.error('SendGrid Send Error:', { statusCode, body });
    }
    
    throw new Error(`Failed to send test email: ${error.message}`);
  }
}

/**
 * Get template mappings for all email types
 */
export async function getTemplateMappings() {
  try {
    const templates = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        type: emailTemplates.type,
        sendgridTemplateId: emailTemplates.sendgridTemplateId,
        isActive: emailTemplates.isActive
      })
      .from(emailTemplates);
    
    return templates;
    
  } catch (error: any) {
    console.error('Error fetching template mappings:', error);
    throw new Error(`Failed to fetch template mappings: ${error.message}`);
  }
}