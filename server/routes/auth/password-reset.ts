import { Router } from "express";
import { db } from "@db";
import { users } from "@db/schema";
import { z } from "zod";
import { hashPassword } from "../../auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { emailService } from "../../services/email-service";

const router = Router();

// Token storage - in a production app, this would be in a database
// Maps token to {userId, expiresAt}
export const passwordResetTokens = new Map<string, { userId: number, expiresAt: Date }>();

// Request password reset schema
const requestResetSchema = z.object({
  email: z.string().email(),
});

// Reset password schema
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// Request password reset
router.post("/request-reset", async (req, res) => {
  try {
    const { email } = requestResetSchema.parse(req.body);

    // Find user by email
    const userResult = await db.select().from(users).where(eq(users.email, email));

    if (userResult.length > 0) {
      const user = userResult[0];

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');

      // Store token with expiration (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      passwordResetTokens.set(token, {
        userId: user.id,
        expiresAt
      });

      // Create reset URL
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      // Send email
      await emailService.sendPasswordResetEmail(user.email, {
        username: user.username || user.email,
        resetUrl
      });
    }

    // Always return success even if email doesn't exist (security best practice)
    return res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent' 
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// Verify token endpoint
router.get("/verify-token/:token", (req, res) => {
  const { token } = req.params;

  const tokenData = passwordResetTokens.get(token);

  if (!tokenData) {
    return res.status(400).json({ valid: false, message: 'Invalid or expired token' });
  }

  if (new Date() > tokenData.expiresAt) {
    passwordResetTokens.delete(token);
    return res.status(400).json({ valid: false, message: 'Token has expired' });
  }

  return res.status(200).json({ valid: true });
});

// Reset password
router.post("/reset", async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const tokenData = passwordResetTokens.get(token);

    if (!tokenData) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (new Date() > tokenData.expiresAt) {
      passwordResetTokens.delete(token);
      return res.status(400).json({ message: 'Token has expired' });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, tokenData.userId));

    // Delete the token
    passwordResetTokens.delete(token);

    return res.status(200).json({ message: 'Password has been updated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;