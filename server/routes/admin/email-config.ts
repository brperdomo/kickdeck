import { Router } from "express";
import { db } from "../../../db"; 
import { emailConfig } from "../../../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get email configuration
router.get('/', async (req, res) => {
  try {
    const [config] = await db
      .select()
      .from(emailConfig)
      .limit(1);

    res.json(config || {});
  } catch (error) {
    console.error('Error fetching email config:', error);
    res.status(500).json({ error: "Failed to fetch email configuration" });
  }
});

// Update email configuration
router.post('/', async (req, res) => {
  try {
    const configData = req.body;

    // Check if config exists
    const [existingConfig] = await db
      .select()
      .from(emailSettings)
      .limit(1);

    let updatedConfig;

    if (existingConfig) {
      // Update existing config
      [updatedConfig] = await db
        .update(emailConfig)
        .set({
          ...configData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(emailConfig.id, existingConfig.id))
        .returning();
    } else {
      // Create new config
      [updatedConfig] = await db
        .insert(emailConfig)
        .values({
          ...configData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
    }

    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating email config:', error);
    res.status(500).json({ error: "Failed to update email configuration" });
  }
});

// Test email configuration
router.post('/test', async (req, res) => {
  try {
    const { recipient } = req.body;

    if (!recipient) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    // Import email service dynamically to prevent circular dependencies
    const { sendEmail } = await import('../../services/email-service');

    await sendEmail({
      to: recipient,
      subject: "Email Configuration Test",
      html: `
        <h1>Email Configuration Test</h1>
        <p>This is a test email to verify your email configuration settings.</p>
        <p>If you received this email, your configuration is working correctly.</p>
      `,
    });

    res.json({ success: true, message: "Test email sent successfully" });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send test email" 
    });
  }
});

export default router;