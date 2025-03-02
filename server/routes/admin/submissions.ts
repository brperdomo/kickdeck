
import { Router } from "express";

const router = Router();

// Basic route for form submissions
router.get('/', async (req, res) => {
  try {
    res.json({ submissions: [] });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

export default router;
