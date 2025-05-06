/**
 * Set up Welcome Email Template with SendGrid
 * 
 * This script updates the welcome email template to use the SendGrid provider
 * and the same sender email as the password reset template.
 */

import { db } from './server/db/index.js';
import { emailTemplates, emailProviderSettings, emailTemplateRouting } from './server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';

config(); // Load environment variables

// Standard sender information
const SENDER_NAME = 'MatchPro';
const SENDER_EMAIL = 'support@matchpro.ai';

async function setupWelcomeEmailTemplate() {
  console.log('Setting up welcome email templates with SendGrid provider...');
  
  try {
    // Find the SendGrid provider
    console.log('Looking for SendGrid provider...');
    const [sendGridProvider] = await db
      .select()
      .from(emailProviderSettings)
      .where(
        eq(emailProviderSettings.providerType, 'sendgrid')
      );
    
    if (!sendGridProvider) {
      console.error('SendGrid provider not found!');
      console.log('Creating SendGrid provider...');
      
      // Create the SendGrid provider if it doesn't exist
      const [newProvider] = await db
        .insert(emailProviderSettings)
        .values({
          providerType: 'sendgrid',
          providerName: 'SendGrid',
          isActive: true,
          isDefault: true,
          settings: {
            from: SENDER_EMAIL,
            apiKey: process.env.SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log('SendGrid provider created:', newProvider.id);
      
      // Use the newly created provider
      sendGridProvider = newProvider;
    } else {
      console.log('Found SendGrid provider:', sendGridProvider.id);
    }
    
    // Check if welcome email template exists
    console.log('Checking for welcome email template...');
    const [welcomeTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'welcome'));
    
    if (welcomeTemplate) {
      console.log('Found welcome email template:', welcomeTemplate.id);
      
      // Update the template with the correct sender and provider
      console.log('Updating welcome email template...');
      await db
        .update(emailTemplates)
        .set({
          senderEmail: SENDER_EMAIL,
          senderName: SENDER_NAME,
          providerId: sendGridProvider.id,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, welcomeTemplate.id));
      
      console.log('Welcome email template updated successfully!');
    } else {
      console.error('Welcome email template not found!');
    }
    
    // Check if admin welcome email template exists
    console.log('Checking for admin welcome email template...');
    const [adminWelcomeTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'admin_welcome'));
    
    if (adminWelcomeTemplate) {
      console.log('Found admin welcome email template:', adminWelcomeTemplate.id);
      
      // Update the template with the correct sender and provider
      console.log('Updating admin welcome email template...');
      await db
        .update(emailTemplates)
        .set({
          senderEmail: SENDER_EMAIL,
          senderName: SENDER_NAME,
          providerId: sendGridProvider.id,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, adminWelcomeTemplate.id));
      
      console.log('Admin welcome email template updated successfully!');
    } else {
      console.log('Admin welcome email template not found.');
    }
    
    // Set up routing for welcome email templates
    await setupEmailRouting('welcome', sendGridProvider.id);
    await setupEmailRouting('admin_welcome', sendGridProvider.id);
    
    console.log('Email template setup completed successfully!');
  } catch (error) {
    console.error('Error setting up welcome email template:', error);
  }
}

async function setupEmailRouting(templateType, providerId) {
  console.log(`Setting up routing for ${templateType} template...`);
  
  try {
    // Check if routing already exists
    const [existingRouting] = await db
      .select()
      .from(emailTemplateRouting)
      .where(eq(emailTemplateRouting.templateType, templateType));
    
    if (existingRouting) {
      console.log(`Found existing routing for ${templateType}:`, existingRouting.id);
      
      // Update the routing
      await db
        .update(emailTemplateRouting)
        .set({
          providerId: providerId,
          fromEmail: SENDER_EMAIL,
          fromName: SENDER_NAME,
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(emailTemplateRouting.id, existingRouting.id));
      
      console.log(`Routing for ${templateType} updated successfully!`);
    } else {
      console.log(`No routing found for ${templateType}, creating one...`);
      
      // Create new routing
      const [newRouting] = await db
        .insert(emailTemplateRouting)
        .values({
          templateType: templateType,
          providerId: providerId,
          fromEmail: SENDER_EMAIL,
          fromName: SENDER_NAME,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log(`Routing for ${templateType} created successfully!`, newRouting.id);
    }
  } catch (error) {
    console.error(`Error setting up routing for ${templateType}:`, error);
  }
}

// Run the setup function
setupWelcomeEmailTemplate();