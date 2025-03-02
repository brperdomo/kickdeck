
import { Router } from "express";
import { db } from "@db";
import { eventFormTemplates, formFields, formFieldOptions } from "@db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all form templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(eventFormTemplates)
      .orderBy(eventFormTemplates.createdAt);
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching form templates:', error);
    res.status(500).json({ error: "Failed to fetch form templates" });
  }
});

// Get a specific form template with its fields
router.get('/templates/:id', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    const [template] = await db
      .select()
      .from(eventFormTemplates)
      .where(eq(eventFormTemplates.id, templateId))
      .limit(1);
    
    if (!template) {
      return res.status(404).json({ error: "Form template not found" });
    }
    
    const fields = await db
      .select()
      .from(formFields)
      .where(eq(formFields.templateId, templateId))
      .orderBy(formFields.order);
    
    // Get field options for each field
    const fieldIds = fields.map(f => f.id);
    const fieldOptions = fieldIds.length > 0 
      ? await db
          .select()
          .from(formFieldOptions)
          .where(eq(formFieldOptions.fieldId, fieldIds[0]))
      : [];
    
    // Build the complete template object with fields and options
    const result = {
      ...template,
      fields: fields.map(field => ({
        ...field,
        options: fieldOptions
          .filter(option => option.fieldId === field.id)
          .map(option => ({
            id: option.id,
            label: option.label,
            value: option.value,
          })),
      })),
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching form template:', error);
    res.status(500).json({ error: "Failed to fetch form template" });
  }
});

// Create basic endpoints for forms management
router.post('/templates', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const [newTemplate] = await db
      .insert(eventFormTemplates)
      .values({
        name,
        description,
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating form template:', error);
    res.status(500).json({ error: "Failed to create form template" });
  }
});

// Other form management routes can be added here

export default router;
