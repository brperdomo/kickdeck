import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the onboarding user progress interface
export interface OnboardingProgress {
  // Whether the user has completed the initial welcome experience
  welcomeCompleted: boolean;
  
  // The list of features the user has discovered or been introduced to
  featuresDiscovered: string[];
  
  // The sections of the app the user has visited
  sectionsVisited: string[];
  
  // Whether the user has completed the full onboarding experience
  fullyOnboarded: boolean;
  
  // The timestamp when onboarding started
  startedAt: string;
  
  // The timestamp when onboarding was completed (if applicable)
  completedAt: string | null;
  
  // Optional user preferences for the onboarding experience
  preferences: {
    showMascot: boolean;
    enableTips: boolean;
    showTourOnLogin: boolean;
  };
}

// Define the context interface
interface OnboardingContextType {
  // The user's onboarding progress
  progress: OnboardingProgress;
  
  // Whether onboarding is currently active
  isOnboardingActive: boolean;
  
  // Toggle the active state of onboarding
  toggleOnboarding: () => void;
  
  // Mark a feature as discovered
  markFeatureDiscovered: (featureId: string) => void;
  
  // Mark a section as visited
  markSectionVisited: (sectionId: string) => void;
  
  // Check if a feature has been discovered
  hasDiscoveredFeature: (featureId: string) => boolean;
  
  // Check if a section has been visited
  hasVisitedSection: (sectionId: string) => boolean;
  
  // Complete the welcome experience
  completeWelcome: () => void;
  
  // Complete the entire onboarding experience
  completeOnboarding: () => void;
  
  // Reset the onboarding progress (for testing or user request)
  resetOnboarding: () => void;
  
  // Update user preferences
  updatePreferences: (preferences: Partial<OnboardingProgress['preferences']>) => void;
}

// Create the context with a default undefined value
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Storage key for persisting onboarding progress
const STORAGE_KEY = 'kickdeck-onboarding-progress';

// Default initial progress state
const defaultProgress: OnboardingProgress = {
  welcomeCompleted: false,
  featuresDiscovered: [],
  sectionsVisited: [],
  fullyOnboarded: false,
  startedAt: new Date().toISOString(),
  completedAt: null,
  preferences: {
    showMascot: true,
    enableTips: true,
    showTourOnLogin: true,
  },
};

// Provider component that wraps the app or sections requiring onboarding
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load stored progress or use defaults
  const [progress, setProgress] = useState<OnboardingProgress>(() => {
    if (typeof window !== 'undefined') {
      const storedProgress = localStorage.getItem(STORAGE_KEY);
      if (storedProgress) {
        try {
          return JSON.parse(storedProgress) as OnboardingProgress;
        } catch (e) {
          console.error('Failed to parse stored onboarding progress', e);
        }
      }
    }
    return defaultProgress;
  });
  
  // Whether the onboarding experience is currently active
  const [isOnboardingActive, setIsOnboardingActive] = useState<boolean>(false);
  
  // Persist progress changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);
  
  // Toggle onboarding active state
  const toggleOnboarding = () => {
    setIsOnboardingActive(prev => !prev);
  };
  
  // Mark a feature as discovered
  const markFeatureDiscovered = (featureId: string) => {
    setProgress(prev => {
      // If already discovered, don't modify the array
      if (prev.featuresDiscovered.includes(featureId)) {
        return prev;
      }
      
      return {
        ...prev,
        featuresDiscovered: [...prev.featuresDiscovered, featureId],
      };
    });
  };
  
  // Mark a section as visited
  const markSectionVisited = (sectionId: string) => {
    setProgress(prev => {
      // If already visited, don't modify the array
      if (prev.sectionsVisited.includes(sectionId)) {
        return prev;
      }
      
      return {
        ...prev,
        sectionsVisited: [...prev.sectionsVisited, sectionId],
      };
    });
  };
  
  // Check if a feature has been discovered
  const hasDiscoveredFeature = (featureId: string) => {
    return progress.featuresDiscovered.includes(featureId);
  };
  
  // Check if a section has been visited
  const hasVisitedSection = (sectionId: string) => {
    return progress.sectionsVisited.includes(sectionId);
  };
  
  // Complete the welcome experience
  const completeWelcome = () => {
    setProgress(prev => ({
      ...prev,
      welcomeCompleted: true,
    }));
  };
  
  // Complete the entire onboarding experience
  const completeOnboarding = () => {
    setProgress(prev => ({
      ...prev,
      fullyOnboarded: true,
      completedAt: new Date().toISOString(),
    }));
    // Also deactivate onboarding when completed
    setIsOnboardingActive(false);
  };
  
  // Reset the onboarding progress
  const resetOnboarding = () => {
    setProgress({
      ...defaultProgress,
      startedAt: new Date().toISOString(),
    });
    // Activate onboarding again when reset
    setIsOnboardingActive(true);
  };
  
  // Update user preferences
  const updatePreferences = (preferences: Partial<OnboardingProgress['preferences']>) => {
    setProgress(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...preferences,
      },
    }));
  };
  
  // Construct the context value
  const contextValue: OnboardingContextType = {
    progress,
    isOnboardingActive,
    toggleOnboarding,
    markFeatureDiscovered,
    markSectionVisited,
    hasDiscoveredFeature,
    hasVisitedSection,
    completeWelcome,
    completeOnboarding,
    resetOnboarding,
    updatePreferences,
  };
  
  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook for using the onboarding context
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
};

export default OnboardingContext;