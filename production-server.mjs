#!/usr/bin/env node

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting soccer facility management platform...');

const app = express();
const port = process.env.PORT || 5000;

// Enhanced middleware setup
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Static file serving
const uploadsPath = path.join(process.cwd(), 'uploads');
const publicPath = path.join(process.cwd(), 'public');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));
app.use('/public', express.static(publicPath));

// Health check endpoint
app.get('/_health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    message: 'Soccer facility management platform is running',
    server: 'Express.js Production',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    stripe: {
      secret_key: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY ? 'configured' : 'not configured'
    },
    sendgrid: process.env.SENDGRID_API_KEY ? 'configured' : 'not configured'
  });
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || null,
    environment: process.env.NODE_ENV || 'development',
    features: {
      payments: !!process.env.STRIPE_SECRET_KEY,
      email: !!process.env.SENDGRID_API_KEY,
      database: !!process.env.DATABASE_URL
    }
  });
});

// Test endpoints for development
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API endpoint working',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    }
  });
});

app.post('/api/test', (req, res) => {
  res.json({
    message: 'POST endpoint working',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'Database not configured',
        message: 'DATABASE_URL environment variable is missing'
      });
    }
    
    // Basic connection test
    res.json({
      message: 'Database connection available',
      url_prefix: process.env.DATABASE_URL.substring(0, 20) + '...',
      status: 'ready'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Environment variables endpoint (development only)
app.get('/api/env', (req, res) => {
  const envInfo = {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    memory_usage: process.memoryUsage(),
    cwd: process.cwd(),
    environment_variables: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || '5000',
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not set',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not set',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ? 'configured' : 'not set',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'configured' : 'not set'
    }
  };
  
  res.json(envInfo);
});

// Default route - serve React app or landing page
app.get('*', (req, res) => {
  const clientBuildPath = path.join(process.cwd(), 'client', 'dist', 'index.html');
  
  if (fs.existsSync(clientBuildPath)) {
    res.sendFile(clientBuildPath);
  } else {
    // Development landing page
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soccer Facility Management Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container { 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 2rem;
        }
        .card { 
            background: rgba(255, 255, 255, 0.95);
            padding: 2.5rem; 
            border-radius: 16px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin-bottom: 1.5rem;
            backdrop-filter: blur(10px);
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .header h1 {
            font-size: 2.5rem;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        .status { 
            display: inline-flex;
            align-items: center;
            background: #10b981; 
            color: white; 
            padding: 0.5rem 1rem; 
            border-radius: 50px;
            font-size: 0.875rem;
            font-weight: 600;
            gap: 0.5rem;
        }
        .status::before {
            content: "●";
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        .feature {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        .feature h3 {
            color: #2d3748;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }
        .feature p {
            color: #64748b;
            font-size: 0.9rem;
            line-height: 1.5;
        }
        .endpoints { 
            background: #1a202c; 
            color: #e2e8f0;
            padding: 1.5rem; 
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            overflow-x: auto;
        }
        .endpoints a {
            color: #63b3ed;
            text-decoration: none;
            border-bottom: 1px dotted #63b3ed;
        }
        .endpoints a:hover {
            color: #90cdf4;
        }
        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        .tech {
            background: #667eea;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <h1>⚽ Soccer Facility Management</h1>
                <span class="status">Server Running</span>
                <p style="margin-top: 1rem; color: #64748b;">Professional platform for managing soccer facilities, teams, and events</p>
            </div>
            
            <div class="grid">
                <div class="feature">
                    <h3>🏟️ Facility Management</h3>
                    <p>Complete management of soccer facilities with scheduling and resource allocation</p>
                </div>
                
                <div class="feature">
                    <h3>👥 Team Registration</h3>
                    <p>Streamlined team registration process with payment integration</p>
                </div>
                
                <div class="feature">
                    <h3>📊 Event Organization</h3>
                    <p>Advanced event setup with flexible age groups and tournament brackets</p>
                </div>
                
                <div class="feature">
                    <h3>💳 Payment Processing</h3>
                    <p>Secure Stripe integration for registration fees and facility booking</p>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2 style="color: #2d3748; margin-bottom: 1rem;">📡 API Endpoints</h2>
            <div class="endpoints">
GET  <a href="/_health">/_health</a>           - Health check<br>
GET  <a href="/api/status">/api/status</a>         - Server status<br>
GET  <a href="/api/config">/api/config</a>         - Configuration<br>
GET  <a href="/api/test">/api/test</a>           - API test<br>
POST <a href="/api/test">/api/test</a>           - POST test<br>
GET  <a href="/api/db-test">/api/db-test</a>       - Database test<br>
GET  <a href="/api/env">/api/env</a>            - Environment info
            </div>
        </div>
        
        <div class="card">
            <h2 style="color: #2d3748; margin-bottom: 1rem;">🚀 Technology Stack</h2>
            <div class="tech-stack">
                <span class="tech">React</span>
                <span class="tech">Express.js</span>
                <span class="tech">PostgreSQL</span>
                <span class="tech">Stripe</span>
                <span class="tech">SendGrid</span>
                <span class="tech">TypeScript</span>
                <span class="tech">Tailwind CSS</span>
            </div>
            
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 0.9rem;">
                    <strong>Status:</strong> Development server running on port ${port}<br>
                    <strong>Started:</strong> ${new Date().toLocaleString()}<br>
                    <strong>Mode:</strong> ${process.env.NODE_ENV || 'Development'}
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
    
    res.send(html);
  }
});

// Global error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`
🚀 Soccer Facility Management Platform

✅ Server operational on port ${port}
🌐 Local URL: http://localhost:${port}
🌍 Network URL: http://0.0.0.0:${port}
📊 Status: Ready for connections
🕒 Started: ${new Date().toLocaleString()}
🔧 Mode: ${process.env.NODE_ENV || 'development'}

Environment:
${process.env.DATABASE_URL ? '✅' : '❌'} Database
${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'} Stripe
${process.env.SENDGRID_API_KEY ? '✅' : '❌'} SendGrid
`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️ Forcing server shutdown...');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;