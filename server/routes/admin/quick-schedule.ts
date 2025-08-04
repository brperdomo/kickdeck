import { Router } from 'express';
import { db } from '../../../db';
import { 
  events, 
  eventAgeGroups, 
  eventGameFormats, 
  eventScheduleConstraints,
  games,
  gameTimeSlots,
  fields
} from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Quick schedule generation endpoint
router.post('/events/:eventId/quick-schedule', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      selectedAgeGroup, 
      teamNames, 
      startDate, 
      endDate, 
      availableFields, 
      gameFormat, 
      gameDuration,
      operatingHours 
    } = req.body;

    console.log('Quick schedule generation requested:', {
      eventId,
      selectedAgeGroup,
      teamCount: teamNames.split('\n').filter((name: string) => name.trim()).length,
      gameFormat,
      gameDuration
    });

    // Parse team names
    const teams = teamNames.split('\n')
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0);

    if (teams.length < 2) {
      return res.status(400).json({ error: 'At least 2 teams required' });
    }

    // Create or update age group configuration
    const ageGroupConfig = {
      eventId: parseInt(eventId),
      name: selectedAgeGroup,
      minAge: getMinAgeFromGroup(selectedAgeGroup),
      maxAge: getMaxAgeFromGroup(selectedAgeGroup),
      fieldSize: gameFormat,
      maxTeams: teams.length,
      isActive: true
    };

    await db.insert(eventAgeGroups)
      .values(ageGroupConfig)
      .onConflictDoUpdate({
        target: [eventAgeGroups.eventId, eventAgeGroups.name],
        set: ageGroupConfig
      });

    // Create game format configuration
    const gameFormatConfig = {
      eventId: parseInt(eventId),
      ageGroup: selectedAgeGroup,
      format: gameFormat,
      gameLength: gameDuration,
      halves: 2,
      halfLength: Math.floor((gameDuration - 15) / 2), // Account for halftime
      halfTimeBreak: 15,
      bufferTime: 15,
      fieldSize: gameFormat,
      allowsLights: true,
      surfacePreference: 'Any'
    };

    await db.insert(eventGameFormats)
      .values(gameFormatConfig)
      .onConflictDoUpdate({
        target: [eventGameFormats.eventId, eventGameFormats.ageGroup],
        set: gameFormatConfig
      });

    // Create schedule constraints with smart defaults
    const constraintsConfig = {
      eventId: parseInt(eventId),
      maxGamesPerTeamPerDay: 3,
      maxHoursSpreadPerTeam: 8,
      minRestTimeBetweenGames: 90,
      allowBackToBackGames: false,
      maxHoursPerFieldPerDay: 10,
      enforceFieldCompatibility: true,
      prioritizeEvenScheduling: true,
      allowEveningGames: true,
      earliestGameTime: operatingHours.start,
      latestGameTime: operatingHours.end,
      minRestBeforePlayoffs: 120,
      allowPlayoffBackToBack: false
    };

    await db.insert(eventScheduleConstraints)
      .values(constraintsConfig)
      .onConflictDoUpdate({
        target: [eventScheduleConstraints.eventId],
        set: constraintsConfig
      });

    // Get actual field data with size compatibility
    const fieldsData = await db.query.fields.findMany({
      where: eq(fields.isOpen, true),
      orderBy: fields.id
    });
    
    // Filter fields compatible with the game format
    const compatibleFields = fieldsData.filter(field => 
      field.fieldSize === gameFormat || field.fieldSize === '11v11' // 11v11 fields can accommodate smaller games
    );
    
    if (compatibleFields.length === 0) {
      return res.status(400).json({ 
        error: `No fields compatible with ${gameFormat} format found. Available fields: ${fieldsData.map(f => `${f.name} (${f.fieldSize})`).join(', ')}` 
      });
    }
    
    console.log(`Using ${compatibleFields.length} compatible fields for ${gameFormat} games:`, 
      compatibleFields.map(f => `${f.name} (${f.fieldSize})`));

    // Generate time slots for the tournament dates with compatible fields only
    const timeSlots = generateTimeSlots(
      startDate, 
      endDate, 
      operatingHours.start, 
      operatingHours.end, 
      gameDuration + 15, // Include buffer time
      compatibleFields
    );

    // Save time slots
    const timeSlotInserts = timeSlots.map(slot => ({
      eventId: parseInt(eventId),
      startTime: slot.startTime,
      endTime: slot.endTime,
      fieldId: slot.fieldId,
      isAvailable: true,
      fieldName: slot.fieldName || `Field ${slot.fieldId}`
    }));

    await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, parseInt(eventId)));
    await db.insert(gameTimeSlots).values(timeSlotInserts);

    // Generate games using simple round-robin for small groups, pool play for larger
    const generatedGames = generateGamesForTeams(teams, selectedAgeGroup, timeSlots);

    // Save games
    const gameInserts = generatedGames.map((game, index) => ({
      eventId: parseInt(eventId),
      ageGroupId: 1, // Will be updated when we get proper age group ID
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      scheduledTime: game.scheduledTime,
      fieldId: game.fieldId,
      status: 'scheduled' as const,
      gameNumber: index + 1,
      round: game.round || 1
    }));

    await db.delete(games).where(eq(games.eventId, parseInt(eventId)));
    await db.insert(games).values(gameInserts);

    console.log(`Generated ${generatedGames.length} games for ${teams.length} teams`);

    res.json({
      success: true,
      ageGroup: selectedAgeGroup,
      teamsCount: teams.length,
      gamesCount: generatedGames.length,
      timeSlotsCount: timeSlots.length,
      fieldsUsed: compatibleFields.length,
      compatibleFields: compatibleFields.map(f => ({ id: f.id, name: f.name, size: f.fieldSize })),
      schedule: generatedGames.slice(0, 10), // Return first 10 games as preview
      message: `Successfully generated ${generatedGames.length} games for ${selectedAgeGroup}`
    });

  } catch (error) {
    console.error('Quick schedule generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quick schedule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function getMinAgeFromGroup(ageGroup: string): number {
  const match = ageGroup.match(/U(\d+)/);
  return match ? Math.max(parseInt(match[1]) - 2, 4) : 13;
}

function getMaxAgeFromGroup(ageGroup: string): number {
  const match = ageGroup.match(/U(\d+)/);
  return match ? parseInt(match[1]) : 19;
}

function generateTimeSlots(
  startDate: string, 
  endDate: string, 
  startTime: string, 
  endTime: string, 
  gameDurationWithBuffer: number,
  compatibleFields: any[]
) {
  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayStart = new Date(`${date.toISOString().split('T')[0]}T${startTime}:00`);
    const dayEnd = new Date(`${date.toISOString().split('T')[0]}T${endTime}:00`);
    
    for (const field of compatibleFields) {
      let currentTime = new Date(dayStart);
      
      while (currentTime < dayEnd) {
        const slotEnd = new Date(currentTime.getTime() + gameDurationWithBuffer * 60000);
        
        if (slotEnd <= dayEnd) {
          slots.push({
            startTime: currentTime.toISOString(),
            endTime: slotEnd.toISOString(),
            fieldId: field.id,
            fieldName: field.name,
            fieldSize: field.fieldSize
          });
        }
        
        currentTime = slotEnd;
      }
    }
  }
  
  return slots;
}

function generateGamesForTeams(teams: string[], ageGroup: string, timeSlots: any[]) {
  const games = [];
  
  if (teams.length <= 6) {
    // Round-robin for small groups
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const slotIndex = games.length % timeSlots.length;
        const slot = timeSlots[slotIndex];
        
        games.push({
          homeTeam: teams[i],
          awayTeam: teams[j],
          scheduledTime: slot.startTime,
          fieldId: slot.fieldId,
          round: 1
        });
      }
    }
  } else {
    // Pool play + elimination for larger groups
    const poolSize = Math.ceil(teams.length / 4);
    let gameIndex = 0;
    
    // Generate pool games
    for (let pool = 0; pool < 4 && pool * poolSize < teams.length; pool++) {
      const poolTeams = teams.slice(pool * poolSize, (pool + 1) * poolSize);
      
      for (let i = 0; i < poolTeams.length; i++) {
        for (let j = i + 1; j < poolTeams.length; j++) {
          const slotIndex = gameIndex % timeSlots.length;
          const slot = timeSlots[slotIndex];
          
          games.push({
            homeTeam: poolTeams[i],
            awayTeam: poolTeams[j],
            scheduledTime: slot.startTime,
            fieldId: slot.fieldId,
            round: 1
          });
          
          gameIndex++;
        }
      }
    }
  }
  
  return games;
}

export default router;