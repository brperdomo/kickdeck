/**
 * Enhanced Form Templates Migration
 * 
 * This script adds the enhanced form template system with:
 * - Event assignment capabilities
 * - Template versioning and audit trails
 * - Auto-generated field IDs
 * - Team usage tracking
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(sql);

async function migrateEnhancedFormTemplates() {
  console.log('🔄 MIGRATING ENHANCED FORM TEMPLATES SYSTEM');
  console.log('=============================================');
  
  try {
    console.log('\n1. Adding new columns to event_form_templates...');
    
    // Add new columns to eventFormTemplates table
    await sql`
      ALTER TABLE event_form_templates 
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)
    `;
    console.log('✅ Enhanced event_form_templates table');

    console.log('\n2. Adding field_id column to form_fields...');
    
    // Add fieldId column to formFields table
    await sql`
      ALTER TABLE form_fields 
      ADD COLUMN IF NOT EXISTS field_id TEXT
    `;
    
    // Generate field IDs for existing records
    const existingFields = await sql`
      SELECT id, label FROM form_fields WHERE field_id IS NULL
    `;
    
    for (const field of existingFields) {
      const fieldId = field.label.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
      
      await sql`
        UPDATE form_fields 
        SET field_id = ${fieldId} 
        WHERE id = ${field.id}
      `;
    }
    
    // Make field_id required now that all records have values
    await sql`
      ALTER TABLE form_fields 
      ALTER COLUMN field_id SET NOT NULL
    `;
    console.log(`✅ Added field_id to ${existingFields.length} existing fields`);

    console.log('\n3. Adding template_version to form_responses...');
    
    // Add templateVersion to formResponses
    await sql`
      ALTER TABLE form_responses 
      ADD COLUMN IF NOT EXISTS template_version INTEGER DEFAULT 1 NOT NULL
    `;
    console.log('✅ Enhanced form_responses table');

    console.log('\n4. Creating template_audit_log table...');
    
    // Create templateAuditLog table
    await sql`
      CREATE TABLE IF NOT EXISTS template_audit_log (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES event_form_templates(id),
        action TEXT NOT NULL,
        change_details JSONB,
        affected_team_count INTEGER DEFAULT 0,
        performed_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created template_audit_log table');

    console.log('\n5. Creating team_template_usage table...');
    
    // Create teamTemplateUsage table
    await sql`
      CREATE TABLE IF NOT EXISTS team_template_usage (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id),
        template_id INTEGER NOT NULL REFERENCES event_form_templates(id),
        template_version INTEGER NOT NULL,
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created team_template_usage table');

    console.log('\n6. Creating indexes for performance...');
    
    // Create useful indexes (one at a time)
    await sql`CREATE INDEX IF NOT EXISTS idx_form_fields_field_id ON form_fields(field_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_form_responses_template_version ON form_responses(template_version)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_template_audit_log_template_id ON template_audit_log(template_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_team_template_usage_team_id ON team_template_usage(team_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_event_form_templates_event_active ON event_form_templates(event_id, is_active)`;
    
    console.log('✅ Created performance indexes');

    console.log('\n7. Migrating existing data...');
    
    // Create audit logs for existing templates
    const existingTemplates = await sql`
      SELECT id, name, event_id, created_at FROM event_form_templates
    `;
    
    // Get a default admin user for audit logs
    const [adminUser] = await sql`
      SELECT id FROM users WHERE "isAdmin" = true LIMIT 1
    `;
    
    if (adminUser && existingTemplates.length > 0) {
      for (const template of existingTemplates) {
        await sql`
          INSERT INTO template_audit_log (template_id, action, change_details, performed_by)
          VALUES (${template.id}, 'migrated', ${JSON.stringify({
            templateName: template.name,
            eventId: template.event_id,
            note: 'Template migrated from old system'
          })}, ${adminUser.id})
        `;
      }
      console.log(`✅ Created audit logs for ${existingTemplates.length} existing templates`);
    }

    console.log('\n8. Verifying migration...');
    
    // Verify the migration
    const tableChecks = await sql`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = 'event_form_templates' AND column_name = 'version') as template_version,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = 'form_fields' AND column_name = 'field_id') as field_id,
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_name = 'template_audit_log') as audit_table,
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_name = 'team_template_usage') as usage_table
    `;
    
    const check = tableChecks[0];
    if (check.template_version > 0 && check.field_id > 0 && check.audit_table > 0 && check.usage_table > 0) {
      console.log('✅ All migration components verified successfully');
    } else {
      console.log('❌ Migration verification failed');
      return false;
    }

    console.log('\n🎉 ENHANCED FORM TEMPLATES MIGRATION COMPLETE!');
    console.log('\n📋 New Features Available:');
    console.log('• Template versioning and audit trails');
    console.log('• Auto-generated field IDs from labels');
    console.log('• Event-specific template assignment');
    console.log('• Team usage tracking by template version');
    console.log('• Comprehensive change logging');

    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  } finally {
    await sql.end();
  }
}

migrateEnhancedFormTemplates()
  .then(success => {
    if (success) {
      console.log('\n✅ Enhanced form templates system ready for use!');
      process.exit(0);
    } else {
      console.log('\n❌ Migration failed. Please check the logs.');
      process.exit(1);
    }
  })
  .catch(console.error);