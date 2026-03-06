/**
 * Update Refund Email Template for Partial Refunds
 * 
 * This script updates the payment_refunded email template 
 * to support both full and partial refund scenarios.
 */

import { db } from './db/index.js';
import { emailTemplates } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function updateRefundEmailTemplate() {
  try {
    console.log('Updating refund email template to support partial refunds...');
    
    // Check if the template already exists
    const existingTemplate = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.type, 'payment_refunded')
    });
    
    if (!existingTemplate) {
      console.log('Refund email template not found. Creating new template...');
      // Create the template if it doesn't exist
      await createRefundEmailTemplate();
      return;
    }
    
    // Update the template to include variables for partial refunds
    const updatedVariables = [
      'teamName',
      'eventName',
      'amount',
      'reason',
      'refundDate',
      'isPartial',
      'originalAmount'
    ];
    
    // Update the template content
    const updatedContent = `
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
    .partial-notice {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 4px;
      padding: 12px;
      margin: 15px 0;
      color: #92400e;
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
      
      {{#if isPartial}}
      <p>This email confirms that a <strong>partial refund</strong> has been processed for your team <strong>{{teamName}}</strong> registration in <strong>{{eventName}}</strong>.</p>
      <div class="partial-notice">
        <strong>Note:</strong> This is a partial refund. Your team registration remains active.
      </div>
      {{else}}
      <p>This email confirms that a refund has been processed for your team <strong>{{teamName}}</strong> registration in <strong>{{eventName}}</strong>.</p>
      {{/if}}
      
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
        
        {{#if isPartial}}
        <div class="refund-row">
          <div>Original Payment:</div>
          <div>${{originalAmount}}</div>
        </div>
        {{/if}}
        
        <div class="refund-total">
          <div>Refund Amount:</div>
          <div>${{amount}}</div>
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
    `;
    
    // Update the template in the database
    await db.update(emailTemplates)
      .set({
        variables: updatedVariables,
        content: updatedContent,
        updatedAt: new Date().toISOString()
      })
      .where(eq(emailTemplates.type, 'payment_refunded'));
    
    console.log('Refund email template updated successfully to support partial refunds');
  } catch (error) {
    console.error('Error updating refund email template:', error);
    throw error;
  }
}

async function createRefundEmailTemplate() {
  try {
    // Create the full template from scratch
    await db.insert(emailTemplates).values({
      name: 'Payment Refunded',
      description: 'Notification when a payment is refunded (full or partial)',
      type: 'payment_refunded',
      subject: 'Refund Confirmation for {{teamName}}',
      senderName: 'KickDeck Payments',
      senderEmail: 'payments@kickdeck.io',
      variables: [
        'teamName',
        'eventName',
        'amount',
        'reason',
        'refundDate',
        'isPartial',
        'originalAmount'
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
    .partial-notice {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 4px;
      padding: 12px;
      margin: 15px 0;
      color: #92400e;
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
      
      {{#if isPartial}}
      <p>This email confirms that a <strong>partial refund</strong> has been processed for your team <strong>{{teamName}}</strong> registration in <strong>{{eventName}}</strong>.</p>
      <div class="partial-notice">
        <strong>Note:</strong> This is a partial refund. Your team registration remains active.
      </div>
      {{else}}
      <p>This email confirms that a refund has been processed for your team <strong>{{teamName}}</strong> registration in <strong>{{eventName}}</strong>.</p>
      {{/if}}
      
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
        
        {{#if isPartial}}
        <div class="refund-row">
          <div>Original Payment:</div>
          <div>${{originalAmount}}</div>
        </div>
        {{/if}}
        
        <div class="refund-total">
          <div>Refund Amount:</div>
          <div>${{amount}}</div>
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
      `,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('Refund email template created successfully');
  } catch (error) {
    console.error('Error creating refund email template:', error);
    throw error;
  }
}

// Self-executing async function
(async () => {
  try {
    await updateRefundEmailTemplate();
    console.log('Operation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
})();