import { Router } from "express";
import { db } from "@db";
import { emailTemplateRouting, emailProviderSettings } from "@db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Error handler middleware
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Email template routing error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  });
};

// Get all template routings
router.get("/", asyncHandler(async (req, res) => {
  console.log('Fetching email template routings...');

  try {
    const routings = await db.query.emailTemplateRouting.findMany({
      with: {
        provider: true,
      },
      orderBy: emailTemplateRouting.templateType,
    });

    console.log('Found routings:', routings.length);
    res.json(routings);
  } catch (error) {
    console.error('Error fetching email template routings:', error);
    throw error;
  }
}));

// Create template routing
router.post("/", asyncHandler(async (req, res) => {
  const { templateType, providerId, fromEmail, fromName, isActive } = req.body;

  if (!templateType || !providerId || !fromEmail || !fromName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if provider exists
    const [provider] = await db
      .select()
      .from(emailProviderSettings)
      .where(eq(emailProviderSettings.id, parseInt(providerId)))
      .limit(1);

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    // Check if template type already exists
    const [existingRouting] = await db
      .select()
      .from(emailTemplateRouting)
      .where(eq(emailTemplateRouting.templateType, templateType))
      .limit(1);

    if (existingRouting) {
      return res.status(400).json({ error: "Template type already exists" });
    }

    const [routing] = await db
      .insert(emailTemplateRouting)
      .values({
        templateType,
        providerId: parseInt(providerId),
        fromEmail,
        fromName,
        isActive: isActive ?? true,
      })
      .returning();

    console.log('Created routing:', routing.id);
    res.status(201).json(routing);
  } catch (error) {
    console.error('Error creating email template routing:', error);
    throw error;
  }
}));

// Update template routing
router.patch("/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid routing ID" });
  }

  const { templateType, providerId, fromEmail, fromName, isActive } = req.body;

  if (!templateType || !providerId || !fromEmail || !fromName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if routing exists
    const [existingRouting] = await db
      .select()
      .from(emailTemplateRouting)
      .where(eq(emailTemplateRouting.id, id))
      .limit(1);

    if (!existingRouting) {
      return res.status(404).json({ error: "Routing not found" });
    }

    // Check if provider exists
    const [provider] = await db
      .select()
      .from(emailProviderSettings)
      .where(eq(emailProviderSettings.id, parseInt(providerId)))
      .limit(1);

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    const [routing] = await db
      .update(emailTemplateRouting)
      .set({
        templateType,
        providerId: parseInt(providerId),
        fromEmail,
        fromName,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplateRouting.id, id))
      .returning();

    console.log('Updated routing:', routing.id);
    res.json(routing);
  } catch (error) {
    console.error('Error updating email template routing:', error);
    throw error;
  }
}));

// Delete template routing
router.delete("/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid routing ID" });
  }

  try {
    const [routing] = await db
      .delete(emailTemplateRouting)
      .where(eq(emailTemplateRouting.id, id))
      .returning();

    if (!routing) {
      return res.status(404).json({ error: "Routing not found" });
    }

    console.log('Deleted routing:', id);
    res.json({ message: "Routing deleted successfully" });
  } catch (error) {
    console.error('Error deleting email template routing:', error);
    throw error;
  }
}));

export default router;
