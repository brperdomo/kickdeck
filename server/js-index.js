import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Health check endpoint
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '..', 'client')));

// Basic API route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Catch-all handler for frontend routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'client', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Client files not found');
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});