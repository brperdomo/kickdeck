/**
 * Verify SendGrid Activity and Email Status
 * 
 * This script checks SendGrid's activity feed and email statistics to determine
 * if emails are actually being processed or if there's an account-level issue.
 */

import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

async function verifySendGridActivity() {
  console.log('Verifying SendGrid activity and email processing...');
  
  // Check account statistics
  console.log('\n1. Checking SendGrid account statistics...');
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsResponse = await fetch(`https://api.sendgrid.com/v3/stats?start_date=${today}`, {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('Today\'s email statistics:');
      if (stats.length > 0) {
        const todayStats = stats[0].stats[0];
        console.log(`  Requests: ${todayStats.metrics.requests || 0}`);
        console.log(`  Delivered: ${todayStats.metrics.delivered || 0}`);
        console.log(`  Bounces: ${todayStats.metrics.bounces || 0}`);
        console.log(`  Blocks: ${todayStats.metrics.blocks || 0}`);
      } else {
        console.log('  No email activity recorded today');
      }
    } else {
      console.log(`Stats check failed: ${statsResponse.status}`);
    }
  } catch (error) {
    console.log(`Stats error: ${error.message}`);
  }
  
  // Check global statistics
  console.log('\n2. Checking global email statistics...');
  try {
    const globalStatsResponse = await fetch('https://api.sendgrid.com/v3/stats/global', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (globalStatsResponse.ok) {
      const globalStats = await globalStatsResponse.json();
      console.log('Global account statistics:');
      if (globalStats.length > 0) {
        const latest = globalStats[0];
        console.log(`  Date: ${latest.date}`);
        console.log(`  Requests: ${latest.stats[0].metrics.requests || 0}`);
        console.log(`  Delivered: ${latest.stats[0].metrics.delivered || 0}`);
      }
    }
  } catch (error) {
    console.log(`Global stats error: ${error.message}`);
  }
  
  // Check account reputation and sending capacity
  console.log('\n3. Checking account reputation and limits...');
  try {
    const accountResponse = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (accountResponse.ok) {
      const account = await accountResponse.json();
      console.log('Account status:');
      console.log(`  Type: ${account.type}`);
      console.log(`  Reputation: ${account.reputation}`);
      console.log(`  Package: ${account.package || 'Not specified'}`);
      
      if (account.reputation < 80) {
        console.log('  WARNING: Low reputation may affect delivery');
      }
    }
  } catch (error) {
    console.log(`Account check error: ${error.message}`);
  }
  
  // Test with a real Gmail address to see if it's a testinator.com issue
  console.log('\n4. Testing with Gmail address...');
  try {
    const { MailService } = await import('@sendgrid/mail');
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const gmailTest = {
      to: 'test.kickdeck.delivery@gmail.com',
      from: 'support@kickdeck.io',
      subject: 'KickDeck Production Delivery Verification',
      text: 'This email verifies that KickDeck production emails are being delivered.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>KickDeck Production Email Verification</h2>
          <p>This email confirms that production emails are being sent successfully.</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Domain: kickdeck.io (authenticated)</p>
          <p>If you receive this email, the delivery system is working correctly.</p>
        </div>
      `
    };
    
    const gmailResult = await mailService.send(gmailTest);
    console.log(`Gmail test email sent: ${gmailResult[0].statusCode}`);
    console.log(`Message ID: ${gmailResult[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.log(`Gmail test error: ${error.message}`);
  }
  
  console.log('\n=== SENDGRID ACTIVITY VERIFICATION COMPLETE ===');
  console.log('\nFindings:');
  console.log('- Check if email statistics show activity');
  console.log('- Verify account reputation is adequate');
  console.log('- Test with Gmail to rule out testinator.com issues');
  
  console.log('\nNext steps:');
  console.log('1. Check your SendGrid dashboard Activity Feed manually');
  console.log('2. Try registering with a Gmail address instead of testinator.com');
  console.log('3. Monitor email statistics for delivery confirmation');
  console.log('4. Consider that emails may be delivered but filtered by recipient');
}

verifySendGridActivity().catch(console.error);