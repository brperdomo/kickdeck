import { Router } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { createMagicLinkEmailTemplate } from '../../db/migrations/magic-link-email-template';
import { createAndSendMagicLink, verifyMagicLinkToken } from '../services/magicLinkService';

const router = Router();

/**
 * Request a magic link to be sent to the provided email
 * POST /api/auth/magic-link/request
 */
router.post('/magic-link/request', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }
    
    // Get base URL for links - prefer X-Forwarded-Host for proper URL behind proxies
    const protocol = req.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.get('x-forwarded-host') || req.get('host')}`;
    
    // Ensure magic link email template exists
    await createMagicLinkEmailTemplate();
    
    // Create and send magic link
    const result = await createAndSendMagicLink(
      email,
      baseUrl,
      req.get('user-agent'),
      req.ip
    );
    
    // Always return success=true for security reasons
    // This prevents email enumeration attacks
    return res.json({
      success: true,
      message: 'If an account exists with this email, a magic link has been sent'
    });
  } catch (error) {
    console.error('Error requesting magic link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process magic link request'
    });
  }
});

/**
 * Verify a magic link token and log the user in
 * GET /api/auth/magic-link/verify
 */
router.get('/magic-link/verify', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
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
    
    // Get the user
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
    
    // Log the user in
    req.login(user, async (err) => {
      if (err) {
        console.error('Login error after magic link verification:', err);
        return res.status(500).json({
          success: false,
          message: 'Error logging in with magic link'
        });
      }
      
      // Set longer session cookie expiration
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      try {
        // Update the user's last login time in the database
        await db
          .update(users)
          .set({
            lastLogin: new Date()
          })
          .where(eq(users.id, user.id));
          
        console.log(`Updated last_login for user ${user.id} via magic link`);
      } catch (updateError) {
        // Non-blocking - log error but continue login process
        console.error('Failed to update last_login:', updateError);
      }
      
      // Save the session to ensure it's persisted
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
        }
        
        // Return success response with redirect target
        const redirectTarget = user.isAdmin ? '/admin-direct' : '/dashboard';
        
        return res.json({
          success: true,
          message: 'Magic link authentication successful',
          user,
          redirectTo: redirectTarget
        });
      });
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify magic link'
    });
  }
});

export default router;