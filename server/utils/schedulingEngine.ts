import { db } from '@db';
import { 
  events, 
  teams, 
  eventGameFormats, 
  eventScheduleConstraints,
  games,
  gameTimeSlots,
  fields,
  complexes,
  eventBrackets
} from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';

interface TeamData {
  id: number;
  name: string;
  ageGroupId: number;
  ageGroup: string;
  gender: string;
  coach: any; // JSON field with coach info
  coachNames: string[]; // Extracted coach names for conflict detection
  bracketId?: number | null; // Associated bracket ID for rest period lookup
}

interface GameFormat {
  ageGroup: string;
  gameLength: number;
  halfLength: number;
  halfTimeBreak: number;
  bufferTime: number;
  fieldSize: string;
}

interface SchedulingConstraints {
  operatingStartTime: string; // "08:00"
  operatingEndTime: string;   // "18:00"
  restPeriodMinutes: number;  // 30
  maxGamesPerTeamPerDay: number; // 3
  minTimeBetweenGames: number; // 120 minutes
}

interface FieldData {
  id: number;
  name: string;
  fieldSize: string;
  complexName: string;
  openTime: string;
  closeTime: string;
}

export class IntelligentSchedulingEngine {
  private eventId: number;
  private teams: TeamData[] = [];
  private gameFormats: Map<string, GameFormat> = new Map();
  private constraints: SchedulingConstraints = {
    operatingStartTime: "08:00",
    operatingEndTime: "18:00", 
    restPeriodMinutes: 30,
    maxGamesPerTeamPerDay: 3,
    minTimeBetweenGames: 120
  };
  private availableFields: FieldData[] = [];
  private tournamentDates: Date[] = [];
  private coachConflicts: Map<string, number[]> = new Map(); // coach name -> team IDs
  private teamRestPeriods: Map<number, number> = new Map(); // team ID -> rest period in minutes

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  /**
   * Initialize the scheduling engine with real tournament data
   */
  async initialize(): Promise<void> {
    console.log(`[Scheduling Engine] Initializing scheduling engine for event ${this.eventId}`);

    try {
      // Load event details
      console.log(`[Scheduling Engine] Loading event details...`);
      const event = await db.select()
        .from(events)
        .where(eq(events.id, this.eventId))
        .then(results => results[0]);

      if (!event) {
        throw new Error(`Event ${this.eventId} not found`);
      }

      console.log(`[Scheduling Engine] Event: ${event.name}, Dates: ${event.startDate} to ${event.endDate}`);

      // Validate dates before proceeding
      if (!event.startDate || !event.endDate) {
        throw new Error(`Event ${event.name} has invalid dates: start=${event.startDate}, end=${event.endDate}`);
      }

      // Generate tournament dates
      console.log(`[Scheduling Engine] Generating tournament dates...`);
      this.generateTournamentDates(event.startDate, event.endDate);
      console.log(`[Scheduling Engine] Tournament dates generated successfully`);
    } catch (error) {
      console.error(`[Scheduling Engine] Error during event loading:`, error);
      throw error;
    }

    try {
      // Load teams with coach information
      console.log(`[Scheduling Engine] Loading teams...`);
      await this.loadTeams();
      console.log(`[Scheduling Engine] Teams loaded successfully`);

      // Load game formats
      console.log(`[Scheduling Engine] Loading game formats...`);
      await this.loadGameFormats();
      console.log(`[Scheduling Engine] Game formats loaded successfully`);

      // Load scheduling constraints
      console.log(`[Scheduling Engine] Loading constraints...`);
      await this.loadConstraints();
      console.log(`[Scheduling Engine] Constraints loaded successfully`);

      // Load available fields
      console.log(`[Scheduling Engine] Loading fields...`);
      await this.loadFields();
      console.log(`[Scheduling Engine] Fields loaded successfully`);

      // Load bracket-specific rest periods
      console.log(`[Scheduling Engine] Loading team rest periods...`);
      await this.loadTeamRestPeriods();
      console.log(`[Scheduling Engine] Team rest periods loaded successfully`);

      // Analyze coach conflicts
      console.log(`[Scheduling Engine] Analyzing coach conflicts...`);
      this.analyzeCoachConflicts();
      console.log(`[Scheduling Engine] Coach conflicts analyzed successfully`);

      console.log('[Scheduling Engine] Scheduling engine initialized successfully');
      console.log(`[Scheduling Engine] Teams: ${this.teams.length}, Game Formats: ${this.gameFormats.size}, Fields: ${this.availableFields.length}`);
    } catch (error) {
      console.error(`[Scheduling Engine] Error during initialization:`, error);
      throw error;
    }
  }

  /**
   * Load all approved teams with coach information
   */
  private async loadTeams(): Promise<void> {
    const teamRecords = await db.select({
      id: teams.id,
      name: teams.name,
      ageGroupId: teams.ageGroupId,
      bracketId: teams.bracketId,
      status: teams.status,
      coach: teams.coach
    })
    .from(teams)
    .where(and(
      eq(teams.eventId, this.eventId.toString()),
      eq(teams.status, 'approved')
    ));

    console.log(`Found ${teamRecords.length} approved teams`);

    this.teams = teamRecords.map(team => {
      // Extract coach names from JSON coach field
      let coachNames: string[] = [];
      if (team.coach) {
        try {
          const coachData = typeof team.coach === 'string' ? JSON.parse(team.coach) : team.coach;
          if (coachData.headCoachName) coachNames.push(coachData.headCoachName);
          if (coachData.assistantCoachName) coachNames.push(coachData.assistantCoachName);
        } catch (e) {
          console.log(`Could not parse coach data for team ${team.name}`);
        }
      }

      // Determine age group and gender from ageGroupId
      const ageGroup = this.determineAgeGroupFromId(team.ageGroupId);
      const gender = this.determineGenderFromId(team.ageGroupId);

      return {
        id: team.id,
        name: team.name,
        ageGroupId: team.ageGroupId,
        bracketId: team.bracketId,
        ageGroup,
        gender,
        coach: team.coach,
        coachNames
      };
    });
  }

  /**
   * Load game format rules for each age group
   */
  private async loadGameFormats(): Promise<void> {
    const formats = await db.select()
      .from(eventGameFormats)
      .where(eq(eventGameFormats.eventId, this.eventId));

    console.log(`Found ${formats.length} game format configurations`);

    formats.forEach(format => {
      this.gameFormats.set(format.ageGroup, {
        ageGroup: format.ageGroup,
        gameLength: format.gameLength,
        halfLength: format.halfLength,
        halfTimeBreak: format.halfTimeBreak,
        bufferTime: format.bufferTime,
        fieldSize: format.fieldSize
      });
    });
  }

  /**
   * Load scheduling constraints
   */
  private async loadConstraints(): Promise<void> {
    const constraintRecords = await db.select()
      .from(eventScheduleConstraints)
      .where(eq(eventScheduleConstraints.eventId, this.eventId))
      .limit(1);

    if (constraintRecords.length > 0) {
      const c = constraintRecords[0];
      this.constraints = {
        operatingStartTime: "08:00", // Use default for now, field not in schema
        operatingEndTime: "18:00", // Use default for now, field not in schema
        restPeriodMinutes: c.minRestTimeBetweenGames || 30,
        maxGamesPerTeamPerDay: c.maxGamesPerTeamPerDay,
        minTimeBetweenGames: c.minRestTimeBetweenGames || 120
      };
    } else {
      // Default constraints
      this.constraints = {
        operatingStartTime: "08:00",
        operatingEndTime: "18:00",
        restPeriodMinutes: 90, // Default to 90 minutes as specified
        maxGamesPerTeamPerDay: 2, // User specified max 2 games per day
        minTimeBetweenGames: 90 // 90 minutes rest period
      };
    }

    console.log('Scheduling constraints loaded:', this.constraints);
  }

  /**
   * Load available fields with complex information
   */
  private async loadFields(): Promise<void> {
    const fieldRecords = await db.select({
      fieldId: fields.id,
      fieldName: fields.name,
      fieldSize: fields.fieldSize,
      openTime: fields.openTime,
      closeTime: fields.closeTime,
      complexId: fields.complexId,
      complexName: complexes.name
    })
    .from(fields)
    .leftJoin(complexes, eq(fields.complexId, complexes.id))
    .where(eq(fields.isOpen, true));

    this.availableFields = fieldRecords.map(record => ({
      id: record.fieldId,
      name: record.fieldName,
      fieldSize: record.fieldSize || '11v11',
      complexName: record.complexName || 'Unknown Complex',
      openTime: record.openTime || "08:00",
      closeTime: record.closeTime || "18:00"
    }));

    console.log(`Loaded ${this.availableFields.length} available fields`);
  }

  /**
   * Load team-specific rest periods from their associated brackets
   */
  private async loadTeamRestPeriods(): Promise<void> {
    console.log('Loading bracket-specific rest periods for teams...');
    
    // Get all brackets for this event with their tournament settings
    const brackets = await db.select({
      id: eventBrackets.id,
      name: eventBrackets.name,
      tournamentSettings: eventBrackets.tournamentSettings
    })
    .from(eventBrackets)
    .where(eq(eventBrackets.eventId, this.eventId.toString()));

    console.log(`Found ${brackets.length} brackets for event ${this.eventId}`);

    // Map each team to its bracket's rest period
    for (const team of this.teams) {
      if (team.bracketId) {
        const bracket = brackets.find(b => b.id === team.bracketId);
        if (bracket && bracket.tournamentSettings) {
          let restPeriod = 90; // Default rest period from the screenshot (90 minutes)
          
          try {
            const settings = typeof bracket.tournamentSettings === 'string' 
              ? JSON.parse(bracket.tournamentSettings) 
              : bracket.tournamentSettings;
            
            if (settings.restPeriodMinutes && typeof settings.restPeriodMinutes === 'number') {
              restPeriod = settings.restPeriodMinutes;
            }
          } catch (e) {
            console.log(`Could not parse tournament settings for bracket ${bracket.name}, using default rest period`);
          }
          
          this.teamRestPeriods.set(team.id, restPeriod);
          console.log(`Team ${team.name} (Bracket: ${bracket.name}) → Rest Period: ${restPeriod} minutes`);
        } else {
          // Use global constraint as fallback
          this.teamRestPeriods.set(team.id, this.constraints.minTimeBetweenGames);
          console.log(`Team ${team.name} → Using global rest period: ${this.constraints.minTimeBetweenGames} minutes`);
        }
      } else {
        // No bracket assigned, use global constraint
        this.teamRestPeriods.set(team.id, this.constraints.minTimeBetweenGames);
        console.log(`Team ${team.name} (No bracket) → Using global rest period: ${this.constraints.minTimeBetweenGames} minutes`);
      }
    }
    
    console.log(`Loaded rest periods for ${this.teamRestPeriods.size} teams`);
  }

  /**
   * Analyze coach conflicts (coaches with multiple teams)
   */
  private analyzeCoachConflicts(): void {
    this.coachConflicts.clear();

    this.teams.forEach(team => {
      team.coachNames.forEach(coachName => {
        if (!this.coachConflicts.has(coachName)) {
          this.coachConflicts.set(coachName, []);
        }
        this.coachConflicts.get(coachName)?.push(team.id);
      });
    });

    // Filter to only coaches with multiple teams
    const conflictCoaches = Array.from(this.coachConflicts.entries())
      .filter(([_, teamIds]) => teamIds.length > 1);

    console.log(`Found ${conflictCoaches.length} coaches with multiple teams:`, 
      conflictCoaches.map(([coach, teams]) => `${coach}: ${teams.length} teams`)
    );
  }

  /**
   * Generate round-robin schedule for a specific age group
   */
  async generateAgeGroupSchedule(ageGroupId: number, tournamentFormat: 'round-robin' | 'single-elimination' = 'round-robin'): Promise<any[]> {
    console.log(`Generating ${tournamentFormat} schedule for age group ${ageGroupId}`);

    // Get teams for this age group
    const ageGroupTeams = this.teams.filter(team => team.ageGroupId === ageGroupId);
    
    if (ageGroupTeams.length < 2) {
      throw new Error(`Need at least 2 teams for age group ${ageGroupId}, found ${ageGroupTeams.length}`);
    }

    console.log(`Found ${ageGroupTeams.length} teams in age group ${ageGroupId}`);

    // Get appropriate game format
    const gameFormat = this.getGameFormatForAgeGroup(ageGroupTeams[0].ageGroup);
    if (!gameFormat) {
      throw new Error(`No game format configured for age group ${ageGroupTeams[0].ageGroup}`);
    }

    // Get appropriate fields
    const suitableFields = this.availableFields.filter(field => 
      field.fieldSize === gameFormat.fieldSize
    );

    if (suitableFields.length === 0) {
      throw new Error(`No fields available with size ${gameFormat.fieldSize} for age group ${ageGroupTeams[0].ageGroup}`);
    }

    console.log(`Using ${suitableFields.length} fields of size ${gameFormat.fieldSize}`);

    const generatedGames = [];

    if (tournamentFormat === 'round-robin') {
      // Generate round-robin matchups
      for (let i = 0; i < ageGroupTeams.length; i++) {
        for (let j = i + 1; j < ageGroupTeams.length; j++) {
          const homeTeam = ageGroupTeams[i];
          const awayTeam = ageGroupTeams[j];

          // Find optimal time slot considering coach conflicts
          const timeSlot = await this.findOptimalTimeSlot(
            homeTeam, 
            awayTeam, 
            gameFormat, 
            suitableFields
          );

          if (timeSlot) {
            generatedGames.push({
              homeTeam,
              awayTeam,
              timeSlot,
              field: timeSlot.field,
              gameFormat,
              ageGroupId
            });
          }
        }
      }
    }

    console.log(`Generated ${generatedGames.length} games for age group ${ageGroupId}`);
    return generatedGames;
  }

  /**
   * Enhanced scheduling with full constraint enforcement
   */
  async generateAgeGroupScheduleWithConstraints(ageGroupId: number): Promise<any[]> {
    console.log(`=== CONSTRAINT-AWARE SCHEDULING FOR AGE GROUP ${ageGroupId} ===`);

    // Get teams for this age group
    const ageGroupTeams = this.teams.filter(team => team.ageGroupId === ageGroupId);
    
    if (ageGroupTeams.length < 2) {
      throw new Error(`Need at least 2 teams for age group ${ageGroupId}, found ${ageGroupTeams.length}`);
    }

    console.log(`Found ${ageGroupTeams.length} teams in age group ${ageGroupId}`);

    // Get appropriate game format
    const gameFormat = this.getGameFormatForAgeGroup(ageGroupTeams[0].ageGroup);
    if (!gameFormat) {
      throw new Error(`No game format configured for age group ${ageGroupTeams[0].ageGroup}`);
    }

    // Get appropriate fields
    const suitableFields = this.availableFields.filter(field => 
      field.fieldSize === gameFormat.fieldSize
    );

    if (suitableFields.length === 0) {
      throw new Error(`No fields available with size ${gameFormat.fieldSize} for age group ${ageGroupTeams[0].ageGroup}`);
    }

    console.log(`Using ${suitableFields.length} fields of size ${gameFormat.fieldSize}`);
    console.log(`Scheduling constraints:`, this.constraints);

    // Generate all possible round-robin matchups
    const allGames: Array<{
      homeTeam: TeamData;
      awayTeam: TeamData;
      gameFormat: GameFormat;
      ageGroupId: number;
      field?: FieldData;
      timeSlot?: {startTime: Date, endTime: Date};
    }> = [];

    for (let i = 0; i < ageGroupTeams.length; i++) {
      for (let j = i + 1; j < ageGroupTeams.length; j++) {
        allGames.push({
          homeTeam: ageGroupTeams[i],
          awayTeam: ageGroupTeams[j],
          gameFormat,
          ageGroupId
        });
      }
    }

    console.log(`Generated ${allGames.length} potential games for round-robin format`);

    // Schedule games with constraints
    const scheduledGames = this.scheduleGamesWithConstraints(allGames, suitableFields);

    return scheduledGames;
  }

  /**
   * Smart scheduling algorithm with comprehensive constraint enforcement
   */
  private scheduleGamesWithConstraints(games: any[], availableFields: FieldData[]): any[] {
    console.log(`=== SMART SCHEDULING WITH CONSTRAINTS ===`);
    console.log(`Scheduling ${games.length} games with constraints:`, this.constraints);
    
    // Track field usage: fieldId -> array of {start, end, gameIndex}
    const fieldSchedule = new Map<number, Array<{start: Date, end: Date, gameIndex: number}>>();
    
    // Track team schedules: teamId -> array of {start, end, gameIndex}
    const teamSchedule = new Map<number, Array<{start: Date, end: Date, gameIndex: number}>>();
    
    // Track daily game counts per team: "teamId-date" -> count
    const dailyGameCounts = new Map<string, number>();
    
    const scheduledGames: any[] = [];
    const failedGames: any[] = [];

    // Initialize field schedule tracking
    availableFields.forEach(field => {
      fieldSchedule.set(field.id, []);
    });

    // Initialize team schedule tracking
    this.teams.forEach(team => {
      teamSchedule.set(team.id, []);
    });

    console.log(`Available fields: ${availableFields.length}`);
    console.log(`Tournament dates: ${this.tournamentDates.map(d => d.toDateString()).join(', ')}`);

    // Try to schedule each game
    for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
      const game = games[gameIndex];
      
      console.log(`\n--- Scheduling Game ${gameIndex + 1}/${games.length}: ${game.homeTeam.name} vs ${game.awayTeam.name} ---`);
      
      let scheduled = false;
      
      // Try each tournament day
      for (const tournamentDate of this.tournamentDates) {
        if (scheduled) break;
        
        const dateStr = tournamentDate.toISOString().split('T')[0];
        
        // Check daily game limits for both teams
        const homeTeamDailyKey = `${game.homeTeam.id}-${dateStr}`;
        const awayTeamDailyKey = `${game.awayTeam.id}-${dateStr}`;
        
        const homeTeamDailyGames = dailyGameCounts.get(homeTeamDailyKey) || 0;
        const awayTeamDailyGames = dailyGameCounts.get(awayTeamDailyKey) || 0;
        
        if (homeTeamDailyGames >= this.constraints.maxGamesPerTeamPerDay) {
          console.log(`${game.homeTeam.name} already has ${homeTeamDailyGames} games on ${dateStr}, skipping`);
          continue;
        }
        
        if (awayTeamDailyGames >= this.constraints.maxGamesPerTeamPerDay) {
          console.log(`${game.awayTeam.name} already has ${awayTeamDailyGames} games on ${dateStr}, skipping`);
          continue;
        }
        
        // Try each available field
        for (const field of availableFields) {
          if (scheduled) break;
          
          // Generate possible time slots for this day
          const timeSlots = this.generateTimeSlots(tournamentDate, game.gameFormat);
          
          for (const timeSlot of timeSlots) {
            // Check field availability with detailed logging
            const fieldConflicts = this.checkFieldConflicts(field.id, timeSlot, fieldSchedule);
            if (fieldConflicts.length > 0) {
              console.log(`  ❌ Field conflicts at ${timeSlot.startTime.toLocaleTimeString()} on ${field.name}:`);
              fieldConflicts.forEach(conflict => console.log(`     - ${conflict}`));
              continue;
            }
            
            // Check team availability (rest time constraints) with detailed logging
            const teamConflicts = this.checkTeamConflicts([game.homeTeam.id, game.awayTeam.id], timeSlot, teamSchedule);
            if (teamConflicts.length > 0) {
              console.log(`  ❌ Team conflicts at ${timeSlot.startTime.toLocaleTimeString()} on ${field.name}:`);
              teamConflicts.forEach(conflict => console.log(`     - ${conflict}`));
              continue;
            }
            
            // Success! Schedule the game
            game.field = field;
            game.timeSlot = timeSlot;
            
            // Record field usage with buffer time
            const bufferMs = 15 * 60 * 1000; // 15 minutes
            fieldSchedule.get(field.id)!.push({
              start: new Date(timeSlot.startTime.getTime() - bufferMs),
              end: new Date(timeSlot.endTime.getTime() + bufferMs),
              gameIndex
            });
            
            // Record team usage (actual game time for rest period calculations)
            teamSchedule.get(game.homeTeam.id)!.push({
              start: timeSlot.startTime,
              end: timeSlot.endTime,
              gameIndex
            });
            teamSchedule.get(game.awayTeam.id)!.push({
              start: timeSlot.startTime,
              end: timeSlot.endTime,
              gameIndex
            });
            
            // Update daily game counts
            dailyGameCounts.set(homeTeamDailyKey, (dailyGameCounts.get(homeTeamDailyKey) || 0) + 1);
            dailyGameCounts.set(awayTeamDailyKey, (dailyGameCounts.get(awayTeamDailyKey) || 0) + 1);
            
            scheduledGames.push(game);
            scheduled = true;
            
            console.log(`✅ Scheduled: ${timeSlot.startTime.toLocaleString()} at ${field.name}`);
            console.log(`   Daily games: ${game.homeTeam.name}=${dailyGameCounts.get(homeTeamDailyKey)}, ${game.awayTeam.name}=${dailyGameCounts.get(awayTeamDailyKey)}`);
            break;
          }
        }
      }
      
      if (!scheduled) {
        console.log(`❌ Failed to schedule: ${game.homeTeam.name} vs ${game.awayTeam.name}`);
        failedGames.push(game);
      }
    }

    console.log(`\n=== SCHEDULING SUMMARY ===`);
    console.log(`Successfully scheduled: ${scheduledGames.length}/${games.length} games`);
    console.log(`Failed to schedule: ${failedGames.length} games`);
    
    // Show daily game distribution
    console.log(`\nDaily game distribution per team:`);
    for (const entry of Array.from(dailyGameCounts.entries())) {
      const [key, count] = entry;
      const [teamId, date] = key.split('-');
      const team = this.teams.find(t => t.id === parseInt(teamId));
      console.log(`  ${team?.name || `Team ${teamId}`} on ${date}: ${count} games`);
    }

    return scheduledGames;
  }

  // Generate time slots for a given day - CREATE MORE GRANULAR TIME SLOTS
  private generateTimeSlots(date: Date, gameFormat: GameFormat): Array<{startTime: Date, endTime: Date}> {
    const slots: Array<{startTime: Date, endTime: Date}> = [];
    
    const [startHour, startMinute] = this.constraints.operatingStartTime.split(':').map(Number);
    const [endHour, endMinute] = this.constraints.operatingEndTime.split(':').map(Number);
    
    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);
    
    const gameLength = gameFormat.gameLength; // Just the game time (no buffer in slot generation)
    const slotIncrement = 15; // Generate slots every 15 minutes for more flexibility
    
    let currentTime = new Date(dayStart);
    
    // Generate slots every 15 minutes to allow more scheduling flexibility
    while (currentTime.getTime() + (gameLength * 60 * 1000) <= dayEnd.getTime()) {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + (gameLength * 60 * 1000)); // Game end time
      
      slots.push({ startTime, endTime });
      
      // Move to next slot (increment by 15 minutes)
      currentTime = new Date(currentTime.getTime() + (slotIncrement * 60 * 1000));
    }
    
    console.log(`Generated ${slots.length} time slots for ${date.toDateString()} (${slots[0]?.startTime.toLocaleTimeString()} - ${slots[slots.length-1]?.startTime.toLocaleTimeString()})`);
    return slots;
  }

  // Check if field is available during time slot with buffer time
  private checkFieldConflicts(fieldId: number, timeSlot: {startTime: Date, endTime: Date}, fieldSchedule: Map<number, Array<{start: Date, end: Date, gameIndex: number}>>): string[] {
    const conflicts: string[] = [];
    const fieldGames = fieldSchedule.get(fieldId) || [];
    
    // Add 15-minute buffer time around the game
    const bufferMs = 15 * 60 * 1000; // 15 minutes
    const bufferedStartTime = new Date(timeSlot.startTime.getTime() - bufferMs);
    const bufferedEndTime = new Date(timeSlot.endTime.getTime() + bufferMs);
    
    for (const game of fieldGames) {
      // Check for overlap (including buffer time)
      if (bufferedStartTime < game.end && bufferedEndTime > game.start) {
        conflicts.push(`Field conflict with game ${game.gameIndex} (${game.start.toLocaleTimeString()} - ${game.end.toLocaleTimeString()}) - need 15min buffer`);
      }
    }
    
    return conflicts;
  }

  // Check if teams are available (respect rest time based on flight-specific rest periods)
  private checkTeamConflicts(teamIds: number[], timeSlot: {startTime: Date, endTime: Date}, teamSchedule: Map<number, Array<{start: Date, end: Date, gameIndex: number}>>): string[] {
    const conflicts: string[] = [];
    
    for (const teamId of teamIds) {
      const teamGames = teamSchedule.get(teamId) || [];
      
      // Get team-specific rest period (defaults to global constraint if not found)
      const teamRestPeriod = this.teamRestPeriods.get(teamId) || this.constraints.minTimeBetweenGames;
      
      for (const game of teamGames) {
        // Check for overlap
        if (timeSlot.startTime < game.end && timeSlot.endTime > game.start) {
          conflicts.push(`Team ${teamId} overlap with game ${game.gameIndex}`);
          continue;
        }
        
        // CRITICAL FIX: Calculate rest time from END of previous game to START of new game
        // This enforces the requirement that "the team's next game should start 90 minutes after their first game ENDS"
        const timeSinceGameEnded = timeSlot.startTime.getTime() - game.end.getTime();
        const minRestMs = teamRestPeriod * 60 * 1000;
        
        if (timeSinceGameEnded < minRestMs && timeSinceGameEnded >= 0) {
          const restMinutes = Math.round(timeSinceGameEnded / (60 * 1000));
          const teamName = this.teams.find(t => t.id === teamId)?.name || `Team ${teamId}`;
          conflicts.push(`${teamName} insufficient rest: ${restMinutes}min < ${teamRestPeriod}min required (previous game ended ${game.end.toLocaleTimeString()}, new game starts ${timeSlot.startTime.toLocaleTimeString()})`);
        }
        
        // Also check the reverse: new game ending before previous game starts
        const timeBeforeGameStarts = game.start.getTime() - timeSlot.endTime.getTime();
        if (timeBeforeGameStarts < minRestMs && timeBeforeGameStarts >= 0) {
          const restMinutes = Math.round(timeBeforeGameStarts / (60 * 1000));
          const teamName = this.teams.find(t => t.id === teamId)?.name || `Team ${teamId}`;
          conflicts.push(`${teamName} insufficient rest: ${restMinutes}min < ${teamRestPeriod}min required (from new game end to existing game start)`);
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Legacy method for compatibility - now redirects to constraint-aware scheduling
   */
  private async findOptimalTimeSlot(
    homeTeam: TeamData, 
    awayTeam: TeamData, 
    gameFormat: GameFormat, 
    availableFields: FieldData[]
  ): Promise<any> {
    
    // Check for coach conflicts
    const hasCoachConflict = homeTeam.coachNames.some(coach => 
      awayTeam.coachNames.includes(coach)
    );
    
    // This method is now deprecated in favor of the constraint-aware scheduling
    // Return a placeholder for compatibility
    return {
      startTime: new Date(),
      endTime: new Date(),
      field: availableFields[0],
      hasCoachConflict
    };

    if (hasCoachConflict) {
      console.log(`Coach conflict detected between ${homeTeam.name} and ${awayTeam.name}`);
    }

    // Select random field and tournament date for now
    // In a full implementation, this would check actual availability
    const selectedField = availableFields[0];
    const selectedDate = this.tournamentDates[0];
    
    // Generate time slot
    const gameStartTime = new Date(selectedDate);
    gameStartTime.setHours(parseInt(this.constraints.operatingStartTime.split(':')[0]), 0, 0, 0);
    
    const gameEndTime = new Date(gameStartTime.getTime() + gameFormat.gameLength * 60000);

    return {
      field: selectedField,
      startTime: gameStartTime,
      endTime: gameEndTime,
      hasCoachConflict
    };
  }

  /**
   * Get game format for age group
   */
  private getGameFormatForAgeGroup(ageGroup: string): GameFormat | undefined {
    // Try exact match first
    if (this.gameFormats.has(ageGroup)) {
      return this.gameFormats.get(ageGroup);
    }

    // Try to find compatible format by field size
    const formatsByFieldSize = Array.from(this.gameFormats.values());
    
    // Age group to field size mapping
    if (ageGroup.includes('U7') || ageGroup.includes('U8')) {
      return formatsByFieldSize.find(f => f.fieldSize === '4v4' || f.fieldSize === '7v7');
    } else if (ageGroup.includes('U9') || ageGroup.includes('U10')) {
      return formatsByFieldSize.find(f => f.fieldSize === '7v7');
    } else if (ageGroup.includes('U11') || ageGroup.includes('U12')) {
      return formatsByFieldSize.find(f => f.fieldSize === '9v9');
    } else {
      return formatsByFieldSize.find(f => f.fieldSize === '11v11');
    }
  }

  /**
   * Schedule Games - Main entry point for scheduling games with constraints
   * This is the method called by selective scheduling
   */
  async scheduleGames(gamesData: any[]): Promise<any[]> {
    console.log(`[IntelligentSchedulingEngine] scheduleGames called with ${gamesData.length} games`);
    
    if (gamesData.length === 0) {
      console.log(`[IntelligentSchedulingEngine] No games to schedule`);
      return [];
    }

    // Convert the input format to our internal format
    const gamesToSchedule = gamesData.map((game, index) => ({
      homeTeam: {
        id: game.homeTeam.id,
        name: game.homeTeam.name,
        ageGroupId: game.homeTeam.ageGroupId,
        bracketId: game.homeTeam.bracketId,
        ageGroup: 'U14 Girls', // Default for now
        gender: 'Female',
        coach: null,
        coachNames: []
      },
      awayTeam: {
        id: game.awayTeam.id,
        name: game.awayTeam.name,
        ageGroupId: game.awayTeam.ageGroupId,
        bracketId: game.awayTeam.bracketId,
        ageGroup: 'U14 Girls', // Default for now
        gender: 'Female',
        coach: null,
        coachNames: []
      },
      gameFormat: {
        ageGroup: 'U14 Girls',
        gameLength: game.gameFormat.gameLength || 90,
        halfLength: 45,
        halfTimeBreak: 10,
        bufferTime: game.gameFormat.bufferTime || 15,
        fieldSize: game.gameFormat.fieldSize || '11v11'
      },
      ageGroupId: game.homeTeam.ageGroupId || 1,
      isPending: game.isPending || false
    }));

    console.log(`[IntelligentSchedulingEngine] Converted ${gamesToSchedule.length} games for scheduling`);

    // Get suitable fields for the game format
    const gameFormat = gamesToSchedule[0].gameFormat;
    const suitableFields = this.availableFields.filter(field => 
      field.fieldSize === gameFormat.fieldSize
    );

    console.log(`[IntelligentSchedulingEngine] Found ${suitableFields.length} suitable fields of size ${gameFormat.fieldSize}`);

    if (suitableFields.length === 0) {
      console.log(`[IntelligentSchedulingEngine] ERROR: No suitable fields found for field size ${gameFormat.fieldSize}`);
      return [];
    }

    // Schedule the games using constraint-aware scheduling
    const scheduledGames = this.scheduleGamesWithConstraints(gamesToSchedule, suitableFields);
    
    console.log(`[IntelligentSchedulingEngine] Successfully scheduled ${scheduledGames.length}/${gamesToSchedule.length} games`);
    
    return scheduledGames;
  }

  /**
   * Generate tournament date range
   */
  private generateTournamentDates(startDate: string, endDate: string): void {
    console.log(`[Scheduling Engine] Generating dates from ${startDate} to ${endDate}`);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error(`Invalid tournament dates: start=${startDate}, end=${endDate}`);
    }
    
    if (start > end) {
      throw new Error(`Tournament start date (${startDate}) is after end date (${endDate})`);
    }
    
    this.tournamentDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      this.tournamentDates.push(new Date(d));
    }
    
    console.log(`[Scheduling Engine] Tournament spans ${this.tournamentDates.length} days: ${this.tournamentDates.map(d => d.toDateString()).join(', ')}`);
  }

  /**
   * Helper methods for age group/gender determination
   */
  private determineAgeGroupFromId(ageGroupId: number): string {
    // This would ideally query the eventAgeGroups table
    // For now, return a placeholder
    return `Age Group ${ageGroupId}`;
  }

  private determineGenderFromId(ageGroupId: number): string {
    // This would ideally query the eventAgeGroups table
    // For now, determine from ID patterns if available
    return 'Mixed';
  }

  /**
   * Get scheduling statistics and analysis
   */
  getSchedulingAnalysis(): any {
    const analysis = {
      totalTeams: this.teams.length,
      ageGroups: new Set(this.teams.map(t => t.ageGroup)).size,
      coachConflicts: this.coachConflicts.size,
      availableFields: this.availableFields.length,
      tournamentDays: this.tournamentDates.length,
      gameFormatsConfigured: this.gameFormats.size,
      fieldSizes: Array.from(new Set(this.availableFields.map(f => f.fieldSize))),
      constraints: this.constraints
    };

    return analysis;
  }
}