/**
 * Unified Age Group Generator
 * 
 * Single source of truth for all age group creation across the platform.
 * Supports Boys/Girls, Coed, Coed-only, and U19 consolidation options.
 */

export interface AgeGroupConfig {
  includeCoed?: boolean;          // Include both Boys/Girls AND Coed versions
  coedOnly?: boolean;            // Only create Coed versions (no Boys/Girls)
  includeU19Consolidated?: boolean; // Create U19 that includes both U18 and U19 players
  customYearOffset?: number;      // Override birth year calculation (default: current year)
}

export interface StandardAgeGroup {
  ageGroup: string;
  birthYear: number;
  gender: 'Boys' | 'Girls' | 'Coed';
  divisionCode: string;
  fieldSize: string;
  projectedTeams: number;
}

/**
 * Calculate field size based on age group
 */
function getFieldSize(ageGroup: string): string {
  if (!ageGroup.startsWith('U')) return '11v11';
  const age = parseInt(ageGroup.substring(1));
  if (age <= 7) return '4v4';
  if (age <= 10) return '7v7';
  if (age <= 12) return '9v9';
  return '11v11';
}

/**
 * Generate standard age groups with configurable options
 */
export function generateStandardAgeGroups(config: AgeGroupConfig = {}): StandardAgeGroup[] {
  const {
    includeCoed = false,
    coedOnly = false,
    includeU19Consolidated = false,
    customYearOffset = 0
  } = config;

  const currentYear = new Date().getFullYear() + customYearOffset;
  const ageGroups: StandardAgeGroup[] = [];

  // Define age ranges (U4 through U19)
  const ageRanges = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  for (const age of ageRanges) {
    const ageGroup = `U${age}`;
    const birthYear = currentYear - age;
    const fieldSize = getFieldSize(ageGroup);

    // Handle U19 consolidation - skip U18 if U19 consolidated is enabled
    if (age === 18 && includeU19Consolidated) {
      continue;
    }

    // For U19 consolidated, use U18 birth year to include both U18 and U19 players
    const effectiveBirthYear = (age === 19 && includeU19Consolidated) 
      ? currentYear - 18  // Use U18 birth year to include both ages
      : birthYear;

    if (coedOnly) {
      // Only create Coed versions
      ageGroups.push({
        ageGroup: includeU19Consolidated && age === 19 ? 'U19' : ageGroup,
        birthYear: effectiveBirthYear,
        gender: 'Coed',
        divisionCode: `C${effectiveBirthYear}`,
        fieldSize,
        projectedTeams: 8
      });
    } else {
      // Create Boys and Girls versions
      ageGroups.push({
        ageGroup: includeU19Consolidated && age === 19 ? 'U19' : ageGroup,
        birthYear: effectiveBirthYear,
        gender: 'Boys',
        divisionCode: `B${effectiveBirthYear}`,
        fieldSize,
        projectedTeams: 8
      });

      ageGroups.push({
        ageGroup: includeU19Consolidated && age === 19 ? 'U19' : ageGroup,
        birthYear: effectiveBirthYear,
        gender: 'Girls',
        divisionCode: `G${effectiveBirthYear}`,
        fieldSize,
        projectedTeams: 8
      });

      // Also create Coed versions if requested
      if (includeCoed) {
        ageGroups.push({
          ageGroup: includeU19Consolidated && age === 19 ? 'U19' : ageGroup,
          birthYear: effectiveBirthYear,
          gender: 'Coed',
          divisionCode: `C${effectiveBirthYear}`,
          fieldSize,
          projectedTeams: 8
        });
      }
    }
  }

  // Sort by age group number, then by gender (Boys, Girls, Coed)
  ageGroups.sort((a, b) => {
    const getAgeNumber = (ageGroup: string) => parseInt(ageGroup.substring(1));
    const ageA = getAgeNumber(a.ageGroup);
    const ageB = getAgeNumber(b.ageGroup);
    
    if (ageA !== ageB) {
      return ageA - ageB;
    }
    
    // Within same age, sort by gender: Boys, Girls, Coed
    const genderOrder = { 'Boys': 0, 'Girls': 1, 'Coed': 2 };
    return genderOrder[a.gender] - genderOrder[b.gender];
  });

  return ageGroups;
}

/**
 * Convert StandardAgeGroup to database insert format
 */
export function formatForDatabase(ageGroups: StandardAgeGroup[], eventId: string) {
  return ageGroups.map(group => ({
    eventId,
    ageGroup: group.ageGroup,
    birthYear: group.birthYear,
    gender: group.gender,
    divisionCode: group.divisionCode,
    fieldSize: group.fieldSize,
    projectedTeams: group.projectedTeams,
    createdAt: new Date().toISOString(),
    birthDateStart: new Date(group.birthYear, 0, 1).toISOString().split('T')[0],
    birthDateEnd: new Date(group.birthYear, 11, 31).toISOString().split('T')[0]
  }));
}

/**
 * Main function to create age groups for an event
 */
export async function createAgeGroupsForEvent(
  eventId: string, 
  config: AgeGroupConfig = {}
): Promise<StandardAgeGroup[]> {
  const ageGroups = generateStandardAgeGroups(config);
  
  console.log(`Generated ${ageGroups.length} age groups for event ${eventId}`);
  console.log(`Config: ${JSON.stringify(config)}`);
  console.log(`Age groups: ${ageGroups.map(g => `${g.ageGroup}-${g.gender}`).join(', ')}`);
  
  return ageGroups;
}