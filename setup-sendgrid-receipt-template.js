/**
 * Setup SendGrid Registration Receipt Template
 * 
 * This script creates an email template record that uses SendGrid's dynamic templates
 * for sending registration receipt emails.
 */

const { db } = require('./server/db/index');
const { emailTemplates } = require('./server/db/schema/emailTemplates');
const { eq } = require('drizzle-orm');

async function setupSendGridReceiptTemplate() {
  try {
    console.log("Setting up SendGrid registration receipt template...");
    
    // Check if the template already exists
    const existingTemplates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'registration_receipt'));

    if (existingTemplates && existingTemplates.length > 0) {
      console.log("Registration receipt email template already exists, updating with SendGrid template ID...");
      
      // Prompt for SendGrid template ID
      const sendgridTemplateId = process.argv[2];
      
      if (!sendgridTemplateId) {
        console.error("SendGrid template ID required. Usage: node setup-sendgrid-receipt-template.js d-your-template-id");
        process.exit(1);
      }
      
      // Update existing template with SendGrid template ID
      await db
        .update(emailTemplates)
        .set({
          sendgridTemplateId: sendgridTemplateId,
          updatedAt: new Date()
        })
        .where(eq(emailTemplates.type, 'registration_receipt'));
      
      console.log(`Registration receipt email template updated with SendGrid template ID: ${sendgridTemplateId}`);
    } else {
      // Prompt for SendGrid template ID
      const sendgridTemplateId = process.argv[2];
      
      if (!sendgridTemplateId) {
        console.error("SendGrid template ID required. Usage: node setup-sendgrid-receipt-template.js d-your-template-id");
        process.exit(1);
      }
      
      // Create new template with SendGrid template ID
      await db.insert(emailTemplates).values({
        name: 'Registration Receipt',
        description: 'SendGrid dynamic template for registration receipts',
        type: 'registration_receipt',
        subject: 'Your Registration Receipt for {{eventName}}',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.io',
        isActive: true,
        sendgridTemplateId: sendgridTemplateId,
        variables: [
          'teamName',
          'eventName',
          'submitterName',
          'submitterEmail',
          'registrationDate',
          'totalAmount',
          'paymentStatus',
          'paymentDate',
          'paymentMethod',
          'cardLastFour',
          'cardBrand',
          'paymentId',
          'selectedFees',
          'loginLink',
          'clubName',
          'currentYear'
        ],
        content: 'This template uses SendGrid dynamic templates. The content is managed in SendGrid.',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Registration receipt email template created with SendGrid template ID: ${sendgridTemplateId}`);
    }
    
    console.log("\nNEXT STEPS:");
    console.log("1. Create a dynamic template in SendGrid with the ID you provided");
    console.log("2. In the SendGrid template, use the variable names listed above");
    console.log("3. Make sure the SendGrid template includes all the necessary sections:");
    console.log("   - Registration details (team name, event, date, submitter)");
    console.log("   - Payment information (status, date, transaction ID, payment method)");
    console.log("   - Fee breakdown (itemized fees and total amount)");
    
    return { success: true };
  } catch (error) {
    console.error("Error setting up SendGrid receipt template:", error);
    return { success: false, error };
  } finally {
    // Close the database connection
    try {
      await db.end();
    } catch (err) {
      console.error("Error closing database connection:", err);
    }
  }
}

// Run the script if executed directly
setupSendGridReceiptTemplate()
  .then(result => {
    if (result.success) {
      console.log("Setup completed successfully");
      process.exit(0);
    } else {
      console.error("Setup failed:", result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });