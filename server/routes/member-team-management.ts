/**
 * Member Team Management Routes
 * 
 * Handles team contact updates for members, including automatic account creation
 * for new emails and sending welcome emails.
 */

import { Router, Request, Response } from 'express';
import { db } from '@db';
import { teams, users } from '@db/schema';
import { eq, or, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import * as z from 'zod';
import { sendEmail } from '../services/brevoService';

const router = Router();

// Validation schema for team contact updates
const updateContactsSchema = z.object({
  managerName: z.string().min(1, 'Manager name is required'),
  managerEmail: z.string().email('Valid manager email is required'),
  managerPhone: z.string().optional(),
  coachName: z.string().optional(),
  coachEmail: z.string().email().optional().or(z.literal('')),
  coachPhone: z.string().optional(),
});

/**
 * Middleware to ensure user is authenticated
 */
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Check if user has access to modify this team
 */
async function canUserModifyTeam(userId: number, userEmail: string, teamId: number): Promise<boolean> {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team) return false;

  // User can modify team if they are:
  // 1. The submitter
  // 2. The manager
  // 3. The coach (in JSON field)
  if (team.submitterEmail === userEmail || team.managerEmail === userEmail) {
    return true;
  }

  // Check if user is the coach
  if (team.coach) {
    try {
      const coachData = JSON.parse(team.coach);
      if (coachData.headCoachEmail === userEmail || coachData.email === userEmail) {
        return true;
      }
    } catch (e) {
      // Invalid JSON, skip coach check
    }
  }

  return false;
}

/**
 * Create or find user account for email
 */
async function findOrCreateUser(email: string, name?: string): Promise<{ user: any; isNewUser: boolean }> {
  // First, try to find existing user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return { user: existingUser, isNewUser: false };
  }

  // Create new user account
  const tempPassword = Math.random().toString(36).slice(-12); // Random temporary password
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  // Extract name parts if provided
  const nameParts = name ? name.trim().split(' ') : [];
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ') || '';

  const [newUser] = await db
    .insert(users)
    .values({
      email: email,
      username: email, // Use email as username
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      verified: false, // User will need to verify via email
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  // Send welcome email with password reset link
  try {
    await sendEmail({
      to: email,
      from: process.env.DEFAULT_FROM_EMAIL || 'support@kickdeck.io',
      subject: 'Welcome to KickDeck - Team Management Account Created',
      templateId: 'welcome_new_account', // We'll need to create this template
      dynamicTemplateData: {
        firstName: firstName,
        email: email,
        resetPasswordUrl: `${process.env.FRONTEND_URL || 'https://app.kickdeck.io'}/reset-password?email=${encodeURIComponent(email)}`,
        loginUrl: `${process.env.FRONTEND_URL || 'https://app.kickdeck.io'}/login`,
      },
    });
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Don't fail the account creation if email fails
  }

  return { user: newUser, isNewUser: true };
}

/**
 * Update team contacts (manager and coach)
 * PUT /api/member/teams/:teamId/contacts
 */
router.put('/teams/:teamId/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'Valid team ID is required' });
    }

    // Validate request body
    const validationResult = updateContactsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid data provided',
        details: validationResult.error.issues
      });
    }

    const { managerName, managerEmail, managerPhone, coachName, coachEmail, coachPhone } = validationResult.data;

    // Check if user has permission to modify this team
    const canModify = await canUserModifyTeam(userId, userEmail, teamId);
    if (!canModify) {
      return res.status(403).json({ error: 'You do not have permission to modify this team' });
    }

    // Find or create accounts for new emails
    const newAccountsCreated: string[] = [];

    // Handle manager email
    const managerResult = await findOrCreateUser(managerEmail, managerName);
    if (managerResult.isNewUser) {
      newAccountsCreated.push(managerEmail);
    }

    // Handle coach email if provided
    let coachResult = null;
    if (coachEmail && coachEmail.trim()) {
      coachResult = await findOrCreateUser(coachEmail, coachName);
      if (coachResult.isNewUser) {
        newAccountsCreated.push(coachEmail);
      }
    }

    // Prepare coach JSON data
    let coachJsonData = null;
    if (coachName || coachEmail || coachPhone) {
      coachJsonData = JSON.stringify({
        headCoachName: coachName || '',
        headCoachEmail: coachEmail || '',
        headCoachPhone: coachPhone || '',
        name: coachName || '', // Backward compatibility
        email: coachEmail || '', // Backward compatibility
        phone: coachPhone || '' // Backward compatibility
      });
    }

    // Update team with new contact information
    await db
      .update(teams)
      .set({
        managerName: managerName,
        managerEmail: managerEmail,
        managerPhone: managerPhone || null,
        coach: coachJsonData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(teams.id, teamId));

    console.log(`Team ${teamId} contacts updated by user ${userEmail}. New accounts created: ${newAccountsCreated.join(', ')}`);

    // Prepare response message
    let message = 'Team contacts updated successfully.';
    if (newAccountsCreated.length > 0) {
      message += ` New accounts created for: ${newAccountsCreated.join(', ')}. Welcome emails have been sent.`;
    }

    return res.status(200).json({
      message,
      newAccountsCreated,
      teamId,
    });

  } catch (error: any) {
    console.error('Error updating team contacts:', error);
    return res.status(500).json({
      error: 'Failed to update team contacts',
      details: error.message,
    });
  }
});

export default router;