import { sql } from 'drizzle-orm';
import { db } from '../index';

/**
 * Migration to add missing columns to email_templates table:
 * - brevo_template_id: maps a KickDeck email type to a Brevo dynamic template
 * - text_content: plain text version for better deliverability
 */
export async function addBrevoFieldsToEmailTemplates() {
  console.log('Starting migration to add brevo_template_id and text_content to email_templates...');

  try {
    // Check for brevo_template_id
    const brevoCol = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'email_templates' AND column_name = 'brevo_template_id';
    `);

    if (!brevoCol.rowCount || brevoCol.rowCount === 0) {
      await db.execute(sql`
        ALTER TABLE email_templates
        ADD COLUMN IF NOT EXISTS brevo_template_id TEXT;
      `);
      console.log('brevo_template_id column added to email_templates');
    } else {
      console.log('brevo_template_id column already exists');
    }

    // Check for text_content
    const textCol = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'email_templates' AND column_name = 'text_content';
    `);

    if (!textCol.rowCount || textCol.rowCount === 0) {
      await db.execute(sql`
        ALTER TABLE email_templates
        ADD COLUMN IF NOT EXISTS text_content TEXT;
      `);
      console.log('text_content column added to email_templates');
    } else {
      console.log('text_content column already exists');
    }

    console.log('Migration complete: brevo fields added to email_templates');
  } catch (error) {
    console.error('Error adding brevo fields to email_templates:', error);
    throw error;
  }
}

// Execute migration if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addBrevoFieldsToEmailTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
