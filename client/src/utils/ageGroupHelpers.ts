/**
 * Age Group Helper Functions for Tournament Management
 */

export interface AgeGroupWithBirthYear {
  ageGroup: string;
  gender: string;
  birthYear?: number;
}

/**
 * Format age group display name with birth year for better tournament director visibility
 * Example: "U17 Boys - [2008]"
 */
export function formatAgeGroupDisplay(ageGroup: AgeGroupWithBirthYear): string {
  const { ageGroup: name, gender, birthYear } = ageGroup;
  return `${name} ${gender}${birthYear ? ` - [${birthYear}]` : ''}`;
}

/**
 * Sort age groups from oldest to youngest (lowest birth year to highest)
 * This provides tournament directors with logical age progression
 */
export function sortAgeGroupsByAge(ageGroups: AgeGroupWithBirthYear[]): AgeGroupWithBirthYear[] {
  return ageGroups.sort((a, b) => {
    // Primary sort: birth year (oldest first)
    if (a.birthYear && b.birthYear) {
      return a.birthYear - b.birthYear;
    }
    
    // Secondary sort: age group name if birth years are missing
    const aAge = extractAgeFromString(a.ageGroup);
    const bAge = extractAgeFromString(b.ageGroup);
    
    if (aAge && bAge) {
      return bAge - aAge; // Higher age number = older = should come first
    }
    
    // Tertiary sort: alphabetical by age group name
    return a.ageGroup.localeCompare(b.ageGroup);
  });
}

/**
 * Extract numeric age from age group string (e.g., "U17" -> 17)
 */
function extractAgeFromString(ageGroup: string): number | null {
  const match = ageGroup.match(/U?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Calculate birth year from age group and current year
 * Example: U17 in 2025 -> birth year 2008
 */
export function calculateBirthYear(ageGroup: string, currentYear = new Date().getFullYear()): number | null {
  const age = extractAgeFromString(ageGroup);
  return age ? currentYear - age : null;
}

/**
 * Group age groups by gender while maintaining age order
 */
export function groupAgeGroupsByGender(ageGroups: AgeGroupWithBirthYear[]): {
  boys: AgeGroupWithBirthYear[];
  girls: AgeGroupWithBirthYear[];
} {
  const sorted = sortAgeGroupsByAge(ageGroups);
  
  return {
    boys: sorted.filter(ag => ag.gender.toLowerCase().includes('boys')),
    girls: sorted.filter(ag => ag.gender.toLowerCase().includes('girls'))
  };
}

/**
 * Validate birth year makes sense for age group
 */
export function validateBirthYear(ageGroup: string, birthYear: number): boolean {
  const expectedBirthYear = calculateBirthYear(ageGroup);
  if (!expectedBirthYear) return true; // Can't validate if we can't parse age
  
  // Allow +/- 1 year flexibility for birth year cutoffs
  return Math.abs(birthYear - expectedBirthYear) <= 1;
}