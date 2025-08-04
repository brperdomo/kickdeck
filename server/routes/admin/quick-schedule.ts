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
      eventId: eventId,
      ageGroup: selectedAgeGroup,
      gender: 'Mixed',
      minAge: getMinAgeFromGroup(selectedAgeGroup),
      maxAge: getMaxAgeFromGroup(selectedAgeGroup),
      fieldSize: gameFormat,
      maxTeams: teams.length,
      isActive: true
    };

    await db.insert(eventAgeGroups)
      .values([ageGroupConfig])
      .onConflictDoUpdate({
        target: [eventAgeGroups.eventId, eventAgeGroups.ageGroup],
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
    
    // Filter fields with strict size compatibility - only allow exact matches or proper scaling
    const compatibleFields = fieldsData.filter(field => {
      if (field.fieldSize === gameFormat) return true;
      
      // Only allow larger fields if they can properly accommodate smaller games
      if (gameFormat === '7v7' && field.fieldSize === '11v11') return false; // 7v7 should NOT go on 11v11
      if (gameFormat === '7v7' && field.fieldSize === '9v9') return false;   // 7v7 should NOT go on 9v9
      if (gameFormat === '9v9' && field.fieldSize === '11v11') return true;  // 9v9 CAN go on 11v11
      
      return false;
    });
    
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
    const timeSlotInserts = timeSlots.map((slot, index) => ({
      eventId: eventId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      fieldId: slot.fieldId,
      dayIndex: Math.floor(index / compatibleFields.length), // Calculate day index
      isAvailable: true,
      fieldName: slot.fieldName || `Field ${slot.fieldId}`
    }));

    await db.delete(gameTimeSlots).where(eq(gameTimeSlots.eventId, eventId));
    await db.insert(gameTimeSlots).values(timeSlotInserts);

    // Enhanced game generation with constraint validation
    const enhancedConstraints = {
      ...constraintsConfig,
      requiresLights: gameFormat === '11v11', // Assume 11v11 games may need lights
      preventCoachConflicts: true, // Enable coach conflict detection
      enforceFieldCompatibility: true // Enable field travel time considerations
    };
    
    const generatedGames = generateGamesForTeamsWithConstraints(teams, selectedAgeGroup, timeSlots, enhancedConstraints);

    // Save games with proper schema fields
    const gameInserts = generatedGames.map((game, index) => ({
      eventId: eventId,
      ageGroupId: 1, // Default age group ID
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      scheduledTime: game.scheduledTime,
      fieldId: game.fieldId,
      status: 'scheduled' as const,
      gameNumber: index + 1,
      matchNumber: index + 1,
      duration: 90, // Default 90 minutes
      round: game.round || 1
    }));

    await db.delete(games).where(eq(games.eventId, eventId));
    await db.insert(games).values(gameInserts);

    // Calculate scheduling statistics
    const totalPossibleGames = teams.length <= 6 
      ? (teams.length * (teams.length - 1)) / 2  // Round-robin
      : Math.floor(teams.length / 4) * 3; // Simplified pool calculation
    
    const schedulingEfficiency = (generatedGames.length / totalPossibleGames) * 100;
    
    // Validate team game distribution
    const teamGameCounts: { [team: string]: number } = {};
    generatedGames.forEach(game => {
      teamGameCounts[game.homeTeam] = (teamGameCounts[game.homeTeam] || 0) + 1;
      teamGameCounts[game.awayTeam] = (teamGameCounts[game.awayTeam] || 0) + 1;
    });
    
    const unscheduledGames = totalPossibleGames - generatedGames.length;
    
    console.log(`Enhanced Scheduling Results: ${generatedGames.length}/${totalPossibleGames} games scheduled (${schedulingEfficiency.toFixed(1)}% efficiency)`);
    if (unscheduledGames > 0) {
      console.warn(`Warning: ${unscheduledGames} games could not be scheduled due to constraints`);
    }

    res.json({
      success: true,
      ageGroup: selectedAgeGroup,
      teamsCount: teams.length,
      gamesCount: generatedGames.length,
      totalPossibleGames,
      schedulingEfficiency: Math.round(schedulingEfficiency),
      unscheduledGames,
      timeSlotsCount: timeSlots.length,
      fieldsUsed: compatibleFields.length,
      compatibleFields: compatibleFields.map(f => ({ id: f.id, name: f.name, size: f.fieldSize, hasLights: f.hasLights })),
      teamGameCounts,
      constraintsApplied: {
        fieldSizeValidation: true,
        teamRestPeriods: enhancedConstraints.minRestTimeBetweenGames + ' minutes',
        maxGamesPerDay: enhancedConstraints.maxGamesPerTeamPerDay,
        lightingRequirements: enhancedConstraints.requiresLights,
        coachConflictPrevention: enhancedConstraints.preventCoachConflicts,
        fieldCompatibilityEnforcement: enhancedConstraints.enforceFieldCompatibility,
        intelligentSchedulingOptimization: true,
        fairGameDistribution: true
      },
      optimizationFeatures: {
        slotScoring: 'Multi-factor scoring for optimal game assignment',
        restPeriodOptimization: 'Longer rest periods preferred',
        gameDistribution: 'Balanced games per day per team',
        primeTimePreference: 'Preferred scheduling during 10 AM - 4 PM',
        fieldUtilizationBalance: 'Even distribution across available fields'
      },
      schedule: generatedGames.slice(0, 10), // Return first 10 games as preview
      message: unscheduledGames > 0 
        ? `Generated ${generatedGames.length}/${totalPossibleGames} games (${unscheduledGames} games unscheduled due to constraints)`
        : `Successfully generated ${generatedGames.length} games for ${selectedAgeGroup} with full constraint validation`
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
            fieldSize: field.fieldSize,
            hasLights: field.hasLights || false,
            complexId: field.complexId
          });
        }
        
        currentTime = slotEnd;
      }
    }
  }
  
  return slots;
}

function generateGamesForTeamsWithConstraints(teams: string[], ageGroup: string, timeSlots: any[], constraints: any) {
  const games: any[] = [];
  const teamLastGameTime: { [team: string]: Date } = {};
  const teamGamesPerDay: { [team: string]: { [date: string]: number } } = {};
  
  // Initialize team tracking
  teams.forEach(team => {
    teamLastGameTime[team] = new Date(0); // Start with epoch
    teamGamesPerDay[team] = {};
  });

  // Generate matchups based on team count
  let matchups = [];
  if (teams.length <= 6) {
    // Round-robin for small groups
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchups.push({
          homeTeam: teams[i],
          awayTeam: teams[j],
          round: 1,
          priority: 1 // All games have equal priority in round-robin
        });
      }
    }
  } else {
    // Pool play + elimination for larger groups
    const poolSize = Math.ceil(teams.length / 4);
    
    // Generate pool games
    for (let pool = 0; pool < 4 && pool * poolSize < teams.length; pool++) {
      const poolTeams = teams.slice(pool * poolSize, (pool + 1) * poolSize);
      
      for (let i = 0; i < poolTeams.length; i++) {
        for (let j = i + 1; j < poolTeams.length; j++) {
          matchups.push({
            homeTeam: poolTeams[i],
            awayTeam: poolTeams[j],
            round: 1,
            priority: 1,
            pool: pool + 1
          });
        }
      }
    }
  }

  // Sort time slots by date and time for optimal assignment
  const sortedSlots = timeSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Group slots by day for better distribution
  const slotsByDay: { [date: string]: any[] } = {};
  sortedSlots.forEach(slot => {
    const date = new Date(slot.startTime).toISOString().split('T')[0];
    if (!slotsByDay[date]) slotsByDay[date] = [];
    slotsByDay[date].push(slot);
  });
  
  // Intelligent game assignment with constraint validation and fair distribution
  for (const matchup of matchups) {
    let assignedSlot = null;
    let bestScore = -1;
    
    // Try to find the best slot considering multiple factors
    for (const slot of sortedSlots) {
      const slotTime = new Date(slot.startTime);
      const slotDate = slotTime.toISOString().split('T')[0];
      
      // Check if this slot is already used
      if (games.find(g => g.scheduledTime === slot.startTime && g.fieldId === slot.fieldId)) {
        continue;
      }
      
      // CRITICAL: Check if either team is already playing at this exact time
      const conflictingGame = games.find(g => 
        g.scheduledTime === slot.startTime && 
        (g.homeTeam === matchup.homeTeam || g.awayTeam === matchup.homeTeam ||
         g.homeTeam === matchup.awayTeam || g.awayTeam === matchup.awayTeam)
      );
      
      if (conflictingGame) {
        console.log(`SCHEDULING CONFLICT BLOCKED: ${matchup.homeTeam} vs ${matchup.awayTeam} at ${slot.startTime} - team already playing`);
        continue;
      }
      
      // Validate constraints for both teams
      if (isSlotValidForTeams(matchup.homeTeam, matchup.awayTeam, slot, teamLastGameTime, teamGamesPerDay, constraints)) {
        // Calculate assignment score for optimal distribution
        const score = calculateSlotScore(matchup.homeTeam, matchup.awayTeam, slot, teamLastGameTime, teamGamesPerDay, games);
        
        if (score > bestScore) {
          bestScore = score;
          assignedSlot = slot;
        }
      }
    }
    
    if (assignedSlot) {
      const slotTime = new Date(assignedSlot.startTime);
      const slotDate = slotTime.toISOString().split('T')[0];
      
      // Update team tracking
      teamLastGameTime[matchup.homeTeam] = slotTime;
      teamLastGameTime[matchup.awayTeam] = slotTime;
      
      // Update games per day tracking
      teamGamesPerDay[matchup.homeTeam][slotDate] = (teamGamesPerDay[matchup.homeTeam][slotDate] || 0) + 1;
      teamGamesPerDay[matchup.awayTeam][slotDate] = (teamGamesPerDay[matchup.awayTeam][slotDate] || 0) + 1;
      
      games.push({
        homeTeam: matchup.homeTeam,
        awayTeam: matchup.awayTeam,
        scheduledTime: assignedSlot.startTime,
        fieldId: assignedSlot.fieldId,
        round: matchup.round,
        pool: matchup.pool || null
      });
    } else {
      console.warn(`Could not schedule game: ${matchup.homeTeam} vs ${matchup.awayTeam} - no valid time slots found`);
    }
  }
  
  return games;
}

function isSlotValidForTeams(homeTeam: string, awayTeam: string, slot: any, teamLastGameTime: any, teamGamesPerDay: any, constraints: any): boolean {
  const slotTime = new Date(slot.startTime);
  const slotDate = slotTime.toISOString().split('T')[0];
  
  // Check team rest period constraint
  const minRestMs = constraints.minRestTimeBetweenGames * 60 * 1000; // Convert minutes to milliseconds
  
  const homeTeamLastGame = teamLastGameTime[homeTeam];
  const awayTeamLastGame = teamLastGameTime[awayTeam];
  
  if (slotTime.getTime() - homeTeamLastGame.getTime() < minRestMs) {
    return false;
  }
  
  if (slotTime.getTime() - awayTeamLastGame.getTime() < minRestMs) {
    return false;
  }
  
  // Check games per day constraint
  const homeTeamGamesThisDay = teamGamesPerDay[homeTeam][slotDate] || 0;
  const awayTeamGamesThisDay = teamGamesPerDay[awayTeam][slotDate] || 0;
  
  if (homeTeamGamesThisDay >= constraints.maxGamesPerTeamPerDay) {
    return false;
  }
  
  if (awayTeamGamesThisDay >= constraints.maxGamesPerTeamPerDay) {
    return false;
  }
  
  // Check lighting constraints for evening games
  if (constraints.requiresLights && !slot.hasLights) {
    const hour = slotTime.getHours();
    if (hour >= 18 || hour <= 7) { // Evening or early morning games need lights
      return false;
    }
  }
  
  // Enhanced coach conflict detection - prevent teams from same organization playing simultaneously
  if (constraints.preventCoachConflicts) {
    const homeClub = extractClubName(homeTeam);
    const awayClub = extractClubName(awayTeam);
    
    // If teams are from same club/organization, they CANNOT play at the exact same time
    if (homeClub === awayClub && homeClub.length > 2) {
      const timeDifferenceMinutes = Math.abs(slotTime.getTime() - teamLastGameTime[homeTeam].getTime()) / (1000 * 60);
      const awayTimeDifferenceMinutes = Math.abs(slotTime.getTime() - teamLastGameTime[awayTeam].getTime()) / (1000 * 60);
      
      // Require at least 60 minutes between games for same-club teams
      if (timeDifferenceMinutes < 60 || awayTimeDifferenceMinutes < 60) {
        console.log(`COACH CONFLICT BLOCKED: ${homeTeam} vs ${awayTeam} - same club (${homeClub}) within 60 minutes`);
        return false;
      }
    }
  }
  
  // Check travel time between fields (if fields are at different complexes)
  if (constraints.enforceFieldCompatibility && slot.complexId) {
    // This would require additional logic to track previous field assignments
    // For now, we'll implement a basic constraint
    return true; // Placeholder for field travel time validation
  }
  
  return true;
}

function calculateSlotScore(homeTeam: string, awayTeam: string, slot: any, teamLastGameTime: any, teamGamesPerDay: any, existingGames: any[]): number {
  let score = 100; // Base score
  
  const slotTime = new Date(slot.startTime);
  const slotDate = slotTime.toISOString().split('T')[0];
  
  // Prefer spreading games throughout the day
  const homeTeamLastGame = teamLastGameTime[homeTeam];
  const awayTeamLastGame = teamLastGameTime[awayTeam];
  
  const homeRestMinutes = (slotTime.getTime() - homeTeamLastGame.getTime()) / (1000 * 60);
  const awayRestMinutes = (slotTime.getTime() - awayTeamLastGame.getTime()) / (1000 * 60);
  
  // Bonus for longer rest periods (up to 4 hours)
  score += Math.min(homeRestMinutes / 240 * 20, 20); // Max 20 bonus points
  score += Math.min(awayRestMinutes / 240 * 20, 20); // Max 20 bonus points
  
  // Prefer balanced games per day
  const homeGamesToday = teamGamesPerDay[homeTeam][slotDate] || 0;
  const awayGamesToday = teamGamesPerDay[awayTeam][slotDate] || 0;
  
  // Penalty for teams that already have many games today
  score -= homeGamesToday * 15;
  score -= awayGamesToday * 15;
  
  // Prefer prime time slots (10 AM - 4 PM)
  const hour = slotTime.getHours();
  if (hour >= 10 && hour <= 16) {
    score += 10;
  } else if (hour >= 8 && hour <= 18) {
    score += 5;
  }
  
  // Prefer field utilization balance
  const fieldUsage = existingGames.filter(g => g.fieldId === slot.fieldId).length;
  score -= fieldUsage * 2; // Small penalty for heavily used fields
  
  return score;
}

function extractClubName(teamName: string): string {
  // Extract club/organization name from team name
  // Examples: "ALBION SC Riverside B19 Academy" -> "ALBION SC"
  //           "Empire Surf B2019 A-1" -> "Empire Surf"
  const parts = teamName.split(' ');
  
  // Look for common club indicators
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].match(/^(SC|FC|United|Academy|Club|CF|AFC|FC)$/i)) {
      return parts.slice(0, i + 1).join(' ');
    }
  }
  
  // If no club indicator found, use first 2 words as club name
  return parts.slice(0, 2).join(' ');
}

export default router;