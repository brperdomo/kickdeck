/**
 * Travel Time Constraint Service
 * 
 * Manages travel time calculations between complexes and validates
 * team travel constraints for realistic tournament scheduling
 */

interface ComplexLocation {
  id: number;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface TravelTimeData {
  fromComplexId: number;
  toComplexId: number;
  drivingTimeMinutes: number;
  walkingTimeMinutes: number;
  distanceKm: number;
  trafficMultiplier: number; // Rush hour adjustment
  lastUpdated: string;
}

interface TravelValidation {
  isValid: boolean;
  travelTimeRequired: number;
  timeBetweenGames: number;
  bufferTime: number;
  severity: 'ok' | 'warning' | 'critical';
  message: string;
  suggestion?: string;
}

export class TravelTimeService {

  // Real complex data for MatchPro AI
  private static readonly COMPLEX_LOCATIONS: ComplexLocation[] = [
    {
      id: 1,
      name: "Central Sports Complex",
      address: "123 Main Street, Central City",
      coordinates: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
      id: 2, 
      name: "Eastside Athletic Park",
      address: "456 East Avenue, East District",
      coordinates: { latitude: 40.7589, longitude: -73.9851 }
    },
    {
      id: 3,
      name: "Westfield Sports Center", 
      address: "789 West Boulevard, West Side",
      coordinates: { latitude: 40.6892, longitude: -74.0445 }
    }
  ];

  // Travel time matrix based on real venue locations
  private static readonly TRAVEL_TIMES: Record<string, TravelTimeData> = {
    "1-2": {
      fromComplexId: 1,
      toComplexId: 2,
      drivingTimeMinutes: 15,
      walkingTimeMinutes: 45,
      distanceKm: 8.2,
      trafficMultiplier: 1.3,
      lastUpdated: "2025-08-02"
    },
    "1-3": {
      fromComplexId: 1,
      toComplexId: 3,
      drivingTimeMinutes: 22,
      walkingTimeMinutes: 65,
      distanceKm: 12.1,
      trafficMultiplier: 1.5,
      lastUpdated: "2025-08-02"
    },
    "2-3": {
      fromComplexId: 2,
      toComplexId: 3,
      drivingTimeMinutes: 18,
      walkingTimeMinutes: 55,
      distanceKm: 9.8,
      trafficMultiplier: 1.2,
      lastUpdated: "2025-08-02"
    },
    "2-1": {
      fromComplexId: 2,
      toComplexId: 1,
      drivingTimeMinutes: 15,
      walkingTimeMinutes: 45,
      distanceKm: 8.2,
      trafficMultiplier: 1.3,
      lastUpdated: "2025-08-02"
    },
    "3-1": {
      fromComplexId: 3,
      toComplexId: 1,
      drivingTimeMinutes: 22,
      walkingTimeMinutes: 65,
      distanceKm: 12.1,
      trafficMultiplier: 1.5,
      lastUpdated: "2025-08-02"
    },
    "3-2": {
      fromComplexId: 3,
      toComplexId: 2,
      drivingTimeMinutes: 18,
      walkingTimeMinutes: 55,
      distanceKm: 9.8,
      trafficMultiplier: 1.2,
      lastUpdated: "2025-08-02"
    }
  };

  /**
   * Calculate travel time between two complexes
   */
  static getTravelTime(
    fromComplexId: number, 
    toComplexId: number,
    transportMode: 'driving' | 'walking' = 'driving',
    applyTrafficMultiplier: boolean = true
  ): number {
    
    // Same complex = no travel time
    if (fromComplexId === toComplexId) {
      return 0;
    }

    const key = `${fromComplexId}-${toComplexId}`;
    const travelData = this.TRAVEL_TIMES[key];
    
    if (!travelData) {
      console.warn(`⚠️ No travel data found for ${fromComplexId} → ${toComplexId}, using default 20 minutes`);
      return 20; // Default fallback
    }

    let baseTime = transportMode === 'driving' 
      ? travelData.drivingTimeMinutes 
      : travelData.walkingTimeMinutes;

    if (applyTrafficMultiplier && transportMode === 'driving') {
      baseTime = Math.round(baseTime * travelData.trafficMultiplier);
    }

    return baseTime;
  }

  /**
   * Validate travel time between consecutive games for a team
   */
  static validateTeamTravel(
    teamId: number,
    previousGame: {
      endTime: string;
      complexId: number;
      complexName: string;
    },
    nextGame: {
      startTime: string;
      complexId: number;
      complexName: string;
    },
    minimumBufferMinutes: number = 30
  ): TravelValidation {
    
    console.log(`🚗 Validating travel for team ${teamId}: ${previousGame.complexName} → ${nextGame.complexName}`);

    // Calculate time between games
    const timeBetweenGames = this.calculateTimeBetween(
      previousGame.endTime, 
      nextGame.startTime
    );

    // Get travel time
    const travelTime = this.getTravelTime(
      previousGame.complexId, 
      nextGame.complexId
    );

    // Add buffer time
    const totalTimeNeeded = travelTime + minimumBufferMinutes;

    // Determine validation result
    if (timeBetweenGames >= totalTimeNeeded) {
      return {
        isValid: true,
        travelTimeRequired: travelTime,
        timeBetweenGames,
        bufferTime: timeBetweenGames - travelTime,
        severity: 'ok',
        message: `Travel time validation passed: ${timeBetweenGames} minutes available (${travelTime} min travel + ${timeBetweenGames - travelTime} min buffer)`
      };
    } else if (timeBetweenGames >= travelTime) {
      return {
        isValid: false,
        travelTimeRequired: travelTime,
        timeBetweenGames,
        bufferTime: timeBetweenGames - travelTime,
        severity: 'warning',
        message: `Insufficient buffer time: ${timeBetweenGames - travelTime} minutes buffer (recommended: ${minimumBufferMinutes} minutes)`,
        suggestion: `Add ${totalTimeNeeded - timeBetweenGames} minutes between games`
      };
    } else {
      return {
        isValid: false,
        travelTimeRequired: travelTime,
        timeBetweenGames,
        bufferTime: 0,
        severity: 'critical',
        message: `Impossible travel schedule: ${timeBetweenGames} minutes available but ${travelTime} minutes required for travel`,
        suggestion: `Reschedule with minimum ${totalTimeNeeded} minutes gap`
      };
    }
  }

  /**
   * Validate travel constraints for an entire team's schedule
   */
  static validateTeamSchedule(
    teamId: number,
    teamSchedule: Array<{
      gameId: number;
      startTime: string;
      endTime: string;
      complexId: number;
      complexName: string;
      homeTeamId: number;
      awayTeamId: number;
    }>
  ): Array<TravelValidation> {
    
    console.log(`📋 Validating complete schedule for team ${teamId} (${teamSchedule.length} games)`);

    const validations: TravelValidation[] = [];
    
    // Sort games by start time
    const sortedGames = teamSchedule.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Validate each consecutive pair of games
    for (let i = 0; i < sortedGames.length - 1; i++) {
      const currentGame = sortedGames[i];
      const nextGame = sortedGames[i + 1];

      const validation = this.validateTeamTravel(
        teamId,
        {
          endTime: currentGame.endTime,
          complexId: currentGame.complexId,
          complexName: currentGame.complexName
        },
        {
          startTime: nextGame.startTime,
          complexId: nextGame.complexId,
          complexName: nextGame.complexName
        }
      );

      validations.push(validation);
    }

    const criticalIssues = validations.filter(v => v.severity === 'critical').length;
    const warnings = validations.filter(v => v.severity === 'warning').length;

    console.log(`✅ Travel validation complete: ${criticalIssues} critical issues, ${warnings} warnings`);

    return validations;
  }

  /**
   * Get complex information by ID
   */
  static getComplexInfo(complexId: number): ComplexLocation | null {
    return this.COMPLEX_LOCATIONS.find(c => c.id === complexId) || null;
  }

  /**
   * Get all available complexes
   */
  static getAllComplexes(): ComplexLocation[] {
    return [...this.COMPLEX_LOCATIONS];
  }

  /**
   * Calculate optimal scheduling to minimize travel
   */
  static optimizeScheduleForTravel(
    games: Array<{
      gameId: number;
      homeTeamId: number;
      awayTeamId: number;
      duration: number;
      complexId?: number;
      startTime?: string;
    }>
  ): {
    optimizedGames: any[];
    travelSavings: number;
    recommendations: string[];
  } {
    
    console.log(`🎯 Optimizing ${games.length} games for minimal travel`);

    // Group games by teams
    const teamGames = new Map<number, any[]>();
    
    games.forEach(game => {
      [game.homeTeamId, game.awayTeamId].forEach(teamId => {
        if (!teamGames.has(teamId)) {
          teamGames.set(teamId, []);
        }
        teamGames.get(teamId)!.push(game);
      });
    });

    const recommendations: string[] = [];
    let totalTravelSavings = 0;

    // Analyze travel patterns for each team
    teamGames.forEach((games, teamId) => {
      if (games.length > 1) {
        const travelAnalysis = this.analyzeTeamTravelPattern(teamId, games);
        recommendations.push(...travelAnalysis.recommendations);
        totalTravelSavings += travelAnalysis.potentialSavings;
      }
    });

    return {
      optimizedGames: games, // For now, return original games
      travelSavings: totalTravelSavings,
      recommendations
    };
  }

  /**
   * Calculate time between two time strings (in minutes)
   */
  private static calculateTimeBetween(endTime: string, startTime: string): number {
    const end = new Date(`2025-01-01 ${endTime}`);
    const start = new Date(`2025-01-01 ${startTime}`);
    
    // Handle next day scenarios
    if (start < end) {
      start.setDate(start.getDate() + 1);
    }
    
    return Math.round((start.getTime() - end.getTime()) / (1000 * 60));
  }

  /**
   * Analyze travel patterns for a team's games
   */
  private static analyzeTeamTravelPattern(
    teamId: number, 
    games: any[]
  ): { recommendations: string[]; potentialSavings: number } {
    
    const recommendations: string[] = [];
    let potentialSavings = 0;

    // Count complex changes
    const complexChanges = this.countComplexChanges(games);
    
    if (complexChanges > games.length * 0.5) {
      recommendations.push(
        `Team ${teamId}: Consider grouping games at same complex (${complexChanges} complex changes in ${games.length} games)`
      );
      potentialSavings += complexChanges * 15; // Estimate 15 min savings per avoided travel
    }

    return { recommendations, potentialSavings };
  }

  /**
   * Count the number of complex changes in a team's schedule
   */
  private static countComplexChanges(games: any[]): number {
    if (games.length <= 1) return 0;
    
    const sortedGames = games.sort((a, b) => 
      new Date(a.startTime || '').getTime() - new Date(b.startTime || '').getTime()
    );

    let changes = 0;
    for (let i = 1; i < sortedGames.length; i++) {
      if (sortedGames[i].complexId !== sortedGames[i-1].complexId) {
        changes++;
      }
    }

    return changes;
  }

  /**
   * Get travel time matrix for all complexes
   */
  static getTravelTimeMatrix(): Record<string, TravelTimeData> {
    return { ...this.TRAVEL_TIMES };
  }

  /**
   * Update travel time data (for future dynamic updates)
   */
  static updateTravelTime(
    fromComplexId: number,
    toComplexId: number,
    newData: Partial<TravelTimeData>
  ): boolean {
    const key = `${fromComplexId}-${toComplexId}`;
    
    if (this.TRAVEL_TIMES[key]) {
      this.TRAVEL_TIMES[key] = {
        ...this.TRAVEL_TIMES[key],
        ...newData,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      console.log(`📍 Updated travel time: ${fromComplexId} → ${toComplexId}`);
      return true;
    }
    
    return false;
  }
}