/**
 * Create Team Waitlist Email Template Migration
 */
import { db } from "@db";
import { emailTemplates } from "@db/schema";
import { eq } from "drizzle-orm";

export async function createTeamWaitlistTemplate() {
  console.log("Starting to create team waitlist email template...");
  
  try {
    // Check if the template already exists
    const existingTemplate = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, 'team_waitlisted'));
    
    if (existingTemplate && existingTemplate.length > 0) {
      console.log("Team waitlist email template already exists");
      return { success: true, existing: true };
    }
    
    // Create the template
    const templateData = {
      type: 'team_waitlisted',
      name: 'Team Waitlisted',
      description: 'Notification when a team is placed on the waitlist',
      subject: 'Your Team Has Been Placed on the Waitlist',
      senderName: 'KickDeck Registration',
      senderEmail: 'support@kickdeck.io',
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
    .details { margin: 20px 0; background: #f1f5f9; padding: 15px; border-radius: 4px; }
    .waitlist-banner { 
      background-color: #f59e0b; 
      color: white;
      padding: 10px;
      margin: 15px 0;
      border-radius: 4px;
      text-align: center;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Team Waitlist Notification</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p class="message">Your team <strong>{{teamName}}</strong> has been placed on the waitlist for <strong>{{eventName}}</strong>.</p>
      
      <div class="waitlist-banner">
        WAITLISTED
      </div>
      
      <div class="details">
        <p>Being on the waitlist means your team may be approved at a later date if space becomes available. If your team is not ultimately approved to participate, your payment will be refunded.</p>
        
        <p><strong>Notes:</strong> {{notes}}</p>
      </div>
      
      <p>Please visit your dashboard to view your registration details and monitor your status.</p>
      
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
    };
    
    // Insert the template into the database
    await db.insert(emailTemplates).values({
      type: templateData.type,
      name: templateData.name,
      description: templateData.description,
      subject: templateData.subject,
      content: templateData.content,
      sender_name: templateData.senderName,
      sender_email: templateData.senderEmail,
      is_active: true,
      variables: templateData.variables,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    console.log("Team waitlist email template created successfully");
    return { success: true };
  } catch (error) {
    console.error('Error creating team waitlist email template:', error);
    return { success: false, error };
  }
}

// Run immediately in ES module
createTeamWaitlistTemplate().then(result => {
  if (result.success) {
    console.log("✅ Team waitlist email template created successfully");
  } else {
    console.error("❌ Failed to create team waitlist email template:", result.error);
    process.exit(1);
  }
}).catch(error => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
