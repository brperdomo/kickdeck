/**
 * Check and Create Email Templates
 * 
 * This helper script ensures that essential email templates exist in the database.
 * It creates templates if they don't already exist.
 */

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Check if a template exists and create it if it doesn't
 */
async function createMagicLinkTemplateIfNotExists() {
  try {
    console.log('Setting up magic link email template...');
    
    // Check if template already exists
    const existingTemplate = await pool.query(
      'SELECT * FROM email_templates WHERE type = $1',
      ['magic_link']
    );
    
    if (existingTemplate.rows.length > 0) {
      console.log('Magic link email template already exists');
      return true;
    }
    
    // Create the template
    const template = {
      type: 'magic_link',
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
      senderEmail: 'support@matchpro.ai',
      isActive: true,
    };
    
    await pool.query(
      `INSERT INTO email_templates (type, subject, content, "senderName", "senderEmail", "isActive")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        template.type,
        template.subject,
        template.content,
        template.senderName,
        template.senderEmail,
        template.isActive
      ]
    );
    
    console.log('Created magic link email template');
    return true;
  } catch (error) {
    console.error('Error setting up magic link email template:', error);
    return false;
  }
}

// Export functions for use in other scripts
module.exports = {
  createMagicLinkTemplateIfNotExists
};