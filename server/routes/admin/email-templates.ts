
import { Router } from "express";
import { db } from "@db";
import { emailTemplates } from "@db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all email templates
router.get('/', async (req, res) => {
  try {
    const templates = await db.select().from(emailTemplates);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: "Failed to fetch email templates" });
  }
});

// Create a new email template
router.post('/', async (req, res) => {
  try {
    const { name, type, subject, content, senderName, senderEmail, isDefault } = req.body;
    
    // If this is set as default, unset any other defaults of the same type
    if (isDefault) {
      await db.update(emailTemplates)
        .set({ isDefault: false })
        .where(eq(emailTemplates.type, type));
    }
    
    const [newTemplate] = await db.insert(emailTemplates)
      .values({
        name,
        type,
        subject,
        content,
        senderName,
        senderEmail,
        isDefault: isDefault || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
      
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: "Failed to create email template" });
  }
});

// Update an existing email template
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, type, subject, content, senderName, senderEmail, isDefault } = req.body;
    
    // If this is set as default, unset any other defaults of the same type
    if (isDefault) {
      await db.update(emailTemplates)
        .set({ isDefault: false })
        .where(eq(emailTemplates.type, type));
    }
    
    const [updatedTemplate] = await db.update(emailTemplates)
      .set({
        name,
        type,
        subject,
        content,
        senderName,
        senderEmail,
        isDefault: isDefault || false,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, id))
      .returning();
      
    if (!updatedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ error: "Failed to update email template" });
  }
});

// Delete an email template
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const [deletedTemplate] = await db.delete(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .returning();
      
    if (!deletedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: "Failed to delete email template" });
  }
});

// Preview email template rendering
router.post('/preview', async (req, res) => {
  try {
    // In a real implementation, this would render the template with test data
    // For now, just return success
    res.json({ 
      success: true, 
      preview: req.body.content 
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({ error: "Failed to preview email template" });
  }
});

export default router;
