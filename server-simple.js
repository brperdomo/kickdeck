/**
 * Simplified Server Start
 * This bypasses tsx issues and starts the server with basic Node.js
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// Basic SendGrid templates endpoint for testing
app.get('/api/admin/sendgrid/templates', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on http://0.0.0.0:${PORT}`);
  console.log('SendGrid templates available at: /api/admin/sendgrid/templates');
});