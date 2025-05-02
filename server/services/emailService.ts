import nodemailer, { Transporter } from 'nodemailer';
import { MailService } from '@sendgrid/mail';
import { db } from '@db/index';
import { emailProviderSettings } from '@db/schema';
import { emailTemplates } from '@db/schema/emailTemplates';
import { eq, and } from 'drizzle-orm';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface TemplateContext {
  [key: string]: any;
}

// Cache for email transporter
let emailTransporter: Transporter | null = null;
let emailTransporterLastFetch: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Gets the configured email provider settings from the database
 * with fallback to environment variables if no provider is configured
 */
async function getEmailProvider() {
  try {
    // Get the default email provider
    const [provider] = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.isDefault, true),
        eq(emailProviderSettings.isActive, true)
      ));

    if (provider) {
      return provider;
    }

    // No provider found in database, check for environment variables as fallback
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpSecure = process.env.SMTP_SECURE === 'true';

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      console.log('Using SMTP settings from environment variables as fallback');
      
      // Create a fallback provider from environment variables
      return {
        id: 0,
        providerType: 'smtp',
        providerName: 'Fallback SMTP Provider',
        settings: {
          host: smtpHost,
          port: smtpPort,
          username: smtpUser,
          password: smtpPassword,
          secure: smtpSecure.toString()
        },
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // No fallback available either
    throw new Error('No email provider configured in database and no valid SMTP settings in environment variables');
  } catch (error) {
    console.error('Error getting email provider:', error);
    throw error;
  }
}

/**
 * Gets and caches an email transporter based on the configured provider
 */
async function getEmailTransporter(): Promise<Transporter> {
  const now = Date.now();
  
  // Return cached transporter if valid
  if (emailTransporter && (now - emailTransporterLastFetch) < CACHE_TTL) {
    return emailTransporter;
  }
  
  try {
    const provider = await getEmailProvider();
    
    if (provider.providerType === 'smtp') {
      const { host, port, username, password, secure } = provider.settings as any;
      
      emailTransporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: secure === 'true',
        auth: {
          user: username,
          pass: password
        }
      });
    } else {
      throw new Error(`Unsupported email provider type: ${provider.providerType}`);
    }
    
    emailTransporterLastFetch = now;
    return emailTransporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
}

/**
 * Gets an email template by type
 * @param type The template type to fetch
 * @param throwIfNotFound Whether to throw an error if template not found (default: false)
 * @returns The template or null if not found and throwIfNotFound is false
 */
async function getEmailTemplate(type: string, throwIfNotFound = false) {
  try {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.type, type),
        eq(emailTemplates.isActive, true)
      ));
      
    if (!template) {
      if (throwIfNotFound) {
        throw new Error(`No active template found for type: ${type}`);
      }
      console.warn(`No active template found for type: ${type}, using fallback`);
      return null;
    }
    
    return template;
  } catch (error) {
    console.error(`Error getting email template for type ${type}:`, error);
    if (throwIfNotFound) {
      throw error;
    }
    return null;
  }
}

/**
 * Renders a template with context variables
 */
function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return context[trimmedKey] !== undefined ? context[trimmedKey] : match;
  });
}

/**
 * Sends an email using the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  try {
    if (isDevelopment) {
      // In development mode, just log the email content
      console.log('\n===== DEVELOPMENT MODE: EMAIL NOT ACTUALLY SENT =====');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`From: ${options.from || 'default-sender'}`);
      console.log('Content:');
      console.log(options.html);
      console.log('=====================================================\n');
      return;
    }
    
    // In production, try to send the actual email
    const transporter = await getEmailTransporter();
    
    // Double check that we have a valid transporter before trying to send
    if (!transporter) {
      console.error('No email transporter available');
      // Log the issue but don't crash the application in production
      console.error('Email could not be sent to', options.to, 'due to missing email transporter');
      return;
    }
    
    await transporter.sendMail(options);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    
    if (isDevelopment) {
      // In development, don't throw errors from email failures
      console.log('Email sending failed, but continuing in development mode');
      return;
    }
    
    // In production, log the error but don't crash the application
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send email to ${options.to}: ${errorMessage}`);
    
    // Don't rethrow the error in production as this could interrupt important flows
    // such as payment processing or user registration just because an email failed
  }
}

/**
 * Sends a templated email using a specific template type
 */
export async function sendTemplatedEmail(
  to: string,
  templateType: string,
  context: TemplateContext
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  try {
    // First get the email template using the updated non-throwing version
    const template = await getEmailTemplate(templateType, false);
    
    // If no template found, use a fallback
    const emailTemplate = template || createFallbackTemplate(templateType, context, isDevelopment);
    
    // At this point emailTemplate is guaranteed to exist because createFallbackTemplate always returns a value
    if (!emailTemplate || !emailTemplate.subject || !emailTemplate.content) {
      throw new Error(`Failed to generate a valid email template for ${templateType}`);
    }
    
    try {
      const subject = renderTemplate(emailTemplate.subject, context);
      const html = renderTemplate(emailTemplate.content, context);
      
      await sendEmail({
        to,
        subject,
        html,
        from: `${emailTemplate.senderName} <${emailTemplate.senderEmail}>`
      });
      
      console.log(`Templated email (${templateType}) sent to ${to}`);
    } catch (renderError) {
      console.error(`Error rendering or sending email (${templateType}):`, renderError);
      // Don't throw here, even in development, to prevent API failures
    }
  } catch (error) {
    console.error(`Unexpected error in sendTemplatedEmail (${templateType}):`, error);
    
    // Always log but never throw to keep API endpoints working
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send templated email to ${to}: ${errorMessage}`);
  }
}

/**
 * Creates a fallback template when a requested template is not found
 */
function createFallbackTemplate(templateType: string, context: TemplateContext, isDevelopment: boolean) {
  if (isDevelopment) {
    // In development, use a more detailed debug template
    console.log(`Using detailed development fallback template for ${templateType}`);
    return {
      subject: `[DEV MODE] ${templateType} notification`,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Development Mode - Template Missing</h2>
          <p>This is a development placeholder for the <strong>${templateType}</strong> template which was not found in the database.</p>
          <h3>Context Data:</h3>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${JSON.stringify(context, null, 2)}</pre>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This template was generated automatically as a fallback in development mode.</p>
        </div>
      `,
      senderName: "System (Dev)",
      senderEmail: "noreply@example.com",
      isActive: true,
      type: templateType,
      providerId: null
    };
  } else {
    // In production, use a generic professional template
    console.log(`Using generic production fallback template for ${templateType}`);
    return {
      subject: `${templateType.replace(/_/g, ' ')} notification`,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Team Registration Update</h2>
          <p>This is a notification regarding your team registration status.</p>
          <p>Please check your dashboard for more details.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This is an automated notification.</p>
        </div>
      `,
      senderName: "Team Registration System",
      senderEmail: "noreply@matchpro.ai",
      isActive: true,
      type: templateType,
      providerId: null
    };
  }
}

/**
 * Sends a password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  username: string
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  try {
    // Use the APP_URL environment variable or the Replit domain as fallback
    const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    
    await sendTemplatedEmail(to, 'password_reset', {
      username,
      resetUrl,
      token: resetToken,
      expiryHours: 24, // Token validity period
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    if (isDevelopment) {
      // Rethrow errors in development mode for easier debugging
      throw error;
    }
    
    // In production, log error but don't crash the application
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send password reset email to ${to}: ${errorMessage}`);
  }
}