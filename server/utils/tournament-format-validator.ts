/**
 * Tournament Format Validation Utilities
 * Prevents inappropriate use of round_robin formats and enforces proper group formats
 */

export interface TournamentFormatValidation {
  isValid: boolean;
  recommendedFormat: string | null;
  reason: string;
}

/**
 * Validates and recommends proper tournament format based on team count
 */
export function validateTournamentFormat(
  requestedFormat: string, 
  teamCount: number
): TournamentFormatValidation {
  
  // CRITICAL RULE: Never allow plain round_robin for organized tournaments
  if (requestedFormat === 'round_robin' && teamCount > 0) {
    const recommendedFormat = getRecommendedFormat(teamCount);
    return {
      isValid: false,
      recommendedFormat,
      reason: `Plain round_robin format is not allowed. Use ${recommendedFormat} for ${teamCount} teams.`
    };
  }

  // CRITICAL RULE: Never allow round_robin_final without proper justification
  if (requestedFormat === 'round_robin_final' && teamCount > 0) {
    const recommendedFormat = getRecommendedFormat(teamCount);
    return {
      isValid: false,
      recommendedFormat,
      reason: `round_robin_final is deprecated. Use ${recommendedFormat} for ${teamCount} teams.`
    };
  }

  // Validate format matches team count
  const formatValidation = validateFormatTeamCountMatch(requestedFormat, teamCount);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  return {
    isValid: true,
    recommendedFormat: null,
    reason: 'Format is valid for team count'
  };
}

/**
 * Get recommended format based on team count
 */
export function getRecommendedFormat(teamCount: number): string {
  switch (teamCount) {
    case 4:
    case 5:
      return 'group_of_4';
    case 6:
      return 'group_of_6'; // Can be changed to crossplay if needed
    case 7:
    case 8:
      return 'group_of_8';
    case 2:
    case 3:
      return 'single_elimination';
    default:
      if (teamCount > 8) {
        return 'swiss_system';
      }
      return 'single_elimination';
  }
}

/**
 * Validate that format is appropriate for team count
 */
function validateFormatTeamCountMatch(format: string, teamCount: number): TournamentFormatValidation {
  const validationRules: Record<string, { minTeams: number; maxTeams: number; isOptimal: (count: number) => boolean }> = {
    'group_of_4': {
      minTeams: 3,
      maxTeams: 5,
      isOptimal: (count) => count === 4
    },
    'group_of_6': {
      minTeams: 5,
      maxTeams: 7,
      isOptimal: (count) => count === 6
    },
    'crossplay': {
      minTeams: 6,
      maxTeams: 6,
      isOptimal: (count) => count === 6
    },
    'full_crossplay': {
      minTeams: 6,
      maxTeams: 6,
      isOptimal: (count) => count === 6
    },
    'group_of_6_crossplay': {
      minTeams: 6,
      maxTeams: 6,
      isOptimal: (count) => count === 6
    },
    'crossover_bracket_6_teams': {
      minTeams: 6,
      maxTeams: 6,
      isOptimal: (count) => count === 6
    },
    'group_of_8': {
      minTeams: 7,
      maxTeams: 9,
      isOptimal: (count) => count === 8
    },
    'single_elimination': {
      minTeams: 2,
      maxTeams: 32,
      isOptimal: (count) => [2, 4, 8, 16, 32].includes(count)
    },
    'swiss_system': {
      minTeams: 8,
      maxTeams: 64,
      isOptimal: (count) => count >= 8
    }
  };

  const rule = validationRules[format];
  if (!rule) {
    return {
      isValid: false,
      recommendedFormat: getRecommendedFormat(teamCount),
      reason: `Unknown format '${format}'. Recommended: ${getRecommendedFormat(teamCount)}`
    };
  }

  if (teamCount < rule.minTeams || teamCount > rule.maxTeams) {
    return {
      isValid: false,
      recommendedFormat: getRecommendedFormat(teamCount),
      reason: `Format '${format}' requires ${rule.minTeams}-${rule.maxTeams} teams, got ${teamCount}`
    };
  }

  if (!rule.isOptimal(teamCount)) {
    return {
      isValid: true,
      recommendedFormat: getRecommendedFormat(teamCount),
      reason: `Format '${format}' works but ${getRecommendedFormat(teamCount)} is optimal for ${teamCount} teams`
    };
  }

  return {
    isValid: true,
    recommendedFormat: null,
    reason: 'Format is optimal for team count'
  };
}

/**
 * Check if a format is a crossplay variant
 */
export function isCrossplayFormat(format: string): boolean {
  const crossplayFormats = [
    'crossplay',
    'full_crossplay', 
    'group_of_6_crossplay',
    'crossover_bracket_6_teams'
  ];
  
  return crossplayFormats.includes(format) || 
         format.toLowerCase().includes('crossplay') ||
         format.toLowerCase().includes('crossover');
}

/**
 * Auto-fix deprecated formats to proper ones
 */
export function autoFixDeprecatedFormat(format: string, teamCount: number): string {
  // Auto-fix deprecated round_robin formats
  if (format === 'round_robin' || format === 'round_robin_final') {
    return getRecommendedFormat(teamCount);
  }
  
  return format;
}