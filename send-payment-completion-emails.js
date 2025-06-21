/**
 * Send Payment Completion Emails to Teams with Incomplete Setup
 * 
 * This script sends emails to all teams that registered without completing
 * payment setup, requiring them to complete payment before approval.
 */

import pkg from 'pg';
const { Client } = pkg;
import { sendTemplatedEmail } from './server/services/emailService.js';

async function sendPaymentCompletionEmails() {
  console.log('Sending payment completion emails to teams with incomplete setup...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get all teams that need to complete payment setup
    const teamsQuery = `
      SELECT t.id, t.name, t.manager_email, t.submitter_email, t.total_amount,
             e.name as event_name, ag.age_group, ag.gender
      FROM teams t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      WHERE t.total_amount > 0 
        AND (t.setup_intent_id IS NULL OR t.payment_method_id IS NULL)
        AND t.status IN ('registered', 'pending')
      ORDER BY t.total_amount DESC
    `;
    
    const result = await client.query(teamsQuery);
    const teams = result.rows;
    
    console.log(`Found ${teams.length} teams requiring payment completion`);
    
    if (teams.length === 0) {
      console.log('No teams found that need payment completion emails');
      return;
    }
    
    // Send payment completion email to each team
    let emailsSent = 0;
    let emailsFailed = 0;
    
    for (const team of teams) {
      try {
        const recipientEmail = team.submitter_email || team.manager_email;
        
        if (!recipientEmail) {
          console.log(`Skipping team ${team.name} - no email address found`);
          continue;
        }
        
        const emailData = {
          teamName: team.name,
          eventName: team.event_name,
          ageGroup: `${team.age_group} ${team.gender}`,
          registrationAmount: (team.total_amount / 100).toFixed(2),
          paymentSetupUrl: `${process.env.FRONTEND_URL || 'https://app.matchpro.ai'}/teams/${team.id}/complete-payment`,
          supportEmail: 'support@matchpro.ai'
        };
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Complete Your Team Registration Payment</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2c5282; margin-bottom: 10px;">Payment Setup Required</h1>
            <p style="font-size: 16px; margin-bottom: 0;">Complete your team registration for ${emailData.eventName}</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Team: ${emailData.teamName}</h2>
            
            <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #c53030; margin-bottom: 10px;">Action Required</h3>
                <p style="margin-bottom: 10px;">Your team registration for <strong>${emailData.eventName}</strong> is incomplete. Payment setup is required before your team can be approved.</p>
                <p style="margin-bottom: 0;"><strong>Registration Amount:</strong> $${emailData.registrationAmount}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #2d3748; margin-bottom: 10px;">Registration Details</h3>
                <ul style="padding-left: 20px;">
                    <li><strong>Team:</strong> ${emailData.teamName}</li>
                    <li><strong>Event:</strong> ${emailData.eventName}</li>
                    <li><strong>Age Group:</strong> ${emailData.ageGroup}</li>
                    <li><strong>Amount Due:</strong> $${emailData.registrationAmount}</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${emailData.paymentSetupUrl}" 
                   style="display: inline-block; background-color: #2c5282; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Complete Payment Setup
                </a>
            </div>
            
            <div style="background: #f7fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h4 style="color: #2d3748; margin-bottom: 10px;">What You Need to Do</h4>
                <ol style="padding-left: 20px; margin-bottom: 0;">
                    <li>Click the "Complete Payment Setup" button above</li>
                    <li>Enter your payment information securely through Stripe</li>
                    <li>Your card will be stored securely but not charged yet</li>
                    <li>Payment will only be processed after team approval</li>
                </ol>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                <p style="margin-bottom: 10px;"><strong>Important:</strong> Teams cannot be approved for participation until payment setup is complete.</p>
                <p style="margin-bottom: 10px;">If you have questions or need assistance, please contact us at <a href="mailto:${emailData.supportEmail}">${emailData.supportEmail}</a></p>
                <p style="margin-bottom: 0; font-size: 14px; color: #718096;">This email was sent regarding your team registration. Payment information is processed securely through Stripe.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
        
        await sendTemplatedEmail({
          to: recipientEmail,
          subject: `Payment Setup Required - ${team.name} Registration`,
          html: emailHtml,
          templateType: 'payment_completion_required'
        });
        
        console.log(`✓ Sent payment completion email to ${recipientEmail} for team ${team.name}`);
        emailsSent++;
        
        // Add a small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (emailError) {
        console.error(`✗ Failed to send email for team ${team.name}:`, emailError.message);
        emailsFailed++;
      }
    }
    
    console.log(`\n=== EMAIL SENDING SUMMARY ===`);
    console.log(`Total teams requiring payment: ${teams.length}`);
    console.log(`Emails sent successfully: ${emailsSent}`);
    console.log(`Emails failed: ${emailsFailed}`);
    
    if (emailsSent > 0) {
      console.log(`\n✓ Payment completion emails sent to ${emailsSent} teams`);
      console.log('Teams will receive instructions to complete payment setup');
    }
    
    return {
      totalTeams: teams.length,
      emailsSent,
      emailsFailed,
      teams: teams.map(t => ({
        name: t.name,
        email: t.submitter_email || t.manager_email,
        amount: t.total_amount / 100
      }))
    };
    
  } catch (error) {
    console.error('Error sending payment completion emails:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  sendPaymentCompletionEmails()
    .then(result => {
      console.log('\nPayment completion emails process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { sendPaymentCompletionEmails };