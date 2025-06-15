/**
 * Fix Email Delivery in Production
 * 
 * This script addresses the production email delivery issue where emails
 * return success but aren't delivered, likely due to spam filtering.
 */

import { execute_sql_tool } from './db/index.js';

async function fixEmailDelivery() {
  try {
    console.log('🔧 Fixing email delivery for production...');
    
    // 1. Remove the SendGrid template ID to use local rendering instead
    console.log('1. Switching to local email template rendering...');
    
    await execute_sql_tool(`
      UPDATE email_templates 
      SET sendgrid_template_id = NULL 
      WHERE type = 'password_reset'
    `);
    
    console.log('✅ Removed SendGrid template ID - emails will now use local rendering');
    
    // 2. Update the email template content for better deliverability
    console.log('2. Updating email content for better deliverability...');
    
    const improvedTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">MatchPro</h1>
              <p style="margin: 10px 0 0 0; color: #e2e8f0; font-size: 16px;">Soccer Tournament Management</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 20px;">Password Reset Request</h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.5;">
                Hello {{username}},
              </p>
              <p style="margin: 0 0 30px 0; color: #475569; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password for your MatchPro account. 
                Click the button below to create a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{resetUrl}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset My Password</a>
              </div>
              <p style="margin: 30px 0 20px 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                {{resetUrl}}
              </p>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Security Notice:</strong> This link will expire in {{expiryHours}} hours. 
                  If you didn't request this reset, please ignore this email.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f8fafc; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                This email was sent by MatchPro Tournament Management System.<br>
                If you have questions, contact us at support@matchpro.ai
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await execute_sql_tool(`
      UPDATE email_templates 
      SET 
        content = '${improvedTemplate.replace(/'/g, "''")}',
        subject = 'Reset Your MatchPro Password',
        sender_name = 'MatchPro Support',
        sender_email = 'support@matchpro.ai'
      WHERE type = 'password_reset'
    `);
    
    console.log('✅ Updated email template with improved deliverability');
    
    // 3. Create a fallback simple text version
    console.log('3. Adding fallback simple text email...');
    
    const simpleTextVersion = `Hello {{username}},

We received a request to reset your password for your MatchPro account.

To reset your password, please visit this link:
{{resetUrl}}

This link will expire in {{expiryHours}} hours.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
MatchPro Support Team
support@matchpro.ai`;

    // Update to ensure we have a text version
    await execute_sql_tool(`
      UPDATE email_templates 
      SET 
        text_content = '${simpleTextVersion.replace(/'/g, "''")}'
      WHERE type = 'password_reset'
    `);
    
    console.log('✅ Added text version for better deliverability');
    
    console.log('\n📧 Email delivery fixes applied successfully!');
    console.log('\nChanges made:');
    console.log('• Switched from SendGrid dynamic template to local rendering');
    console.log('• Updated email design for better spam filter compatibility');
    console.log('• Added proper text version alongside HTML');
    console.log('• Improved email structure and security messaging');
    
  } catch (error) {
    console.error('Error fixing email delivery:', error);
    throw error;
  }
}

fixEmailDelivery().catch(console.error);