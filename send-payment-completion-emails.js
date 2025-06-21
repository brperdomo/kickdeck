/**
 * Send Payment Completion Email Notifications
 * 
 * This script sends professional email notifications to teams that need to
 * complete their payment setup, including their secure payment completion links.
 */

import pkg from 'pg';
const { Client } = pkg;
import crypto from 'crypto';
import { sendTemplatedEmail } from './server/services/emailService.js';

// Generate secure payment completion token
function generatePaymentToken(teamId) {
  const secret = process.env.PAYMENT_COMPLETION_SECRET || 'fallback-secret-key';
  const timestamp = Date.now();
  const data = `${teamId}-${timestamp}`;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${teamId}.${timestamp}.${hash}`;
}

// Email template for payment completion notification
const PAYMENT_COMPLETION_EMAIL_TEMPLATE = {
  subject: 'Complete Your Team Registration Payment - Action Required',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Complete Your Registration</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Secure your team's spot in the tournament</p>
      </div>
      
      <div style="background: white; border: 1px solid #e0e0e0; border-top: none; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Team: {{teamName}}</h2>
          <p style="margin: 5px 0; color: #666;"><strong>Event:</strong> {{eventName}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Division:</strong> {{ageGroup}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Registration Fee:</strong> <span style="font-size: 18px; color: #2e7d32; font-weight: bold;">\${{amount}}</span></p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #856404; margin: 0 0 10px 0; display: flex; align-items: center;">
            <span style="background: #ffc107; color: white; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">!</span>
            Payment Setup Required
          </h3>
          <p style="color: #856404; margin: 0; line-height: 1.5;">
            Your team registration is incomplete. To secure your spot and avoid losing your registration, 
            please complete your payment setup using the secure link below.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{paymentLink}}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                    font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
            🔒 Complete Payment Setup
          </a>
        </div>
        
        <div style="background: #e8f5e8; border: 1px solid #c8e6c9; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #2e7d32; margin: 0 0 10px 0;">What happens next?</h4>
          <ul style="color: #2e7d32; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Click the secure link above to add your payment method</li>
            <li>Your card will be saved securely with Stripe (industry-standard security)</li>
            <li>Payment will be processed automatically once your team is approved</li>
            <li>You'll receive a confirmation email with your receipt</li>
          </ul>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
            <strong>Important:</strong> This payment link is secure and unique to your team. 
            Please complete your payment setup within 7 days to avoid registration cancellation.
          </p>
          <p style="color: #666; font-size: 14px; margin: 0;">
            Questions? Contact us at <a href="mailto:support@matchpro.ai" style="color: #667eea;">support@matchpro.ai</a>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 0;">© 2024 MatchPro Tournament Management. All rights reserved.</p>
      </div>
    </div>
  `,
  text: `
Complete Your Team Registration Payment

Team: {{teamName}}
Event: {{eventName}}
Division: {{ageGroup}}
Registration Fee: ${{amount}}

PAYMENT SETUP REQUIRED

Your team registration is incomplete. To secure your spot and avoid losing your registration, please complete your payment setup using the secure link below.

Complete Payment Setup: {{paymentLink}}

What happens next?
- Click the secure link to add your payment method
- Your card will be saved securely with Stripe
- Payment will be processed automatically once your team is approved
- You'll receive a confirmation email with your receipt

Important: Please complete your payment setup within 7 days to avoid registration cancellation.

Questions? Contact us at support@matchpro.ai

© 2024 MatchPro Tournament Management
  `
};

async function sendPaymentCompletionEmails(options = {}) {
  console.log('Sending payment completion email notifications...');
  
  const {
    dryRun = true,
    batchSize = 5,
    delayBetweenEmails = 2000,
    testEmail = null
  } = options;
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent');
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get all teams that need payment completion
    const teamsQuery = `
      SELECT t.id, t.name, t.total_amount, t.submitter_email, t.manager_email,
             e.name as event_name, ag.age_group, ag.gender, t.status,
             COALESCE(t.submitter_email, t.manager_email) as contact_email
      FROM teams t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      WHERE t.total_amount > 0 
        AND t.payment_method_id IS NULL
        AND t.status IN ('registered', 'pending')
        AND COALESCE(t.submitter_email, t.manager_email) IS NOT NULL
      ORDER BY t.total_amount DESC
    `;
    
    const result = await client.query(teamsQuery);
    const teams = result.rows;
    
    console.log(`Found ${teams.length} teams requiring payment completion`);
    
    if (teams.length === 0) {
      console.log('No teams found that need payment completion emails');
      return { sent: 0, errors: 0 };
    }
    
    const baseUrl = process.env.FRONTEND_URL || 'https://app.matchpro.ai';
    let sentCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process teams in batches
    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize);
      
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(teams.length / batchSize)}`);
      
      for (const team of batch) {
        try {
          const token = generatePaymentToken(team.id);
          const completionUrl = `${baseUrl}/complete-payment/${token}`;
          const recipientEmail = testEmail || team.contact_email;
          const ageGroup = `${team.age_group || ''} ${team.gender || ''}`.trim();
          
          // Prepare email data
          const emailData = {
            teamName: team.name,
            eventName: team.event_name,
            ageGroup: ageGroup || 'N/A',
            amount: (team.total_amount / 100).toFixed(2),
            paymentLink: completionUrl
          };
          
          // Replace template variables
          let htmlContent = PAYMENT_COMPLETION_EMAIL_TEMPLATE.html;
          let textContent = PAYMENT_COMPLETION_EMAIL_TEMPLATE.text;
          
          Object.entries(emailData).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
            textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
          });
          
          if (!dryRun) {
            // Send the email
            await sendTemplatedEmail({
              to: recipientEmail,
              subject: PAYMENT_COMPLETION_EMAIL_TEMPLATE.subject,
              html: htmlContent,
              text: textContent,
              templateType: 'payment_completion_notification'
            });
          }
          
          console.log(`${dryRun ? '[DRY RUN] ' : ''}✓ Email ${dryRun ? 'prepared for' : 'sent to'}: ${recipientEmail}`);
          console.log(`  Team: ${team.name} - $${emailData.amount}`);
          console.log(`  Link: ${completionUrl}`);
          
          sentCount++;
          
          // Delay between emails to avoid rate limiting
          if (delayBetweenEmails > 0 && !dryRun) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenEmails));
          }
          
        } catch (error) {
          console.error(`✗ Error processing team ${team.name}:`, error.message);
          errors.push({ team: team.name, error: error.message });
          errorCount++;
        }
      }
      
      if (i + batchSize < teams.length) {
        console.log(`Batch complete. Waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Summary
    console.log('\n=== EMAIL NOTIFICATION SUMMARY ===');
    console.log(`${dryRun ? 'Emails prepared' : 'Emails sent'}: ${sentCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total revenue pending: $${teams.reduce((sum, team) => sum + team.total_amount, 0) / 100}`);
    
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(({ team, error }) => {
        console.log(`  ${team}: ${error}`);
      });
    }
    
    if (dryRun) {
      console.log('\n🔍 This was a dry run. To send emails, run with { dryRun: false }');
    }
    
    return {
      sent: sentCount,
      errors: errorCount,
      totalAmount: teams.reduce((sum, team) => sum + team.total_amount, 0) / 100,
      teams: teams.map(team => ({
        name: team.name,
        email: team.contact_email,
        amount: team.total_amount / 100
      }))
    };
    
  } catch (error) {
    console.error('Error sending payment completion emails:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// CLI usage examples
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'dry-run':
      await sendPaymentCompletionEmails({ dryRun: true });
      break;
      
    case 'send':
      const confirmed = args.includes('--confirm');
      if (!confirmed) {
        console.log('To send real emails, use: node send-payment-completion-emails.js send --confirm');
        return;
      }
      await sendPaymentCompletionEmails({ dryRun: false });
      break;
      
    case 'test':
      const testEmail = args[1];
      if (!testEmail) {
        console.log('Usage: node send-payment-completion-emails.js test <email>');
        return;
      }
      await sendPaymentCompletionEmails({ 
        dryRun: false, 
        testEmail,
        batchSize: 1 
      });
      break;
      
    default:
      console.log('Usage:');
      console.log('  node send-payment-completion-emails.js dry-run    # Preview emails');
      console.log('  node send-payment-completion-emails.js send --confirm    # Send emails');
      console.log('  node send-payment-completion-emails.js test <email>    # Send test email');
      break;
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
}

export { sendPaymentCompletionEmails, generatePaymentToken };