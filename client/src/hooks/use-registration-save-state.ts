import { useState, useEffect } from 'react';

// Define our own type that matches the form structure in event-registration.tsx
// This avoids circular dependencies
interface TeamRegistrationForm {
  name: string;
  ageGroupId: number;
  bracketId?: number | null;
  headCoachName: string;
  headCoachEmail: string;
  headCoachPhone: string;
  assistantCoachName?: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  players: any[];
  selectedFeeIds?: number[];
  totalAmount?: number;
  clubId?: number | null;
  clubName?: string;
  newClub?: boolean;
}

interface SavedRegistration {
  eventId: string;
  step: string;
  formData: Partial<TeamRegistrationForm>;
  personalDetails?: any;
  lastUpdated: number;
  players?: any[];
  termsAgreed?: boolean;
}

const STORAGE_KEY = 'saved_registration';

export const useRegistrationSaveState = (eventId: string) => {
  const [savedState, setSavedState] = useState<SavedRegistration | null>(null);
  
  // Load any saved state on component mount
  useEffect(() => {
    const loadSavedState = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData) as SavedRegistration;
          
          // Only restore if it's for the current event and less than 7 days old
          const isCurrentEvent = parsed.eventId === eventId;
          const isRecent = Date.now() - parsed.lastUpdated < 7 * 24 * 60 * 60 * 1000;
          
          if (isCurrentEvent && isRecent) {
            setSavedState(parsed);
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error loading saved registration:', error);
      }
      return null;
    };

    loadSavedState();
  }, [eventId]);

  // Save the current registration state
  const saveRegistrationState = (
    step: string, 
    formData: Partial<TeamRegistrationForm>, 
    personalDetails?: any,
    players?: any[],
    termsAgreed?: boolean
  ) => {
    try {
      const dataToSave: SavedRegistration = {
        eventId,
        step,
        formData,
        personalDetails,
        players,
        termsAgreed,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setSavedState(dataToSave);
      
      return true;
    } catch (error) {
      console.error('Error saving registration state:', error);
      return false;
    }
  };

  // Clear saved registration data
  const clearSavedRegistration = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedState(null);
    } catch (error) {
      console.error('Error clearing saved registration:', error);
    }
  };

  // Check if there's a saved registration for the current event
  const hasSavedRegistration = () => {
    return savedState !== null;
  };

  return {
    savedState,
    saveRegistrationState,
    clearSavedRegistration,
    hasSavedRegistration
  };
};