import { db } from '@db';
import { users } from '@db/schema';
import { magicLinkTokens } from '@db/schema/magicLink';
import { eq, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendEmail } from './emailService';

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
  userAgent: string = 'Unknown',
  ipAddress: string = 'Unknown'
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRY_MINUTES);

  await db.insert(magicLinkTokens).values({
    userId,
    token,
    expiresAt,
    userAgent,
    ipAddress,
    createdAt: new Date(),
  });

  return token;
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
  userAgent: string = 'Unknown',
  ipAddress: string = 'Unknown'
): Promise<string | null> {
  // Find the user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return null;
  }

  return createMagicLinkToken(user.id, userAgent, ipAddress);
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
): Promise<boolean> {
  try {
    // Find user to get their first name and role
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error(`User with email ${email} not found`);
      return false;
    }

    const firstName = user.firstName || 'User';
    const userType = user.isAdmin ? 'Administrator' : 'Member';
    const magicLinkUrl = `${baseUrl}/auth/verify-magic-link?token=${token}`;

    const result = await sendEmail({
      to: email,
      templateType: 'magic_link',
      subject: 'Your MatchPro Login Link',
      variables: {
        firstName,
        userType,
        magicLinkUrl,
        expiryMinutes: String(TOKEN_EXPIRY_MINUTES),
      },
    });

    return result.success;
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return false;
  }
}

/**
 * Verify if a magic link token is valid and return the associated user
 * @param token The token to verify
 * @returns The user ID if token is valid, null otherwise
 */
export async function verifyMagicLinkToken(token: string): Promise<number | null> {
  try {
    // Find and validate the token
    const [magicLinkToken] = await db
      .select()
      .from(magicLinkTokens)
      .where(
        eq(magicLinkTokens.token, token),
        gt(magicLinkTokens.expiresAt, new Date()),
        eq(magicLinkTokens.used, false)
      )
      .limit(1);

    if (!magicLinkToken) {
      console.log('Magic link token not found or expired');
      return null;
    }

    // Mark the token as used
    await db
      .update(magicLinkTokens)
      .set({ used: true, usedAt: new Date() })
      .where(eq(magicLinkTokens.id, magicLinkToken.id));

    return magicLinkToken.userId;
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
  userAgent: string = 'Unknown',
  ipAddress: string = 'Unknown'
): Promise<boolean> {
  // Generate token
  const token = await createMagicLinkTokenByEmail(email, userAgent, ipAddress);
  
  if (!token) {
    return false;
  }
  
  // Send email with magic link
  return await sendMagicLinkEmail(email, token, baseUrl);
}