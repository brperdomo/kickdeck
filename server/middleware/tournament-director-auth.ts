/**
 * Tournament Director Access Control Middleware
 * 
 * This middleware ensures Tournament Directors can only access events
 * they are specifically assigned to manage.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from 'db';
import { users, adminRoles, roles } from '@db/schema';
import { eq, and } from 'drizzle-orm';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    isAdmin: boolean;
    isTournamentDirector?: boolean;
    assignedEvents?: string[];
  };
}

/**
 * Check if user has Tournament Director role
 */
export async function checkTournamentDirectorRole(userId: number): Promise<boolean> {
  try {
    const tournamentDirectorRole = await db.query.adminRoles.findFirst({
      where: and(
        eq(adminRoles.userId, userId)
      ),
      with: {
        role: true
      }
    });

    return tournamentDirectorRole?.role?.name === 'tournament_admin';
  } catch (error) {
    console.error('Error checking tournament director role:', error);
    return false;
  }
}

/**
 * Get events assigned to a Tournament Director
 */
export async function getTournamentDirectorEvents(userId: number): Promise<string[]> {
  try {
    const assignments = await db.execute(`
      SELECT event_id 
      FROM tournament_director_events 
      WHERE user_id = $1
    `, [userId]);

    return assignments.map((assignment: any) => assignment.event_id.toString());
  } catch (error) {
    console.error('Error getting tournament director events:', error);
    return [];
  }
}

/**
 * Middleware to authenticate Tournament Directors and add event access info
 */
export async function authenticateTournamentDirector(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has Tournament Director role first
    const isTournamentDirector = await checkTournamentDirectorRole(req.user.id);
    
    if (isTournamentDirector) {
      // Get assigned events for this Tournament Director
      const assignedEvents = await getTournamentDirectorEvents(req.user.id);
      
      req.user.isTournamentDirector = true;
      req.user.assignedEvents = assignedEvents;
      
      return next();
    }

    // Check if user is a super admin (has full access)
    if (req.user.isAdmin) {
      req.user.isTournamentDirector = false;
      return next();
    }

    // User has no admin or tournament director privileges
    return res.status(403).json({ error: 'Access denied. Tournament Director role required.' });

  } catch (error) {
    console.error('Tournament Director authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to check if Tournament Director has access to specific event
 */
export function requireEventAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.eventId || req.params.id || req.body.eventId;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    // Super admins have access to all events
    if (req.user?.isAdmin && !req.user?.isTournamentDirector) {
      return next();
    }

    // Tournament Directors can only access their assigned events
    if (req.user?.isTournamentDirector && req.user?.assignedEvents) {
      if (req.user.assignedEvents.includes(eventId.toString())) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Access denied. You can only manage events assigned to you.' 
      });
    }

    return res.status(403).json({ error: 'Insufficient permissions' });

  } catch (error) {
    console.error('Event access check error:', error);
    return res.status(500).json({ error: 'Access check failed' });
  }
}

/**
 * Filter events list to only show accessible events for Tournament Directors
 */
export function filterEventsForTournamentDirector(
  events: any[], 
  user: AuthenticatedRequest['user']
): any[] {
  // Super admins see all events
  if (user?.isAdmin && !user?.isTournamentDirector) {
    return events;
  }

  // Tournament Directors only see their assigned events
  if (user?.isTournamentDirector && user?.assignedEvents) {
    return events.filter(event => 
      user.assignedEvents!.includes(event.id.toString())
    );
  }

  return [];
}