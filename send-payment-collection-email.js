/**
 * Send Payment Collection Email to Team B2017 Academy-1
 * 
 * This script sends an email to the team manager requesting
 * completion of payment for their approved team registration.
 */

import fetch from 'node-fetch';
import pkg from 'pg';
const { Client } = pkg;

async function sendPaymentCollectionEmail() {
  console.log('Sending payment collection email to team B2017 Academy-1...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Get team details
    const teamQuery = `
      SELECT id, name, total_amount, manager_email, submitter_email,
             manager_name, submitter_name
      FROM teams 
      WHERE name = 'B2017 Academy-1'
    `;
    
    const teamResult = await client.query(teamQuery);
    const team = teamResult.rows[0];
    
    const recipientEmail = team.manager_email || team.submitter_email;
    const recipientName = team.manager_name || team.submitter_name || 'Team Manager';
    
    console.log(`Team: ${team.name}`);
    console.log(`Amount due: $${team.total_amount / 100}`);
    console.log(`Recipient: ${recipientName} <${recipientEmail}>`);
    
    // Send payment collection email
    const emailData = {
      to: recipientEmail,
      template: 'payment_collection_required',
      data: {
        recipientName: recipientName,
        teamName: team.name,
        amount: (team.total_amount / 100).toFixed(2),
        approvalDate: new Date().toLocaleDateString(),
        paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 7 days from now
        loginUrl: `${process.env.PUBLIC_URL || 'https://app.kickdeck.io'}/dashboard`,
        supportEmail: 'support@kickdeck.io'
      }
    };
    
    const emailResponse = await fetch('http://localhost:5000/api/send-templated-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (emailResponse.ok) {
      console.log('✅ Payment collection email sent successfully');
      
      // Update team status to reflect payment collection in progress
      await client.query(`
        UPDATE teams 
        SET payment_status = 'collection_pending',
            notes = COALESCE(notes, '') || ' | Payment collection email sent on ' || CURRENT_DATE
        WHERE id = $1
      `, [team.id]);
      
      console.log('Team status updated to reflect payment collection in progress');
      
    } else {
      const errorText = await emailResponse.text();
      console.log(`❌ Failed to send email: ${emailResponse.status} - ${errorText}`);
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Team manager will receive email requesting payment completion');
    console.log('2. They can log into their dashboard to complete payment');
    console.log('3. Once payment is completed, team will be fully processed');
    console.log('4. Monitor payment status in admin dashboard');
    
    return {
      emailSent: emailResponse.ok,
      recipientEmail: recipientEmail,
      amountDue: team.total_amount / 100
    };
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return { emailSent: false, error: error.message };
  } finally {
    await client.end();
  }
}

sendPaymentCollectionEmail().then(result => {
  if (result.emailSent) {
    console.log('\nPayment collection process initiated');
    console.log(`Customer will complete payment for $${result.amountDue}`);
  } else {
    console.log('\nPayment collection email failed');
    console.log('Manual contact with team manager may be required');
  }
}).catch(console.error);