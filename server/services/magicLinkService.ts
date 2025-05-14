import { db } from '@db';
import { users, emailTemplates } from '@db/schema';
import { magicLinkTokens } from '@db/schema/magicLink';
import { eq, gt, and } from 'drizzle-orm';
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
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60000);

  try {
    await db.insert(magicLinkTokens).values({
      userId,
      token,
      expiresAt, // Use the Date object directly
      userAgent,
      ipAddress,
      // Let the database handle createdAt
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

    // Get template from database
    const [emailTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(
        and(
          eq(emailTemplates.type, 'magic_link'),
          eq(emailTemplates.isActive, true)
        )
      )
      .limit(1);
      
    // Prepare template variables
    const variables = {
      firstName,
      userType,
      magicLinkUrl,
      expiryMinutes: String(TOKEN_EXPIRY_MINUTES),
    };
    
    if (emailTemplate) {
      console.log('Found magic_link template in database');
      
      // Try to send with SendGrid template if configured
      if (emailTemplate.sendgridTemplateId) {
        try {
          const result = await sendEmail({
            to: email,
            from: `${emailTemplate.senderName} <${emailTemplate.senderEmail}>`,
            templateType: 'magic_link',
            subject: emailTemplate.subject,
            variables,
          });
          
          console.log('Sent magic link email using SendGrid template');
          return result.success;
        } catch (err) {
          console.error('Error sending with SendGrid template:', err);
          // Will fall through to inline template
        }
      }
      
      // Use inline template with variable replacement
      let html = emailTemplate.content;
      let subject = emailTemplate.subject;
      
      // Replace template variables
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, String(value));
        html = html.replace(regex, String(value));
      });
      
      const result = await sendEmail({
        to: email,
        from: `${emailTemplate.senderName} <${emailTemplate.senderEmail}>`,
        subject,
        html,
      });
      
      return result.success;
    } 
    
    // Fallback to inline HTML if no template found
    console.warn('No magic_link template found, using fallback');
    const fallbackResult = await sendEmail({
      to: email,
      from: 'MatchPro <support@matchpro.ai>',
      subject: 'Your MatchPro Login Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">MatchPro Login Link</h1>
          <p>Hello ${firstName},</p>
          <p>You requested a secure login link for your MatchPro ${userType} account. Click the button below to log in:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLinkUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Log In Securely
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in ${TOKEN_EXPIRY_MINUTES} minutes and can only be used once.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this link, you can safely ignore this email.</p>
        </div>
      `,
    });

    return fallbackResult.success;
  } catch (error) {
    console.error('Error sending magic link email:', error);
    if (error.response && error.response.body) {
      console.error('SendGrid API error details:', error.response.body);
    }
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
      .where(and(
        eq(magicLinkTokens.token, token),
        gt(magicLinkTokens.expiresAt, new Date()),
        eq(magicLinkTokens.used, false)
      ))
      .limit(1);

    if (!magicLinkToken) {
      console.log('Magic link token not found or expired');
      return null;
    }

    // Mark the token as used
    await db
      .update(magicLinkTokens)
      .set({ 
        used: true
        // No usedAt field in the schema, stick with the used flag only
      })
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