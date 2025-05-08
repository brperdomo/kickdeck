import { useState, useEffect, useCallback } from 'react';

// Keys for localStorage
const STORAGE_KEY_PREFIX = 'saved_registration_';
const MAX_AGE_DAYS = 7;

/**
 * Hook for managing saved registration state
 * Allows for saving form data for abandoned registrations so users can resume later
 */
export function useSavedRegistration(eventId: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${eventId}`;
  const [hasSavedData, setHasSavedData] = useState<boolean>(false);
  const [savedData, setSavedData] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Check if there's saved data for this event on mount
  useEffect(() => {
    checkForSavedData();
  }, [eventId]);

  // Check for any saved registration data for this event
  const checkForSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const parsedData = JSON.parse(saved);
        
        // Check if the data is still valid (not too old)
        const savedTime = parsedData.timestamp || 0;
        const ageInDays = (Date.now() - savedTime) / (1000 * 60 * 60 * 24);
        
        if (ageInDays <= MAX_AGE_DAYS) {
          setSavedData(parsedData.data);
          setLastSaved(savedTime);
          setHasSavedData(true);
          return true;
        } else {
          // Data is too old, clear it
          clearSavedData();
        }
      }
    } catch (error) {
      console.error('Error checking for saved registration:', error);
    }
    
    return false;
  }, [eventId, storageKey]);

  // Save registration data to localStorage
  const saveRegistrationData = useCallback(
    (data: any, silent: boolean = false) => {
      try {
        const timestamp = Date.now();
        const dataToSave = {
          timestamp,
          data
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        // Only update the state if not in silent mode
        // This prevents UI notifications from appearing
        if (!silent) {
          setLastSaved(timestamp);
          setSavedData(data);
          setHasSavedData(true);
        }
        
        return true;
      } catch (error) {
        console.error('Error saving registration data:', error);
        return false;
      }
    },
    [storageKey]
  );

  // Clear saved registration data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSavedData(null);
      setLastSaved(null);
      setHasSavedData(false);
      
      return true;
    } catch (error) {
      console.error('Error clearing saved registration:', error);
      return false;
    }
  }, [storageKey]);

  return {
    hasSavedData,
    savedData,
    lastSaved,
    saveRegistrationData,
    clearSavedData,
    checkForSavedData
  };
}