/**
 * Facility Constraints API Routes
 * Integrates existing parking, lighting, and concession constraints into scheduling
 */

import { Router } from 'express';
import { db } from '@db';
import { fields, complexes } from '@db/schema';
import { eq } from 'drizzle-orm';
import FacilityConstraintService from '../../services/facility-constraint-service.js';

const router = Router();

/**
 * GET /api/admin/facility-constraints/fields/:fieldId
 * Get facility constraint details for a specific field
 */
router.get('/fields/:fieldId', async (req, res) => {
  try {
    const { fieldId } = req.params;
    
    const field = await db.query.fields.findFirst({
      where: eq(fields.id, parseInt(fieldId))
    });
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }
    
    // Parse concession hours safely
    let concessionHours = null;
    if (field.concessionHours) {
      try {
        concessionHours = JSON.parse(field.concessionHours);
      } catch (e) {
        console.warn('Invalid concession hours JSON:', field.concessionHours);
      }
    }
    
    res.json({
      success: true,
      field: {
        ...field,
        concessionHours,
        facilityCapabilities: {
          lighting: field.hasLights,
          parking: field.hasParking,
          concessions: field.hasConcessions,
          parkingCapacity: field.parkingCapacity || 50,
          concessionCapacity: field.concessionCapacity || 0
        }
      }
    });
    
  } catch (error: any) {
    console.error('Field facility constraints error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve field facility constraints',
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/facility-constraints/validate-games
 * Validate facility constraints for a set of games
 */
router.post('/validate-games', async (req, res) => {
  try {
    const { games } = req.body;
    
    if (!games || !Array.isArray(games)) {
      return res.status(400).json({ error: 'Games array is required' });
    }
    
    // Fetch all relevant fields
    const fieldIds = [...new Set(games.map(g => g.fieldId))];
    const fieldsData = await db.query.fields.findMany({
      where: (fields, { inArray }) => inArray(fields.id, fieldIds)
    });
    
    const fieldsMap = new Map(fieldsData.map(f => [f.id, f]));
    
    // Validate all facility constraints
    const validationResults = FacilityConstraintService.validateAllFacilityConstraints(
      games, 
      fieldsMap
    );
    
    // Categorize results
    const criticalIssues = validationResults.filter(r => r.severity === 'critical');
    const warnings = validationResults.filter(r => r.severity === 'warning');
    const passed = validationResults.filter(r => r.severity === 'ok');
    
    // Get optimization recommendations
    const recommendations = FacilityConstraintService.getFacilityOptimizationRecommendations(
      validationResults
    );
    
    res.json({
      success: true,
      validation: {
        totalChecks: validationResults.length,
        criticalIssues: criticalIssues.length,
        warnings: warnings.length,
        passed: passed.length,
        complianceRate: (passed.length / validationResults.length * 100).toFixed(1)
      },
      results: validationResults,
      recommendations,
      summary: {
        lightingIssues: criticalIssues.filter(r => r.facilityType === 'lighting').length,
        parkingIssues: criticalIssues.filter(r => r.facilityType === 'parking').length,
        concessionIssues: criticalIssues.filter(r => r.facilityType === 'concessions').length
      }
    });
    
  } catch (error: any) {
    console.error('Facility constraints validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate facility constraints',
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/facility-constraints/complex/:complexId/capacity
 * Get capacity analysis for a complex
 */
router.get('/complex/:complexId/capacity', async (req, res) => {
  try {
    const { complexId } = req.params;
    
    const complexData = await db.query.complexes.findFirst({
      where: eq(complexes.id, parseInt(complexId))
    });
    
    const complexFields = await db.query.fields.findMany({
      where: eq(fields.complexId, parseInt(complexId))
    });
    
    if (!complexData) {
      return res.status(404).json({ error: 'Complex not found' });
    }
    
    // Calculate capacity metrics
    const totalFields = complexFields.length;
    const lightsFields = complexFields.filter(f => f.hasLights).length;
    const concessionFields = complexFields.filter(f => f.hasConcessions).length;
    const totalParkingCapacity = complexFields.reduce((sum, f) => 
      sum + (f.parkingCapacity || 50), 0);
    const totalConcessionCapacity = complexFields.reduce((sum, f) => 
      sum + (f.concessionCapacity || 0), 0);
    
    // Field size distribution
    const fieldSizeDistribution = complexFields.reduce((dist, field) => {
      const size = field.fieldSize || '11v11';
      dist[size] = (dist[size] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    res.json({
      success: true,
      complex: {
        id: complexData.id,
        name: complexData.name,
        address: `${complexData.address}, ${complexData.city}, ${complexData.state}`,
        operatingHours: `${complexData.openTime} - ${complexData.closeTime}`
      },
      capacity: {
        totalFields,
        fieldsWithLights: lightsFields,
        fieldsWithConcessions: concessionFields,
        lightingCoverage: `${lightsFields}/${totalFields} (${(lightsFields/totalFields*100).toFixed(1)}%)`,
        totalParkingCapacity,
        totalConcessionCapacity,
        fieldSizeDistribution
      },
      recommendations: [
        ...(lightsFields < totalFields ? [`Consider adding lights to ${totalFields - lightsFields} more fields for extended scheduling`] : []),
        ...(totalParkingCapacity < totalFields * 80 ? [`Parking capacity may be insufficient for simultaneous games`] : []),
        ...(concessionFields === 0 ? [`Consider adding concession facilities for enhanced spectator experience`] : [])
      ]
    });
    
  } catch (error: any) {
    console.error('Complex capacity analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze complex capacity',
      details: error.message 
    });
  }
});

/**
 * PUT /api/admin/facility-constraints/fields/:fieldId
 * Update facility constraint settings for a field
 */
router.put('/fields/:fieldId', async (req, res) => {
  try {
    const { fieldId } = req.params;
    const updates = req.body;
    
    // Validate concession hours JSON if provided
    if (updates.concessionHours) {
      try {
        JSON.parse(updates.concessionHours);
      } catch (e) {
        return res.status(400).json({ 
          error: 'Invalid concession hours format. Expected JSON: {"open": "07:00", "close": "21:00"}' 
        });
      }
    }
    
    const updatedField = await db.update(fields)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(fields.id, parseInt(fieldId)))
      .returning();
    
    if (updatedField.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }
    
    res.json({
      success: true,
      message: 'Field facility constraints updated successfully',
      field: updatedField[0]
    });
    
  } catch (error: any) {
    console.error('Field facility constraints update error:', error);
    res.status(500).json({ 
      error: 'Failed to update field facility constraints',
      details: error.message 
    });
  }
});

/**
 * GET /api/admin/facility-constraints/optimization-report
 * Generate facility optimization recommendations across all complexes
 */
router.get('/optimization-report', async (req, res) => {
  try {
    const allComplexes = await db.query.complexes.findMany();
    const allFields = await db.query.fields.findMany();
    
    const report = {
      summary: {
        totalComplexes: allComplexes.length,
        totalFields: allFields.length,
        totalLightedFields: 0,
        totalConcessionFields: 0,
        totalParkingCapacity: 0
      },
      complexAnalysis: [] as any[],
      globalRecommendations: [] as string[]
    };
    
    allComplexes.forEach(complex => {
      const complexFieldsData = allFields.filter(f => f.complexId === complex.id);
      const lightsFields = complexFieldsData.filter(f => f.hasLights).length;
      const concessionFields = complexFieldsData.filter(f => f.hasConcessions).length;
      const parkingCapacity = complexFieldsData.reduce((sum, f) => sum + (f.parkingCapacity || 50), 0);
      
      report.summary.totalLightedFields += lightsFields;
      report.summary.totalConcessionFields += concessionFields;
      report.summary.totalParkingCapacity += parkingCapacity;
      
      report.complexAnalysis.push({
        id: complex.id,
        name: complex.name,
        fields: complexFieldsData.length,
        lightingCoverage: lightsFields / complexFieldsData.length,
        concessionCoverage: concessionFields / complexFieldsData.length,
        parkingPerField: parkingCapacity / complexFieldsData.length,
        recommendations: [
          ...(lightsFields === 0 ? ['Critical: No lighting available - limits scheduling flexibility'] : []),
          ...(lightsFields < complexFieldsData.length * 0.5 ? ['Consider expanding lighting coverage'] : []),
          ...(concessionFields === 0 ? ['No concession facilities - consider adding for spectator experience'] : []),
          ...(parkingCapacity < complexFieldsData.length * 60 ? ['Parking capacity may be insufficient for peak usage'] : [])
        ]
      });
    });
    
    // Global recommendations
    const lightingCoverage = report.summary.totalLightedFields / report.summary.totalFields;
    const concessionCoverage = report.summary.totalConcessionFields / report.summary.totalFields;
    
    if (lightingCoverage < 0.6) {
      report.globalRecommendations.push('System-wide lighting coverage below 60% - consider strategic lighting investments');
    }
    
    if (concessionCoverage < 0.3) {
      report.globalRecommendations.push('Limited concession facilities - opportunity for revenue enhancement');
    }
    
    if (report.summary.totalParkingCapacity < report.summary.totalFields * 70) {
      report.globalRecommendations.push('Overall parking capacity appears constrained for simultaneous events');
    }
    
    res.json({
      success: true,
      report,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Facility optimization report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate facility optimization report',
      details: error.message 
    });
  }
});

export default router;