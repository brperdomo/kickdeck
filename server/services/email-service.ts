
import nodemailer from 'nodemailer';
import { emailTemplates } from '@db/schema';
import { db } from '@db';
import { eq } from 'drizzle-orm';

// Configure mail transport
// For production, use your actual SMTP settings (SendGrid, Amazon SES, etc.)
// For development/testing, you can use a service like Ethereal or Mailtrap
export let transporter: nodemailer.Transporter;

// Initialize the email transporter
export async function initEmailService() {
  // For development - create a test account with Ethereal
  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.password,
      },
    });
    console.log('\n==================================================');
    console.log('Email service initialized in development mode');
    console.log(`Ethereal Email: ${testAccount.user}`);
    console.log(`Ethereal Password: ${testAccount.pass}`);
    console.log(`Preview URL: https://ethereal.email/message/${testAccount.web}`);
    console.log('==================================================\n');
  } else {
    // Production configuration - use your actual SMTP settings
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });
    console.log('Email service initialized in production mode');
  }
}

// Get email template by type
export async function getEmailTemplate(type: string) {
  const templates = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.type, type));
  
  // Get the default template or the first one if no default
  const defaultTemplate = templates.find(t => t.isDefault);
  return defaultTemplate || templates[0];
}

// Replace template variables with actual values
export function compileTemplate(template: string, data: Record<string, any>) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

// Send email using a template
export async function sendTemplatedEmail(
  templateType: string,
  to: string,
  data: Record<string, any>
) {
  try {
    const template = await getEmailTemplate(templateType);
    
    if (!template) {
      throw new Error(`Email template not found for type: ${templateType}`);
    }
    
    const compiledSubject = compileTemplate(template.subject, data);
    const compiledContent = compileTemplate(template.content, data);
    
    const mailOptions = {
      from: `"${template.senderName}" <${template.senderEmail}>`,
      to,
      subject: compiledSubject,
      html: compiledContent,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // For development - log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Specific email sending functions
export async function sendPasswordResetEmail(
  to: string, 
  resetToken: string,
  username: string
) {
  const resetUrl = `${process.env.APP_URL || ''}/reset-password?token=${resetToken}`;
  
  return sendTemplatedEmail('password_reset', to, {
    username,
    resetUrl,
    expiryTime: '1 hour',
  });
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  return sendTemplatedEmail('welcome', to, {
    firstName,
    loginUrl: process.env.APP_URL || '',
  });
}

export async function sendRegistrationConfirmation(
  to: string,
  firstName: string,
  eventName: string
) {
  return sendTemplatedEmail('registration_confirmation', to, {
    firstName,
    eventName,
    dashboardUrl: `${process.env.APP_URL || ''}/dashboard`,
  });
}
