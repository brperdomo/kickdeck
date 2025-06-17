import { Router } from 'express';
import { db } from '@db/index';
import { emailTracking } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

interface SendGridEvent {
  email: string;
  timestamp: number;
  'smtp-id': string;
  event: string;
  category?: string[];
  sg_event_id: string;
  sg_message_id: string;
  reason?: string;
  status?: string;
  response?: string;
  useragent?: string;
  ip?: string;
  url?: string;
  url_offset?: {
    index: number;
    type: string;
  };
  template_id?: string;
  custom_args?: Record<string, string>;
}

/**
 * SendGrid webhook endpoint to receive email events
 */
router.post('/webhooks/sendgrid', async (req, res) => {
  try {
    const events: SendGridEvent[] = Array.isArray(req.body) ? req.body : [req.body];
    
    console.log(`📧 Received ${events.length} SendGrid webhook events`);
    
    for (const event of events) {
      try {
        await processWebhookEvent(event);
      } catch (error) {
        console.error('Error processing individual webhook event:', error);
        // Continue processing other events even if one fails
      }
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true, processed: events.length });
    
  } catch (error) {
    console.error('Error processing SendGrid webhook:', error);
    // Still return 200 to prevent SendGrid from retrying
    res.status(200).json({ success: false, error: 'Processing failed' });
  }
});

/**
 * Process individual SendGrid webhook event and update database
 */
async function processWebhookEvent(event: SendGridEvent) {
  const eventType = event.event;
  const timestamp = new Date(event.timestamp * 1000).toISOString();
  
  console.log(`Processing ${eventType} event for ${event.email} at ${timestamp}`);
  
  // Try to find existing email tracking record by SendGrid message ID
  let trackingRecord = null;
  if (event.sg_message_id) {
    const existing = await db
      .select()
      .from(emailTracking)
      .where(eq(emailTracking.sendgridMessageId, event.sg_message_id))
      .limit(1);
    
    trackingRecord = existing[0] || null;
  }
  
  // If no existing record found, create a new one
  if (!trackingRecord) {
    try {
      const newRecord = {
        recipientEmail: event.email,
        emailType: event.template_id ? 'template' : 'regular',
        templateId: event.template_id || null,
        sendgridMessageId: event.sg_message_id,
        status: eventType === 'delivered' ? 'delivered' : 
                eventType === 'bounce' || eventType === 'dropped' ? 'failed' : 'sent',
        sentAt: timestamp,
        deliveredAt: eventType === 'delivered' ? timestamp : null,
        errorMessage: event.reason || null,
        webhookData: JSON.stringify(event)
      };
      
      await db.insert(emailTracking).values(newRecord);
      console.log(`✅ Created new tracking record for ${event.email}`);
      
    } catch (insertError) {
      console.error('Error inserting new tracking record:', insertError);
    }
  } else {
    // Update existing record with new event information
    const updateData: any = {
      webhookData: JSON.stringify(event)
    };
    
    // Update status based on event type
    if (eventType === 'delivered') {
      updateData.status = 'delivered';
      updateData.deliveredAt = timestamp;
    } else if (eventType === 'bounce' || eventType === 'dropped') {
      updateData.status = 'failed';
      updateData.errorMessage = event.reason || 'Email bounced or dropped';
    } else if (eventType === 'open') {
      updateData.openedAt = timestamp;
    } else if (eventType === 'click') {
      updateData.clickedAt = timestamp;
    }
    
    try {
      await db
        .update(emailTracking)
        .set(updateData)
        .where(eq(emailTracking.id, trackingRecord.id));
      
      console.log(`✅ Updated tracking record for ${event.email} with ${eventType} event`);
      
    } catch (updateError) {
      console.error('Error updating tracking record:', updateError);
    }
  }
  
  // Log important events for immediate visibility
  if (eventType === 'delivered') {
    console.log(`🎉 EMAIL DELIVERED: ${event.email} via SendGrid`);
  } else if (eventType === 'bounce') {
    console.log(`❌ EMAIL BOUNCED: ${event.email} - ${event.reason}`);
  } else if (eventType === 'dropped') {
    console.log(`⚠️ EMAIL DROPPED: ${event.email} - ${event.reason}`);
  }
}

/**
 * Get email activity dashboard for admin users
 */
router.get('/admin/email-activity', async (req, res) => {
  try {
    const { limit = '50', offset = '0', status, email_type } = req.query;
    
    // Build where conditions
    const whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(emailTracking.status, status as string));
    }
    
    if (email_type) {
      whereConditions.push(eq(emailTracking.emailType, email_type as string));
    }
    
    // Get recent email activity
    const emails = await db
      .select()
      .from(emailTracking)
      .where(whereConditions.length > 0 ? eq(emailTracking.status, status as string) : undefined)
      .orderBy(emailTracking.sentAt)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    // Get summary statistics
    const allEmails = await db.select().from(emailTracking);
    const stats = {
      total: allEmails.length,
      delivered: allEmails.filter(e => e.status === 'delivered').length,
      failed: allEmails.filter(e => e.status === 'failed').length,
      sent: allEmails.filter(e => e.status === 'sent').length
    };
    
    res.json({
      success: true,
      data: {
        emails,
        stats,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: emails.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching email activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email activity'
    });
  }
});

export default router;