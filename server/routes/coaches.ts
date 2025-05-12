/**
 * Coach-related API routes
 */
import { Request, Response } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

/**
 * Check if a coach exists by email and return non-sensitive information
 */
export async function checkCoachEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find the coach by email
    const [coach] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!coach) {
      // Coach not found
      return res.json({ exists: false });
    }
    
    // Return non-sensitive coach information
    return res.json({
      exists: true,
      coach: {
        firstName: coach.firstName,
        lastName: coach.lastName,
        email: coach.email,
        phone: coach.phone || ''
      }
    });
  } catch (error) {
    console.error('Error checking coach email:', error);
    return res.status(500).json({ 
      error: 'Failed to check coach email',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}