
import { Router } from "express";
import { db } from "@db";
import { activityLogs } from "@db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get all activity logs
router.get('/', async (req, res) => {
  try {
    const logs = await db
      .select()
      .from(activityLogs)
      .orderBy(activityLogs.createdAt);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
