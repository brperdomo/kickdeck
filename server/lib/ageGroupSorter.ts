/**
 * Universal Age Group Sorting Utility
 * 
 * Ensures consistent sorting across all components:
 * Admin Age Groups, Fee Management, Brackets, etc.
 */

export interface AgeGroupSortable {
  ageGroup: string;
  gender: string;
  [key: string]: any;
}

/**
 * Universal age group sorting function
 * Used by all endpoints and components for consistency
 */
export function sortAgeGroups<T extends AgeGroupSortable>(ageGroups: T[]): T[] {
  return ageGroups.sort((a, b) => {
    // First sort by age group number (U4, U5, U6, etc.)
    const getAgeNumber = (ageGroup: string) => {
      if (ageGroup.startsWith('U')) {
        return parseInt(ageGroup.substring(1));
      }
      return 999; // Put non-U groups at the end
    };
    
    const ageA = getAgeNumber(a.ageGroup);
    const ageB = getAgeNumber(b.ageGroup);
    
    if (ageA !== ageB) {
      return ageA - ageB;
    }
    
    // Within same age, sort by gender: Boys, Girls, Coed
    const genderOrder: { [key: string]: number } = { 'Boys': 0, 'Girls': 1, 'Coed': 2 };
    return (genderOrder[a.gender] || 3) - (genderOrder[b.gender] || 3);
  });
}