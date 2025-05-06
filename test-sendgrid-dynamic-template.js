/**
 * Test SendGrid Dynamic Template Integration
 * 
 * This script tests sending an email using a SendGrid dynamic template.
 * It demonstrates how to store and use SendGrid template IDs with the
 * email template system.
 * 
 * Usage:
 *   node test-sendgrid-dynamic-template.js your-email@example.com d-your-template-id
 */

import { db } from './server/db/index.js';
import { emailTemplates } from './server/db/schema/emailTemplates.js';
import { eq } from 'drizzle-orm';
import * as sendgridService from './server/services/sendgridService.js';
import { sendTemplatedEmail } from './server/services/emailService.js';

async function testSendgridDynamicTemplate() {
  try {
    // Get the test email address and template ID from command line arguments
    const testEmail = process.argv[2];
    const templateId = process.argv[3];
    
    if (!testEmail) {
      console.error('Error: Test email address is required');
      console.log('Usage: node test-sendgrid-dynamic-template.js your-email@example.com [d-your-template-id]');
      process.exit(1);
    }
    
    console.log('\n==== SendGrid Dynamic Template Test ====\n');
    
    // If template ID is provided directly, use it for direct testing
    if (templateId) {
      console.log(`Testing with provided template ID: ${templateId}`);
      console.log(`Sending test email to: ${testEmail}\n`);
      
      // Sample data for testing - adjust based on your template's expected variables
      const sampleData = {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        role: 'Test Admin',
        teamName: 'Test Team',
        eventName: 'Test Event',
        loginUrl: 'https://matchpro.ai/login'
      };
      
      // Test the template directly
      const success = await sendgridService.testDynamicTemplate(testEmail, templateId, sampleData);
      
      if (success) {
        console.log('\n✅ Direct SendGrid template test successful!');
        console.log('Check your inbox for the test email.');
      } else {
        console.error('\n❌ Direct SendGrid template test failed.');
      }
    } else {
      // If no template ID provided, set one up in the database and test through the normal flow
      console.log('No template ID provided, setting up template in database...');
      
      // First, get the welcome email template
      const [welcomeTemplate] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.type, 'welcome'));
      
      if (!welcomeTemplate) {
        console.error('Welcome email template not found in the database.');
        process.exit(1);
      }
      
      console.log('Found welcome email template:', welcomeTemplate.name);
      
      // Example SendGrid template ID (usually starts with 'd-')
      const exampleTemplateId = 'd-example-template-id-from-sendgrid';
      
      // Update the template with a dummy SendGrid template ID
      console.log('Enter a SendGrid dynamic template ID when prompted, or press enter to use a placeholder');
      
      // Update the welcome template with the SendGrid template ID
      await db
        .update(emailTemplates)
        .set({
          sendgrid_template_id: exampleTemplateId,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, welcomeTemplate.id));
      
      console.log(`Updated welcome email template with SendGrid template ID: ${exampleTemplateId}`);
      
      // Now test sending using the normal email service
      console.log('\nTesting sending welcome email with updated template...');
      console.log('Note: This will use the test SendGrid template ID. In production, replace with your actual template ID.');
      
      // Sample data for testing
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        loginUrl: 'https://matchpro.ai/login'
      };
      
      try {
        await sendTemplatedEmail(testEmail, 'welcome', userData);
        console.log('\n✅ SendGrid template test through email service successful!');
        console.log('Check your inbox for the welcome email.');
      } catch (error) {
        console.error('\n❌ SendGrid template test through email service failed:', error);
      }
    }
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    process.exit(0);
  }
}

testSendgridDynamicTemplate();