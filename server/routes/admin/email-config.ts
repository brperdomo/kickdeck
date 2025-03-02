
import { Router } from "express";
import { db } from "../../db";
import { emailConfig } from "@db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

const router = Router();

// Get email configuration
router.get("/", async (req, res) => {
  try {
    const [config] = await db.select().from(emailConfig).limit(1);
    
    // If config exists, remove sensitive information before sending to client
    if (config && config.auth && config.auth.pass) {
      // Create a copy of the config to avoid modifying the database result
      const safeConfig = { ...config };
      // Mask the password
      safeConfig.auth = { ...config.auth, pass: "********" };
      res.json(safeConfig);
    } else {
      res.json(config || {});
    }
  } catch (error) {
    console.error("Error fetching email configuration:", error);
    res.status(500).json({ error: "Failed to fetch email configuration" });
  }
});

// Save email configuration
router.post("/", async (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate required fields
    if (!newConfig.host || !newConfig.port || !newConfig.auth?.user || !newConfig.auth?.pass || !newConfig.senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if configuration already exists
    const [existingConfig] = await db.select().from(emailConfig).limit(1);

    let savedConfig;
    if (existingConfig) {
      // Update existing configuration
      [savedConfig] = await db
        .update(emailConfig)
        .set({
          ...newConfig,
          updatedAt: new Date().toISOString()
        })
        .where(eq(emailConfig.id, existingConfig.id))
        .returning();
    } else {
      // Insert new configuration
      [savedConfig] = await db
        .insert(emailConfig)
        .values({
          ...newConfig,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .returning();
    }

    // Remove sensitive information before sending response
    const safeConfig = { ...savedConfig };
    if (safeConfig.auth && safeConfig.auth.pass) {
      safeConfig.auth = { ...safeConfig.auth, pass: "********" };
    }

    res.json(safeConfig);
  } catch (error) {
    console.error("Error saving email configuration:", error);
    res.status(500).json({ error: "Failed to save email configuration" });
  }
});

// Test email connection
router.post("/test", async (req, res) => {
  try {
    const config = req.body;
    
    // Create test transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      }
    });

    // Verify connection
    await transporter.verify();
    
    // Send a test email to the sender address
    await transporter.sendMail({
      from: config.senderName ? `${config.senderName} <${config.senderEmail}>` : config.senderEmail,
      to: config.auth.user,
      subject: "SMTP Connection Test",
      text: "This is a test email to verify your SMTP connection.",
      html: "<p>This is a test email to verify your SMTP connection.</p>"
    });

    res.json({ success: true, message: "Connection test successful" });
  } catch (error) {
    console.error("Email connection test failed:", error);
    res.status(500).json({ 
      error: "Connection test failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export default router;
