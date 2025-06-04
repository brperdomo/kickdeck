import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static('dist'));
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// SendGrid templates endpoint
app.get('/api/admin/sendgrid/templates', async (req, res) => {
  try {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    
    if (!SENDGRID_API_KEY) {
      return res.status(500).json({ error: 'SendGrid API key not configured' });
    }
    
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `SendGrid API error: ${response.status} ${response.statusText}` 
      });
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('SendGrid templates error:', error);
    res.status(500).json({ error: 'Failed to fetch SendGrid templates' });
  }
});

// Test endpoint to verify templates
app.get('/api/test/sendgrid', async (req, res) => {
  try {
    const response = await fetch(`http://localhost:${PORT}/api/admin/sendgrid/templates`);
    const data = await response.json();
    
    const templateList = data.templates?.map(t => ({
      id: t.id,
      name: t.name,
      updated: t.updated_at
    })) || [];
    
    res.json({
      status: 'SendGrid templates accessible',
      count: templateList.length,
      templates: templateList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('SendGrid templates endpoint: /api/admin/sendgrid/templates');
  console.log('Test endpoint: /api/test/sendgrid');
});