import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { db } from '@db';
import { complexes, fields, eventComplexes } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get complexes with fields for capacity analysis
router.get('/events/:eventId/complexes', requireAuth, requirePermission('view_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Fetch complexes associated with the event through eventComplexes table
    const eventComplexesData = await db
      .select({
        complexId: complexes.id,
        complexName: complexes.name,
        complexAddress: complexes.address,
        complexOpenTime: complexes.openTime,
        complexCloseTime: complexes.closeTime,
        fieldId: fields.id,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        hasLights: fields.hasLights,
        isOpen: fields.isOpen,
        fieldOpenTime: fields.openTime,
        fieldCloseTime: fields.closeTime,
      })
      .from(eventComplexes)
      .innerJoin(complexes, eq(eventComplexes.complexId, complexes.id))
      .leftJoin(fields, eq(complexes.id, fields.complexId))
      .where(eq(eventComplexes.eventId, eventId));

    // Transform to grouped structure
    const complexMap = new Map();
    eventComplexesData.forEach(row => {
      if (!complexMap.has(row.complexId)) {
        complexMap.set(row.complexId, {
          id: row.complexId,
          name: row.complexName,
          address: row.complexAddress,
          openTime: row.complexOpenTime,
          closeTime: row.complexCloseTime,
          fields: []
        });
      }
      
      if (row.fieldId) {
        complexMap.get(row.complexId).fields.push({
          id: row.fieldId,
          name: row.fieldName,
          fieldSize: row.fieldSize,
          hasLights: row.hasLights,
          isOpen: row.isOpen,
          openTime: row.fieldOpenTime,
          closeTime: row.fieldCloseTime,
        });
      }
    });

    const eventComplexesList = Array.from(complexMap.values());

    res.json(eventComplexesList);
  } catch (error) {
    console.error('Error fetching complexes:', error);
    res.status(500).json({ error: 'Failed to fetch complexes' });
  }
});

// Analyze field capacity for an event
router.post('/events/:eventId/analyze-capacity', requireAuth, requirePermission('view_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { teamsData, gameMetadata } = req.body;

    // Fetch complexes with fields (reuse the logic from above)
    const eventComplexesData = await db
      .select({
        complexId: complexes.id,
        complexName: complexes.name,
        fieldId: fields.id,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        isOpen: fields.isOpen,
      })
      .from(eventComplexes)
      .innerJoin(complexes, eq(eventComplexes.complexId, complexes.id))
      .leftJoin(fields, eq(complexes.id, fields.complexId))
      .where(eq(eventComplexes.eventId, eventId));

    // Transform to grouped structure
    const complexMap = new Map();
    eventComplexesData.forEach(row => {
      if (!complexMap.has(row.complexId)) {
        complexMap.set(row.complexId, {
          id: row.complexId,
          name: row.complexName,
          fields: []
        });
      }
      
      if (row.fieldId && row.isOpen) {
        complexMap.get(row.complexId).fields.push({
          id: row.fieldId,
          name: row.fieldName,
          fieldSize: row.fieldSize,
          isOpen: row.isOpen,
        });
      }
    });

    const eventComplexesList = Array.from(complexMap.values());

    // Calculate operating hours
    const openHour = parseInt(gameMetadata.fieldOpeningTime.split(':')[0]);
    const closeHour = parseInt(gameMetadata.fieldClosingTime.split(':')[0]);
    const operatingMinutes = (closeHour - openHour) * 60;
    const gameSlotMinutes = gameMetadata.gameDuration + gameMetadata.restTime;
    const gamesPerFieldPerDay = Math.floor(operatingMinutes / gameSlotMinutes);

    // Group teams by age group
    const ageGroups = teamsData.reduce((acc: any, team: any) => {
      const ageGroupName = team.ageGroup?.ageGroup || 'Unknown';
      if (!acc[ageGroupName]) {
        acc[ageGroupName] = [];
      }
      acc[ageGroupName].push(team);
      return acc;
    }, {});

    // Calculate required games per age group
    const ageGroupRequirements: { [key: string]: { teams: number; games: number; fieldSize: string } } = {};
    
    Object.entries(ageGroups).forEach(([ageGroupName, teams]: [string, any]) => {
      const teamCount = teams.length;
      let requiredGames = 0;
      
      if (teamCount <= 4) {
        // Round robin for small groups: n(n-1)/2
        requiredGames = Math.floor(teamCount * (teamCount - 1) / 2);
      } else if (teamCount <= 8) {
        // Pool play + playoffs: roughly 1.5 games per team
        requiredGames = Math.floor(teamCount * 1.5);
      } else {
        // Multiple brackets: conservative estimate 1.2 games per team
        requiredGames = Math.floor(teamCount * 1.2);
      }

      const fieldSize = getFieldSizeForAgeGroup(ageGroupName);
      ageGroupRequirements[ageGroupName] = {
        teams: teamCount,
        games: requiredGames,
        fieldSize
      };
    });

    // Analyze field availability by type
    const fieldsByType: { [key: string]: any[] } = {};
    eventComplexesList.forEach(complex => {
      complex.fields?.forEach((field: any) => {
        const size = field.fieldSize || '11v11';
        if (!fieldsByType[size]) {
          fieldsByType[size] = [];
        }
        fieldsByType[size].push({
          ...field,
          complexName: complex.name,
          capacity: gamesPerFieldPerDay
        });
      });
    });

    // Calculate requirements by field type
    const fieldTypeRequirements: { [key: string]: { ageGroups: string[]; games: number } } = {};
    Object.entries(ageGroupRequirements).forEach(([ageGroup, req]) => {
      if (!fieldTypeRequirements[req.fieldSize]) {
        fieldTypeRequirements[req.fieldSize] = { ageGroups: [], games: 0 };
      }
      fieldTypeRequirements[req.fieldSize].ageGroups.push(ageGroup);
      fieldTypeRequirements[req.fieldSize].games += req.games;
    });

    // Generate field breakdown analysis
    const fieldBreakdown = Object.entries(fieldTypeRequirements).map(([fieldSize, req]) => {
      const availableFields = fieldsByType[fieldSize] || [];
      const totalCapacity = availableFields.length * gamesPerFieldPerDay;
      
      return {
        fieldSize,
        availableFields: availableFields.length,
        requiredFields: Math.ceil(req.games / gamesPerFieldPerDay),
        capacity: totalCapacity,
        requiredGames: req.games,
        ageGroups: req.ageGroups,
        isAdequate: totalCapacity >= req.games
      };
    });

    // Generate conflicts and recommendations
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    fieldBreakdown.forEach(analysis => {
      if (!analysis.isAdequate) {
        const shortage = analysis.requiredGames - analysis.capacity;
        conflicts.push(
          `${analysis.fieldSize} fields: Need ${analysis.requiredGames} games but only have capacity for ${analysis.capacity} (shortage: ${shortage} games)`
        );
        
        const additionalFields = Math.ceil(shortage / gamesPerFieldPerDay);
        recommendations.push(
          `Add ${additionalFields} more ${analysis.fieldSize} field(s) or extend operating hours by ${Math.ceil(shortage / eventComplexes.length)} hours`
        );
      }
    });

    if (eventComplexesList.length === 0) {
      conflicts.push('No complexes or fields configured for this event');
      recommendations.push('Configure at least one complex with appropriate fields');
    }

    const totalRequiredGames = fieldBreakdown.reduce((sum, fb) => sum + fb.requiredGames, 0);
    const totalCapacity = fieldBreakdown.reduce((sum, fb) => sum + fb.capacity, 0);

    const analysis = {
      isValid: conflicts.length === 0,
      totalCapacity,
      requiredGames: totalRequiredGames,
      fieldBreakdown,
      conflicts,
      recommendations,
      ageGroupSummary: ageGroupRequirements
    };

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing field capacity:', error);
    res.status(500).json({ error: 'Failed to analyze field capacity' });
  }
});

function getFieldSizeForAgeGroup(ageGroupName: string): string {
  const ageGroup = ageGroupName.toLowerCase();
  if (ageGroup.includes('u6') || ageGroup.includes('u7') || ageGroup.includes('u8')) {
    return '4v4';
  } else if (ageGroup.includes('u9') || ageGroup.includes('u10')) {
    return '7v7';
  } else if (ageGroup.includes('u11') || ageGroup.includes('u12')) {
    return '9v9';
  } else {
    return '11v11';
  }
}

export default router;