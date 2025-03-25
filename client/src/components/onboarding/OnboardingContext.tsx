import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type OnboardingStep = 
  | 'welcome'
  | 'dashboard-overview'
  | 'event-creation'
  | 'team-management'
  | 'reporting'
  | 'settings'
  | 'complete';

interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: OnboardingStep | null;
  completedSteps: OnboardingStep[];
  startOnboarding: () => void;
  endOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  skipOnboarding: () => void;
  isStepCompleted: (step: OnboardingStep) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'dashboard-overview',
  'event-creation',
  'team-management',
  'reporting',
  'settings',
  'complete'
];

const STORAGE_KEY = 'matchpro_onboarding';

interface OnboardingState {
  isOnboarding: boolean;
  currentStep: OnboardingStep | null;
  completedSteps: OnboardingStep[];
  hasCompletedOnboarding: boolean;
}

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    isOnboarding: false,
    currentStep: null,
    completedSteps: [],
    hasCompletedOnboarding: false,
  });

  // Load onboarding state from local storage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
      } catch (error) {
        console.error('Failed to parse onboarding state from localStorage', error);
      }
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check if this is a new user (first login)
  useEffect(() => {
    const isFirstLogin = localStorage.getItem('matchpro_first_login');
    if (isFirstLogin === null && !state.hasCompletedOnboarding) {
      localStorage.setItem('matchpro_first_login', 'false');
      // Auto-start onboarding for first-time users, but only after a delay
      // to ensure everything else is loaded
      const timer = setTimeout(() => {
        if (!state.isOnboarding && !state.hasCompletedOnboarding) {
          startOnboarding();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.isOnboarding, state.hasCompletedOnboarding]);

  const startOnboarding = () => {
    setState({
      ...state,
      isOnboarding: true,
      currentStep: 'welcome',
      completedSteps: [],
    });
  };

  const endOnboarding = () => {
    setState({
      ...state,
      isOnboarding: false,
      currentStep: null,
      hasCompletedOnboarding: true,
    });
  };

  const nextStep = () => {
    if (!state.currentStep) return;
    
    const currentIndex = ONBOARDING_STEPS.indexOf(state.currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStep = ONBOARDING_STEPS[currentIndex + 1];
      setState({
        ...state,
        currentStep: nextStep,
        completedSteps: [...state.completedSteps, state.currentStep],
      });
    } else {
      // If we're at the last step, end onboarding
      endOnboarding();
    }
  };

  const previousStep = () => {
    if (!state.currentStep) return;
    
    const currentIndex = ONBOARDING_STEPS.indexOf(state.currentStep);
    if (currentIndex > 0) {
      const previousStep = ONBOARDING_STEPS[currentIndex - 1];
      setState({
        ...state,
        currentStep: previousStep,
      });
    }
  };

  const goToStep = (step: OnboardingStep) => {
    if (ONBOARDING_STEPS.includes(step)) {
      setState({
        ...state,
        isOnboarding: true,
        currentStep: step,
      });
    }
  };

  const skipOnboarding = () => {
    setState({
      isOnboarding: false,
      currentStep: null,
      completedSteps: [...ONBOARDING_STEPS],
      hasCompletedOnboarding: true,
    });
  };

  const isStepCompleted = (step: OnboardingStep) => {
    return state.completedSteps.includes(step);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding: state.isOnboarding,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        startOnboarding,
        endOnboarding,
        nextStep,
        previousStep,
        goToStep,
        skipOnboarding,
        isStepCompleted,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;