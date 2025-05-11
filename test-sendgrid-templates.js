/**
 * Test SendGrid Templates API Access
 * 
 * This script tests if we can fetch templates from the SendGrid API
 * to verify full API access with the new key.
 */

import fetch from 'node-fetch';

async function getTemplates() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not set');
      process.exit(1);
    }
    
    console.log('Fetching dynamic templates from SendGrid...');
    
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Successfully fetched templates!');
    console.log(`Found ${data.templates ? data.templates.length : 0} dynamic templates.`);
    
    // Print details of first few templates if any exist
    if (data.templates && data.templates.length > 0) {
      console.log('\nTemplate details (up to first 3):');
      const templates = data.templates.slice(0, 3);
      templates.forEach((template, index) => {
        console.log(`\nTemplate ${index + 1}:`);
        console.log(`- ID: ${template.id}`);
        console.log(`- Name: ${template.name}`);
        console.log(`- Generation: ${template.generation}`);
        console.log(`- Updated: ${template.updated_at}`);
      });
    } else {
      console.log('\nNo templates found. You may need to create some in your SendGrid account.');
    }
    
  } catch (error) {
    console.error('❌ Error testing SendGrid templates:', error);
    process.exit(1);
  }
}

getTemplates().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});