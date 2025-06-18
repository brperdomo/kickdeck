/**
 * Tournament Director Management Routes
 * 
 * Routes for assigning Tournament Directors to events and managing their access
 */

import express from 'express';
import { db } from 'db';
import { eventAdministrators, users, adminRoles, roles } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { authenticateTournamentDirector, requireEventAccess } from '../middleware/tournament-director-auth';

const router = express.Router();

/**
 * Get all users with Tournament Director role
 */
router.get('/tournament-directors', async (req, res) => {
  try {
    const tournamentDirectors = await db.query.adminRoles.findMany({
      with: {
        user: true,
        role: true
      },
      where: (adminRoles, { eq }) => eq(adminRoles.roleId, 
        db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'tournament_director'))
      )
    });

    const directors = tournamentDirectors.map(td => ({
      id: td.user.id,
      email: td.user.email,
      firstName: td.user.firstName,
      lastName: td.user.lastName,
      phone: td.user.phone,
      assignedAt: td.createdAt
    }));

    res.json(directors);
  } catch (error) {
    console.error('Error fetching tournament directors:', error);
    res.status(500).json({ error: 'Failed to fetch tournament directors' });
  }
});

/**
 * Get Tournament Directors assigned to a specific event
 */
router.get('/events/:eventId/tournament-directors', async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventDirectors = await db.query.eventAdministrators.findMany({
      where: and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.role, 'tournament_director')
      ),
      with: {
        user: true
      }
    });

    const directors = eventDirectors.map(ea => ({
      id: ea.user.id,
      email: ea.user.email,
      firstName: ea.user.firstName,
      lastName: ea.user.lastName,
      phone: ea.user.phone,
      role: ea.role,
      permissions: ea.permissions,
      assignedAt: ea.createdAt
    }));

    res.json(directors);
  } catch (error) {
    console.error('Error fetching event tournament directors:', error);
    res.status(500).json({ error: 'Failed to fetch event tournament directors' });
  }
});

/**
 * Assign Tournament Director to an event
 */
router.post('/events/:eventId/tournament-directors', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, permissions = {} } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user has Tournament Director role
    const tournamentDirectorRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'tournament_director')
    });

    if (!tournamentDirectorRole) {
      return res.status(400).json({ error: 'Tournament Director role not found' });
    }

    const userHasRole = await db.query.adminRoles.findFirst({
      where: and(
        eq(adminRoles.userId, userId),
        eq(adminRoles.roleId, tournamentDirectorRole.id)
      )
    });

    if (!userHasRole) {
      return res.status(400).json({ 
        error: 'User must have Tournament Director role before assignment' 
      });
    }

    // Check if already assigned to this event
    const existingAssignment = await db.query.eventAdministrators.findFirst({
      where: and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.userId, userId),
        eq(eventAdministrators.role, 'tournament_director')
      )
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        error: 'Tournament Director already assigned to this event' 
      });
    }

    // Create assignment
    const [assignment] = await db.insert(eventAdministrators).values({
      eventId,
      userId,
      role: 'tournament_director',
      permissions: permissions
    }).returning();

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    res.status(201).json({
      id: assignment.id,
      eventId: assignment.eventId,
      userId: assignment.userId,
      role: assignment.role,
      permissions: assignment.permissions,
      user: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        phone: user?.phone
      },
      createdAt: assignment.createdAt
    });

  } catch (error) {
    console.error('Error assigning tournament director:', error);
    res.status(500).json({ error: 'Failed to assign tournament director' });
  }
});

/**
 * Remove Tournament Director from an event
 */
router.delete('/events/:eventId/tournament-directors/:userId', async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const deleted = await db.delete(eventAdministrators)
      .where(and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.userId, parseInt(userId)),
        eq(eventAdministrators.role, 'tournament_director')
      ))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Tournament Director assignment not found' });
    }

    res.json({ message: 'Tournament Director removed from event' });

  } catch (error) {
    console.error('Error removing tournament director:', error);
    res.status(500).json({ error: 'Failed to remove tournament director' });
  }
});

/**
 * Get events accessible to current Tournament Director
 */
router.get('/my-events', authenticateTournamentDirector, async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Super admins see all events (handled in middleware)
    if (req.user.isAdmin && !req.user.isTournamentDirector) {
      const allEvents = await db.query.events.findMany({
        where: (events, { eq }) => eq(events.isArchived, false)
      });
      return res.json(allEvents);
    }

    // Tournament Directors see only assigned events
    if (req.user.isTournamentDirector && req.user.assignedEvents) {
      const accessibleEvents = await db.query.events.findMany({
        where: (events, { and, eq, inArray }) => and(
          eq(events.isArchived, false),
          inArray(events.id, req.user.assignedEvents.map(id => parseInt(id)))
        )
      });
      return res.json(accessibleEvents);
    }

    res.json([]);

  } catch (error) {
    console.error('Error fetching accessible events:', error);
    res.status(500).json({ error: 'Failed to fetch accessible events' });
  }
});

/**
 * Update Tournament Director permissions for an event
 */
router.put('/events/:eventId/tournament-directors/:userId', requireEventAccess, async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { permissions } = req.body;

    const [updated] = await db.update(eventAdministrators)
      .set({ permissions })
      .where(and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.userId, parseInt(userId)),
        eq(eventAdministrators.role, 'tournament_director')
      ))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Tournament Director assignment not found' });
    }

    res.json(updated);

  } catch (error) {
    console.error('Error updating tournament director permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

export default router;