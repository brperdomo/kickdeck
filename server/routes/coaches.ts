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
    
    // Find the user by email
    const [user] = await db
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
    
    if (user) {
      // Return coach information (excluding sensitive data)
      return res.status(200).json({
        exists: true,
        coach: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || ''
        }
      });
    } else {
      // Coach doesn't exist
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking coach email:', error);
    return res.status(500).json({ error: 'Failed to check coach email' });
  }
}