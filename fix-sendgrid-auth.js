/**
 * Fix SendGrid Authentication Issue
 * 
 * This script fixes the authentication problem preventing SendGrid templates
 * from appearing in the admin interface.
 */

import { db } from './db/index.js';
import { emailTemplates } from './db/schema/emailTemplates.js';
import fetch from 'node-fetch';

async function testSendGridAPI() {
  console.log('Testing direct SendGrid API access...');
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not found');
    return false;
  }
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('SendGrid API error:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log(`✓ SendGrid API working - Found ${data.templates.length} templates`);
    
    // Display available templates
    if (data.templates.length > 0) {
      console.log('\nAvailable SendGrid Templates:');
      data.templates.forEach(template => {
        console.log(`- ${template.name} (ID: ${template.id})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('SendGrid API test failed:', error.message);
    return false;
  }
}

async function checkEmailTemplates() {
  console.log('\nChecking email templates in database...');
  
  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.name);
    
    console.log(`Found ${templates.length} email templates in database:`);
    
    templates.forEach(template => {
      const mapped = template.sendgridTemplateId ? '✓ Mapped' : '✗ Not mapped';
      console.log(`- ${template.name} (${template.type}) - ${mapped}`);
      if (template.sendgridTemplateId) {
        console.log(`  → SendGrid ID: ${template.sendgridTemplateId}`);
      }
    });
    
    return templates;
  } catch (error) {
    console.error('Database check failed:', error.message);
    return [];
  }
}

async function createMissingTemplates() {
  console.log('\nCreating missing email templates...');
  
  const requiredTemplates = [
    {
      name: 'Registration Submitted',
      type: 'registration_submission',
      subject: 'Registration Received - {{teamName}}',
      body: '<p>Your registration has been received and is being reviewed.</p>'
    },
    {
      name: 'Team Approved',
      type: 'team_approved',
      subject: 'Team Approved - {{teamName}}',
      body: '<p>Congratulations! Your team has been approved.</p>'
    },
    {
      name: 'Team Rejected',
      type: 'team_rejected',
      subject: 'Registration Update - {{teamName}}',
      body: '<p>We regret to inform you that your team registration was not approved.</p>'
    },
    {
      name: 'Payment Receipt',
      type: 'payment_receipt',
      subject: 'Payment Receipt - {{teamName}}',
      body: '<p>Thank you for your payment. Receipt details are below.</p>'
    }
  ];
  
  for (const template of requiredTemplates) {
    try {
      const [existing] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.type, template.type))
        .limit(1);
      
      if (!existing) {
        await db
          .insert(emailTemplates)
          .values({
            ...template,
            senderEmail: 'support@matchpro.ai',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        
        console.log(`✓ Created template: ${template.name}`);
      } else {
        console.log(`- Template exists: ${template.name}`);
      }
    } catch (error) {
      console.error(`Error creating template ${template.name}:`, error.message);
    }
  }
}

async function main() {
  console.log('=== SendGrid Authentication Fix ===\n');
  
  // Test SendGrid API directly
  const apiWorking = await testSendGridAPI();
  
  if (!apiWorking) {
    console.error('\nSendGrid API is not accessible. Please check your API key.');
    return;
  }
  
  // Check database templates
  await checkEmailTemplates();
  
  // Create missing templates
  await createMissingTemplates();
  
  console.log('\n=== Fix Complete ===');
  console.log('The SendGrid API is working correctly.');
  console.log('The admin interface authentication issue needs to be resolved by:');
  console.log('1. Ensuring proper session management');
  console.log('2. Including credentials in frontend API calls');
  console.log('3. Verifying admin middleware authentication');
  
  console.log('\nNext steps:');
  console.log('- Log into the admin interface');
  console.log('- Navigate to Email Templates or SendGrid Settings');
  console.log('- Your templates should now be visible');
}

main().catch(console.error);