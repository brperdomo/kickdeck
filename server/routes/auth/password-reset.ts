
import { Router } from 'express';
import { users } from '@db/schema';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../../services/email-service';

const router = Router();

// Store reset tokens temporarily (in production, consider using Redis or a database table)
export const passwordResetTokens: Record<string, { userId: number; expires: Date }> = {};

// Request password reset
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user) {
      // Don't reveal that the user doesn't exist (security best practice)
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store token with expiry (1 hour)
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    
    passwordResetTokens[resetToken] = {
      userId: user.id,
      expires,
    };
    
    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken, user.username);
    
    // For development: log the token and reset URL
    if (process.env.NODE_ENV !== 'production') {
      const resetUrl = `${process.env.APP_URL || ''}/reset-password?token=${resetToken}`;
      console.log(`\n=============== PASSWORD RESET INFO ===============`);
      console.log(`[DEV ONLY] Password reset requested for ${user.email}`);
      console.log(`[DEV ONLY] Reset token: ${resetToken}`);
      console.log(`[DEV ONLY] Reset URL: ${resetUrl}`);
      console.log(`====================================================\n`);
    }
    
    return res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent' 
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    
    // Verify token
    const tokenData = passwordResetTokens[token];
    
    if (!tokenData) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expires) {
      delete passwordResetTokens[token];
      return res.status(400).json({ message: 'Token has expired' });
    }
    
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1);
    
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    // Update password
    const { crypto } = await import('../../crypto');
    const hashedPassword = await crypto.hash(password);
    
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));
    
    // Remove used token
    delete passwordResetTokens[token];
    
    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;
