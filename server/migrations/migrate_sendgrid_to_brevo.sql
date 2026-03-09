-- Migration: SendGrid to Brevo email provider migration
-- Date: 2026-03-08
-- Description: Renames SendGrid-specific columns to Brevo equivalents and updates provider type

-- Step 1: Rename sendgrid_template_id column to brevo_template_id in email_templates
ALTER TABLE email_templates RENAME COLUMN sendgrid_template_id TO brevo_template_id;

-- Step 2: Rename sendgrid_message_id column to brevo_message_id in email_tracking
ALTER TABLE email_tracking RENAME COLUMN sendgrid_message_id TO brevo_message_id;

-- Step 3: Update provider type from 'sendgrid' to 'brevo' in email_provider_settings
UPDATE email_provider_settings SET provider_type = 'brevo' WHERE provider_type = 'sendgrid';

-- Step 4: Update provider name for any SendGrid-named providers
UPDATE email_provider_settings SET provider_name = 'Brevo Email Service' WHERE provider_name LIKE '%SendGrid%';
