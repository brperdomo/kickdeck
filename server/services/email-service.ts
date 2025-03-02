import { db } from "@db";
import nodemailer from "nodemailer";
import { emailConfig } from "@db/schema";

let emailTransporter: nodemailer.Transporter | null = null;

export async function initEmailService() {
  try {
    // Get email configuration from the database
    const [config] = await db.select().from(emailConfig).limit(1);

    if (config && config.host && config.port && config.auth?.user && config.auth?.pass) {
      // Create email transporter
      emailTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass
        }
      });

      // Verify connection
      await emailTransporter.verify();
      console.log("Email service initialized successfully");
      return true;
    } else {
      console.log("Email configuration not found or incomplete");
      return false;
    }
  } catch (error) {
    console.error("Failed to initialize email service:", error);
    return false;
  }
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}) {
  try {
    if (!emailTransporter) {
      await initEmailService();
      if (!emailTransporter) {
        throw new Error("Email service not initialized");
      }
    }

    // Get email configuration for sender info
    const [config] = await db.select().from(emailConfig).limit(1);

    if (!config || !config.senderEmail) {
      throw new Error("Email configuration not found");
    }

    // Send email
    const result = await emailTransporter.sendMail({
      from: options.from || (config.senderName ? `${config.senderName} <${config.senderEmail}>` : config.senderEmail),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });

    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
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

    return sendEmail({
      to,
      subject: compiledSubject,
      html: compiledContent,
      from: `"${template.senderName}" <${template.senderEmail}>`
    });
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