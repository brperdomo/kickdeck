import { sql } from 'drizzle-orm';
import { db } from '../index';

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
    { name: 'Welcome Email', type: 'welcome', subject: 'Welcome to KickDeck!', description: 'Sent when a new user registers', senderEmail: SUPPORT_EMAIL },
    { name: 'Admin Welcome', type: 'admin_welcome', subject: 'Welcome to KickDeck Admin', description: 'Sent when a new admin is invited', senderEmail: SUPPORT_EMAIL },
    { name: 'Password Reset', type: 'password_reset', subject: 'Reset Your Password', description: 'Sent when a user requests a password reset', senderEmail: SUPPORT_EMAIL },
    { name: 'Registration Confirmation', type: 'registration_confirmation', subject: 'Registration Received', description: 'Sent when a team submits registration (setup intent flow)', senderEmail: NOREPLY_EMAIL },
    { name: 'Registration Receipt', type: 'registration_receipt', subject: 'Registration Confirmation', description: 'Sent after a team registers for an event', senderEmail: NOREPLY_EMAIL },
    { name: 'Registration Under Review', type: 'registration_under_review', subject: 'Registration Under Review', description: 'Sent when a registration is pending review', senderEmail: NOREPLY_EMAIL },
    { name: 'Payment Confirmation', type: 'payment_confirmation', subject: 'Payment Received', description: 'Sent after a successful payment', senderEmail: NOREPLY_EMAIL },
    { name: 'Payment Completion Notification', type: 'payment_completion_notification', subject: 'Payment Complete', description: 'Sent when full payment is completed', senderEmail: NOREPLY_EMAIL },
    { name: 'Payment Refunded', type: 'payment_refunded', subject: 'Payment Refunded', description: 'Sent when a payment is refunded', senderEmail: NOREPLY_EMAIL },
    { name: 'Team Approved', type: 'team_approved', subject: 'Team Approved', description: 'Sent when a team registration is approved', senderEmail: NOREPLY_EMAIL },
    { name: 'Team Approved With Payment', type: 'team_approved_with_payment', subject: 'Team Approved — Payment Required', description: 'Sent when a team is approved and payment is needed', senderEmail: NOREPLY_EMAIL },
    { name: 'Team Rejected', type: 'team_rejected', subject: 'Registration Update', description: 'Sent when a team registration is rejected', senderEmail: NOREPLY_EMAIL },
    { name: 'Team Waitlisted', type: 'team_waitlisted', subject: 'Team Waitlisted', description: 'Sent when a team is placed on a waitlist', senderEmail: NOREPLY_EMAIL },
    { name: 'Team Withdrawn', type: 'team_withdrawn', subject: 'Team Withdrawn', description: 'Sent when a team registration is withdrawn', senderEmail: NOREPLY_EMAIL },
    { name: 'Team Status Update', type: 'team_status_update', subject: 'Team Status Update', description: 'General team status change notification', senderEmail: NOREPLY_EMAIL },
    { name: 'Newsletter Confirmation', type: 'newsletter_confirmation', subject: 'Newsletter Subscription Confirmed', description: 'Sent when a user subscribes to the newsletter', senderEmail: NOREPLY_EMAIL },
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
          VALUES (${tmpl.name}, ${tmpl.type}, ${tmpl.subject}, ${tmpl.description}, '<p>{{content}}</p>', 'KickDeck', ${tmpl.senderEmail}, true, NOW(), NOW())
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

    // Ensure all templates use the correct verified Brevo sender
    // Account templates (welcome, admin_welcome, password_reset) → support@kickdeck.xyz
    // All other templates → no-reply@kickdeck.xyz
    const accountTypes = ['welcome', 'admin_welcome', 'password_reset'];
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
