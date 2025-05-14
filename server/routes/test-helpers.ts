import { Router } from 'express';
import { db } from '@db';
import { magicLinkTokens } from '@db/schema/magicLink';
import { users } from '@db/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

/**
 * This endpoint is for testing purposes only and should never be exposed in production
 * It returns the most recent magic link token for a given email address
 */
router.post('/get-magic-link-token', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      message: 'Endpoint not available in production'
    });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // First, find the user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
      
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Then get the most recent unused token for this user
    const [token] = await db
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.userId, user.id),
          eq(magicLinkTokens.used, false)
        )
      )
      .orderBy(desc(magicLinkTokens.createdAt))
      .limit(1);
      
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'No valid magic link token found'
      });
    }
    
    return res.json({
      success: true,
      token: token.token
    });
  } catch (error) {
    console.error('Error retrieving magic link token:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;