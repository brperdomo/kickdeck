/**
 * Coach-related API routes
 */

import { Request, Response } from 'express';
import { db } from '@db/index';
import { users } from '@db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Check if a coach exists by email and return non-sensitive information
 */
export async function checkCoachEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }
    
    // Look for a user with the provided email
    const [coach] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        exists: sql`true`.as('exists')
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    // Return coach information if found, otherwise return exists: false
    if (coach) {
      return res.status(200).json({ 
        exists: true,
        coach: {
          id: coach.id,
          firstName: coach.firstName,
          lastName: coach.lastName,
          phone: coach.phone || ''
        }
      });
    } else {
      return res.status(200).json({ 
        exists: false
      });
    }
  } catch (error) {
    console.error('Error checking coach email:', error);
    return res.status(500).json({ 
      error: 'Failed to check coach email' 
    });
  }
}