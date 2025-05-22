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

interface EligibilitySettingPayload {
  eventId: string | number;
  ageGroupId: string;
  isEligible: boolean;
}

// Update a single age group's eligibility (using the original endpoint)
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

// Bulk update multiple age groups' eligibility (using the original endpoint)
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

// Update a single age group's eligibility using the new eligibility settings endpoint
// This uses string-based composite IDs to avoid foreign key constraints
export const updateAgeGroupEligibilitySetting = async (
  payload: EligibilitySettingPayload
): Promise<{ success: boolean }> => {
  try {
    console.log(`API call: Updating eligibility for event ${payload.eventId}, age group ID ${payload.ageGroupId} to ${payload.isEligible}`);
    
    const response = await axios.put(`/api/admin/age-group-eligibility-settings/${payload.ageGroupId}`, {
      eventId: payload.eventId,
      isEligible: payload.isEligible
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to update age group eligibility setting:', error);
    throw error;
  }
};