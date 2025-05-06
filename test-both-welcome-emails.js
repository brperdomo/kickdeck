/**
 * Test Both Welcome Email Templates
 * 
 * This script tests sending both member and admin welcome emails
 * to verify they are correctly configured with SendGrid.
 * 
 * Usage:
 *   node test-both-welcome-emails.js recipient@example.com
 */

import { db } from './db/index.js';
import { emailTemplates } from './db/schema.js';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid mail service
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

async function getEmailProvider() {
  try {
    // Look for the provider with type 'sendgrid'
    const providers = await db
      .select()
      .from({ e: 'email_providers' })
      .where(eq('e.type', 'sendgrid'))
      .limit(1);

    return providers[0];
  } catch (error) {
    console.error('Error fetching email provider:', error);
    return null;
  }
}

async function getEmailTemplate(type) {
  try {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, type))
      .limit(1);
    
    return template;
  } catch (error) {
    console.error(`Error fetching ${type} email template:`, error);
    return null;
  }
}

async function sendWelcomeEmail(type, recipientEmail) {
  try {
    const template = await getEmailTemplate(type);
    const emailProvider = await getEmailProvider();

    if (!template) {
      throw new Error(`Email template with type '${type}' not found`);
    }

    if (!emailProvider) {
      throw new Error('SendGrid email provider not found');
    }

    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }

    const appUrl = process.env.APP_URL || 'https://matchpro.ai';
    const loginUrl = `${appUrl}/login`;
    
    // Prepare email data based on email type
    let emailData = {};
    
    if (type === 'welcome') {
      // Member welcome email
      emailData = {
        user: {
          firstName: 'Test',
          lastName: 'User',
          email: recipientEmail
        },
        loginUrl: loginUrl,
        appUrl: appUrl,
        organizationName: 'MatchPro'
      };
    } else if (type === 'admin_welcome') {
      // Admin welcome email
      emailData = {
        user: {
          firstName: 'Test',
          lastName: 'Admin',
          email: recipientEmail
        },
        loginUrl: loginUrl,
        appUrl: appUrl,
        organizationName: 'MatchPro',
        isAdmin: true
      };
    } else {
      throw new Error(`Unsupported email type: ${type}`);
    }

    // Check if SendGrid template ID is set
    if (template.sendgridTemplateId) {
      console.log(`Sending ${type} email using SendGrid template ${template.sendgridTemplateId}`);
      
      const msg = {
        to: recipientEmail,
        from: emailProvider.senderEmail || 'noreply@matchpro.ai',
        templateId: template.sendgridTemplateId,
        dynamicTemplateData: emailData
      };
      
      await mailService.send(msg);
      console.log(`SendGrid ${type} email sent successfully to ${recipientEmail}`);
      
      return true;
    } else {
      console.log(`No SendGrid template ID found for ${type} email template. Using fallback method.`);
      
      // Create a transporter using the provider config
      const transporter = nodemailer.createTransport({
        host: emailProvider.smtpHost,
        port: emailProvider.smtpPort,
        secure: emailProvider.smtpPort === 465,
        auth: {
          user: emailProvider.smtpUsername,
          pass: emailProvider.smtpPassword
        }
      });
      
      // Send email using the configured transporter
      await transporter.sendMail({
        from: emailProvider.senderEmail || 'noreply@matchpro.ai',
        to: recipientEmail,
        subject: template.subject,
        html: `<p>This is a test ${type} email. The dynamic template was not configured.</p>
               <p>Login URL: <a href="${loginUrl}">${loginUrl}</a></p>`
      });
      
      console.log(`Fallback ${type} email sent successfully to ${recipientEmail}`);
      return true;
    }
  } catch (error) {
    console.error(`Error sending ${type} email:`, error);
    return false;
  }
}

async function testWelcomeEmails() {
  const recipientEmail = process.argv[2];
  
  if (!recipientEmail) {
    console.error('Usage: node test-both-welcome-emails.js recipient@example.com');
    process.exit(1);
  }
  
  console.log('Testing welcome email templates...');
  
  // First, test the member welcome email
  const memberResult = await sendWelcomeEmail('welcome', recipientEmail);
  console.log(`Member welcome email ${memberResult ? 'sent successfully' : 'failed'}`);
  
  // Then, test the admin welcome email
  const adminResult = await sendWelcomeEmail('admin_welcome', recipientEmail);
  console.log(`Admin welcome email ${adminResult ? 'sent successfully' : 'failed'}`);
  
  console.log('\nSummary:');
  console.log(`- Member welcome email: ${memberResult ? '✓' : '✗'}`);
  console.log(`- Admin welcome email: ${adminResult ? '✓' : '✗'}`);
  
  process.exit(0);
}

testWelcomeEmails().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});