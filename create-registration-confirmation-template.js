/**
 * Create Registration Confirmation Email Template
 * 
 * This script creates the email template for the setup intent payment workflow
 * where teams submit registration and payment info but aren't charged yet.
 */

import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

async function createRegistrationConfirmationTemplate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Creating registration confirmation email template...");
    
    // Read the HTML template content
    const htmlContent = fs.readFileSync('registration-confirmation-template.html', 'utf8');
    
    // Check if the template already exists
    const existingResult = await pool.query(
      'SELECT * FROM email_templates WHERE type = $1',
      ['registration_confirmation']
    );

    const variables = JSON.stringify([
      'submitterName',
      'submitterEmail', 
      'teamName',
      'eventName',
      'ageGroup',
      'bracket',
      'clubName',
      'registrationDate',
      'headCoachName',
      'managerName',
      'managerEmail',
      'managerPhone',
      'totalAmount',
      'selectedFees',
      'cardBrand',
      'cardLastFour',
      'setupIntentId',
      'addRosterLater',
      'loginLink',
      'supportEmail',
      'branding.primaryColor',
      'branding.logoUrl',
      'organizationName',
      'currentYear'
    ]);

    if (existingResult.rows.length > 0) {
      console.log("Registration confirmation template already exists, updating...");
      
      // Update the existing template
      await pool.query(
        `UPDATE email_templates SET 
         name = $1, 
         description = $2, 
         subject = $3, 
         content = $4,
         sender_name = $5, 
         sender_email = $6, 
         is_active = $7, 
         variables = $8, 
         updated_at = $9
         WHERE type = $10`,
        [
          'Registration Confirmation',
          'Sent when team registration is submitted with setup intent (payment method saved but not charged)',
          'Registration Confirmation - {{teamName}} for {{eventName}}',
          htmlContent,
          'MatchPro Registration',
          'support@matchpro.ai',
          true,
          variables,
          new Date().toISOString(),
          'registration_confirmation'
        ]
      );
        
      console.log("Registration confirmation template updated successfully!");
    } else {
      // Create new template
      await pool.query(
        `INSERT INTO email_templates (name, type, description, subject, content, sender_name, sender_email, is_active, variables, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          'Registration Confirmation',
          'registration_confirmation',
          'Sent when team registration is submitted with setup intent (payment method saved but not charged)',
          'Registration Confirmation - {{teamName}} for {{eventName}}',
          htmlContent,
          'MatchPro Registration',
          'support@matchpro.ai',
          true,
          variables,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      console.log("Registration confirmation template created successfully!");
    }

    console.log("Template variables available:");
    console.log("- Team info: teamName, eventName, ageGroup, bracket, clubName");
    console.log("- Contact info: submitterName, submitterEmail, headCoachName, managerName, managerEmail, managerPhone");
    console.log("- Registration: registrationDate, totalAmount, selectedFees, addRosterLater");
    console.log("- Payment: cardBrand, cardLastFour, setupIntentId");
    console.log("- System: loginLink, supportEmail, organizationName, currentYear");
    console.log("- Branding: branding.primaryColor, branding.logoUrl");

    return { success: true };
  } catch (error) {
    console.error('Error creating registration confirmation template:', error);
    return { success: false, error };
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    const result = await createRegistrationConfirmationTemplate();
    if (result.success) {
      console.log('\nRegistration confirmation email template setup completed successfully!');
      console.log('Next steps:');
      console.log('1. Create the corresponding SendGrid dynamic template');
      console.log('2. Copy the HTML from registration-confirmation-template.html');
      console.log('3. Map the SendGrid template ID to the registration_confirmation type');
      process.exit(0);
    } else {
      console.error('Failed to set up registration confirmation email template');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing script:', error);
    process.exit(1);
  }
}

// Run the script if called directly
main();