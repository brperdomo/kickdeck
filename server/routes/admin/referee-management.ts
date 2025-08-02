/**
 * Referee Management API Routes
 * Complete CRUD operations and assignment management for referees
 */

import { Router } from 'express';
import { db } from '@db';
import { referees, gameAssignments, insertRefereeSchema, insertGameAssignmentSchema } from '@db/schema';
import { eq, and, desc, count, sum } from 'drizzle-orm';
import RefereeAssignmentEngine from '../../services/referee-assignment-engine.js';

const router = Router();

/**
 * GET /api/admin/referees
 * Get all referees with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { active, certificationLevel, complexId } = req.query;
    
    let query = db.select().from(referees);
    
    // Apply filters
    const conditions = [];
    if (active !== undefined) {
      conditions.push(eq(referees.isActive, active === 'true'));
    }
    if (certificationLevel) {
      conditions.push(eq(referees.certificationLevel, certificationLevel as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const allReferees = await query.orderBy(referees.name);
    
    // Filter by preferred complex if specified
    let filteredReferees = allReferees;
    if (complexId) {
      filteredReferees = allReferees.filter(referee => {
        if (!referee.preferredComplexes) return false;
        try {
          const preferred = JSON.parse(referee.preferredComplexes);
          return preferred.includes(parseInt(complexId as string));
        } catch {
          return false;
        }
      });
    }
    
    res.json({
      success: true,
      referees: filteredReferees,
      total: filteredReferees.length,
      filters: { active, certificationLevel, complexId }
    });
    
  } catch (error: any) {
    console.error('Error fetching referees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch referees',
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/referees
 * Create a new referee
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = insertRefereeSchema.parse(req.body);
    
    const [newReferee] = await db.insert(referees)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json({
      success: true,
      message: 'Referee created successfully',
      referee: newReferee
    });
    
  } catch (error: any) {
    console.error('Error creating referee:', error);
    res.status(400).json({ 
      error: 'Failed to create referee',
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/referees/:id
 * Get specific referee with assignment history
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const referee = await db.query.referees.findFirst({
      where: eq(referees.id, parseInt(id))
    });
    
    if (!referee) {
      return res.status(404).json({ error: 'Referee not found' });
    }
    
    // Get recent assignments
    const recentAssignments = await db.select()
      .from(gameAssignments)
      .where(eq(gameAssignments.refereeId, parseInt(id)))
      .orderBy(desc(gameAssignments.assignedAt))
      .limit(20);
    
    // Calculate stats
    const [stats] = await db.select({
      totalAssignments: count(),
      totalEarnings: sum(gameAssignments.paymentAmount)
    })
    .from(gameAssignments)
    .where(eq(gameAssignments.refereeId, parseInt(id)));
    
    res.json({
      success: true,
      referee: {
        ...referee,
        stats: {
          totalAssignments: stats.totalAssignments || 0,
          totalEarnings: (stats.totalEarnings || 0) / 100, // Convert to dollars
          recentAssignments: recentAssignments.length
        }
      },
      recentAssignments
    });
    
  } catch (error: any) {
    console.error('Error fetching referee:', error);
    res.status(500).json({ 
      error: 'Failed to fetch referee details',
      details: error.message 
    });
  }
});

/**
 * PUT /api/admin/referees/:id
 * Update referee information
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertRefereeSchema.partial().parse(req.body);
    
    const [updatedReferee] = await db.update(referees)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(referees.id, parseInt(id)))
      .returning();
    
    if (!updatedReferee) {
      return res.status(404).json({ error: 'Referee not found' });
    }
    
    res.json({
      success: true,
      message: 'Referee updated successfully',
      referee: updatedReferee
    });
    
  } catch (error: any) {
    console.error('Error updating referee:', error);
    res.status(400).json({ 
      error: 'Failed to update referee',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/admin/referees/:id
 * Deactivate referee (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deactivatedReferee] = await db.update(referees)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(referees.id, parseInt(id)))
      .returning();
    
    if (!deactivatedReferee) {
      return res.status(404).json({ error: 'Referee not found' });
    }
    
    res.json({
      success: true,
      message: 'Referee deactivated successfully',
      referee: deactivatedReferee
    });
    
  } catch (error: any) {
    console.error('Error deactivating referee:', error);
    res.status(500).json({ 
      error: 'Failed to deactivate referee',
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/referees/assign-games
 * Automatically assign referees to multiple games
 */
router.post('/assign-games', async (req, res) => {
  try {
    const { gameIds, constraints } = req.body;
    
    if (!gameIds || !Array.isArray(gameIds)) {
      return res.status(400).json({ error: 'Game IDs array is required' });
    }
    
    // This would need to fetch actual games from your games table
    // For now, using mock data structure
    const games = gameIds.map((id: number) => ({
      id,
      startTime: '10:00',
      endTime: '11:30',
      date: '2025-08-10',
      fieldId: 1,
      complexId: 1,
      ageGroup: 'U14',
      requiredCertification: 'Adult' as const,
      estimatedPayment: 5000
    }));
    
    const activeReferees = await db.select()
      .from(referees)
      .where(eq(referees.isActive, true));
    
    const assignments = RefereeAssignmentEngine.assignReferees(
      games, 
      activeReferees, 
      constraints
    );
    
    // Save assignments to database
    const savedAssignments = [];
    for (const assignment of assignments) {
      const [saved] = await db.insert(gameAssignments)
        .values({
          gameId: assignment.gameId,
          refereeId: assignment.refereeId,
          position: assignment.position,
          paymentAmount: assignment.paymentAmount,
          assignedAt: new Date(),
          assignedBy: 1 // Would use actual user ID
        })
        .returning();
      
      savedAssignments.push(saved);
    }
    
    // Generate report
    const report = RefereeAssignmentEngine.generateAssignmentReport(
      assignments, 
      games, 
      activeReferees
    );
    
    res.json({
      success: true,
      message: `${assignments.length} referee assignments created`,
      assignments: savedAssignments,
      report
    });
    
  } catch (error: any) {
    console.error('Error assigning referees:', error);
    res.status(500).json({ 
      error: 'Failed to assign referees to games',
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/referees/assignments/:gameId
 * Get referee assignments for a specific game
 */
router.get('/assignments/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const assignments = await db.select({
      assignment: gameAssignments,
      referee: {
        id: referees.id,
        name: referees.name,
        email: referees.email,
        certificationLevel: referees.certificationLevel
      }
    })
    .from(gameAssignments)
    .innerJoin(referees, eq(gameAssignments.refereeId, referees.id))
    .where(eq(gameAssignments.gameId, parseInt(gameId)));
    
    res.json({
      success: true,
      gameId: parseInt(gameId),
      assignments,
      totalAssignments: assignments.length
    });
    
  } catch (error: any) {
    console.error('Error fetching game assignments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch game assignments',
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/referees/assignments
 * Create individual referee assignment
 */
router.post('/assignments', async (req, res) => {
  try {
    const validatedData = insertGameAssignmentSchema.parse(req.body);
    
    // Check if assignment already exists for this game/position
    const existing = await db.select()
      .from(gameAssignments)
      .where(
        and(
          eq(gameAssignments.gameId, validatedData.gameId),
          eq(gameAssignments.position, validatedData.position)
        )
      );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Assignment already exists for this game and position' 
      });
    }
    
    const [newAssignment] = await db.insert(gameAssignments)
      .values({
        ...validatedData,
        assignedAt: new Date(),
        assignedBy: 1 // Would use actual user ID
      })
      .returning();
    
    res.status(201).json({
      success: true,
      message: 'Referee assignment created successfully',
      assignment: newAssignment
    });
    
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(400).json({ 
      error: 'Failed to create referee assignment',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/admin/referees/assignments/:id
 * Remove referee assignment
 */
router.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedAssignment] = await db.delete(gameAssignments)
      .where(eq(gameAssignments.id, parseInt(id)))
      .returning();
    
    if (!deletedAssignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json({
      success: true,
      message: 'Referee assignment removed successfully',
      assignment: deletedAssignment
    });
    
  } catch (error: any) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ 
      error: 'Failed to remove referee assignment',
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/referees/availability/:refereeId
 * Get referee availability for scheduling
 */
router.get('/availability/:refereeId', async (req, res) => {
  try {
    const { refereeId } = req.params;
    const { startDate, endDate } = req.query;
    
    const referee = await db.query.referees.findFirst({
      where: eq(referees.id, parseInt(refereeId))
    });
    
    if (!referee) {
      return res.status(404).json({ error: 'Referee not found' });
    }
    
    // Get existing assignments in date range
    const existingAssignments = await db.select()
      .from(gameAssignments)
      .where(eq(gameAssignments.refereeId, parseInt(refereeId)));
    
    // Parse availability schedule
    let availabilitySchedule = null;
    if (referee.availability) {
      try {
        availabilitySchedule = JSON.parse(referee.availability);
      } catch (error) {
        console.warn('Invalid availability JSON for referee:', refereeId);
      }
    }
    
    res.json({
      success: true,
      referee: {
        id: referee.id,
        name: referee.name,
        certificationLevel: referee.certificationLevel
      },
      availabilitySchedule,
      existingAssignments,
      dateRange: { startDate, endDate }
    });
    
  } catch (error: any) {
    console.error('Error fetching referee availability:', error);
    res.status(500).json({ 
      error: 'Failed to fetch referee availability',
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/referees/stats/summary
 * Get referee system statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    // Get referee counts by status
    const totalReferees = await db.select({ count: count() })
      .from(referees);
    
    const activeReferees = await db.select({ count: count() })
      .from(referees)
      .where(eq(referees.isActive, true));
    
    // Get certification distribution
    const certificationStats = await db.select({
      certification: referees.certificationLevel,
      count: count()
    })
    .from(referees)
    .where(eq(referees.isActive, true))
    .groupBy(referees.certificationLevel);
    
    // Get assignment statistics
    const assignmentStats = await db.select({
      totalAssignments: count(),
      totalPayments: sum(gameAssignments.paymentAmount)
    })
    .from(gameAssignments);
    
    res.json({
      success: true,
      stats: {
        totalReferees: totalReferees[0]?.count || 0,
        activeReferees: activeReferees[0]?.count || 0,
        inactiveReferees: (totalReferees[0]?.count || 0) - (activeReferees[0]?.count || 0),
        certificationDistribution: certificationStats,
        assignmentStats: {
          totalAssignments: assignmentStats[0]?.totalAssignments || 0,
          totalPayments: (assignmentStats[0]?.totalPayments || 0) / 100
        }
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error fetching referee stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch referee statistics',
      details: error.message 
    });
  }
});

export default router;