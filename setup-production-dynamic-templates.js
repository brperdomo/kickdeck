/**
 * Setup Production Dynamic Templates
 * 
 * This script configures your email system to use SendGrid dynamic templates
 * instead of plain HTML emails in production.
 */

import { db } from './db/index.js';
import { emailTemplates } from './db/schema/emailTemplates.js';
import { eq } from 'drizzle-orm';

const templateMappings = [
  {
    type: 'password_reset',
    name: 'Password Reset',
    sendgridTemplateId: 'd-7eb7ea1c19ca4090a0cefa3a2be75088',
    subject: 'Let\'s reset your password',
    variables: ['userName', 'resetLink', 'supportEmail']
  },
  {
    type: 'registration_submitted',
    name: 'Registration Submitted',
    sendgridTemplateId: 'd-4eca2752ddd247158dd1d5433407cd5e',
    subject: 'Your Registration Has Been Submitted',
    variables: ['teamName', 'eventName', 'userName', 'supportEmail']
  },
  {
    type: 'team_approved',
    name: 'Team Approved / Payment Processed',
    sendgridTemplateId: 'd-1bca14d4dc8e41e5a7ed2131124d470e',
    subject: 'Your Team is Officially In! 🎉 – {{eventName}}',
    variables: ['teamName', 'eventName', 'userName', 'paymentAmount', 'supportEmail']
  },
  {
    type: 'team_rejected',
    name: 'Team Not Approved',
    sendgridTemplateId: 'd-4160d22e727944128335d7a3910b8092',
    subject: 'Your Team Registration for {{eventName}} – Not Approved',
    variables: ['teamName', 'eventName', 'userName', 'reason', 'supportEmail']
  },
  {
    type: 'team_waitlisted',
    name: 'Waitlisted Team',
    sendgridTemplateId: 'd-23265a10149a4144893cf84e32cc3f54',
    subject: 'Waitlist Notification for {{teamName}} – {{eventName}}',
    variables: ['teamName', 'eventName', 'userName', 'position', 'supportEmail']
  },
  {
    type: 'payment_confirmation',
    name: 'Payment Confirmation',
    sendgridTemplateId: 'd-3697f286c1e748f298710282e515ee25',
    subject: 'Confirmation of your Recent Team Registration',
    variables: ['teamName', 'eventName', 'userName', 'paymentAmount', 'transactionId', 'supportEmail']
  },
  {
    type: 'admin_welcome',
    name: 'Admin Welcome Email',
    sendgridTemplateId: 'd-29971e21ccc641de982f3d60f395ccb5',
    subject: 'Welcome to MatchPro',
    variables: ['userName', 'loginLink', 'supportEmail']
  },
  {
    type: 'member_welcome',
    name: 'Member Welcome Email',
    sendgridTemplateId: 'd-6064756d74914ec79b3a3586f6713424',
    subject: 'Welcome to MatchPro',
    variables: ['userName', 'loginLink', 'supportEmail']
  }
];

console.log('Setting up SendGrid Dynamic Templates for Production');
console.log('===================================================');

async function setupDynamicTemplates() {
  try {
    console.log(`Configuring ${templateMappings.length} email templates...`);
    
    for (const mapping of templateMappings) {
      try {
        // Check if template exists
        const existingTemplate = await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.type, mapping.type))
          .limit(1);
        
        if (existingTemplate.length > 0) {
          // Update existing template
          await db
            .update(emailTemplates)
            .set({
              name: mapping.name,
              sendgridTemplateId: mapping.sendgridTemplateId,
              subject: mapping.subject,
              variables: JSON.stringify(mapping.variables),
              isActive: true,
              updatedAt: new Date().toISOString()
            })
            .where(eq(emailTemplates.type, mapping.type));
          
          console.log(`✅ Updated: ${mapping.name}`);
        } else {
          // Create new template
          await db
            .insert(emailTemplates)
            .values({
              type: mapping.type,
              name: mapping.name,
              sendgridTemplateId: mapping.sendgridTemplateId,
              subject: mapping.subject,
              variables: JSON.stringify(mapping.variables),
              isActive: true,
              senderEmail: 'support@matchpro.ai',
              senderName: 'MatchPro',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          
          console.log(`✅ Created: ${mapping.name}`);
        }
      } catch (error) {
        console.log(`❌ Error with ${mapping.name}: ${error.message}`);
      }
    }
    
    console.log('\n=== Template Configuration Complete ===');
    
    // Verify all templates are configured
    const configuredTemplates = await db
      .select({
        type: emailTemplates.type,
        name: emailTemplates.name,
        sendgridTemplateId: emailTemplates.sendgridTemplateId,
        isActive: emailTemplates.isActive
      })
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true));
    
    console.log(`\nConfigured ${configuredTemplates.length} active email templates:`);
    configuredTemplates.forEach(template => {
      console.log(`  ${template.name} (${template.type})`);
      console.log(`    Template ID: ${template.sendgridTemplateId}`);
    });
    
    console.log('\n✅ Production email system now configured to use SendGrid dynamic templates');
    console.log('✅ All emails will use your branded templates instead of plain HTML');
    
  } catch (error) {
    console.error('Error setting up dynamic templates:', error);
  }
}

setupDynamicTemplates();