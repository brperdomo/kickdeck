import nodemailer from 'nodemailer';
import { db } from '../../db';
import { emailTemplates, emailConfig } from '../../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

let transporter: nodemailer.Transporter;

export async function initEmailService() {
  // Check for configured email settings in the database
  const [dbEmailConfig] = await db.select().from(emailConfig).limit(1);

  if (dbEmailConfig && process.env.NODE_ENV === 'production') {
    // Use database configuration for production
    transporter = nodemailer.createTransport({
      host: dbEmailConfig.host,
      port: dbEmailConfig.port,
      secure: dbEmailConfig.secure,
      auth: dbEmailConfig.auth,
    });

    console.log('\n==================================================');
    console.log('Email service initialized with production configuration');
    console.log(`SMTP Host: ${dbEmailConfig.host}`);
    console.log(`SMTP Port: ${dbEmailConfig.port}`);
    console.log(`Secure: ${dbEmailConfig.secure ? 'Yes' : 'No'}`);
    console.log(`Sender: ${dbEmailConfig.senderName ? `${dbEmailConfig.senderName} <${dbEmailConfig.senderEmail}>` : dbEmailConfig.senderEmail}`);
    console.log('==================================================\n');
  } else if (process.env.NODE_ENV !== 'production') {
    // For development, use Ethereal Email
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('\n==================================================');
    console.log('Email service initialized in development mode');
    console.log(`Ethereal Email: ${testAccount.user}`);
    console.log(`Ethereal Password: ${testAccount.pass}`);
    console.log(`Preview URL: https://ethereal.email/login`);
    console.log('==================================================\n');
  } else {
    // Fallback to environment variables if no database config and in production
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
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

// Send email function
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  from?: string;
  attachments?: any[];
}) {
  try {
    // Get sender email from database config
    const [dbEmailConfig] = await db.select().from(emailConfig).limit(1);

    const fromEmail = options.from || 
      (dbEmailConfig?.senderName 
        ? `${dbEmailConfig.senderName} <${dbEmailConfig.senderEmail}>`
        : dbEmailConfig?.senderEmail || process.env.EMAIL_FROM || 'no-reply@example.com');

    const mailOptions = {
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Email sent in development mode:');
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Specific email sending functions using the new sendEmail function.
export async function sendPasswordResetEmail(
  to: string, 
  resetToken: string,
  username: string
) {
  const resetUrl = `${process.env.APP_URL || ''}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: 'Password Reset', //Example subject
    html: compileTemplate( (await getEmailTemplate('password_reset')).content, { username, resetUrl, expiryTime: '1 hour' }), //Assumes template exists
  });
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  return sendEmail({
    to,
    subject: 'Welcome!', //Example Subject
    html: compileTemplate( (await getEmailTemplate('welcome')).content, { firstName, loginUrl: process.env.APP_URL || '' }), //Assumes template exists
  });
}

export async function sendRegistrationConfirmation(
  to: string,
  firstName: string,
  eventName: string
) {
  return sendEmail({
    to,
    subject: 'Registration Confirmation', //Example Subject
    html: compileTemplate( (await getEmailTemplate('registration_confirmation')).content, { firstName, eventName, dashboardUrl: `${process.env.APP_URL || ''}/dashboard` }), //Assumes template exists
  });
}