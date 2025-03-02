import { Router } from "express";
import { db } from "@db";
import { emailConfig } from "@db/schema";
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

    // Check if config already exists
    const [existingConfig] = await db
      .select()
      .from(emailConfig)
      .limit(1);

    let updatedConfig;

    if (existingConfig) {
      // Update existing config
      [updatedConfig] = await db
        .update(emailConfig)
        .set({
          ...configData,
          updatedAt: new Date().toISOString()
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
          updatedAt: new Date().toISOString()
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

    // For now just return success without actually sending
    res.json({ success: true, message: "Test email would be sent to: " + recipient });
  } catch (error) {
    console.error('Error testing email config:', error);
    res.status(500).json({ error: "Failed to test email configuration" });
  }
});

export default router;