/**
 * SendGrid Settings Routes
 * 
 * This file contains the routes for managing SendGrid templates and settings.
 */

import express from 'express';
import { isAdmin } from '../middleware/auth.js';
import { 
  getSendGridTemplates, 
  getEmailTemplatesWithMappings, 
  mapSendGridTemplate,
  getSendGridStatus,
  sendTestEmail
} from '../services/sendgridTemplateService.js';

const router = express.Router();

// Get all SendGrid templates
router.get('/templates', isAdmin, async (req, res) => {
  try {
    const templates = await getSendGridTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching SendGrid templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all email templates with SendGrid mappings
router.get('/template-mappings', isAdmin, async (req, res) => {
  try {
    const templates = await getEmailTemplatesWithMappings();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching template mappings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Map a SendGrid template to an email type
router.post('/template-mapping', isAdmin, async (req, res) => {
  try {
    const { templateType, sendgridTemplateId } = req.body;
    
    if (!templateType) {
      return res.status(400).json({ error: 'Template type is required' });
    }

    const result = await mapSendGridTemplate(templateType, sendgridTemplateId);
    res.json(result);
  } catch (error) {
    console.error('Error mapping SendGrid template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get SendGrid provider settings and status
router.get('/settings', isAdmin, async (req, res) => {
  try {
    const status = await getSendGridStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching SendGrid settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send a test email using a SendGrid template
router.post('/test-template', isAdmin, async (req, res) => {
  try {
    const { templateId, recipientEmail, testData } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const result = await sendTestEmail(templateId, recipientEmail, testData || {});
    res.json(result);
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;