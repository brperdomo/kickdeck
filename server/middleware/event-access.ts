import { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { eventAdministrators } from '@db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Middleware to check if a user has access to a specific event
 * This enforces event-specific permissions for admins who are not super admins
 * 
 * Usage:
 * - Use on routes with eventId or id parameter to restrict access to authorized admins
 * - Super admins always have access to all events
 * - Tournament admins only have access to events they are assigned to
 */
export const hasEventAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (!req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }

    // Super admins always have access to all events
    if (req.user.roles && req.user.roles.includes('super_admin')) {
      return next();
    }

    // Extract event ID from params (could be either 'id' or 'eventId')
    const eventId = req.params.eventId || req.params.id;
    
    if (!eventId) {
      return res.status(400).send("Event ID is required");
    }

    // Check if user is an administrator for this event
    const userEventAdmins = await db
      .select()
      .from(eventAdministrators)
      .where(
        and(
          eq(eventAdministrators.userId, req.user.id),
          eq(eventAdministrators.eventId, eventId)
        )
      );

    if (userEventAdmins.length === 0) {
      console.log(`User ${req.user.id} attempted to access event ${eventId} without permission`);
      return res.status(403).send("You do not have permission to access this event");
    }

    // If we get here, the user has permission
    next();
  } catch (error) {
    console.error('Error in hasEventAccess middleware:', error);
    res.status(500).send("Internal server error");
  }
};