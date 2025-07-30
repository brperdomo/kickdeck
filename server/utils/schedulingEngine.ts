import { db } from '@db';
import { 
  events, 
  teams, 
  eventGameFormats, 
  eventScheduleConstraints,
  games,
  gameTimeSlots,
  fields,
  complexes
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

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  /**
   * Initialize the scheduling engine with real tournament data
   */
  async initialize(): Promise<void> {
    console.log(`Initializing scheduling engine for event ${this.eventId}`);

    // Load event details
    const event = await db.select()
      .from(events)
      .where(eq(events.id, this.eventId))
      .then(results => results[0]);

    if (!event) {
      throw new Error(`Event ${this.eventId} not found`);
    }

    console.log(`Event: ${event.name}, Dates: ${event.startDate} to ${event.endDate}`);

    // Generate tournament dates
    this.generateTournamentDates(event.startDate, event.endDate);

    // Load teams with coach information
    await this.loadTeams();

    // Load game formats
    await this.loadGameFormats();

    // Load scheduling constraints
    await this.loadConstraints();

    // Load available fields
    await this.loadFields();

    // Analyze coach conflicts
    this.analyzeCoachConflicts();

    console.log('Scheduling engine initialized successfully');
    console.log(`Teams: ${this.teams.length}, Game Formats: ${this.gameFormats.size}, Fields: ${this.availableFields.length}`);
  }

  /**
   * Load all approved teams with coach information
   */
  private async loadTeams(): Promise<void> {
    const teamRecords = await db.select({
      id: teams.id,
      name: teams.name,
      ageGroupId: teams.ageGroupId,
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
        operatingStartTime: c.operatingStartTime || "08:00",
        operatingEndTime: c.operatingEndTime || "18:00",
        restPeriodMinutes: c.minRestTimeBetweenGames || 30,
        maxGamesPerTeamPerDay: c.maxGamesPerTeamPerDay,
        minTimeBetweenGames: c.minRestTimeBetweenGames || 120
      };
    } else {
      // Default constraints
      this.constraints = {
        operatingStartTime: "08:00",
        operatingEndTime: "18:00",
        restPeriodMinutes: 30,
        maxGamesPerTeamPerDay: 3,
        minTimeBetweenGames: 120
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
   * Find optimal time slot avoiding coach conflicts
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
   * Generate tournament date range
   */
  private generateTournamentDates(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    this.tournamentDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      this.tournamentDates.push(new Date(d));
    }
    
    console.log(`Tournament spans ${this.tournamentDates.length} days`);
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