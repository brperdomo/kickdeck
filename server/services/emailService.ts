import nodemailer, { Transporter } from 'nodemailer';
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

    if (!provider) {
      throw new Error('No default email provider configured');
    }

    return provider;
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
 */
async function getEmailTemplate(type: string) {
  try {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.type, type),
        eq(emailTemplates.isActive, true)
      ));
      
    if (!template) {
      throw new Error(`No active template found for type: ${type}`);
    }
    
    return template;
  } catch (error) {
    console.error(`Error getting email template for type ${type}:`, error);
    throw error;
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
    await transporter.sendMail(options);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    
    if (isDevelopment) {
      // In development, don't throw errors from email failures
      console.log('Email sending failed, but continuing in development mode');
      return;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to send email: ${errorMessage}`);
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
  try {
    const template = await getEmailTemplate(templateType);
    
    const subject = renderTemplate(template.subject, context);
    const html = renderTemplate(template.content, context);
    
    await sendEmail({
      to,
      subject,
      html,
      from: `${template.senderName} <${template.senderEmail}>`
    });
    
    console.log(`Templated email (${templateType}) sent to ${to}`);
  } catch (error) {
    console.error(`Error sending templated email (${templateType}):`, error);
    throw error;
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
  try {
    const appUrl = process.env.APP_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    
    await sendTemplatedEmail(to, 'password_reset', {
      username,
      resetUrl,
      token: resetToken,
      expiryHours: 24, // Token validity period
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}