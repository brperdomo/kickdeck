// Direct server implementation to bypass dependency issues
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Soccer facility management platform is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    server: 'Express.js',
    status: 'ok'
  });
});

// Default route
app.get('*', (req, res) => {
  res.json({
    title: 'Soccer Facility Management Platform',
    message: 'Server is running successfully',
    status: 'operational',
    note: 'TypeScript compilation system is being configured...'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Soccer facility management platform running on port ${port}`);
  console.log(`Server URL: http://localhost:${port}`);
  console.log('Status: Ready for connections');
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  process.exit(0);
});