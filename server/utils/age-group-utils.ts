
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
    // U13 and up (including new U19) all use 11v11
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
  // Use birth year if available
  if (birthYear) {
    return `${gender.charAt(0)}${birthYear}`;
  }
  
  // If age group is provided and in the format "U10", derive birth year
  if (ageGroup && ageGroup.startsWith('U') && ageGroup.length > 1) {
    const ageNum = parseInt(ageGroup.substring(1));
    const currentYear = new Date().getFullYear();
    const derivedBirthYear = currentYear - ageNum;
    return `${gender.charAt(0)}${derivedBirthYear}`;
  }
  
  // Fallback
  return `${gender.charAt(0)}-${ageGroup || 'Unknown'}`;
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
