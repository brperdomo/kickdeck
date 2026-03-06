/**
 * Check SendGrid Dynamic Templates Configuration
 * 
 * This script checks your SendGrid dynamic templates and database mappings
 * to ensure production emails use your branded templates.
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;

console.log('Checking SendGrid Dynamic Templates');
console.log('===================================');

async function checkSendGridTemplates() {
  if (!apiKey) {
    console.log('Missing SENDGRID_API_KEY');
    return;
  }

  // Step 1: Get all dynamic templates from SendGrid
  console.log('\n=== Step 1: Available SendGrid Templates ===');
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`Error fetching templates: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const templates = data.templates || [];
    
    console.log(`Found ${templates.length} dynamic templates:`);
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (ID: ${template.id})`);
      if (template.versions && template.versions.length > 0) {
        const activeVersion = template.versions.find(v => v.active === 1) || template.versions[0];
        console.log(`   Subject: ${activeVersion.subject || 'No subject'}`);
        console.log(`   Version: ${activeVersion.id} ${activeVersion.active === 1 ? '(Active)' : ''}`);
      }
    });
    
    if (templates.length === 0) {
      console.log('No dynamic templates found. You need to create templates in SendGrid.');
      return;
    }

    // Step 2: Test sending with a dynamic template
    console.log('\n=== Step 2: Testing Dynamic Template Email ===');
    
    // Use the first available template for testing
    const testTemplate = templates[0];
    if (!testTemplate) {
      console.log('No templates available for testing');
      return;
    }
    
    const sgMail = new MailService();
    sgMail.setApiKey(apiKey);
    
    const dynamicEmail = {
      to: 'bperdomo@zoho.com',
      from: 'support@kickdeck.io',
      templateId: testTemplate.id,
      dynamicTemplateData: {
        // Common variables that might be in your templates
        userName: 'Test User',
        teamName: 'Test Team FC',
        eventName: 'Test Tournament',
        confirmationLink: 'https://app.kickdeck.io/test',
        supportEmail: 'support@kickdeck.io',
        currentYear: new Date().getFullYear().toString(),
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      const result = await sgMail.send(dynamicEmail);
      console.log(`✅ Dynamic template email sent successfully`);
      console.log(`   Template: ${testTemplate.name}`);
      console.log(`   Template ID: ${testTemplate.id}`);
      console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
      
    } catch (error) {
      console.log(`❌ Dynamic template email failed`);
      console.log(`   Template: ${testTemplate.name}`);
      console.log(`   Error: ${error.message}`);
      
      if (error.response && error.response.body) {
        console.log(`   Details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
    }

    // Step 3: Show template details for configuration
    console.log('\n=== Step 3: Template Configuration Guide ===');
    console.log('To use these templates in your application:');
    console.log('');
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. Template: ${template.name}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Use for: Password Reset, Registration, etc.`);
      console.log('');
    });

    console.log('Next steps:');
    console.log('1. Map these template IDs to your email types in the database');
    console.log('2. Update your emailService to use dynamic templates');
    console.log('3. Test each email flow with the proper template');

  } catch (error) {
    console.log(`Error checking templates: ${error.message}`);
  }
}

checkSendGridTemplates();