/**
 * Enhanced Conflict Detection API Routes
 * 
 * Advanced conflict analysis endpoints for tournament scheduling
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { isAdmin } from '../../middleware';
import { EnhancedConflictDetection } from '../../services/enhanced-conflict-detection';

const router = Router();

/**
 * Comprehensive feasibility analysis for tournament scheduling
 */
router.post('/events/:eventId/scheduling-feasibility', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { proposedGames, constraints } = req.body;
    
    console.log(`🧠 API: Assessing scheduling feasibility for event ${eventId}`);
    console.log(`   Proposed games: ${proposedGames?.length || 0}`);
    console.log(`   Constraints: Max days ${constraints?.maxDaysToSpread}, Rest period ${constraints?.minRestPeriod}min`);
    
    const feasibility = await EnhancedConflictDetection.assessSchedulingFeasibility(
      eventId,
      proposedGames,
      constraints
    );
    
    console.log(`🧠 Feasibility result: ${feasibility.confidence}% confidence, ${feasibility.isFeasible ? 'FEASIBLE' : 'CHALLENGING'}`);
    
    res.json({
      success: true,
      feasibility,
      analysis: {
        confidence: feasibility.confidence,
        isFeasible: feasibility.isFeasible,
        conflictCount: feasibility.conflictCount,
        capacityViolations: feasibility.capacityViolations,
        recommendations: feasibility.recommendations,
        bottlenecks: feasibility.bottlenecks
      }
    });
    
  } catch (error: any) {
    console.error('❌ Feasibility analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess scheduling feasibility',
      details: error.message
    });
  }
});

/**
 * Advanced time conflict detection
 */
router.post('/events/:eventId/detect-conflicts', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { startTime, endTime, dayIndex, fieldId, excludeGameIds } = req.body;
    
    console.log(`🔍 API: Detecting conflicts for ${startTime}-${endTime} on day ${dayIndex}`);
    
    const conflicts = await EnhancedConflictDetection.detectTimeOverlaps(
      eventId,
      startTime,
      endTime,
      dayIndex,
      fieldId,
      excludeGameIds || []
    );
    
    console.log(`🔍 Found ${conflicts.length} conflicts`);
    
    res.json({
      success: true,
      conflicts,
      summary: {
        totalConflicts: conflicts.length,
        criticalConflicts: conflicts.filter(c => c.severity === 'critical').length,
        warningConflicts: conflicts.filter(c => c.severity === 'warning').length,
        minorConflicts: conflicts.filter(c => c.severity === 'minor').length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Conflict detection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect conflicts',
      details: error.message
    });
  }
});

/**
 * Capacity constraint analysis
 */
router.post('/events/:eventId/analyze-capacity', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { dayIndex, timeWindow } = req.body;
    
    console.log(`📊 API: Analyzing capacity constraints for event ${eventId} day ${dayIndex}`);
    
    const constraints = await EnhancedConflictDetection.analyzeCapacityConstraints(
      eventId,
      dayIndex,
      timeWindow
    );
    
    console.log(`📊 Found ${constraints.length} capacity constraints`);
    
    res.json({
      success: true,
      constraints,
      summary: {
        totalConstraints: constraints.length,
        violations: constraints.filter(c => c.isViolated).length,
        constraintTypes: Array.from(new Set(constraints.map(c => c.constraintType)))
      }
    });
    
  } catch (error: any) {
    console.error('❌ Capacity analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze capacity constraints',
      details: error.message
    });
  }
});

/**
 * Intelligent conflict resolution suggestions
 */
router.post('/events/:eventId/suggest-resolutions', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { conflicts, constraints } = req.body;
    
    console.log(`💡 API: Generating resolution suggestions for ${conflicts?.length || 0} conflicts`);
    
    const suggestions = await EnhancedConflictDetection.suggestConflictResolution(
      conflicts || [],
      constraints || []
    );
    
    console.log(`💡 Generated ${suggestions.length} resolution strategies`);
    
    res.json({
      success: true,
      suggestions,
      prioritizedSuggestions: suggestions
        .sort((a, b) => (b.estimatedResolution - a.estimatedResolution))
        .slice(0, 3) // Top 3 suggestions
    });
    
  } catch (error: any) {
    console.error('❌ Resolution suggestion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate resolution suggestions',
      details: error.message
    });
  }
});

export default router;