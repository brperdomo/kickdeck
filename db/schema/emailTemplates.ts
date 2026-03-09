import { pgTable, serial, text, timestamp, boolean, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // registration, payment, password_reset, etc.
  subject: text('subject').notNull(),
  content: text('content').notNull(),
  textContent: text('text_content'), // Plain text version for better deliverability
  senderName: text('sender_name').notNull(),
  senderEmail: text('sender_email').notNull(),
  isActive: boolean('is_active').default(true),
  variables: json('variables').$type<string[]>().default([]),
  providerId: integer('provider_id'),
  brevoTemplateId: text('brevo_template_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const defaultPasswordResetTemplate = {
  name: 'Password Reset',
  description: 'Template for password reset emails',
  type: 'password_reset',
  subject: 'Reset Your Password',
  content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      background-color: #4A154B;
      color: white;
      text-align: center;
      padding: 20px;
    }
    .content {
      padding: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4A154B;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #eee;
    }
    .expiry-notice {
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      color: #856404;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello {{username}},</p>
      <p>We received a request to reset your password. Click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </p>
      <div class="expiry-notice">
        <strong>Note:</strong> This password reset link will expire in {{expiryHours}} hours.
      </div>
      <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account's security.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>For security reasons, please bookmark our official website and always access it directly.</p>
    </div>
  </div>
</body>
</html>`,
  senderName: 'KickDeck Support',
  senderEmail: 'no-reply@kickdeck.xyz',
  variables: ['username', 'resetUrl', 'expiryHours']
};

// Zod schemas for validation
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);
export const selectEmailTemplateSchema = createSelectSchema(emailTemplates);

export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
