/**
 * Test Magic Link Email Sending
 * 
 * This script tests the magic link email sending functionality by:
 * 1. Getting the admin user
 * 2. Creating a magic link token for them
 * 3. Sending a magic link email
 */

require('dotenv').config();

const { Pool } = require('pg');
const crypto = require('crypto');
const { createMagicLinkTemplateIfNotExists } = require('./check-email-templates.cjs');
// Cannot directly require TypeScript modules in CommonJS
// Instead we'll use direct database and SendGrid operations
const { MailService } = require('@sendgrid/mail');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Constants
const TOKEN_EXPIRY_MINUTES = 30;
const BASE_URL = 'https://matchpro.ai';

// Helper Functions
async function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getTestUser() {
  try {
    const result = await pool.query(`
      SELECT * FROM users 
      WHERE "isAdmin" = true 
      ORDER BY id 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      throw new Error("No admin user found for testing");
    }
    
    return result.rows[0];
  } catch (error) {
    console.error("Error finding test user:", error);
    throw error;
  }
}

async function createMagicLinkToken(userId) {
  try {
    const token = await generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60000);
    
    // Insert token into database
    const result = await pool.query(`
      INSERT INTO magic_link_tokens 
        (user_id, token, expires_at, used, user_agent, ip_address)
      VALUES 
        ($1, $2, $3, false, 'Test Browser', '127.0.0.1')
      RETURNING *
    `, [userId, token, expiresAt]);
    
    console.log(`Created token: ${token} for user ID: ${userId}, expires: ${expiresAt}`);
    return {
      token,
      tokenRecord: result.rows[0]
    };
  } catch (error) {
    console.error("Error creating magic link token:", error);
    throw error;
  }
}

async function sendMagicLinkEmail(user, token) {
  try {
    const firstName = user.firstName || 'User';
    const userType = user.isAdmin ? 'Administrator' : 'Member';
    const magicLinkUrl = `${BASE_URL}/auth/verify-magic-link?token=${token}`;

    console.log('Sending magic link email with the following details:');
    console.log(`- To: ${user.email}`);
    console.log(`- Name: ${firstName}`);
    console.log(`- Type: ${userType}`);
    console.log(`- Magic Link URL: ${magicLinkUrl}`);

    // Get template from database
    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE type = $1 AND is_active = true',
      ['magic_link']
    );
    
    let emailTemplate;
    if (templateResult.rows.length > 0) {
      console.log('Found magic_link template in database');
      const templateData = templateResult.rows[0];
      emailTemplate = {
        subject: templateData.subject,
        content: templateData.content,
        senderName: templateData.sender_name,
        senderEmail: templateData.sender_email
      };
    } else {
      console.log('No magic_link template found, using fallback');
      emailTemplate = {
        subject: 'Your MatchPro Login Link',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">MatchPro Login Link</h1>
            <p>Hello {{firstName}},</p>
            <p>You requested a secure login link for your MatchPro {{userType}} account. Click the button below to log in:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{magicLinkUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Log In Securely
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in {{expiryMinutes}} minutes and can only be used once.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this link, you can safely ignore this email.</p>
          </div>
        `,
        senderName: 'MatchPro',
        senderEmail: 'support@matchpro.ai'
      };
    }
    
    // Initialize SendGrid
    const mailService = new MailService();
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Prepare template variables
    const context = {
      firstName,
      userType,
      magicLinkUrl,
      expiryMinutes: String(TOKEN_EXPIRY_MINUTES)
    };
    
    // Render template with variables
    let subject = emailTemplate.subject;
    let html = emailTemplate.content;
    
    // Replace template variables
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, context[key]);
      html = html.replace(regex, context[key]);
    });
    
    // Send email with SendGrid
    const message = {
      to: user.email,
      from: `${emailTemplate.senderName} <${emailTemplate.senderEmail}>`,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, '') // Simple HTML to text conversion
    };
    
    console.log('Sending email with SendGrid...');
    const response = await mailService.send(message);
    console.log('SendGrid response:', response[0].statusCode);
    
    return response[0].statusCode >= 200 && response[0].statusCode < 300;
  } catch (error) {
    console.error('Error sending magic link email:', error);
    if (error.response && error.response.body) {
      console.error('SendGrid API error details:', error.response.body);
    }
    return false;
  }
}

// Check for SendGrid API Key
function checkSendGridApiKey() {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY environment variable is not set.');
    console.error('Please set this variable with a valid SendGrid API key to send emails.');
    return false;
  }
  return true;
}

// Main function
async function main() {
  // First check for SendGrid API key
  if (!checkSendGridApiKey()) {
    return;
  }
  
  try {
    // Get an admin user to test with
    const user = await getTestUser();
    console.log("Found test user:", user.email);
    
    // Create magic link token
    const { token, tokenRecord } = await createMagicLinkToken(user.id);
    
    // Send magic link email
    console.log("\nSending magic link email...");
    const result = await sendMagicLinkEmail(user, token);
    
    if (result) {
      console.log("✅ Magic link email sent successfully!");
    } else {
      console.log("❌ Failed to send magic link email.");
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await pool.end();
  }
}

// Run the test
main();