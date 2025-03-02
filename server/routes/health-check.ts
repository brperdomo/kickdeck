import express from 'express';

const router = express.Router();

// Basic health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'System is healthy' });
});

export default router;