/**
 * Set up Welcome Email Template with SendGrid
 * 
 * This script updates the welcome email template to use the SendGrid provider
 * and the same sender email as the password reset template.
 */

import { db } from './db/index.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function setupWelcomeEmailTemplate() {
  try {
    console.log('Setting up welcome email templates with SendGrid...');

    // Get SendGrid provider
    const providers = await db
      .select()
      .from({ e: 'email_providers' })
      .where(eq('e.type', 'sendgrid'))
      .limit(1);

    if (!providers || providers.length === 0) {
      console.error('ERROR: SendGrid provider not found in the database');
      console.log('Please run setup-sendgrid-provider.js first to set up the SendGrid provider');
      process.exit(1);
    }

    const sendgridProvider = providers[0];
    console.log(`Using SendGrid provider: ${sendgridProvider.name} (ID: ${sendgridProvider.id})`);

    // Update welcome email template
    await setupEmailRouting('welcome', sendgridProvider.id);
    console.log('Updated member welcome email template');

    // Update admin welcome email template
    await setupEmailRouting('admin_welcome', sendgridProvider.id);
    console.log('Updated admin welcome email template');

    console.log('\nWelcome email templates are now configured to use SendGrid!');
    console.log('NEXT STEPS:');
    console.log('1. Create dynamic templates in SendGrid for both types of welcome emails');
    console.log('2. Go to the admin panel and map SendGrid templates to email types');
    console.log('3. Test the templates using the test-both-welcome-emails.js script');

    process.exit(0);
  } catch (error) {
    console.error('Error setting up welcome email template:', error);
    process.exit(1);
  }
}

async function setupEmailRouting(templateType, providerId) {
  try {
    // Get template
    const templates = await db
      .select()
      .from({ t: 'email_templates' })
      .where(eq('t.type', templateType))
      .limit(1);

    if (templates && templates.length > 0) {
      const template = templates[0];

      // Get current routing (if any)
      const routings = await db
        .select()
        .from({ r: 'email_template_routings' })
        .where(eq('r.templateId', template.id))
        .limit(1);

      if (routings && routings.length > 0) {
        // Update existing routing
        const routing = routings[0];

        await db
          .update({ r: 'email_template_routings' })
          .set({
            providerId,
            isActive: true,
            updatedAt: new Date().toISOString()
          })
          .where(eq('r.id', routing.id));

        console.log(`Updated existing routing for ${templateType} email template`);
      } else {
        // Create new routing
        await db
          .insert({ r: 'email_template_routings' })
          .values({
            templateId: template.id,
            providerId,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

        console.log(`Created new routing for ${templateType} email template`);
      }
    } else {
      console.error(`WARNING: ${templateType} email template not found`);
    }
  } catch (error) {
    console.error(`Error setting up ${templateType} email routing:`, error);
    throw error;
  }
}

setupWelcomeEmailTemplate();