/**
 * Assign SendGrid Templates to Email Types
 * 
 * This script allows you to list your existing SendGrid dynamic templates 
 * and assign them to specific email types in your application.
 * 
 * Usage:
 *   node assign-sendgrid-templates.js list       - Lists all SendGrid templates
 *   node assign-sendgrid-templates.js assign     - Interactive tool to assign templates
 */

import { db } from './db/index.js';
import { emailTemplates } from './db/schema.js';
import { eq } from 'drizzle-orm';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

// Create readline interface for interactive prompting
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

/**
 * Lists all SendGrid dynamic templates
 */
async function listTemplates() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('ERROR: SENDGRID_API_KEY environment variable is not set');
      process.exit(1);
    }
    
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SendGrid API returned ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    const templates = data.templates || [];
    
    console.log('\nAvailable SendGrid Templates:');
    console.log('===========================');
    
    if (templates.length === 0) {
      console.log('No dynamic templates found in your SendGrid account.');
      console.log('Please create templates in the SendGrid dashboard first.');
      return [];
    }
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ID: ${template.id}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Version ID: ${template.versions?.[0]?.id || 'N/A'}`);
      console.log('---');
    });
    
    return templates;
  } catch (error) {
    console.error('Error fetching SendGrid templates:', error);
    return [];
  }
}

/**
 * Lists all application email templates with their SendGrid mappings
 */
async function listAppTemplates() {
  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.name);
    
    console.log('\nApplication Email Templates:');
    console.log('==========================');
    
    if (templates.length === 0) {
      console.log('No email templates found in the application database.');
      return [];
    }
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. Type: ${template.type}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   SendGrid Template ID: ${template.sendgridTemplateId || 'Not assigned'}`);
      console.log('---');
    });
    
    return templates;
  } catch (error) {
    console.error('Error fetching application templates:', error);
    return [];
  }
}

/**
 * Interactive tool to assign SendGrid templates to application email types
 */
async function assignTemplates() {
  try {
    // List app templates first
    const appTemplates = await listAppTemplates();
    if (appTemplates.length === 0) {
      rl.close();
      return;
    }
    
    // List SendGrid templates
    const sendgridTemplates = await listTemplates();
    if (sendgridTemplates.length === 0) {
      rl.close();
      return;
    }
    
    console.log('\nTemplate Assignment:');
    console.log('===================');
    
    // Ask which app template to update
    const appTemplateIndex = parseInt(await question('\nEnter the number of the application template to update: ')) - 1;
    if (isNaN(appTemplateIndex) || appTemplateIndex < 0 || appTemplateIndex >= appTemplates.length) {
      console.error('Invalid template selection');
      rl.close();
      return;
    }
    
    // Ask which SendGrid template to assign
    const sendgridTemplateIndex = parseInt(await question('Enter the number of the SendGrid template to assign: ')) - 1;
    if (isNaN(sendgridTemplateIndex) || sendgridTemplateIndex < 0 || sendgridTemplateIndex >= sendgridTemplates.length) {
      console.error('Invalid template selection');
      rl.close();
      return;
    }
    
    const appTemplate = appTemplates[appTemplateIndex];
    const sendgridTemplate = sendgridTemplates[sendgridTemplateIndex];
    
    // Confirm the assignment
    console.log(`\nAssigning SendGrid template "${sendgridTemplate.name}" to app template "${appTemplate.name}"`);
    const confirm = await question('Confirm? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('Operation cancelled');
      rl.close();
      return;
    }
    
    // Update the template in the database
    await db
      .update(emailTemplates)
      .set({ 
        sendgridTemplateId: sendgridTemplate.id,
        updatedAt: new Date().toISOString()
      })
      .where(eq(emailTemplates.id, appTemplate.id));
    
    console.log(`\nSuccess! The template assignment has been updated.`);
    console.log(`App Template: ${appTemplate.name} (${appTemplate.type})`);
    console.log(`SendGrid Template: ${sendgridTemplate.name} (${sendgridTemplate.id})`);
    
    // Ask if the user wants to assign another template
    const assignAnother = await question('\nAssign another template? (yes/no): ');
    if (assignAnother.toLowerCase() === 'yes' || assignAnother.toLowerCase() === 'y') {
      await assignTemplates();
    }
  } catch (error) {
    console.error('Error assigning template:', error);
  } finally {
    rl.close();
  }
}

/**
 * Main function to handle command line arguments
 */
async function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'list':
      await listTemplates();
      await listAppTemplates();
      break;
    case 'assign':
      await assignTemplates();
      break;
    case 'help':
    default:
      console.log('Usage:');
      console.log('  node assign-sendgrid-templates.js list   - Lists all templates');
      console.log('  node assign-sendgrid-templates.js assign - Interactive tool to assign templates');
      break;
  }
  
  // Make sure to close readline if not closed already
  if (rl.listenerCount('line') > 0) {
    rl.close();
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});