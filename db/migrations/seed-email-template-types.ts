import { sql } from 'drizzle-orm';
import { db } from '../index';

/**
 * Migration to ensure all standard email template types exist.
 * Uses raw SQL to avoid Drizzle schema mismatches between
 * db/schema.ts and db/schema/emailTemplates.ts.
 */
export async function seedEmailTemplateTypes() {
  console.log('Ensuring all standard email template types exist...');

  const standardTemplates = [
    { name: 'Welcome Email', type: 'welcome', subject: 'Welcome to KickDeck!', description: 'Sent when a new user registers' },
    { name: 'Admin Welcome', type: 'admin_welcome', subject: 'Welcome to KickDeck Admin', description: 'Sent when a new admin is invited' },
    { name: 'Password Reset', type: 'password_reset', subject: 'Reset Your Password', description: 'Sent when a user requests a password reset' },
    { name: 'Registration Confirmation', type: 'registration_confirmation', subject: 'Registration Received', description: 'Sent when a team submits registration (setup intent flow)' },
    { name: 'Registration Receipt', type: 'registration_receipt', subject: 'Registration Confirmation', description: 'Sent after a team registers for an event' },
    { name: 'Registration Under Review', type: 'registration_under_review', subject: 'Registration Under Review', description: 'Sent when a registration is pending review' },
    { name: 'Payment Confirmation', type: 'payment_confirmation', subject: 'Payment Received', description: 'Sent after a successful payment' },
    { name: 'Payment Completion Notification', type: 'payment_completion_notification', subject: 'Payment Complete', description: 'Sent when full payment is completed' },
    { name: 'Payment Refunded', type: 'payment_refunded', subject: 'Payment Refunded', description: 'Sent when a payment is refunded' },
    { name: 'Team Approved', type: 'team_approved', subject: 'Team Approved', description: 'Sent when a team registration is approved' },
    { name: 'Team Approved With Payment', type: 'team_approved_with_payment', subject: 'Team Approved — Payment Required', description: 'Sent when a team is approved and payment is needed' },
    { name: 'Team Rejected', type: 'team_rejected', subject: 'Registration Update', description: 'Sent when a team registration is rejected' },
    { name: 'Team Waitlisted', type: 'team_waitlisted', subject: 'Team Waitlisted', description: 'Sent when a team is placed on a waitlist' },
    { name: 'Team Withdrawn', type: 'team_withdrawn', subject: 'Team Withdrawn', description: 'Sent when a team registration is withdrawn' },
    { name: 'Team Status Update', type: 'team_status_update', subject: 'Team Status Update', description: 'General team status change notification' },
    { name: 'Newsletter Confirmation', type: 'newsletter_confirmation', subject: 'Newsletter Subscription Confirmed', description: 'Sent when a user subscribes to the newsletter' },
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
          VALUES (${tmpl.name}, ${tmpl.type}, ${tmpl.subject}, ${tmpl.description}, '<p>{{content}}</p>', 'KickDeck', 'no-reply@kickdeck.xyz', true, NOW(), NOW())
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

    // Fix any templates that have unverified sender emails — the verified sender in Brevo is no-reply@kickdeck.xyz
    const fixResult = await db.execute(sql`
      UPDATE email_templates
      SET sender_email = 'no-reply@kickdeck.xyz'
      WHERE sender_email NOT IN ('no-reply@kickdeck.xyz')
    `);
    if (fixResult.rowCount && fixResult.rowCount > 0) {
      console.log(`  Updated ${fixResult.rowCount} templates sender_email to verified address no-reply@kickdeck.xyz`);
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
