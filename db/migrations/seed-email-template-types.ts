import { sql } from 'drizzle-orm';
import { db } from '../index';

// ── Real HTML content for templates that render locally (no Brevo dynamic template mapped) ──

const PASSWORD_RESET_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A154B; padding: 20px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; background-color: #4A154B; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 4px; margin-top: 20px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .token-box { background-color: #eee; padding: 10px; border-radius: 4px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 13px; }
    .expiry-notice { background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <p>Hello {{username}},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <p style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste the following URL into your browser:</p>
      <div class="token-box">{{resetUrl}}</div>
      <div class="expiry-notice">
        <strong>Note:</strong> This link will expire in {{expiryHours}} hours.
      </div>
      <p>Thank you,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message from KickDeck. Please do not reply to this email.</p>
      <p>If you need help, contact us at <a href="mailto:support@kickdeck.xyz">support@kickdeck.xyz</a></p>
    </div>
  </div>
</body>
</html>`;

const WELCOME_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to KickDeck</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2C5282; padding: 20px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to KickDeck!</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>Welcome to KickDeck! We're excited to have you join our sports management platform.</p>
      <p>Your account has been successfully created with the following information:</p>
      <ul>
        <li><strong>Username:</strong> {{username}}</li>
        <li><strong>Email:</strong> {{email}}</li>
      </ul>
      <p>With your KickDeck account, you can:</p>
      <ul>
        <li>Register teams for tournaments</li>
        <li>Manage player information</li>
        <li>Track your tournament schedules</li>
      </ul>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Thank you,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to {{email}}. If you did not create an account, please contact us at <a href="mailto:support@kickdeck.xyz">support@kickdeck.xyz</a></p>
    </div>
  </div>
</body>
</html>`;

const PLACEHOLDER_HTML = '<p>{{content}}</p>';

/**
 * Migration to ensure all standard email template types exist.
 * Uses raw SQL to avoid Drizzle schema mismatches between
 * db/schema.ts and db/schema/emailTemplates.ts.
 */
export async function seedEmailTemplateTypes() {
  console.log('Ensuring all standard email template types exist...');

  // Account-related templates use support@kickdeck.xyz; all others use no-reply@kickdeck.xyz
  // Both are verified senders in Brevo
  const SUPPORT_EMAIL = 'support@kickdeck.xyz';
  const NOREPLY_EMAIL = 'no-reply@kickdeck.xyz';

  const standardTemplates = [
    { name: 'Welcome Email', type: 'welcome', subject: 'Welcome to KickDeck!', description: 'Sent when a new user registers', senderEmail: SUPPORT_EMAIL, content: WELCOME_HTML },
    { name: 'Admin Welcome', type: 'admin_welcome', subject: 'Welcome to KickDeck Admin', description: 'Sent when a new admin is invited', senderEmail: SUPPORT_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Password Reset', type: 'password_reset', subject: 'Reset Your Password', description: 'Sent when a user requests a password reset', senderEmail: SUPPORT_EMAIL, content: PASSWORD_RESET_HTML },
    { name: 'Registration Confirmation', type: 'registration_confirmation', subject: 'Registration Received', description: 'Sent when a team submits registration (setup intent flow)', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Registration Receipt', type: 'registration_receipt', subject: 'Registration Confirmation', description: 'Sent after a team registers for an event', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Registration Under Review', type: 'registration_under_review', subject: 'Registration Under Review', description: 'Sent when a registration is pending review', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Payment Confirmation', type: 'payment_confirmation', subject: 'Payment Received', description: 'Sent after a successful payment', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Payment Completion Notification', type: 'payment_completion_notification', subject: 'Payment Complete', description: 'Sent when full payment is completed', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Payment Refunded', type: 'payment_refunded', subject: 'Payment Refunded', description: 'Sent when a payment is refunded', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Team Approved', type: 'team_approved', subject: 'Team Approved', description: 'Sent when a team registration is approved', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Team Approved With Payment', type: 'team_approved_with_payment', subject: 'Team Approved — Payment Required', description: 'Sent when a team is approved and payment is needed', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Team Rejected', type: 'team_rejected', subject: 'Registration Update', description: 'Sent when a team registration is rejected', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Team Waitlisted', type: 'team_waitlisted', subject: 'Team Waitlisted', description: 'Sent when a team is placed on a waitlist', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Team Withdrawn', type: 'team_withdrawn', subject: 'Team Withdrawn', description: 'Sent when a team registration is withdrawn', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Team Status Update', type: 'team_status_update', subject: 'Team Status Update', description: 'General team status change notification', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
    { name: 'Newsletter Confirmation', type: 'newsletter_confirmation', subject: 'Newsletter Subscription Confirmed', description: 'Sent when a user subscribes to the newsletter', senderEmail: NOREPLY_EMAIL, content: PLACEHOLDER_HTML },
  ];

  try {
    let insertedCount = 0;

    for (const tmpl of standardTemplates) {
      // Check if this type already exists
      const existing = await db.execute(sql`
        SELECT id FROM email_templates WHERE type = ${tmpl.type} LIMIT 1
      `);

      if (!existing.rowCount || existing.rowCount === 0) {
        await db.execute(sql`
          INSERT INTO email_templates (name, type, subject, description, content, sender_name, sender_email, is_active, created_at, updated_at)
          VALUES (${tmpl.name}, ${tmpl.type}, ${tmpl.subject}, ${tmpl.description}, ${tmpl.content}, 'KickDeck', ${tmpl.senderEmail}, true, NOW(), NOW())
        `);
        insertedCount++;
        console.log(`  Inserted email template type: ${tmpl.type}`);
      }
    }

    if (insertedCount > 0) {
      console.log(`Seeded ${insertedCount} new email template types`);
    } else {
      console.log('All standard email template types already exist');
    }

    // ── Fix templates with placeholder content ──────────────────────────
    // If the password_reset or welcome templates still have the generic placeholder,
    // overwrite them with the real HTML so local rendering works properly.
    const TEMPLATES_WITH_REAL_CONTENT: Record<string, string> = {
      password_reset: PASSWORD_RESET_HTML,
      welcome: WELCOME_HTML,
    };

    for (const [type, html] of Object.entries(TEMPLATES_WITH_REAL_CONTENT)) {
      const result = await db.execute(sql`
        UPDATE email_templates
        SET content = ${html}, updated_at = NOW()
        WHERE type = ${type}
          AND (content = '<p>{{content}}</p>' OR content IS NULL OR content = '')
      `);
      if (result.rowCount && result.rowCount > 0) {
        console.log(`  Updated ${type} template with real HTML content`);
      }
    }

    // ── Ensure correct verified Brevo senders ───────────────────────────
    const fixSupport = await db.execute(sql`
      UPDATE email_templates
      SET sender_email = 'support@kickdeck.xyz'
      WHERE type IN ('welcome', 'admin_welcome', 'password_reset')
        AND sender_email != 'support@kickdeck.xyz'
    `);
    if (fixSupport.rowCount && fixSupport.rowCount > 0) {
      console.log(`  Updated ${fixSupport.rowCount} account templates to use support@kickdeck.xyz`);
    }

    const fixNoreply = await db.execute(sql`
      UPDATE email_templates
      SET sender_email = 'no-reply@kickdeck.xyz'
      WHERE type NOT IN ('welcome', 'admin_welcome', 'password_reset')
        AND sender_email != 'no-reply@kickdeck.xyz'
    `);
    if (fixNoreply.rowCount && fixNoreply.rowCount > 0) {
      console.log(`  Updated ${fixNoreply.rowCount} event templates to use no-reply@kickdeck.xyz`);
    }
  } catch (error) {
    console.error('Error seeding email template types:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedEmailTemplateTypes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
