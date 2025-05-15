/**
 * Development Authentication Bypass
 * 
 * ⚠️ WARNING: This file is for DEVELOPMENT ONLY and should NOT be included in production builds.
 * It provides a simple way to bypass authentication for testing purposes.
 */

import express, { Request, Response } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Development-only route to bypass authentication
router.get('/dev-login-bypass', async (req: Request, res: Response) => {
  // Only allow this in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  try {
    // Find the admin user
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true))
      .limit(1);

    if (!adminUser) {
      return res.status(404).json({ message: 'No admin user found' });
    }

    // Log the user in
    req.login(adminUser, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed', error: err.message });
      }

      return res.status(200).json({ 
        message: 'Successfully logged in as admin for development',
        user: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          isAdmin: adminUser.isAdmin
        }
      });
    });
  } catch (error) {
    console.error('Dev login bypass error:', error);
    return res.status(500).json({ 
      message: 'Failed to bypass authentication',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;