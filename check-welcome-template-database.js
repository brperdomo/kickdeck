/**
 * Check Welcome Template in Database
 * 
 * This script directly checks the database for welcome email template configuration
 * to see if it exists and is properly configured.
 */

import pkg from 'pg';
const { Client } = pkg;

async function checkWelcomeTemplate() {
  console.log('Checking welcome email template in database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check for welcome email template
    const welcomeQuery = `
      SELECT id, name, type, subject, "isActive", "sendgridTemplateId", "senderEmail", "senderName"
      FROM email_templates 
      WHERE type = 'welcome'
    `;
    
    const welcomeResult = await client.query(welcomeQuery);
    
    if (welcomeResult.rows.length > 0) {
      console.log('✅ Welcome email template found:');
      welcomeResult.rows.forEach(template => {
        console.log(`   ID: ${template.id}`);
        console.log(`   Name: ${template.name}`);
        console.log(`   Subject: ${template.subject}`);
        console.log(`   Active: ${template.isActive}`);
        console.log(`   SendGrid Template ID: ${template.sendgridTemplateId || 'None (local template)'}`);
        console.log(`   Sender: ${template.senderName} <${template.senderEmail}>`);
      });
    } else {
      console.log('❌ Welcome email template not found');
      
      // Check what templates do exist
      const allTemplatesQuery = `
        SELECT type, name, "isActive" 
        FROM email_templates 
        ORDER BY type
      `;
      
      const allTemplatesResult = await client.query(allTemplatesQuery);
      console.log('\nAvailable email templates:');
      allTemplatesResult.rows.forEach(template => {
        console.log(`   ${template.type}: ${template.name} (Active: ${template.isActive})`);
      });
    }
    
    // Check email provider settings
    console.log('\nChecking email provider settings...');
    const providerQuery = `
      SELECT id, "providerType", "providerName", "isActive", "isDefault"
      FROM email_provider_settings
      WHERE "isActive" = true
    `;
    
    const providerResult = await client.query(providerQuery);
    
    if (providerResult.rows.length > 0) {
      console.log('✅ Active email providers:');
      providerResult.rows.forEach(provider => {
        console.log(`   ${provider.providerType}: ${provider.providerName} (Default: ${provider.isDefault})`);
      });
    } else {
      console.log('❌ No active email providers found');
    }
    
  } catch (error) {
    console.error('Database query error:', error.message);
  } finally {
    await client.end();
  }
}

checkWelcomeTemplate().catch(console.error);