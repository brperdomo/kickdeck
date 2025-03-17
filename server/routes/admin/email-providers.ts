import { Router } from "express";
import { db } from "@db";
import { emailProviderSettings } from "@db/schema";
import { eq } from "drizzle-orm";

// Error handler middleware
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Email provider error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  });
};

const router = Router();

// Get all email providers
router.get("/", async (req, res) => {
  try {
    const providers = await db
      .select()
      .from(emailProviderSettings)
      .orderBy(emailProviderSettings.providerName);
      
    res.json(providers);
  } catch (error) {
    console.error('Error fetching email providers:', error);
    res.status(500).send("Failed to fetch email providers");
  }
});

// Create email provider
router.post("/", asyncHandler(async (req, res) => {
  try {
    const { providerType, providerName, settings, isActive, isDefault } = req.body;
    
    if (!providerType || !providerName) {
      return res.status(400).json({ error: "Provider type and name are required" });
    }
    
    // If this provider is set as default, unset any existing default
    if (isDefault) {
      await db
        .update(emailProviderSettings)
        .set({ isDefault: false })
        .where(eq(emailProviderSettings.isDefault, true));
    }
    
    const [provider] = await db
      .insert(emailProviderSettings)
      .values({
        providerType,
        providerName,
        settings,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
      
    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating email provider:', error);
    res.status(500).send("Failed to create email provider");
  }
});

// Update email provider
router.patch("/:id", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid provider ID" });
    }

    const { providerType, providerName, settings, isActive, isDefault } = req.body;
    
    if (!providerType || !providerName) {
      return res.status(400).json({ error: "Provider type and name are required" });
    }

    // Check if provider exists
    const [existingProvider] = await db
      .select()
      .from(emailProviderSettings)
      .where(eq(emailProviderSettings.id, id))
      .limit(1);
      
    if (!existingProvider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    
    // If this provider is being set as default, unset any existing default
    if (isDefault && !existingProvider.isDefault) {
      await db
        .update(emailProviderSettings)
        .set({ isDefault: false })
        .where(eq(emailProviderSettings.isDefault, true));
    }
    
    const [updatedProvider] = await db
      .update(emailProviderSettings)
      .set({
        providerType,
        providerName,
        settings,
        isActive,
        isDefault,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(emailProviderSettings.id, id))
      .returning();
      
    res.json(updatedProvider);
  } catch (error) {
    console.error('Error updating email provider:', error);
    res.status(500).send("Failed to update email provider");
  }
});

// Delete email provider
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const [provider] = await db
      .delete(emailProviderSettings)
      .where(eq(emailProviderSettings.id, id))
      .returning();
      
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    
    res.json({ message: "Provider deleted successfully" });
  } catch (error) {
    console.error('Error deleting email provider:', error);
    res.status(500).send("Failed to delete email provider");
  }
});

export default router;
// Test email provider connection
router.post("/test-connection", async (req, res) => {
  const { providerType, settings } = req.body;
  
  try {
    if (providerType === 'smtp') {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.port === 465,
        auth: {
          user: settings.username,
          pass: settings.password,
        },
      });

      await transporter.verify();
      res.json({ success: true, message: 'Connection successful' });
    } else {
      res.status(400).json({ error: 'Unsupported provider type' });
    }
  } catch (error) {
    console.error('Email provider connection test failed:', error);
    res.status(400).json({ error: 'Connection failed: ' + error.message });
  }
});
