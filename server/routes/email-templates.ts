
import { Request, Response } from 'express';
import { db } from '@db/index';
import { emailTemplates } from '@db/schema/emailTemplates';
import { eq } from 'drizzle-orm';

export async function getEmailTemplates(req: Request, res: Response) {
  try {
    const templates = await db.select().from(emailTemplates);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: "Failed to fetch email templates" });
  }
}

export async function createEmailTemplate(req: Request, res: Response) {
  try {
    const { 
      name, 
      description, 
      type, 
      subject, 
      content, 
      senderName, 
      senderEmail, 
      isActive,
      variables 
    } = req.body;

    // Validate required fields
    if (!name || !type || !subject || !content || !senderName || !senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [template] = await db.insert(emailTemplates).values({
      name,
      description,
      type,
      subject,
      content,
      senderName,
      senderEmail,
      isActive: isActive ?? true,
      variables,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: "Failed to create email template" });
  }
}

export async function updateEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      type, 
      subject, 
      content, 
      senderName, 
      senderEmail, 
      isActive,
      variables 
    } = req.body;

    // Validate required fields
    if (!name || !type || !subject || !content || !senderName || !senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [template] = await db.update(emailTemplates)
      .set({
        name,
        description,
        type,
        subject,
        content,
        senderName,
        senderEmail,
        isActive,
        variables,
        updatedAt: new Date()
      })
      .where(eq(emailTemplates.id, parseInt(id)))
      .returning();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ error: "Failed to update email template" });
  }
}

export async function deleteEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const [template] = await db.delete(emailTemplates)
      .where(eq(emailTemplates.id, parseInt(id)))
      .returning();

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: "Failed to delete email template" });
  }
}
