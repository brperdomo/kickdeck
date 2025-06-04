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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// SendGrid templates endpoint - matching your existing API structure
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

// Basic admin interface for testing templates
app.get('/admin/sendgrid-test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>SendGrid Templates Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .template { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .template-id { font-family: monospace; background: #f5f5f5; padding: 2px 5px; }
            .btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .status { margin: 20px 0; padding: 15px; border-radius: 5px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        </style>
    </head>
    <body>
        <h1>SendGrid Templates Access Test</h1>
        <button class="btn" onclick="loadTemplates()">Load SendGrid Templates</button>
        <div id="status"></div>
        <div id="templates"></div>

        <script>
            async function loadTemplates() {
                const statusEl = document.getElementById('status');
                const templatesEl = document.getElementById('templates');
                
                statusEl.innerHTML = '<div class="status">Loading templates...</div>';
                templatesEl.innerHTML = '';
                
                try {
                    const response = await fetch('/api/admin/sendgrid/templates');
                    const data = await response.json();
                    
                    if (response.ok && data.templates) {
                        statusEl.innerHTML = '<div class="status success">✓ Successfully loaded ' + data.templates.length + ' SendGrid templates</div>';
                        
                        data.templates.forEach(template => {
                            templatesEl.innerHTML += \`
                                <div class="template">
                                    <h3>\${template.name}</h3>
                                    <p><strong>ID:</strong> <span class="template-id">\${template.id}</span></p>
                                    <p><strong>Updated:</strong> \${new Date(template.updated_at).toLocaleDateString()}</p>
                                </div>
                            \`;
                        });
                    } else {
                        statusEl.innerHTML = '<div class="status error">✗ Error: ' + (data.error || 'Unknown error') + '</div>';
                    }
                } catch (error) {
                    statusEl.innerHTML = '<div class="status error">✗ Network error: ' + error.message + '</div>';
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Serve a basic index page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>SendGrid Templates Access</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            .btn { background: #007cba; color: white; padding: 15px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin: 10px; text-decoration: none; display: inline-block; }
        </style>
    </head>
    <body>
        <h1>SendGrid Templates Server</h1>
        <p>Your SendGrid templates are accessible through this interface.</p>
        <a href="/admin/sendgrid-test" class="btn">Test SendGrid Templates</a>
        <a href="/api/admin/sendgrid/templates" class="btn">View Templates API</a>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Working server started on http://0.0.0.0:${PORT}`);
  console.log('SendGrid templates test interface: /admin/sendgrid-test');
  console.log('SendGrid templates API: /api/admin/sendgrid/templates');
});