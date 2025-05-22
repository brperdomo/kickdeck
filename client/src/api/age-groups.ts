import axios from 'axios';

export interface AgeGroup {
  id: number;
  eventId: string | number;
  ageGroup: string;
  gender: string;
  divisionCode?: string;
  birthYear?: number;
  fieldSize?: string;
  projectedTeams?: number;
  isEligible?: boolean;
  scoringRule?: string;
}

// Update a single age group's eligibility
export const updateAgeGroupEligibility = async (
  ageGroupId: number,
  isEligible: boolean
): Promise<{ success: boolean }> => {
  try {
    const response = await axios.put(`/api/admin/age-group-eligibility/${ageGroupId}`, {
      isEligible
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update age group eligibility:', error);
    throw error;
  }
};

// Bulk update multiple age groups' eligibility
export const bulkUpdateAgeGroupEligibility = async (
  ageGroups: { id: number; isEligible: boolean }[]
): Promise<{ success: boolean }> => {
  try {
    const response = await axios.put('/api/admin/age-group-eligibility', {
      ageGroups
    });
    return response.data;
  } catch (error) {
    console.error('Failed to bulk update age group eligibility:', error);
    throw error;
  }
};