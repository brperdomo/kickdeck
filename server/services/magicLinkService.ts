import { randomBytes } from 'crypto';
import { db } from '@db/index';
import { users } from '@db/schema';
import { magicLinkTokens } from '@db/schema/magicLink';
import { eq, and, lt, gt } from 'drizzle-orm';
import { sendTemplatedEmail } from './emailService';

// Token expiration time (30 minutes)
const TOKEN_EXPIRY_MINUTES = 30;

/**
 * Generate a secure random token for magic link authentication
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a magic link token for the given user
 * @param userId The ID of the user to create a token for
 * @param userAgent The user agent of the device requesting the magic link
 * @param ipAddress The IP address of the device requesting the magic link
 * @returns The generated token
 */
export async function createMagicLinkToken(
  userId: number, 
  userAgent?: string, 
  ipAddress?: string
): Promise<string> {
  try {
    // Find the user to verify they exist
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRY_MINUTES);
    
    // Store the token in the database
    await db.insert(magicLinkTokens).values({
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
      isUsed: false,
      userAgent,
      ipAddress
    });
    
    return token;
  } catch (error) {
    console.error('Error creating magic link token:', error);
    throw error;
  }
}

/**
 * Find a user by email and generate a magic link token
 * @param email The email of the user
 * @param userAgent The user agent of the device requesting the magic link
 * @param ipAddress The IP address of the device requesting the magic link
 * @returns The generated token, or null if user not found
 */
export async function createMagicLinkTokenByEmail(
  email: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string | null> {
  try {
    // Find the user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    if (!user) {
      return null; // User not found
    }
    
    // Create magic link token
    const token = await createMagicLinkToken(user.id, userAgent, ipAddress);
    return token;
  } catch (error) {
    console.error('Error creating magic link token by email:', error);
    throw error;
  }
}

/**
 * Send a magic link email to the user
 * @param email The email of the user
 * @param token The magic link token
 * @param baseUrl The base URL for constructing the magic link
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  baseUrl: string
): Promise<void> {
  // Get the user info
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  
  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }
  
  // Construct the magic link URL
  const magicLinkUrl = `${baseUrl}/auth/magic-link?token=${token}`;
  
  // Determine if user is admin or member
  const userType = user.isAdmin ? 'admin' : 'member';
  
  // Send the email using the magic_link template
  await sendTemplatedEmail(
    email,
    'magic_link',
    {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      magicLinkUrl,
      userType,
      expiryMinutes: TOKEN_EXPIRY_MINUTES
    }
  );
}

/**
 * Verify if a magic link token is valid and return the associated user
 * @param token The token to verify
 * @returns The user ID if token is valid, null otherwise
 */
export async function verifyMagicLinkToken(token: string): Promise<number | null> {
  try {
    // Find the token in the database
    const [magicToken] = await db
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.token, token),
          eq(magicLinkTokens.isUsed, false),
          gt(magicLinkTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (!magicToken) {
      return null; // Token not found, invalid, expired, or already used
    }
    
    // Mark the token as used
    await db
      .update(magicLinkTokens)
      .set({
        isUsed: true,
        usedAt: new Date()
      })
      .where(eq(magicLinkTokens.token, token));
    
    return magicToken.userId;
  } catch (error) {
    console.error('Error verifying magic link token:', error);
    return null;
  }
}

/**
 * Create a one-click magic link login flow
 * @param email The email of the user
 * @param baseUrl The base URL for constructing the magic link
 * @param userAgent The user agent of the device requesting the magic link
 * @param ipAddress The IP address of the device requesting the magic link
 * @returns true if magic link was sent, false if user not found
 */
export async function createAndSendMagicLink(
  email: string,
  baseUrl: string,
  userAgent?: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    // Create the token
    const token = await createMagicLinkTokenByEmail(email, userAgent, ipAddress);
    
    if (!token) {
      console.log(`Magic link requested for non-existent user: ${email}`);
      return false; // User not found
    }
    
    // Send the email
    await sendMagicLinkEmail(email, token, baseUrl);
    console.log(`Magic link sent to: ${email}`);
    
    return true;
  } catch (error) {
    console.error('Error in magic link flow:', error);
    throw error;
  }
}