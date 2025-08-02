/**
 * Constraint Validation API Routes
 * 
 * Comprehensive constraint validation endpoints for tournament scheduling
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { isAdmin } from '../../middleware';
import { TravelTimeService } from '../../services/travel-time-service';
import { FieldSizeValidator } from '../../services/field-size-validator';
import { CoachConflictService } from '../../services/coach-conflict-service';

const router = Router();

/**
 * Validate travel time constraints for team schedule
 */
router.post('/events/:eventId/validate-travel', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { teamId, teamSchedule } = req.body;
    
    console.log(`🚗 API: Validating travel constraints for team ${teamId}`);
    
    const travelValidations = TravelTimeService.validateTeamSchedule(teamId, teamSchedule);
    
    const criticalIssues = travelValidations.filter(v => v.severity === 'critical');
    const warnings = travelValidations.filter(v => v.severity === 'warning');
    
    console.log(`📊 Travel validation: ${criticalIssues.length} critical, ${warnings.length} warnings`);
    
    res.json({
      success: true,
      teamId,
      validations: travelValidations,
      summary: {
        totalValidations: travelValidations.length,
        criticalIssues: criticalIssues.length,
        warnings: warnings.length,
        allClear: criticalIssues.length === 0
      },
      recommendations: travelValidations
        .filter(v => v.suggestion)
        .map(v => v.suggestion)
    });
    
  } catch (error: any) {
    console.error('❌ Travel validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate travel constraints',
      details: error.message
    });
  }
});

/**
 * Get travel time matrix between complexes
 */
router.get('/travel-times', requireAuth, isAdmin, async (req, res) => {
  try {
    console.log('📍 API: Getting travel time matrix');
    
    const travelTimes = TravelTimeService.getTravelTimeMatrix();
    const complexes = TravelTimeService.getAllComplexes();
    
    res.json({
      success: true,
      complexes,
      travelTimes,
      summary: {
        complexCount: complexes.length,
        routeCount: Object.keys(travelTimes).length,
        maxTravelTime: Math.max(...Object.values(travelTimes).map(t => t.drivingTimeMinutes)),
        avgTravelTime: Math.round(
          Object.values(travelTimes).reduce((sum, t) => sum + t.drivingTimeMinutes, 0) / 
          Object.values(travelTimes).length
        )
      }
    });
    
  } catch (error: any) {
    console.error('❌ Travel time retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve travel times',
      details: error.message
    });
  }
});

/**
 * Validate field size assignments for games
 */
router.post('/events/:eventId/validate-field-sizes', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { games, availableFields } = req.body;
    
    console.log(`🏟️ API: Validating field sizes for ${games.length} games`);
    
    const validation = await FieldSizeValidator.validateScheduleFieldSizes(games, availableFields);
    
    console.log(`📊 Field size validation: ${validation.summary}`);
    
    res.json({
      success: true,
      eventId,
      validation,
      compliance: {
        percentage: Math.round((validation.validGames / games.length) * 100),
        status: validation.invalidGames === 0 ? 'compliant' : 'violations_found'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Field size validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate field sizes',
      details: error.message
    });
  }
});

/**
 * Get field size requirements and capacity rules
 */
router.get('/field-size-requirements', requireAuth, isAdmin, async (req, res) => {
  try {
    console.log('📋 API: Getting field size requirements');
    
    const requirements = FieldSizeValidator.getAllFieldSizeRequirements();
    const capacityRules = FieldSizeValidator.getAllFieldCapacityRules();
    
    res.json({
      success: true,
      requirements,
      capacityRules,
      summary: {
        ageGroups: requirements.length,
        fieldTypes: capacityRules.length,
        supportedSizes: [...new Set(requirements.map(r => r.requiredFieldSize))]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Field requirements retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve field requirements',
      details: error.message
    });
  }
});

/**
 * Find best field matches for age group
 */
router.post('/find-field-matches', requireAuth, isAdmin, async (req, res) => {
  try {
    const { ageGroup, availableFields } = req.body;
    
    console.log(`🎯 API: Finding field matches for ${ageGroup}`);
    
    const matches = FieldSizeValidator.findBestFieldMatches(ageGroup, availableFields);
    
    const perfectMatches = matches.filter(m => m.matchQuality === 'perfect');
    const acceptableMatches = matches.filter(m => m.matchQuality === 'acceptable');
    
    console.log(`🎯 Found ${perfectMatches.length} perfect, ${acceptableMatches.length} acceptable matches`);
    
    res.json({
      success: true,
      ageGroup,
      matches,
      recommendations: {
        preferredFields: perfectMatches,
        alternativeFields: acceptableMatches,
        recommendation: perfectMatches.length > 0 
          ? `Use ${perfectMatches[0].fieldName} for optimal match`
          : acceptableMatches.length > 0
          ? `Use ${acceptableMatches[0].fieldName} as acceptable alternative`
          : 'No suitable fields available'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Field matching failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find field matches',
      details: error.message
    });
  }
});

/**
 * Validate coach conflicts for event
 */
router.get('/events/:eventId/validate-coach-conflicts', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`👨‍🏫 API: Validating coach conflicts for event ${eventId}`);
    
    const conflicts = await CoachConflictService.detectConflicts(eventId);
    
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    const warnings = conflicts.filter(c => c.severity === 'warning');
    
    console.log(`📊 Coach conflicts: ${criticalConflicts.length} critical, ${warnings.length} warnings`);
    
    res.json({
      success: true,
      eventId,
      conflicts,
      summary: {
        totalConflicts: conflicts.length,
        criticalConflicts: criticalConflicts.length,
        warnings: warnings.length,
        coachesAffected: new Set(conflicts.map(c => c.coach.uniqueKey)).size,
        status: criticalConflicts.length === 0 ? 'no_conflicts' : 'conflicts_detected'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Coach conflict validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate coach conflicts',
      details: error.message
    });
  }
});

/**
 * Comprehensive constraint validation for entire schedule
 */
router.post('/events/:eventId/validate-all-constraints', requireAuth, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { games, teams, availableFields } = req.body;
    
    console.log(`🔍 API: Running comprehensive constraint validation for event ${eventId}`);
    
    // Run all validations
    const [
      coachConflicts,
      fieldSizeValidation,
      travelValidations
    ] = await Promise.all([
      CoachConflictService.detectConflicts(eventId),
      FieldSizeValidator.validateScheduleFieldSizes(games, availableFields),
      Promise.all(teams.map((team: any) => ({
        teamId: team.id,
        validations: TravelTimeService.validateTeamSchedule(
          team.id, 
          games.filter((g: any) => g.homeTeamId === team.id || g.awayTeamId === team.id)
        )
      })))
    ]);

    // Aggregate travel validations
    const allTravelValidations = travelValidations.flatMap(tv => tv.validations);
    const travelCritical = allTravelValidations.filter(v => v.severity === 'critical').length;
    const travelWarnings = allTravelValidations.filter(v => v.severity === 'warning').length;

    // Calculate overall compliance score
    const totalChecks = games.length + teams.length;
    const criticalIssues = coachConflicts.filter(c => c.severity === 'critical').length + 
                          fieldSizeValidation.invalidGames + 
                          travelCritical;
    
    const complianceScore = Math.max(0, Math.round(((totalChecks - criticalIssues) / totalChecks) * 100));

    const result = {
      success: true,
      eventId,
      overallCompliance: {
        score: complianceScore,
        status: complianceScore >= 95 ? 'excellent' : 
                complianceScore >= 85 ? 'good' : 
                complianceScore >= 70 ? 'needs_improvement' : 'critical_issues',
        totalChecks,
        criticalIssues
      },
      coachConflicts: {
        total: coachConflicts.length,
        critical: coachConflicts.filter(c => c.severity === 'critical').length,
        warnings: coachConflicts.filter(c => c.severity === 'warning').length
      },
      fieldSizeCompliance: {
        validGames: fieldSizeValidation.validGames,
        invalidGames: fieldSizeValidation.invalidGames,
        warnings: fieldSizeValidation.warnings,
        compliancePercentage: Math.round((fieldSizeValidation.validGames / games.length) * 100)
      },
      travelConstraints: {
        teamsChecked: teams.length,
        criticalIssues: travelCritical,
        warnings: travelWarnings,
        compliantTeams: teams.length - travelValidations.filter(tv => 
          tv.validations.some(v => v.severity === 'critical')).length
      },
      recommendations: [
        ...coachConflicts.filter(c => c.suggestedResolution).map(c => c.suggestedResolution),
        ...fieldSizeValidation.violations.filter(v => v.alternativeFields?.length).map(v => 
          `Consider alternative fields for ${v.requiredSize} games`),
        ...allTravelValidations.filter(v => v.suggestion).map(v => v.suggestion)
      ].filter(Boolean)
    };

    console.log(`📊 Overall compliance: ${complianceScore}% (${criticalIssues} critical issues)`);

    res.json(result);
    
  } catch (error: any) {
    console.error('❌ Comprehensive validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run comprehensive validation',
      details: error.message
    });
  }
});

export default router;