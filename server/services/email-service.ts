import nodemailer from 'nodemailer';
import { db } from '../db';
import { emailTemplates, emailConfig } from '@db/schema';
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