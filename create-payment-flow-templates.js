/**
 * Create Payment Flow Email Templates Script
 * 
 * This script creates the email templates needed for the two-step payment flow:
 * 1. Registration submission with payment method but not charged yet
 * 2. Team approved and payment processed
 * 3. Team rejected with no payment processed
 * 4. Team waitlisted
 * 
 * Usage:
 *   node create-payment-flow-templates.js
 */

const { db } = require('./server/db/index');
const { emailTemplates } = require('./server/db/schema');
const { eq } = require('drizzle-orm');

/**
 * Create all payment flow related email templates if they don't exist
 */
async function createPaymentFlowTemplates() {
  console.log("Creating payment flow email templates...");
  
  try {
    // Define the templates to create
    const templatesData = [
      {
        name: 'Registration Submission',
        description: 'Sent when a team registration is submitted with payment info but not charged yet',
        type: 'registration_submission',
        subject: 'Registration Confirmation - {{teamName}} for {{eventName}}',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.io',
        isActive: true,
        variables: [
          'submitterName',
          'submitterEmail',
          'teamName', 
          'eventName',
          'ageGroup',
          'registrationDate',
          'clubName',
          'totalAmount',
          'setupIntentId',
          'cardBrand',
          'cardLastFour',
          'selectedFees',
          'loginLink',
          'supportEmail',
          'branding.primaryColor',
          'branding.logoUrl',
          'organizationName',
          'currentYear'
        ]
      },
      {
        name: 'Team Approved - Payment Processed',
        description: 'Sent when a team is approved and payment is processed',
        type: 'team_approved_payment',
        subject: 'Payment Confirmation - {{teamName}} for {{eventName}}',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.io',
        isActive: true,
        variables: [
          'submitterName', 
          'submitterEmail',
          'teamName', 
          'eventName',
          'ageGroup',
          'registrationDate',
          'clubName',
          'totalAmount',
          'paymentDate',
          'paymentId',
          'receiptNumber',
          'cardBrand',
          'cardLastFour',
          'selectedFees',
          'loginLink',
          'supportEmail',
          'branding.primaryColor',
          'branding.logoUrl',
          'organizationName',
          'currentYear'
        ]
      },
      {
        name: 'Team Rejected - No Payment',
        description: 'Sent when a team is rejected and no payment is processed',
        type: 'team_rejected',
        subject: 'Registration Status Update - {{teamName}} for {{eventName}}',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.io',
        isActive: true,
        variables: [
          'submitterName',
          'submitterEmail',
          'teamName', 
          'eventName',
          'ageGroup',
          'registrationDate',
          'clubName',
          'rejectionReason',
          'setupIntentId',
          'cardBrand',
          'cardLastFour',
          'eventsListUrl',
          'supportEmail',
          'branding.primaryColor',
          'branding.logoUrl',
          'organizationName',
          'currentYear'
        ]
      },
      {
        name: 'Team Waitlisted',
        description: 'Sent when a team is placed on the waitlist',
        type: 'team_waitlisted',
        subject: 'Waitlist Notification - {{teamName}} for {{eventName}}',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.io',
        isActive: true,
        variables: [
          'submitterName',
          'submitterEmail',
          'teamName', 
          'eventName',
          'ageGroup',
          'registrationDate',
          'clubName',
          'totalAmount',
          'setupIntentId',
          'cardBrand',
          'cardLastFour',
          'selectedFees',
          'waitlistPosition',
          'waitlistNote',
          'loginLink',
          'supportEmail',
          'branding.primaryColor',
          'branding.logoUrl',
          'organizationName',
          'currentYear'
        ]
      }
    ];
    
    // Check for and create each template
    for (const templateData of templatesData) {
      // Check if template already exists
      const existingTemplates = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.type, templateData.type));
      
      if (existingTemplates && existingTemplates.length > 0) {
        console.log(`Email template '${templateData.name}' already exists`);
      } else {
        // Create new template
        await db.insert(emailTemplates).values({
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          subject: templateData.subject,
          senderName: templateData.senderName,
          senderEmail: templateData.senderEmail,
          isActive: templateData.isActive,
          variables: templateData.variables
        });
        
        console.log(`Created email template: ${templateData.name}`);
      }
    }
    
    console.log("All payment flow email templates created successfully!");
    return { success: true };
  } catch (error) {
    console.error('Error creating payment flow email templates:', error);
    return { success: false, error };
  } finally {
    // Close the database connection
    try {
      await db.end();
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

/**
 * Main function to handle script execution
 */
async function main() {
  try {
    const result = await createPaymentFlowTemplates();
    if (result.success) {
      console.log('Payment flow email templates setup completed successfully!');
      process.exit(0);
    } else {
      console.error('Failed to set up payment flow email templates');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing script:', error);
    process.exit(1);
  }
}

// Run the script
main();