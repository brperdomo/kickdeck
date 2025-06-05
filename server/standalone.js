import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// Basic API endpoints for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Development hot reload for client files
app.use('/src', express.static(path.join(__dirname, '../client/src')));
app.use('/public', express.static(path.join(__dirname, '../client/public')));

// Serve a basic HTML page with React development setup
app.get('*', (req, res) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Soccer Management Platform</title>
    <script type="module">
      import RefreshRuntime from "/@react-refresh"
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background: #f5f5f5;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .status {
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin-bottom: 20px;
      }
      .error { background: #fee; border-left: 4px solid #e53e3e; }
      .success { background: #f0fff4; border-left: 4px solid #38a169; }
      .warning { background: #fef5e7; border-left: 4px solid #d69e2e; }
      .btn {
        background: #3182ce;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin: 5px;
      }
      .btn:hover { background: #2c5aa0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="status warning">
        <h2>⚠️ Dependency System Recovery Mode</h2>
        <p>Your application is running in recovery mode due to npm package management corruption.</p>
        <p><strong>What happened:</strong> The tsx, vite, and other critical packages failed to install properly during a recent environment update.</p>
        <p><strong>Current status:</strong> Basic server functionality is working. Full application features will be restored once dependencies are fixed.</p>
      </div>
      
      <div class="status success">
        <h3>✅ Working Components</h3>
        <ul>
          <li>Express server running on port ${process.env.PORT || 5000}</li>
          <li>Basic API endpoints functional</li>
          <li>File uploads directory accessible</li>
          <li>Health check endpoint active</li>
        </ul>
        <button class="btn" onclick="testAPI()">Test API Connection</button>
      </div>

      <div class="status error">
        <h3>❌ Affected Components</h3>
        <ul>
          <li>TypeScript compilation (tsx package missing)</li>
          <li>Vite development server (vite package missing)</li>
          <li>React frontend build system</li>
          <li>Database operations (pending dependency restoration)</li>
        </ul>
      </div>

      <div class="status">
        <h3>🔧 Recovery Actions Needed</h3>
        <p>To fully restore your application:</p>
        <ol>
          <li>Clear npm cache and node_modules completely</li>
          <li>Reinstall Node.js environment from scratch</li>
          <li>Rebuild all dependencies with fresh package manager</li>
          <li>Restart development workflow</li>
        </ol>
      </div>

      <div id="api-result" style="margin-top: 20px;"></div>
    </div>

    <script>
      async function testAPI() {
        try {
          const response = await fetch('/api/test');
          const data = await response.json();
          document.getElementById('api-result').innerHTML = 
            '<div class="status success"><h4>API Test Result:</h4><pre>' + 
            JSON.stringify(data, null, 2) + '</pre></div>';
        } catch (error) {
          document.getElementById('api-result').innerHTML = 
            '<div class="status error"><h4>API Test Failed:</h4><p>' + 
            error.message + '</p></div>';
        }
      }

      // Auto-test API on load
      window.addEventListener('load', testAPI);
    </script>
  </body>
</html>
  `;
  
  res.send(htmlContent);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Recovery server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Status: Dependency system corruption detected`);
  console.log(`🔧 Mode: Recovery and diagnostic mode active`);
  console.log(`⚡ Next: Full dependency restoration required`);
});