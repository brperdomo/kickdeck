import { randomBytes } from 'crypto';
import { db } from '@db/index';
import { users } from '@db/schema';
import { passwordResetTokens } from '@db/schema/passwordReset';
import { eq, and, lt } from 'drizzle-orm';
import { sendPasswordResetEmail } from './emailService';
import { crypto } from '../crypto';

// Token expiration time (24 hours)
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate a secure random token for password reset
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a password reset token for the given user
 */
export async function createPasswordResetToken(userId: number): Promise<string> {
  try {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);
    
    // Store the token in the database
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });
    
    return token;
  } catch (error) {
    console.error('Error creating password reset token:', error);
    throw error;
  }
}

/**
 * Verify if a token is valid and return the associated user
 */
export async function verifyPasswordResetToken(token: string): Promise<number | null> {
  try {
    const currentTime = new Date();
    
    // Find the token in the database
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          lt(currentTime, passwordResetTokens.expiresAt),
          eq(passwordResetTokens.usedAt, null)
        )
      );
    
    if (!resetToken) {
      return null;
    }
    
    return resetToken.userId;
  } catch (error) {
    console.error('Error verifying password reset token:', error);
    return null;
  }
}

/**
 * Mark a token as used
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  try {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  } catch (error) {
    console.error('Error marking token as used:', error);
    throw error;
  }
}

/**
 * Initiate the password reset process for a given email
 */
export async function initiatePasswordReset(email: string): Promise<boolean> {
  try {
    // Find the user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) {
      // Don't reveal if the email exists or not for security reasons
      return true;
    }
    
    // Create a reset token
    const token = await createPasswordResetToken(user.id);
    
    // Send the reset email
    await sendPasswordResetEmail(user.email, token, user.username);
    
    return true;
  } catch (error) {
    console.error('Error initiating password reset:', error);
    throw error;
  }
}

/**
 * Complete the password reset process
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    // Verify the token and get the user ID
    const userId = await verifyPasswordResetToken(token);
    
    if (!userId) {
      return false;
    }
    
    // Hash the new password
    const hashedPassword = await crypto.hash(newPassword);
    
    // Update the user's password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));
    
    // Mark the token as used
    await markTokenAsUsed(token);
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}