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

export async function getEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log(`Fetching template with ID: ${id}`);
    
    const template = await db.select().from(emailTemplates)
      .where(eq(emailTemplates.id, parseInt(id)))
      .then(results => results[0]);
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    console.log(`Found template:`, template);
    res.json(template);
  } catch (error) {
    console.error(`Error fetching email template ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch email template" });
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
      variables,
      providerId
    } = req.body;

    console.log("Creating template with data:", req.body);

    // Validate required fields
    if (!name || !type || !subject || !content || !senderName || !senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [template] = await db.insert(emailTemplates).values({
      name,
      description: description || null,
      type,
      subject,
      content,
      senderName,
      senderEmail,
      isActive: isActive === false ? false : true,
      variables: variables || [],
      providerId: providerId ? Number(providerId) : null,
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
      variables,
      providerId
    } = req.body;

    console.log("Updating template with data:", req.body);

    // Validate required fields
    if (!name || !type || !subject || !content || !senderName || !senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [template] = await db.update(emailTemplates)
      .set({
        name,
        description: description || null,
        type,
        subject,
        content,
        senderName,
        senderEmail,
        isActive: isActive === false ? false : true,
        variables: variables || [],
        providerId: providerId ? Number(providerId) : null,
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

export async function previewEmailTemplate(req: Request, res: Response) {
  try {
    console.log("Preview template query:", req.query.template);
    
    // Handle missing template data
    if (!req.query.template) {
      console.error("No template data provided for preview");
      return res.status(400).json({ error: "No template data provided for preview" });
    }

    let templateData;
    try {
      templateData = JSON.parse(req.query.template as string);
    } catch (e) {
      console.error("Failed to parse template data:", e);
      return res.status(400).json({ error: "Invalid template data format" });
    }

    // Replace variables with sample values
    let content = templateData.content || '';
    
    // Define all possible merge fields and their sample values
    const defaultValues: Record<string, string> = {
      firstName: '[Sample First Name]',
      lastName: '[Sample Last Name]',
      email: '[sample@email.com]',
      username: '[Sample Username]',
      resetLink: '[Reset Password Link]',
      token: '[Reset Token]'
    };

    // Replace all merge fields
    Object.entries(defaultValues).forEach(([variable, sampleValue]) => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, sampleValue);
    });


    // Create HTML for preview
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Preview: ${templateData.subject || 'No Subject'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .preview-container { max-width: 650px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
        .preview-header { background: #f5f5f5; padding: 15px; border-bottom: 1px solid #ddd; }
        .preview-subject { margin: 0; font-size: 18px; }
        .preview-from { margin: 5px 0 0; font-size: 14px; color: #666; }
        .preview-content { padding: 20px; }
        .preview-footer { background: #f5f5f5; padding: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="preview-container">
        <div class="preview-header">
          <h1 class="preview-subject">${templateData.subject || 'No Subject'}</h1>
          <p class="preview-from">From: ${templateData.senderName || 'Sender'} &lt;${templateData.senderEmail || 'email@example.com'}&gt;</p>
        </div>
        <div class="preview-content">
          ${content}
        </div>
        <div class="preview-footer">
          <p>This is a preview. </p>
          <p>Template Type: ${templateData.type || 'Not specified'}</p>
          <p>Active: ${templateData.isActive ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({ error: "Failed to preview email template" });
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