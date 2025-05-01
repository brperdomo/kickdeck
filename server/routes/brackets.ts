import { Router } from "express";
import { db } from "@db";
import { eventBrackets } from "@db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get brackets for a specific age group in an event
router.get('/', async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.query;
    
    if (!eventId || !ageGroupId) {
      return res.status(400).json({ 
        error: 'Missing parameters', 
        message: 'Both eventId and ageGroupId are required' 
      });
    }
    
    // Get all brackets for the specific age group
    const brackets = await db
      .select()
      .from(eventBrackets)
      .where(
        and(
          eq(eventBrackets.eventId, eventId as string),
          eq(eventBrackets.ageGroupId, parseInt(ageGroupId as string))
        )
      )
      .orderBy(eventBrackets.sortOrder);
    
    res.json(brackets);
  } catch (error) {
    console.error('Error fetching age group brackets:', error);
    res.status(500).json({ error: 'Failed to fetch age group brackets' });
  }
});

export default router;