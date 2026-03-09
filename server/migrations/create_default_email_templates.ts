import { db } from '@db/index';
import { emailTemplates } from '@db/schema/emailTemplates';

export async function createDefaultEmailTemplates() {
  try {
    console.log('Creating default email templates...');
    
    // Check if templates already exist
    const existingTemplates = await db
      .select({ id: emailTemplates.id, type: emailTemplates.type })
      .from(emailTemplates);
    
    const passwordResetExists = existingTemplates.some(t => t.type === 'password_reset');
    const welcomeEmailExists = existingTemplates.some(t => t.type === 'welcome');
    
    if (!passwordResetExists) {
      // Create password reset template
      await db.insert(emailTemplates).values({
        name: 'Password Reset',
        description: 'Template for password reset emails',
        type: 'password_reset',
        subject: 'Reset Your Password - KickDeck',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4A154B;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
    }
    .button {
      display: inline-block;
      background-color: #4A154B;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
    }
    .token-box {
      background-color: #eee;
      padding: 10px;
      border-radius: 4px;
      margin: 20px 0;
      word-break: break-all;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <p>Hello {{username}},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <a href="{{resetUrl}}" class="button">Reset Password</a>
      <p>Or copy and paste the following URL into your browser:</p>
      <div class="token-box">{{resetUrl}}</div>
      <p>This link will expire in {{expiryHours}} hours.</p>
      <p>Thank you,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>If you're having trouble with the button above, copy and paste the URL below into your web browser.</p>
      <p>{{resetUrl}}</p>
    </div>
  </div>
</body>
</html>`,
        senderName: 'KickDeck',
        senderEmail: 'no-reply@kickdeck.xyz',
        isActive: true,
        variables: ['username', 'resetUrl', 'token', 'expiryHours'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Password reset template created');
    } else {
      console.log('Password reset template already exists');
    }
    
    if (!welcomeEmailExists) {
      // Create welcome email template
      await db.insert(emailTemplates).values({
        name: 'Welcome Email',
        description: 'Template for welcome emails sent to new users',
        type: 'welcome',
        subject: 'Welcome to KickDeck!',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to KickDeck</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2C5282;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
    }
    .button {
      display: inline-block;
      background-color: #2C5282;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to KickDeck!</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>Welcome to KickDeck! We're excited to have you join our sports management platform.</p>
      <p>Your account has been successfully created with the following information:</p>
      <ul>
        <li><strong>Username:</strong> {{username}}</li>
        <li><strong>Email:</strong> {{email}}</li>
      </ul>
      <p>With your KickDeck account, you can:</p>
      <ul>
        <li>Register teams for tournaments</li>
        <li>Manage player information</li>
        <li>Track your tournament schedules</li>
        <li>And much more!</li>
      </ul>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Thank you,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to {{email}}. If you did not create an account, please contact us immediately.</p>
    </div>
  </div>
</body>
</html>`,
        senderName: 'KickDeck',
        senderEmail: 'no-reply@kickdeck.xyz',
        isActive: true,
        variables: ['firstName', 'lastName', 'username', 'email'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Welcome email template created');
    } else {
      console.log('Welcome email template already exists');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating default email templates:', error);
    return { success: false, error };
  }
}