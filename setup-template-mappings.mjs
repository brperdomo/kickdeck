/**
 * Setup SendGrid Dynamic Template Mappings
 * Direct database configuration for production email templates
 */

import { db } from './db/index.js';
import { emailTemplates } from './db/schema/emailTemplates.js';
import { eq } from 'drizzle-orm';

const templateMappings = [
  {
    type: 'password_reset',
    name: 'Password Reset',
    sendgridTemplateId: 'd-7eb7ea1c19ca4090a0cefa3a2be75088',
    subject: 'Let\'s reset your password'
  },
  {
    type: 'registration_submitted', 
    name: 'Registration Submitted',
    sendgridTemplateId: 'd-4eca2752ddd247158dd1d5433407cd5e',
    subject: 'Your Registration Has Been Submitted'
  },
  {
    type: 'team_approved',
    name: 'Team Approved / Payment Processed', 
    sendgridTemplateId: 'd-1bca14d4dc8e41e5a7ed2131124d470e',
    subject: 'Your Team is Officially In! 🎉 – {{eventName}}'
  },
  {
    type: 'team_rejected',
    name: 'Team Not Approved',
    sendgridTemplateId: 'd-4160d22e727944128335d7a3910b8092',
    subject: 'Your Team Registration for {{eventName}} – Not Approved'
  },
  {
    type: 'team_waitlisted',
    name: 'Waitlisted Team',
    sendgridTemplateId: 'd-23265a10149a4144893cf84e32cc3f54',
    subject: 'Waitlist Notification for {{teamName}} – {{eventName}}'
  },
  {
    type: 'payment_confirmation',
    name: 'Payment Confirmation',
    sendgridTemplateId: 'd-3697f286c1e748f298710282e515ee25',
    subject: 'Confirmation of your Recent Team Registration'
  }
];

async function setupTemplates() {
  console.log('Configuring SendGrid Dynamic Templates...');
  
  for (const mapping of templateMappings) {
    try {
      const existingTemplate = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.type, mapping.type))
        .limit(1);
      
      if (existingTemplate.length > 0) {
        await db
          .update(emailTemplates)
          .set({
            name: mapping.name,
            sendgridTemplateId: mapping.sendgridTemplateId,
            subject: mapping.subject,
            isActive: true,
            senderEmail: 'support@kickdeck.io',
            senderName: 'KickDeck',
            updatedAt: new Date().toISOString()
          })
          .where(eq(emailTemplates.type, mapping.type));
        
        console.log('✅ Updated:', mapping.name);
      } else {
        await db
          .insert(emailTemplates)
          .values({
            type: mapping.type,
            name: mapping.name,
            sendgridTemplateId: mapping.sendgridTemplateId,
            subject: mapping.subject,
            content: '',
            isActive: true,
            senderEmail: 'support@kickdeck.io',
            senderName: 'KickDeck',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        
        console.log('✅ Created:', mapping.name);
      }
    } catch (error) {
      console.log('❌ Error with', mapping.name + ':', error.message);
    }
  }
  
  console.log('\n=== Verification ===');
  const configuredTemplates = await db
    .select({
      type: emailTemplates.type,
      name: emailTemplates.name,
      sendgridTemplateId: emailTemplates.sendgridTemplateId,
      isActive: emailTemplates.isActive
    })
    .from(emailTemplates)
    .where(eq(emailTemplates.isActive, true));
  
  console.log(`Configured ${configuredTemplates.length} active templates:`);
  configuredTemplates.forEach(template => {
    console.log(`  ${template.name} → ${template.sendgridTemplateId || 'No SendGrid ID'}`);
  });
  
  console.log('\n✅ Production emails will now use SendGrid dynamic templates');
}

setupTemplates().catch(console.error);