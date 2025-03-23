
// Utility functions for standardizing age groups across the application

/**
 * Determines the standard field size based on age group
 * @param ageGroup Age group string (e.g., "U10", "U14")
 * @returns The appropriate field size for the age group
 */
export function getStandardFieldSize(ageGroup: string): string {
  // Default to 11v11 if not a standard format
  if (!ageGroup || !ageGroup.startsWith('U')) {
    return '11v11';
  }
  
  // Extract the age number from the age group (e.g., 10 from "U10")
  const ageNum = parseInt(ageGroup.substring(1));
  
  // Apply standard field size rules based on age
  if (ageNum <= 7) {
    return '4v4';
  } else if (ageNum <= 10) {
    return '7v7';
  } else if (ageNum <= 12) {
    return '9v9';
  } else {
    return '11v11';
  }
}

/**
 * Creates a division code from gender and birth year or age group
 * @param gender Gender string ("Boys" or "Girls")
 * @param birthYear Birth year number
 * @param ageGroup Age group string (alternative to birthYear)
 * @returns A division code in the format "G2010" or "B2015"
 */
export function createDivisionCode(gender: string, birthYear?: number, ageGroup?: string): string {
  // Clean up gender input
  const genderPrefix = getGenderPrefix(gender);
  
  // Use birth year if available
  if (birthYear) {
    return `${genderPrefix}${birthYear}`;
  }
  
  // If age group is provided and in the format "U10", derive birth year
  if (ageGroup && ageGroup.startsWith('U') && ageGroup.length > 1) {
    const ageNum = parseInt(ageGroup.substring(1));
    const currentYear = new Date().getFullYear();
    const derivedBirthYear = currentYear - ageNum;
    return `${genderPrefix}${derivedBirthYear}`;
  }
  
  // Fallback
  return `${genderPrefix}-${ageGroup || 'Unknown'}`;
}

/**
 * Normalizes an existing division code to the standard format (B2022, G2021)
 * or creates a new one if the existing code is not valid or doesn't exist
 * 
 * @param ageGroup The ageGroup object with all properties
 * @returns A standardized division code in the format B2022 or G2021
 */
export function normalizeDivisionCode(ageGroup: any): string {
  // If it already has a well-formatted division code, return it
  if (ageGroup.divisionCode && /^[BG]\d{4}$/.test(ageGroup.divisionCode)) {
    return ageGroup.divisionCode;
  }
  
  const genderPrefix = getGenderPrefix(ageGroup.gender);

  // For male/female variations like "Boys-U19-11v11", extract from existing code
  if (ageGroup.divisionCode && ageGroup.divisionCode.includes('U')) {
    const match = ageGroup.divisionCode.match(/U(\d+)/);
    if (match && match[1]) {
      const ageNum = parseInt(match[1]);
      const currentYear = new Date().getFullYear();
      const derivedBirthYear = currentYear - ageNum;
      return `${genderPrefix}${derivedBirthYear}`;
    }
  }
  
  // Try to generate from birth year
  if (ageGroup.birthYear) {
    return `${genderPrefix}${ageGroup.birthYear}`;
  }
  
  // Try to generate from ageGroup (U10, U12, etc.)
  if (ageGroup.ageGroup && ageGroup.ageGroup.startsWith('U') && ageGroup.ageGroup.length > 1) {
    const ageNum = parseInt(ageGroup.ageGroup.substring(1));
    const currentYear = new Date().getFullYear();
    const derivedBirthYear = currentYear - ageNum;
    return `${genderPrefix}${derivedBirthYear}`;
  }
  
  // Last resort fallback
  return ageGroup.divisionCode || `${genderPrefix}-Unknown`;
}

/**
 * Helper function to standardize gender prefixes
 * @param gender Gender string in any format (Boys, Girls, Male, Female, etc.)
 * @returns B for male variants, G for female variants
 */
function getGenderPrefix(gender: string): string {
  if (!gender) return 'X'; // Unknown gender
  
  const lowerGender = gender.toLowerCase();
  
  if (lowerGender.startsWith('b') || lowerGender.startsWith('m') || lowerGender.includes('boy')) {
    return 'B';
  }
  
  if (lowerGender.startsWith('g') || lowerGender.startsWith('f') || lowerGender.includes('girl')) {
    return 'G';
  }
  
  return gender.charAt(0).toUpperCase(); // Fallback to first letter capitalized
}

/**
 * Returns all standard age groups with required properties
 * @returns Array of standardized age groups with division codes
 */
export function getAllStandardAgeGroups(eventId?: string | number) {
  const { PREDEFINED_AGE_GROUPS } = require('../../client/src/components/forms/event-form-types');
  
  return PREDEFINED_AGE_GROUPS.map(group => ({
    ...group,
    eventId: eventId || null,
    fieldSize: getStandardFieldSize(group.ageGroup),
    projectedTeams: 0,
    birthDateStart: null,
    birthDateEnd: null,
    scoringRule: null,
    amountDue: null,
    createdAt: new Date().toISOString(),
  }));
}
