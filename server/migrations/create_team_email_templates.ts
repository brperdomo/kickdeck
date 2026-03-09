// Import using relative paths
import { db } from "../../db/index";
import { emailTemplates } from "../../db/schema";

/**
 * Migration to create default team-related email templates
 */
export async function createTeamEmailTemplates() {
  console.log("Starting migration to create team-related email templates...");
  
  try {
    // Template types to check for
    const templateTypes = [
      {
        type: 'team_status_update',
        name: 'Team Status Update',
        description: 'Notification when a team status is updated',
        subject: 'Your Team Registration Status Has Been Updated',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.xyz',
        variables: [
          'teamName',
          'eventName',
          'status',
          'previousStatus',
          'notes',
          'loginLink'
        ],
        // This is a minimal template - to be customized in the admin UI
        content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .content { padding: 20px; }
    .button { 
      display: inline-block; 
      background: #2563eb; 
      color: white; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin-top: 15px;
    }
    .message { margin: 20px 0; }
    .details { margin: 20px 0; background: #f1f5f9; padding: 15px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Team Registration Update</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p class="message">Your team registration status for <strong>{{teamName}}</strong> in <strong>{{eventName}}</strong> has been updated.</p>
      
      <div class="details">
        <p><strong>Previous Status:</strong> {{previousStatus}}</p>
        <p><strong>New Status:</strong> {{status}}</p>
        <p><strong>Notes:</strong> {{notes}}</p>
      </div>
      
      <p>Please visit your dashboard to view your registration details and take any necessary actions.</p>
      
      <div style="text-align: center;">
        <a href="{{loginLink}}" class="button">Go to Dashboard</a>
      </div>
      
      <p>If you have any questions, please contact our support team.</p>
      <p>Thank you,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
        `
      },
      {
        type: 'team_approved',
        name: 'Team Approved',
        description: 'Notification when a team is approved',
        subject: 'Congratulations! Your Team Registration Has Been Approved',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.xyz',
        variables: [
          'teamName',
          'eventName',
          'notes',
          'loginLink'
        ],
        content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .content { padding: 20px; }
    .button { 
      display: inline-block; 
      background: #2563eb; 
      color: white; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin-top: 15px;
    }
    .message { margin: 20px 0; }
    .success-banner { 
      background-color: #10b981; 
      color: white; 
      padding: 15px; 
      border-radius: 4px; 
      text-align: center;
      margin: 20px 0;
    }
    .notes { margin: 20px 0; background: #f1f5f9; padding: 15px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Registration Approved!</h1>
    </div>
    <div class="content">
      <div class="success-banner">
        <h2>Congratulations!</h2>
        <p>Your team has been officially approved to participate</p>
      </div>
      
      <p>Hello,</p>
      <p class="message">We're pleased to inform you that your team <strong>{{teamName}}</strong> has been approved for <strong>{{eventName}}</strong>.</p>
      
      <div class="notes">
        <p><strong>Additional Information:</strong> {{notes}}</p>
      </div>
      
      <p>Visit your dashboard to view all event details and your team's information.</p>
      
      <div style="text-align: center;">
        <a href="{{loginLink}}" class="button">Go to Dashboard</a>
      </div>
      
      <p>Thank you for registering. We look forward to your participation!</p>
      <p>Best regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
        `
      },
      {
        type: 'team_rejected',
        name: 'Team Rejected',
        description: 'Notification when a team is rejected',
        subject: 'Important Information About Your Team Registration',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.xyz',
        variables: [
          'teamName',
          'eventName',
          'notes',
          'loginLink'
        ],
        content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .content { padding: 20px; }
    .button { 
      display: inline-block; 
      background: #2563eb; 
      color: white; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin-top: 15px;
    }
    .message { margin: 20px 0; }
    .alert-banner { 
      background-color: #ef4444; 
      color: white; 
      padding: 15px; 
      border-radius: 4px; 
      text-align: center;
      margin: 20px 0;
    }
    .notes { margin: 20px 0; background: #f1f5f9; padding: 15px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Registration Status Update</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p class="message">We regret to inform you that your team <strong>{{teamName}}</strong> registration for <strong>{{eventName}}</strong> has not been approved.</p>
      
      <div class="notes">
        <p><strong>Reason:</strong> {{notes}}</p>
      </div>
      
      <p>If you believe this is an error or if you need more information, please contact our support team.</p>
      
      <div style="text-align: center;">
        <a href="{{loginLink}}" class="button">Go to Dashboard</a>
      </div>
      
      <p>Thank you for your understanding.</p>
      <p>Regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
        `
      },
      {
        type: 'team_withdrawn',
        name: 'Team Withdrawn',
        description: 'Notification when a team is withdrawn',
        subject: 'Your Team Registration Status: Withdrawn',
        senderName: 'KickDeck Registration',
        senderEmail: 'support@kickdeck.xyz',
        variables: [
          'teamName',
          'eventName',
          'notes',
          'loginLink'
        ],
        content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .content { padding: 20px; }
    .button { 
      display: inline-block; 
      background: #2563eb; 
      color: white; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin-top: 15px;
    }
    .message { margin: 20px 0; }
    .info-banner { 
      background-color: #f59e0b; 
      color: white; 
      padding: 15px; 
      border-radius: 4px; 
      text-align: center;
      margin: 20px 0;
    }
    .notes { margin: 20px 0; background: #f1f5f9; padding: 15px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Registration Withdrawn</h1>
    </div>
    <div class="content">
      <div class="info-banner">
        <h2>Registration Status: Withdrawn</h2>
      </div>
      
      <p>Hello,</p>
      <p class="message">This email confirms that your team <strong>{{teamName}}</strong> has been withdrawn from <strong>{{eventName}}</strong>.</p>
      
      <div class="notes">
        <p><strong>Additional Information:</strong> {{notes}}</p>
      </div>
      
      <p>If you did not request this change or if you have any questions, please contact our support team immediately.</p>
      
      <div style="text-align: center;">
        <a href="{{loginLink}}" class="button">Go to Dashboard</a>
      </div>
      
      <p>Thank you for your understanding.</p>
      <p>Regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
        `
      },
      {
        type: 'payment_confirmation',
        name: 'Payment Confirmation',
        description: 'Confirmation after successful payment',
        subject: 'Payment Confirmation for {{teamName}}',
        senderName: 'KickDeck Payments',
        senderEmail: 'no-reply@kickdeck.xyz',
        variables: [
          'teamName',
          'eventName',
          'registrationDate',
          'amount',
          'ageGroup',
          'paymentId',
          'receiptNumber',
          'status'
        ],
        content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .content { padding: 20px; }
    .button { 
      display: inline-block; 
      background: #2563eb; 
      color: white; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin-top: 15px;
    }
    .receipt { 
      border: 1px solid #ddd; 
      padding: 20px; 
      margin-top: 20px; 
      background-color: #f8fafc;
    }
    .receipt-header {
      text-align: center;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .receipt-total {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      font-weight: bold;
      border-top: 2px solid #ddd;
      margin-top: 15px;
    }
    .success-icon {
      text-align: center;
      font-size: 48px;
      color: #10b981;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Confirmation</h1>
    </div>
    <div class="content">
      <div class="success-icon">✓</div>
      <p>Thank you for your payment! This email confirms that we have received your registration fee for <strong>{{teamName}}</strong>.</p>
      
      <div class="receipt">
        <div class="receipt-header">
          <h2>Receipt</h2>
          <p>Receipt #: {{receiptNumber}}</p>
          <p>Date: {{registrationDate}}</p>
        </div>
        
        <div class="receipt-row">
          <div>Event:</div>
          <div>{{eventName}}</div>
        </div>
        <div class="receipt-row">
          <div>Team:</div>
          <div>{{teamName}}</div>
        </div>
        <div class="receipt-row">
          <div>Age Group:</div>
          <div>{{ageGroup}}</div>
        </div>
        <div class="receipt-row">
          <div>Payment ID:</div>
          <div>{{paymentId}}</div>
        </div>
        <div class="receipt-row">
          <div>Status:</div>
          <div>{{status}}</div>
        </div>
        <div class="receipt-total">
          <div>Total Paid:</div>
          <div>{{amount}}</div>
        </div>
      </div>
      
      <p>Please keep this receipt for your records. If you have any questions about your payment or registration, please contact our support team.</p>
      
      <p>Thank you for your registration!</p>
      <p>Best regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This is an automated receipt. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
        `
      },
      {
        type: 'payment_refunded',
        name: 'Payment Refunded',
        description: 'Notification when a payment is refunded',
        subject: 'Refund Confirmation for {{teamName}}',
        senderName: 'KickDeck Payments',
        senderEmail: 'no-reply@kickdeck.xyz',
        variables: [
          'teamName',
          'eventName',
          'amount',
          'reason',
          'refundDate'
        ],
        content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .content { padding: 20px; }
    .refund-details { 
      border: 1px solid #ddd; 
      padding: 20px; 
      margin-top: 20px; 
      background-color: #f8fafc;
    }
    .refund-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .refund-total {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      font-weight: bold;
      border-top: 2px solid #ddd;
      margin-top: 15px;
    }
    .info-icon {
      text-align: center;
      font-size: 48px;
      color: #3b82f6;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Confirmation</h1>
    </div>
    <div class="content">
      <div class="info-icon">ⓘ</div>
      <p>This email confirms that a refund has been processed for your team <strong>{{teamName}}</strong> registration in <strong>{{eventName}}</strong>.</p>
      
      <div class="refund-details">
        <h2>Refund Details</h2>
        <div class="refund-row">
          <div>Team:</div>
          <div>{{teamName}}</div>
        </div>
        <div class="refund-row">
          <div>Event:</div>
          <div>{{eventName}}</div>
        </div>
        <div class="refund-row">
          <div>Refund Date:</div>
          <div>{{refundDate}}</div>
        </div>
        <div class="refund-row">
          <div>Reason:</div>
          <div>{{reason}}</div>
        </div>
        <div class="refund-total">
          <div>Refund Amount:</div>
          <div>\${{amount}}</div>
        </div>
      </div>
      
      <p>The refunded amount will be credited back to the original payment method used for the registration. Please allow 5-10 business days for the refund to appear on your statement, depending on your financial institution.</p>
      
      <p>If you have any questions about this refund, please contact our support team.</p>
      
      <p>Thank you for your understanding.</p>
      <p>Regards,<br>The KickDeck Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
        `
      }
    ];
    
    // Check if the templates already exist and create them if they don't
    for (const templateData of templateTypes) {
      // Use the eq operator from Drizzle for safe comparison
      const { eq } = await import('drizzle-orm');
      
      const existingTemplate = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.type, templateData.type)
      });
      
      if (!existingTemplate) {
        // Convert camelCase to snake_case for Drizzle schema
        await db.insert(emailTemplates).values({
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          subject: templateData.subject,
          content: templateData.content,
          sender_name: templateData.senderName,
          sender_email: templateData.senderEmail,
          is_active: true,
          variables: templateData.variables,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        console.log(`${templateData.name} template created`);
      } else {
        console.log(`${templateData.name} template already exists`);
      }
    }
    
    console.log("Team email templates migration completed successfully");
    return { success: true };
  } catch (error) {
    console.error('Error creating team email templates:', error);
    return { success: false, error };
  }
}

// Run the migration directly if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTeamEmailTemplates().then(result => {
    if (result.success) {
      console.log('Migration completed successfully');
      process.exit(0);
    } else {
      console.error('Migration failed');
      process.exit(1);
    }
  });
}