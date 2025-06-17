import { Router } from 'express';
import { db } from '@db/index';
import { sql } from 'drizzle-orm';

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
  
  try {
    // Try to find existing email tracking record by SendGrid message ID
    const existingQuery = await db.execute(sql`
      SELECT * FROM email_tracking 
      WHERE sendgrid_message_id = ${event.sg_message_id}
      LIMIT 1
    `);
    
    const trackingRecord = existingQuery.rows[0] || null;
    
    // If no existing record found, create a new one
    if (!trackingRecord) {
      const status = eventType === 'delivered' ? 'delivered' : 
                    eventType === 'bounce' || eventType === 'dropped' ? 'failed' : 'sent';
      
      await db.execute(sql`
        INSERT INTO email_tracking (
          recipient_email, email_type, template_id, sendgrid_message_id, 
          status, sent_at, delivered_at, error_message, webhook_data
        ) VALUES (
          ${event.email},
          ${event.template_id ? 'template' : 'regular'},
          ${event.template_id || null},
          ${event.sg_message_id},
          ${status},
          ${timestamp}::timestamp,
          ${eventType === 'delivered' ? timestamp : null}::timestamp,
          ${event.reason || null},
          ${JSON.stringify(event)}::jsonb
        )
      `);
      
      console.log(`✅ Created new tracking record for ${event.email}`);
      
    } else {
      // Update existing record with new event information
      let updateQuery = `UPDATE email_tracking SET webhook_data = $1, updated_at = $2`;
      const params = [JSON.stringify(event), timestamp];
      let paramIndex = 3;
      
      // Update status based on event type
      if (eventType === 'delivered') {
        updateQuery += `, status = $${paramIndex}, delivered_at = $${paramIndex + 1}`;
        params.push('delivered', timestamp);
        paramIndex += 2;
      } else if (eventType === 'bounce' || eventType === 'dropped') {
        updateQuery += `, status = $${paramIndex}, error_message = $${paramIndex + 1}`;
        params.push('failed', event.reason || 'Email bounced or dropped');
        paramIndex += 2;
      } else if (eventType === 'open') {
        updateQuery += `, opened_at = $${paramIndex}`;
        params.push(timestamp);
        paramIndex += 1;
      } else if (eventType === 'click') {
        updateQuery += `, clicked_at = $${paramIndex}`;
        params.push(timestamp);
        paramIndex += 1;
      }
      
      updateQuery += ` WHERE id = $${paramIndex}`;
      params.push(trackingRecord.id);
      
      await db.execute(sql.raw(updateQuery, params));
      console.log(`✅ Updated tracking record for ${event.email} with ${eventType} event`);
    }
    
    // Log important events for immediate visibility
    if (eventType === 'delivered') {
      console.log(`🎉 EMAIL DELIVERED: ${event.email} via SendGrid`);
    } else if (eventType === 'bounce') {
      console.log(`❌ EMAIL BOUNCED: ${event.email} - ${event.reason}`);
    } else if (eventType === 'dropped') {
      console.log(`⚠️ EMAIL DROPPED: ${event.email} - ${event.reason}`);
    }
    
  } catch (error) {
    console.error('Error processing webhook event:', error);
  }
}

/**
 * Get email activity dashboard for admin users
 */
router.get('/admin/email-activity', async (req, res) => {
  try {
    const { limit = '50', offset = '0', status, email_type } = req.query;
    
    // Build where clause
    let whereClause = '';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += `WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (email_type) {
      whereClause += whereClause ? ` AND email_type = $${paramIndex}` : `WHERE email_type = $${paramIndex}`;
      params.push(email_type);
      paramIndex++;
    }
    
    // Get recent email activity
    const emailsQuery = await db.execute(sql.raw(`
      SELECT * FROM email_tracking
      ${whereClause}
      ORDER BY sent_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, parseInt(limit as string), parseInt(offset as string)]));
    
    // Get summary statistics
    const statsQuery = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent
      FROM email_tracking
    `);
    
    const stats = statsQuery.rows[0];
    
    res.json({
      success: true,
      data: {
        emails: emailsQuery.rows,
        stats: {
          total: parseInt(stats.total),
          delivered: parseInt(stats.delivered),
          failed: parseInt(stats.failed),
          sent: parseInt(stats.sent)
        },
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: emailsQuery.rows.length
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