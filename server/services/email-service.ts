import nodemailer from 'nodemailer';
import { emailConfig, emailTemplates } from "@db/schema";
import { db } from "@db/index";
import { eq } from "drizzle-orm";

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: any = null;

  async initialize() {
    try {
      // Get the email configuration from the database
      const configs = await db.select().from(emailConfig).limit(1);

      if (configs.length === 0) {
        console.warn('No email configuration found in the database');
        return false;
      }

      this.config = configs[0];

      // Create a transporter using the configuration
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.authUser,
          pass: this.config.authPass,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      return false;
    }
  }

  async sendEmail(to: string, subject: string, html: string, options: any = {}) {
    if (!this.transporter) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Email service not initialized');
      }
    }

    try {
      const mailOptions = {
        from: options.from || `"${this.config.senderName || 'No Reply'}" <${this.config.senderEmail}>`,
        to,
        subject,
        html,
        ...options,
      };

      const info = await this.transporter!.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  }

  async testConnection(config: any) {
    try {
      const testTransporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.authUser || config.auth?.user,
          pass: config.authPass || config.auth?.pass,
        },
      });

      await testTransporter.verify();
      return { success: true };
    } catch (error) {
      console.error('Email connection test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async saveConfiguration(config: any) {
    try {
      const existingConfigs = await db.select().from(emailConfig).limit(1);

      if (existingConfigs.length > 0) {
        // Update existing configuration
        await db.update(emailConfig)
          .set({
            host: config.host,
            port: config.port,
            secure: config.secure,
            authUser: config.authUser || config.auth?.user,
            authPass: config.authPass || config.auth?.pass,
            senderEmail: config.senderEmail,
            senderName: config.senderName,
            updatedAt: new Date(),
          })
          .where(eq(emailConfig.id, existingConfigs[0].id));
      } else {
        // Insert new configuration
        await db.insert(emailConfig).values({
          host: config.host,
          port: config.port,
          secure: config.secure,
          authUser: config.authUser || config.auth?.user,
          authPass: config.authPass || config.auth?.pass,
          senderEmail: config.senderEmail,
          senderName: config.senderName,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Re-initialize with the new configuration
      await this.initialize();

      return { success: true };
    } catch (error) {
      console.error('Failed to save email configuration:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getConfiguration() {
    try {
      const configs = await db.select().from(emailConfig).limit(1);

      if (configs.length === 0) {
        return null;
      }

      const config = configs[0];

      return {
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.authUser,
          pass: config.authPass,
        },
        senderEmail: config.senderEmail,
        senderName: config.senderName,
      };
    } catch (error) {
      console.error('Failed to get email configuration:', error);
      return null;
    }
  }

  async getEmailTemplate(templateName: string) {
    try {
      const template = await db.select().from(emailTemplates).where(eq(emailTemplates.name, templateName)).limit(1);
      return template.length > 0 ? template[0].content : null;
    } catch (error) {
      console.error('Failed to get email template:', error);
      return null;
    }
  }
}

const sendPasswordResetEmail = async (email: string, data: { firstName: string; resetLink: string }) => {
  try {
    const template = await emailService.getEmailTemplate("password-reset");
    if (!template) {
      console.error("Password reset email template not found");
      return { success: false, error: "Email template not found" };
    }

    // Replace placeholders in template
    let html = template;
    html = html.replace("{{firstName}}", data.firstName);
    html = html.replace("{{resetLink}}", data.resetLink);

    return await emailService.sendEmail({
      to: email,
      subject: "Password Reset Request",
      html
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error: "Failed to send email" };
  }
};

export const emailService = new EmailService();
export const getEmailTemplate = (templateName: string) => emailService.getEmailTemplate(templateName);
export const sendEmail = (options:any) => emailService.sendEmail(options.to, options.subject, options.html, options);