import { Router } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import {
  createMagicLinkTokenByEmail,
  verifyMagicLinkToken,
  sendMagicLinkEmail
} from '../services/magicLinkService';

const router = Router();

// Request a magic link to be sent via email
router.post('/request', async (req, res) => {
  try {
    const { email, userAgent, ipAddress } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found with this email address'
      });
    }

    // Create and send magic link
    const token = await createMagicLinkTokenByEmail(
      email,
      userAgent || req.headers['user-agent'],
      ipAddress || req.ip
    );

    if (!token) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate magic link token'
      });
    }

    // Get the base URL for constructing the full magic link
    const baseUrl = process.env.BASE_URL || 
      `${req.protocol}://${req.get('host')}`;

    // Send the email
    const emailSent = await sendMagicLinkEmail(email, token, baseUrl);

    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send magic link email'
      });
    }

    // For testing purposes, include the token in development
    const response: any = { 
      success: true, 
      message: 'Magic link email sent' 
    };
    
    // Only expose the token in development mode
    if (process.env.NODE_ENV === 'development') {
      response.token = token;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Magic link request error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error'
    });
  }
});

// Verify a magic link token and log the user in
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }

    // Verify the token
    const userId = await verifyMagicLinkToken(token);

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired token'
      });
    }

    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found'
      });
    }

    // Log the user in (create session)
    req.login(user, (err) => {
      if (err) {
        console.error('Login error after magic link verification:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating session'
        });
      }

      // Return success and user ID
      return res.status(200).json({ 
        success: true, 
        message: 'Successfully authenticated',
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        }
      });
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error'
    });
  }
});

export default router;