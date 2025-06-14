import nodemailer, { Transporter } from 'nodemailer';
import { db } from '@db/index';
import { emailProviderSettings } from '@db/schema';
import { emailTemplates } from '@db/schema/emailTemplates';
import { eq, and } from 'drizzle-orm';
import * as sendgridService from './sendgridService';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface TemplateContext {
  [key: string]: any;
}

// Cache for email transporter
let emailTransporter: Transporter | null = null;
let emailTransporterLastFetch: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// SendGrid specific types
type EmailProvider = 'smtp' | 'sendgrid';

/**
 * Gets the configured email provider settings, prioritizing SendGrid as the primary provider
 * First checks the database, then falls back to SendGrid environment variables
 */
async function getEmailProvider() {
  try {
    // First, check if there's a SendGrid provider in the database
    const sendGridProviders = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.providerType, 'sendgrid'),
        eq(emailProviderSettings.isActive, true)
      ));
    
    // If we have an active SendGrid provider, use it
    if (sendGridProviders.length > 0) {
      // Prefer the default provider if there are multiple
      const defaultProvider = sendGridProviders.find(p => p.isDefault);
      return defaultProvider || sendGridProviders[0];
    }
    
    // If no SendGrid provider in database, use environment variables
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (sendgridApiKey) {
      console.log('Using SendGrid API key from environment variables');
      
      // Create a SendGrid provider from environment variables
      return {
        id: 0,
        providerType: 'sendgrid' as EmailProvider,
        providerName: 'SendGrid Provider',
        settings: {
          apiKey: sendgridApiKey,
          from: process.env.SENDGRID_FROM_EMAIL || 'support@matchpro.ai'
        },
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // SendGrid is not available - this is an error as we require SendGrid
    throw new Error('SendGrid is not configured. Please set SENDGRID_API_KEY in environment variables.');
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
    } else if (provider.providerType === 'sendgrid') {
      // For SendGrid, we return a dummy transporter that will be overridden
      // by SendGrid-specific methods later
      const { apiKey } = provider.settings as any;
      
      // Make sure the SendGrid API key is valid
      if (!apiKey) {
        throw new Error('Missing SendGrid API key in provider settings');
      }
      
      // Create a "dummy" nodemailer transport that isn't actually used
      // We'll bypass this by using SendGrid's API directly in the sendEmail function
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: apiKey
        }
      });
      
      // We don't need to explicitly set the API key here as it's handled in the sendgridService
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
 * Sends an email using the SendGrid API
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  try {
    // Log the email content in development mode for debugging
    if (isDevelopment) {
      console.log('\n===== DEVELOPMENT MODE: EMAIL CONTENT =====');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`From: ${options.from || 'default-sender'}`);
      console.log('Content:');
      console.log(options.html);
      console.log('=============================================\n');
      // Still proceed to send the email - don't return early
    }
    
    // Get the SendGrid provider
    const provider = await getEmailProvider();
    
    // Use SendGrid to send the email
    const from = options.from || `${provider.providerName} <${(provider.settings as any).from || 'support@matchpro.ai'}>`;
    
    const result = await sendgridService.sendEmail({
      to: options.to,
      from: from,
      subject: options.subject,
      html: options.html || '<p>Please view this email in a compatible email client.</p>',
      text: options.text || 'Please view this email in a compatible email client.'
    });
    
    if (result) {
      console.log(`✅ EMAIL SENT: ${options.subject} → ${options.to}`);
    } else {
      throw new Error('Failed to send email via SendGrid');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    
    if (isDevelopment) {
      // In development, still log but don't throw
      console.log('Email sending failed, but continuing in development mode');
      console.error(error);
      return;
    }
    
    // In production, log error but don't crash the application
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send email to ${options.to}: ${errorMessage}`);
    
    // Don't rethrow the error in production as this could interrupt important flows
    // such as payment processing or user registration just because an email failed
  }
}

/**
 * Sends a templated email using a specific template type
 * If the template has a SendGrid template ID, it will use SendGrid dynamic templates.
 * Otherwise, it will render the template locally and send it as a regular email.
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
      // Check if we should use SendGrid Dynamic Templates
      if (emailTemplate.sendgridTemplateId) {
        console.log(`Using SendGrid dynamic template for ${templateType} (ID: ${emailTemplate.sendgridTemplateId})`);
        
        const fromEmail = `${emailTemplate.senderName} <${emailTemplate.senderEmail}>`;
        
        // Use SendGrid dynamic template
        const result = await sendgridService.sendDynamicTemplateEmail({
          to,
          from: fromEmail,
          templateId: emailTemplate.sendgridTemplateId,
          dynamicTemplateData: context
        });
        
        if (result) {
          console.log(`✅ TEMPLATE EMAIL SENT: ${templateType} → ${to} (SendGrid ID: ${emailTemplate.sendgridTemplateId})`);
        } else {
          throw new Error(`Failed to send SendGrid dynamic template email to ${to}`);
        }
      } else {
        // Use regular template rendering
        const subject = renderTemplate(emailTemplate.subject, context) || 'Notification';
        let html = renderTemplate(emailTemplate.content, context);
        
        // Ensure html is never empty or undefined
        if (!html || html.trim() === '') {
          html = '<p>You have received a notification from MatchPro. Please check your account for more information.</p>';
        }
        
        await sendEmail({
          to,
          subject,
          html,
          from: `${emailTemplate.senderName} <${emailTemplate.senderEmail}>`
        });
        
        console.log(`Templated email (${templateType}) sent to ${to}`);
      }
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
      senderName: "MatchPro",
      senderEmail: "support@matchpro.ai",
      isActive: true,
      type: templateType,
      providerId: null,
      sendgridTemplateId: null
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
      senderName: "MatchPro",
      senderEmail: "support@matchpro.ai",
      isActive: true,
      type: templateType,
      providerId: null,
      sendgridTemplateId: null
    };
  }
}

/**
 * Helper function to get the application URL for email links
 */
function getAppUrl(isDevelopment: boolean = process.env.NODE_ENV !== 'production'): string {
  if (isDevelopment) {
    // Development environment - use local domain
    return process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
  } else {
    // Production environment - use production domain
    return process.env.PRODUCTION_URL || process.env.APP_URL || 'https://matchpro.ai';
  }
}

/**
 * Sends a registration receipt email with transaction details
 */
export async function sendRegistrationReceiptEmail(
  to: string,
  teamData: any, // Team registration data
  paymentData: any, // Payment transaction data
  eventName: string
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  try {
    const appUrl = getAppUrl(isDevelopment);
    const loginLink = `${appUrl}/dashboard`;
    
    // Format numbers and dates consistently
    const formatCurrency = (amount: number) => {
      return (amount / 100).toFixed(2);
    };
    
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // Format payment date if it exists
    const paymentDate = paymentData?.paymentDate || teamData?.paymentDate;
    const formattedPaymentDate = paymentDate ? formatDate(paymentDate) : '';
    
    // Format selected fees if they exist
    let selectedFees: any[] = [];
    if (teamData.selectedFeeIds) {
      // This would normally be populated by a database query to get fee details
      // This is a placeholder - actual implementation would fetch fee info
      selectedFees = [{ name: 'Registration Fee', amount: formatCurrency(teamData.totalAmount || teamData.registrationFee || 0) }];
    }
    
    // Prepare template context data
    const context = {
      teamName: teamData.name || 'Team Registration',
      eventName: eventName || 'Event Registration',
      submitterName: teamData.submitterName || teamData.managerName || '',
      submitterEmail: teamData.submitterEmail || teamData.managerEmail || '',
      registrationDate: formatDate(teamData.createdAt),
      totalAmount: formatCurrency(teamData.totalAmount || teamData.registrationFee || 0),
      paymentStatus: paymentData?.status || teamData.paymentStatus || 'pending',
      paymentDate: formattedPaymentDate,
      paymentMethod: paymentData?.paymentMethodType || 'card',
      cardLastFour: paymentData?.cardLastFour || teamData.cardLastFour || '',
      cardBrand: paymentData?.cardBrand || teamData.cardBrand || '',
      paymentId: paymentData?.paymentIntentId || teamData.paymentIntentId || '',
      selectedFees: selectedFees,
      loginLink: loginLink,
      clubName: teamData.clubName || '',
      currentYear: new Date().getFullYear()
    };
    
    // Send the email using the registration_receipt template
    await sendTemplatedEmail(to, 'registration_receipt', context);
    
    console.log(`Registration receipt email sent to ${to}`);
  } catch (error) {
    console.error('Error sending registration receipt email:', error);
    
    if (isDevelopment) {
      // Rethrow errors in development mode for easier debugging
      throw error;
    }
    
    // In production, log error but don't crash the application
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send registration receipt email to ${to}: ${errorMessage}`);
  }
}

/**
 * Sends a registration confirmation email for setup intent payment workflow
 * This is sent when a team submits registration with payment method saved but not charged yet
 */
export async function sendRegistrationConfirmationEmail(
  to: string,
  teamData: any, // Team registration data
  eventData: any, // Event information
  ageGroupData?: any, // Age group information
  bracketData?: any // Bracket information
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  try {
    const appUrl = getAppUrl(isDevelopment);
    const loginLink = `${appUrl}/dashboard`;
    
    // Format numbers and dates consistently
    const formatCurrency = (amount: number) => {
      if (!amount) return '0.00';
      return (amount / 100).toFixed(2);
    };
    
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Parse coach data if it's a JSON string
    let headCoachName = '';
    if (teamData.coach) {
      try {
        const coachData = typeof teamData.coach === 'string' ? JSON.parse(teamData.coach) : teamData.coach;
        headCoachName = coachData.headCoachName || '';
      } catch (e) {
        console.log('Could not parse coach data, using as string');
        headCoachName = teamData.coach;
      }
    }

    // Format selected fees if they exist
    let selectedFees: any[] = [];
    if (teamData.selectedFeeIds && teamData.selectedFeeIds.length > 0) {
      // This would normally be populated by a database query to get fee details
      // For now, we'll create a basic fee entry based on the total amount
      selectedFees = [{ 
        name: 'Registration Fee', 
        amount: formatCurrency(teamData.totalAmount || teamData.registrationFee || 0) 
      }];
    }
    
    // Prepare template context data
    const context = {
      teamName: teamData.name || 'Team Registration',
      eventName: eventData?.name || 'Event Registration',
      ageGroup: ageGroupData?.ageGroup || ageGroupData?.name || 'Age Group',
      bracket: bracketData?.name || '',
      clubName: teamData.clubName || '',
      submitterName: teamData.submitterName || teamData.managerName || '',
      submitterEmail: teamData.submitterEmail || teamData.managerEmail || '',
      headCoachName: headCoachName,
      managerName: teamData.managerName || '',
      managerEmail: teamData.managerEmail || '',
      managerPhone: teamData.managerPhone || '',
      registrationDate: formatDate(teamData.createdAt),
      totalAmount: formatCurrency(teamData.totalAmount || teamData.registrationFee || 0),
      selectedFees: selectedFees,
      cardBrand: teamData.cardBrand || 'Card',
      cardLastFour: teamData.cardLast4 || teamData.cardLastFour || '****',
      setupIntentId: teamData.setupIntentId || '',
      addRosterLater: teamData.addRosterLater || false,
      loginLink: loginLink,
      supportEmail: 'support@matchpro.ai',
      organizationName: 'MatchPro',
      currentYear: new Date().getFullYear()
    };
    
    // Send the email using the registration_confirmation template
    await sendTemplatedEmail(to, 'registration_confirmation', context);
    
    console.log(`Registration confirmation email sent to ${to}`);
  } catch (error) {
    console.error('Error sending registration confirmation email:', error);
    
    if (isDevelopment) {
      // Rethrow errors in development mode for easier debugging
      throw error;
    }
    
    // In production, log error but don't crash the application
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send registration confirmation email to ${to}: ${errorMessage}`);
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
    const appUrl = getAppUrl(isDevelopment);
    console.log(`Using URL for password reset: ${appUrl}`);
    
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