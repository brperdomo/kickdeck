/**
 * Update Welcome Email Templates
 * 
 * This script updates the existing welcome email template for regular members
 * and creates a new welcome email template for admin users.
 * 
 * What it does:
 * 1. Updates the existing welcome email template with improved wording
 * 2. Creates a new admin welcome email template
 * 3. Updates the routing for both templates to use SendGrid
 */

import { db } from './server/db/index.js';
import { emailTemplates } from './server/db/schema/emailTemplates.js';
import { emailTemplateRouting } from './server/db/schema/emailTemplateRouting.js';
import { emailProviderSettings } from './server/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function updateWelcomeEmailTemplates() {
  try {
    console.log('Updating welcome email templates...');
    
    // First, find the SendGrid provider
    const sendGridProviders = await db
      .select()
      .from(emailProviderSettings)
      .where(and(
        eq(emailProviderSettings.providerType, 'sendgrid'),
        eq(emailProviderSettings.isActive, true)
      ));
    
    if (!sendGridProviders.length) {
      throw new Error('No active SendGrid provider found. Please set up SendGrid first.');
    }
    
    // Use the default provider if there are multiple
    const sendGridProvider = sendGridProviders.find(p => p.isDefault) || sendGridProviders[0];
    console.log(`Using SendGrid provider: ${sendGridProvider.providerName} (ID: ${sendGridProvider.id})`);
    
    // Base url for login link
    const appBaseUrl = process.env.APP_URL || 'https://kickdeck.io';
    
    // Get the existing welcome email template
    const [welcomeTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'welcome'));
    
    if (welcomeTemplate) {
      console.log(`Updating existing member welcome email template: ${welcomeTemplate.name} (ID: ${welcomeTemplate.id})`);
      
      // Update the existing template for regular members
      await db.update(emailTemplates)
        .set({
          name: 'Member Welcome Email',
          description: 'Welcome email for new members who register via the public registration page',
          subject: 'Welcome to KickDeck - Your Account is Ready!',
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
      
      <p>Welcome to KickDeck! We're thrilled to have you join our sports management platform designed to make team management easier and more efficient.</p>
      
      <p>Your account has been successfully created and is ready to use:</p>
      <ul>
        <li><strong>Email:</strong> {{email}}</li>
      </ul>
      
      <p>With your KickDeck member account, you can:</p>
      <ul>
        <li>Register teams for tournaments and events</li>
        <li>Track your upcoming games and schedules</li>
        <li>Manage player information and rosters</li>
        <li>Complete team payments and registration forms</li>
        <li>View tournament brackets and standings</li>
      </ul>
      
      <p>To get started, click the button below to log in to your account:</p>
      
      <p style="text-align: center;">
        <a href="${appBaseUrl}/login" class="button">Log In to Your Account</a>
      </p>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      
      <p>Thank you for choosing KickDeck for your sports management needs!</p>
      
      <p>Best regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to {{email}}. If you did not create an account, please contact us immediately.</p>
    </div>
  </div>
</body>
</html>`,
          senderName: 'KickDeck',
          senderEmail: 'support@kickdeck.io',
          isActive: true,
          variables: ['firstName', 'lastName', 'email'],
          providerId: sendGridProvider.id,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, welcomeTemplate.id));
      
      console.log('Member welcome email template updated successfully');
    } else {
      console.log('No existing welcome email template found. Creating new one...');
      
      // Create welcome email template for members
      await db.insert(emailTemplates).values({
        name: 'Member Welcome Email',
        description: 'Welcome email for new members who register via the public registration page',
        type: 'welcome',
        subject: 'Welcome to KickDeck - Your Account is Ready!',
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
      
      <p>Welcome to KickDeck! We're thrilled to have you join our sports management platform designed to make team management easier and more efficient.</p>
      
      <p>Your account has been successfully created and is ready to use:</p>
      <ul>
        <li><strong>Email:</strong> {{email}}</li>
      </ul>
      
      <p>With your KickDeck member account, you can:</p>
      <ul>
        <li>Register teams for tournaments and events</li>
        <li>Track your upcoming games and schedules</li>
        <li>Manage player information and rosters</li>
        <li>Complete team payments and registration forms</li>
        <li>View tournament brackets and standings</li>
      </ul>
      
      <p>To get started, click the button below to log in to your account:</p>
      
      <p style="text-align: center;">
        <a href="${appBaseUrl}/login" class="button">Log In to Your Account</a>
      </p>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      
      <p>Thank you for choosing KickDeck for your sports management needs!</p>
      
      <p>Best regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to {{email}}. If you did not create an account, please contact us immediately.</p>
    </div>
  </div>
</body>
</html>`,
        senderName: 'KickDeck',
        senderEmail: 'support@kickdeck.io',
        isActive: true,
        variables: ['firstName', 'lastName', 'email'],
        providerId: sendGridProvider.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Member welcome email template created successfully');
    }
    
    // Check if admin welcome template exists
    const [adminWelcomeTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'admin_welcome'));
    
    if (adminWelcomeTemplate) {
      console.log(`Updating existing admin welcome email template: ${adminWelcomeTemplate.name} (ID: ${adminWelcomeTemplate.id})`);
      
      // Update admin welcome template
      await db.update(emailTemplates)
        .set({
          name: 'Admin Welcome Email',
          description: 'Welcome email for users assigned to admin roles',
          subject: 'Welcome to KickDeck - Admin Account Access',
          content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to KickDeck Admin</title>
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
      <h1>Welcome to KickDeck Admin!</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      
      <p>You have been invited to join KickDeck as an administrator for your organization. Your admin account has been created and is ready to use.</p>
      
      <p>Your account details:</p>
      <ul>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Role:</strong> {{role}}</li>
      </ul>
      
      <p>With your administrative access, you can manage:</p>
      <ul>
        <li>Tournament and event settings</li>
        <li>Team registrations and approvals</li>
        <li>Schedules and brackets</li>
        <li>Player verification</li>
        <li>Organization settings</li>
      </ul>
      
      <p>To get started, click the button below to log in to your admin dashboard:</p>
      
      <p style="text-align: center;">
        <a href="${appBaseUrl}/login" class="button">Log In to Admin Dashboard</a>
      </p>
      
      <p>If you have any questions about your administrative role or need assistance, please contact the system administrator.</p>
      
      <p>Thank you for being part of our team!</p>
      
      <p>Best regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to {{email}}. If you did not request an admin account, please contact us immediately.</p>
    </div>
  </div>
</body>
</html>`,
          senderName: 'KickDeck',
          senderEmail: 'support@kickdeck.io',
          isActive: true,
          variables: ['firstName', 'lastName', 'email', 'role'],
          providerId: sendGridProvider.id,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.id, adminWelcomeTemplate.id));
      
      console.log('Admin welcome email template updated successfully');
    } else {
      console.log('Creating new admin welcome email template...');
      
      // Create admin welcome email template
      await db.insert(emailTemplates).values({
        name: 'Admin Welcome Email',
        description: 'Welcome email for users assigned to admin roles',
        type: 'admin_welcome',
        subject: 'Welcome to KickDeck - Admin Account Access',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to KickDeck Admin</title>
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
      <h1>Welcome to KickDeck Admin!</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      
      <p>You have been invited to join KickDeck as an administrator for your organization. Your admin account has been created and is ready to use.</p>
      
      <p>Your account details:</p>
      <ul>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Role:</strong> {{role}}</li>
      </ul>
      
      <p>With your administrative access, you can manage:</p>
      <ul>
        <li>Tournament and event settings</li>
        <li>Team registrations and approvals</li>
        <li>Schedules and brackets</li>
        <li>Player verification</li>
        <li>Organization settings</li>
      </ul>
      
      <p>To get started, click the button below to log in to your admin dashboard:</p>
      
      <p style="text-align: center;">
        <a href="${appBaseUrl}/login" class="button">Log In to Admin Dashboard</a>
      </p>
      
      <p>If you have any questions about your administrative role or need assistance, please contact the system administrator.</p>
      
      <p>Thank you for being part of our team!</p>
      
      <p>Best regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to {{email}}. If you did not request an admin account, please contact us immediately.</p>
    </div>
  </div>
</body>
</html>`,
        senderName: 'KickDeck',
        senderEmail: 'support@kickdeck.io',
        isActive: true,
        variables: ['firstName', 'lastName', 'email', 'role'],
        providerId: sendGridProvider.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Admin welcome email template created successfully');
    }
    
    // Check if routing configurations exist
    // 1. Member welcome email routing
    const [memberWelcomeRouting] = await db
      .select()
      .from(emailTemplateRouting)
      .where(eq(emailTemplateRouting.templateType, 'welcome'));
    
    if (memberWelcomeRouting) {
      // Update existing routing
      await db.update(emailTemplateRouting)
        .set({
          providerId: sendGridProvider.id,
          fromEmail: 'support@kickdeck.io',
          fromName: 'KickDeck',
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(emailTemplateRouting.id, memberWelcomeRouting.id));
      
      console.log('Member welcome email routing updated successfully');
    } else {
      // Create new routing
      await db.insert(emailTemplateRouting).values({
        templateType: 'welcome',
        providerId: sendGridProvider.id,
        fromEmail: 'support@kickdeck.io',
        fromName: 'KickDeck',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Member welcome email routing created successfully');
    }
    
    // 2. Admin welcome email routing
    const [adminWelcomeRouting] = await db
      .select()
      .from(emailTemplateRouting)
      .where(eq(emailTemplateRouting.templateType, 'admin_welcome'));
    
    if (adminWelcomeRouting) {
      // Update existing routing
      await db.update(emailTemplateRouting)
        .set({
          providerId: sendGridProvider.id,
          fromEmail: 'support@kickdeck.io',
          fromName: 'KickDeck',
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(emailTemplateRouting.id, adminWelcomeRouting.id));
      
      console.log('Admin welcome email routing updated successfully');
    } else {
      // Create new routing
      await db.insert(emailTemplateRouting).values({
        templateType: 'admin_welcome',
        providerId: sendGridProvider.id,
        fromEmail: 'support@kickdeck.io',
        fromName: 'KickDeck',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Admin welcome email routing created successfully');
    }
    
    console.log('All welcome email templates and routing updated successfully!');
  } catch (error) {
    console.error('Error updating welcome email templates:', error);
  }
}

updateWelcomeEmailTemplates();