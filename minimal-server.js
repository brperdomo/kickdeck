// Minimal server to get the application running while fixing dependencies
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

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running', status: 'ok' });
});

// Catch all for SPA
app.get('*', (req, res) => {
  res.json({ 
    message: 'Soccer facility management platform starting up',
    note: 'Please wait while dependencies are being resolved...'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${port}`);
  console.log('Working on resolving dependency issues...');
});