import { Router } from "express";
import { db } from "@db";
import { emailProviderSettings } from "@db/schema";
import { eq } from "drizzle-orm";

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
router.post("/", async (req, res) => {
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
  try {
    const id = parseInt(req.params.id);
    const { providerType, providerName, settings, isActive, isDefault } = req.body;
    
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
