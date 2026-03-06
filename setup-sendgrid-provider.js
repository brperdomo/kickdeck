/**
 * Set up SendGrid as Primary Email Provider
 * 
 * This script creates or updates the email provider settings in the database
 * to make SendGrid the primary and only email provider.
 */

import { db } from './server/db/index.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function setupSendGridProvider() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('ERROR: SENDGRID_API_KEY is not set in environment variables');
      console.log('Please set SENDGRID_API_KEY in your .env file and try again');
      process.exit(1);
    }

    console.log('Setting up SendGrid as the primary email provider...');

    // Check if SendGrid provider already exists
    const providers = await db
      .select()
      .from(db.schema.emailProviders)
      .where(eq(db.schema.emailProviders.type, 'sendgrid'))
      .limit(1);

    const senderEmail = 'noreply@kickdeck.io'; // Replace with your verified sender
    const senderName = 'KickDeck'; // Replace with your organization name

    if (providers && providers.length > 0) {
      // Update existing SendGrid provider
      const [provider] = providers;

      await db
        .update(db.schema.emailProviders)
        .set({
          isActive: true,
          senderEmail,
          senderName,
          updatedAt: new Date().toISOString()
        })
        .where(eq(db.schema.emailProviders.id, provider.id));

      console.log('Updated existing SendGrid provider configuration');
    } else {
      // Create new SendGrid provider
      await db
        .insert(db.schema.emailProviders)
        .values({
          type: 'sendgrid',
          name: 'SendGrid',
          isActive: true,
          senderEmail,
          senderName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      console.log('Created new SendGrid provider configuration');
    }

    // Disable all other email providers
    await db
      .update(db.schema.emailProviders)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(db.schema.emailProviders.type, 'smtp'));

    console.log('SendGrid is now set as the primary email provider');
    console.log(`Sender Email: ${senderEmail}`);
    console.log(`Sender Name: ${senderName}`);
    console.log('\nIMPORTANT: Make sure to verify this sender in your SendGrid account!');

    process.exit(0);
  } catch (error) {
    console.error('Error setting up SendGrid provider:', error);
    process.exit(1);
  }
}

setupSendGridProvider();