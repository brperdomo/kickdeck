
import { Router } from "express";
import { emailService } from "../../services/email-service";
import { z } from "zod";

const router = Router();

const emailConfigSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.coerce.number().int().positive("Port must be a positive number"),
  secure: z.boolean().default(true),
  auth: z.object({
    user: z.string().min(1, "Username is required"),
    pass: z.string().min(1, "Password is required"),
  }),
  senderEmail: z.string().email("Must be a valid email address"),
  senderName: z.string().optional(),
});

// Get email configuration
router.get('/', async (req, res) => {
  try {
    const config = await emailService.getConfiguration();
    res.json(config || {});
  } catch (error) {
    console.error('Error fetching email configuration:', error);
    res.status(500).send("Failed to fetch email configuration");
  }
});

// Update email configuration
router.post('/', async (req, res) => {
  try {
    const validatedData = emailConfigSchema.parse(req.body);
    const result = await emailService.saveConfiguration(validatedData);
    
    if (result.success) {
      res.json({ message: "Email configuration updated successfully" });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error updating email configuration:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).send("Failed to update email configuration");
    }
  }
});

// Test email configuration
router.post('/test', async (req, res) => {
  try {
    const validatedData = emailConfigSchema.parse(req.body);
    const result = await emailService.testConnection(validatedData);
    
    if (result.success) {
      res.json({ message: "Connection test successful" });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error testing email configuration:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).send("Failed to test email configuration");
    }
  }
});

export default router;
