import { Router } from "express";
import { db } from "@db/index";
import { sql } from "drizzle-orm";

const router = Router();

interface BrevoEvent {
  email: string;
  event: string;
  date: string;
  ts?: number;
  ts_event?: number;
  "message-id"?: string;
  tag?: string;
  tags?: string[];
  reason?: string;
  subject?: string;
  template_id?: number;
  link?: string;
  sending_ip?: string;
}

/**
 * Brevo webhook endpoint to receive email events
 * Note: Brevo sends events as single objects (not arrays like SendGrid)
 */
router.post("/webhooks/brevo", async (req, res) => {
  try {
    // Brevo sends single event objects, but handle arrays just in case
    const events: BrevoEvent[] = Array.isArray(req.body)
      ? req.body
      : [req.body];

    console.log(`📧 Received ${events.length} Brevo webhook events`);

    for (const event of events) {
      try {
        await processWebhookEvent(event);
      } catch (error) {
        console.error("Error processing individual webhook event:", error);
        // Continue processing other events even if one fails
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true, processed: events.length });
  } catch (error) {
    console.error("Error processing Brevo webhook:", error);
    // Still return 200 to prevent Brevo from retrying
    res.status(200).json({ success: false, error: "Processing failed" });
  }
});

/**
 * Process individual Brevo webhook event and update database
 *
 * Brevo event types:
 * - request: Email has been received by Brevo for sending
 * - delivered: Email successfully delivered
 * - soft_bounce: Temporary delivery failure
 * - hard_bounce: Permanent delivery failure
 * - opened: Email was opened
 * - click: A link was clicked
 * - spam: Marked as spam
 * - unsubscribed: Recipient unsubscribed
 * - blocked: Email was blocked
 * - invalid_email: Invalid email address
 * - deferred: Delivery temporarily deferred
 * - error: General error
 */
async function processWebhookEvent(event: BrevoEvent) {
  const eventType = event.event;
  const timestamp = event.date || new Date(
    (event.ts_event || event.ts || Date.now() / 1000) * 1000
  ).toISOString();
  const messageId = event["message-id"] || "";

  console.log(
    `Processing ${eventType} event for ${event.email} at ${timestamp}`,
  );

  try {
    // Try to find existing email tracking record by Brevo message ID
    const existingQuery = await db.execute(sql`
      SELECT * FROM email_tracking
      WHERE brevo_message_id = ${messageId}
      LIMIT 1
    `);

    const trackingRecord = existingQuery.rows[0] || null;

    // Map Brevo event types to our status values
    const mapStatus = (brevoEvent: string): string => {
      switch (brevoEvent) {
        case "delivered":
          return "delivered";
        case "hard_bounce":
        case "soft_bounce":
        case "blocked":
        case "invalid_email":
        case "error":
          return "failed";
        case "request":
        case "deferred":
          return "sent";
        default:
          return "sent";
      }
    };

    // If no existing record found, create a new one
    if (!trackingRecord) {
      const status = mapStatus(eventType);

      await db.execute(sql`
        INSERT INTO email_tracking (
          recipient_email, email_type, template_id, brevo_message_id,
          status, sent_at, delivered_at, error_message, webhook_data
        ) VALUES (
          ${event.email},
          ${event.template_id ? "template" : "regular"},
          ${event.template_id ? String(event.template_id) : null},
          ${messageId},
          ${status},
          ${timestamp}::timestamp,
          ${eventType === "delivered" ? timestamp : null}::timestamp,
          ${event.reason || null},
          ${JSON.stringify(event)}::jsonb
        )
      `);

      console.log(`✅ Created new tracking record for ${event.email}`);
    } else {
      // Update existing record with new event information
      let updateQuery = `UPDATE email_tracking SET webhook_data = $1, updated_at = $2`;
      const params: any[] = [JSON.stringify(event), timestamp];
      let paramIndex = 3;

      // Update status based on event type
      if (eventType === "delivered") {
        updateQuery += `, status = $${paramIndex}`;
        paramIndex += 1;
        updateQuery += `, delivered_at = $${paramIndex}`;
        params.push("delivered", timestamp);
        paramIndex += 1;
      } else if (
        eventType === "hard_bounce" ||
        eventType === "soft_bounce" ||
        eventType === "blocked" ||
        eventType === "invalid_email" ||
        eventType === "error"
      ) {
        updateQuery += `, status = $${paramIndex}, error_message = $${paramIndex + 1}`;
        params.push("failed", event.reason || `Email ${eventType}`);
        paramIndex += 2;
      } else if (eventType === "opened") {
        updateQuery += `, opened_at = $${paramIndex}`;
        params.push(timestamp);
        paramIndex += 1;
      } else if (eventType === "click") {
        updateQuery += `, clicked_at = $${paramIndex}`;
        params.push(timestamp);
        paramIndex += 1;
      }

      updateQuery += ` WHERE id = $${paramIndex}`;
      params.push(trackingRecord.id);

      await db.execute(sql.raw(updateQuery, params));
      console.log(
        `✅ Updated tracking record for ${event.email} with ${eventType} event`,
      );
    }

    // Log important events for immediate visibility
    if (eventType === "delivered") {
      console.log(`🎉 EMAIL DELIVERED: ${event.email} via Brevo`);
    } else if (eventType === "hard_bounce") {
      console.log(`❌ EMAIL HARD BOUNCED: ${event.email} - ${event.reason}`);
    } else if (eventType === "soft_bounce") {
      console.log(`⚠️ EMAIL SOFT BOUNCED: ${event.email} - ${event.reason}`);
    } else if (eventType === "blocked") {
      console.log(`🚫 EMAIL BLOCKED: ${event.email} - ${event.reason}`);
    } else if (eventType === "spam") {
      console.log(`🗑️ MARKED SPAM: ${event.email}`);
    }
  } catch (error) {
    console.error("Error processing webhook event:", error);
  }
}

/**
 * Get email activity dashboard for admin users
 */
router.get("/admin/email-activity", async (req, res) => {
  try {
    const { limit = "50", offset = "0", status, email_type } = req.query;

    // Build where clause
    let whereClause = "";
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += `WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (email_type) {
      whereClause += whereClause
        ? ` AND email_type = $${paramIndex}`
        : `WHERE email_type = $${paramIndex}`;
      params.push(email_type);
      paramIndex++;
    }

    // Get recent email activity
    const emailsQuery = await db.execute(
      sql.raw(
        `
      SELECT * FROM email_tracking
      ${whereClause}
      ORDER BY sent_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
        [...params, parseInt(limit as string), parseInt(offset as string)],
      ),
    );

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
          sent: parseInt(stats.sent),
        },
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: emailsQuery.rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching email activity:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch email activity",
    });
  }
});

export default router;
