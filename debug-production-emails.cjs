/**
 * Debug Production Email Issues
 * 
 * This script investigates why emails work in development but not in production
 * for user bperdomo@zoho.com registrations.
 */

require('dotenv').config();
const { db } = require('./db');
const { teams, users, events, email_templates } = require('./db/schema');
const { desc, eq, and, gte, or } = require('drizzle-orm');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function debugProductionEmails() {
  try {
    console.log('=== Production Email Debug Report ===');
    console.log('Target emails: bperdomo@zoho.com, bryan@kickdeck.io');
    console.log('');

    // 1. Check SendGrid Configuration
    console.log('1. SendGrid Configuration:');
    console.log('   API Key exists:', !!process.env.SENDGRID_API_KEY);
    console.log('   API Key length:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0);
    console.log('   From email env:', process.env.FROM_EMAIL || 'Not set');
    console.log('');

    // 2. Check Recent Registrations
    console.log('2. Recent Team Registrations (last 7 days):');
    const recentTeams = await db.select({
      id: teams.id,
      name: teams.name,
      submitterEmail: teams.submitterEmail,
      createdAt: teams.createdAt,
      status: teams.status,
      eventId: teams.eventId
    })
    .from(teams)
    .where(
      and(
        or(
          eq(teams.submitterEmail, 'bperdomo@zoho.com'),
          eq(teams.submitterEmail, 'bryan@kickdeck.io')
        ),
        gte(teams.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
    )
    .orderBy(desc(teams.createdAt))
    .limit(15);

    if (recentTeams.length === 0) {
      console.log('   No recent registrations found for target emails');
    } else {
      recentTeams.forEach(team => {
        console.log(`   Team ${team.id}: ${team.name} (${team.status}) - ${team.createdAt} - ${team.submitterEmail}`);
      });
    }
    console.log('');

    // 3. Check Email Templates
    console.log('3. Email Template Configuration:');
    const templates = await db.select()
      .from(email_templates);

    console.log(`   Total templates: ${templates.length}`);
    
    const importantTemplates = [
      'team_registration_confirmation',
      'team_approved',
      'team_rejected',
      'welcome_email'
    ];

    for (const templateType of importantTemplates) {
      const template = templates.find(t => t.type === templateType);
      if (template) {
        console.log(`   ${templateType}:`);
        console.log(`     - Enabled: ${template.isEnabled}`);
        console.log(`     - SendGrid Template ID: ${template.sendgridTemplateId || 'None'}`);
        console.log(`     - Subject: ${template.subject}`);
      } else {
        console.log(`   ${templateType}: Not found`);
      }
    }
    console.log('');

    // 4. Test Direct Email Send
    console.log('4. Testing Direct Email Send:');
    try {
      const testEmail = {
        to: 'bperdomo@zoho.com',
        from: 'noreply@kickdeck.io',
        subject: `Production Email Debug Test - ${new Date().toISOString()}`,
        text: 'This is a direct test email to verify SendGrid connectivity in production.',
        html: '<p>This is a direct test email to verify SendGrid connectivity in production.</p><p>If you receive this, SendGrid is working.</p>'
      };

      const response = await sgMail.send(testEmail);
      console.log('   ✓ Direct email sent successfully');
      console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
    } catch (error) {
      console.log('   ✗ Direct email failed:', error.message);
      if (error.response && error.response.body) {
        console.log('   Error details:', JSON.stringify(error.response.body, null, 2));
      }
    }
    console.log('');

    // 5. Check Production vs Development Environment
    console.log('5. Environment Check:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log(`   Database URL exists: ${!!process.env.DATABASE_URL}`);
    console.log(`   Replit deployment: ${!!process.env.REPLIT_DEPLOYMENT}`);
    console.log('');

    // 6. Most Recent Registration Analysis
    if (recentTeams.length > 0) {
      console.log('6. Most Recent Registration Analysis:');
      const latestTeam = recentTeams[0];
      console.log(`   Latest: Team ${latestTeam.id} - ${latestTeam.name}`);
      console.log(`   Status: ${latestTeam.status}`);
      console.log(`   Created: ${latestTeam.createdAt}`);
      console.log(`   Submitter: ${latestTeam.submitterEmail}`);
      
      // Check if this registration should have triggered emails
      const confirmationTemplate = templates.find(t => t.type === 'team_registration_confirmation');
      if (confirmationTemplate && confirmationTemplate.isEnabled) {
        console.log('   → Should have sent registration confirmation email');
      } else {
        console.log('   → Registration confirmation email disabled or missing');
      }
      
      if (latestTeam.status === 'approved') {
        const approvalTemplate = templates.find(t => t.type === 'team_approved');
        if (approvalTemplate && approvalTemplate.isEnabled) {
          console.log('   → Should have sent approval confirmation email');
        } else {
          console.log('   → Approval confirmation email disabled or missing');
        }
      }
    }

  } catch (error) {
    console.error('Error during debug:', error);
  }
}

debugProductionEmails();