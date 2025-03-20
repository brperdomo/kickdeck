import { Router, Request, Response } from "express";
import { db } from "@db";
import { emailProviderSettings } from "@db/schema";
import { eq } from "drizzle-orm";
import * as nodemailer from 'nodemailer';

// Error handler middleware
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Email provider error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  });
};

const router = Router();

// Test email provider connection
router.post("/test-connection", asyncHandler(async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { providerType, settings } = req.body;

  if (!providerType || !settings) {
    return res.status(400).json({ error: 'Provider type and settings are required' });
  }

  if (providerType === 'smtp') {
    if (!settings.host || !settings.port || !settings.username || !settings.password) {
      return res.status(400).json({ error: 'SMTP settings are incomplete' });
    }

    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: parseInt(settings.port),
      secure: parseInt(settings.port) === 465,
      auth: {
        user: settings.username,
        pass: settings.password,
      },
    });

    try {
      await transporter.verify();
      return res.json({ success: true, message: 'Connection successful' });
    } catch (error: any) {
      console.error('SMTP connection test failed:', error);
      return res.status(400).json({ 
        success: false, 
        error: `Connection failed: ${error.message}` 
      });
    }
  } else {
    return res.status(400).json({ error: 'Unsupported provider type' });
  }
}));

// Get all email providers
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  console.log('Fetching email providers...');

  try {
    const providers = await db
      .select()
      .from(emailProviderSettings)
      .orderBy(emailProviderSettings.providerName);

    console.log('Found providers:', providers.length);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching email providers:', error);
    throw error;
  }
}));

// Create email provider
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { providerType, providerName, settings, isActive, isDefault } = req.body;

  console.log('Creating email provider:', { providerType, providerName, isActive, isDefault });

  if (!providerType || !providerName || !settings) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate SMTP settings
  if (providerType === 'smtp') {
    if (!settings.host || !settings.port || !settings.username || !settings.password) {
      return res.status(400).json({ error: "SMTP settings are incomplete" });
    }

    // Validate port number
    const port = parseInt(settings.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({ error: "Invalid port number" });
    }
  }

  try {
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
        settings: settings as any, // Store settings as JSON
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    console.log('Created provider:', provider.id);
    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating email provider:', error);
    throw error;
  }
}));

// Update email provider
router.patch("/:id", asyncHandler(async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid provider ID" });
  }

  const { providerType, providerName, settings, isActive, isDefault } = req.body;

  if (!providerType || !providerName) {
    return res.status(400).json({ error: "Provider type and name are required" });
  }

  // Validate SMTP settings if they're being updated
  if (providerType === 'smtp' && settings) {
    if (!settings.host || !settings.port || !settings.username || !settings.password) {
      return res.status(400).json({ error: "SMTP settings are incomplete" });
    }

    // Validate port number
    const port = parseInt(settings.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({ error: "Invalid port number" });
    }
  }

  try {
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
        settings: settings as any,
        isActive,
        isDefault,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(emailProviderSettings.id, id))
      .returning();

    console.log('Updated provider:', updatedProvider.id);
    res.json(updatedProvider);
  } catch (error) {
    console.error('Error updating email provider:', error);
    throw error;
  }
}));

// Delete email provider
router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid provider ID" });
  }

  try {
    const [provider] = await db
      .delete(emailProviderSettings)
      .where(eq(emailProviderSettings.id, id))
      .returning();

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    console.log('Deleted provider:', id);
    res.json({ message: "Provider deleted successfully" });
  } catch (error) {
    console.error('Error deleting email provider:', error);
    throw error;
  }
}));

export default router;