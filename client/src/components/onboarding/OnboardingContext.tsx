import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Define the onboarding steps
export type OnboardingStep = 
  | 'welcome' 
  | 'navigation' 
  | 'events' 
  | 'teams' 
  | 'settings' 
  | 'members' 
  | 'reports'
  | 'complete';

export interface OnboardingFeature {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  mascotEmotion?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const ONBOARDING_FEATURES: Record<string, OnboardingFeature[]> = {
  welcome: [
    {
      id: 'welcome',
      title: 'Welcome to MatchPro.ai!',
      description: 'Let\'s take a quick tour to help you get familiar with the system. I\'ll be your guide through the platform\'s main features.',
      targetSelector: 'body',
      mascotEmotion: 'waving',
    }
  ],
  navigation: [
    {
      id: 'nav-events',
      title: 'Event Management',
      description: 'Click here to manage tournaments, leagues, and other events. You can create, edit, and organize all your sporting events.',
      targetSelector: '.nav-events',
      position: 'right',
      mascotEmotion: 'pointing',
    },
    {
      id: 'nav-teams',
      title: 'Team Management',
      description: 'View and manage all registered teams. Track registrations, payments, and team information.',
      targetSelector: '.nav-teams',
      position: 'right',
      mascotEmotion: 'pointing',
    },
    {
      id: 'nav-members',
      title: 'Member Management',
      description: 'Keep track of all your members including players, coaches, and parents.',
      targetSelector: '.nav-members',
      position: 'right',
      mascotEmotion: 'pointing',
    },
    {
      id: 'nav-settings',
      title: 'System Settings',
      description: 'Configure your organization settings, branding, and system preferences.',
      targetSelector: '.nav-settings',
      position: 'right',
      mascotEmotion: 'pointing',
    }
  ],
  events: [
    {
      id: 'create-event',
      title: 'Create New Events',
      description: 'Click here to create a new tournament or league. You\'ll be able to set dates, age groups, and more.',
      targetSelector: '.create-event-button',
      position: 'bottom',
      mascotEmotion: 'excited',
    },
    {
      id: 'event-list',
      title: 'Event List',
      description: 'View and manage all your events. You can click on any event to see details or make changes.',
      targetSelector: '.events-table',
      position: 'top',
      mascotEmotion: 'pointing',
    }
  ],
  teams: [
    {
      id: 'teams-overview',
      title: 'Team Registrations',
      description: 'Track all team registrations across your events. Filter by event, age group, or status.',
      targetSelector: '.teams-table',
      position: 'top',
      mascotEmotion: 'pointing',
    },
    {
      id: 'team-status',
      title: 'Registration Status',
      description: 'See the status of each team registration including payment status and approval.',
      targetSelector: '.team-status-column',
      position: 'right',
      mascotEmotion: 'pointing',
    }
  ],
  settings: [
    {
      id: 'organization-settings',
      title: 'Organization Settings',
      description: 'Configure your organization name, contact information, and other essential details.',
      targetSelector: '.organization-settings-form',
      position: 'top',
      mascotEmotion: 'pointing',
    },
    {
      id: 'branding-settings',
      title: 'Branding Settings',
      description: 'Customize your organization\'s colors and logo to match your brand identity.',
      targetSelector: '.branding-settings',
      position: 'left',
      mascotEmotion: 'pointing',
    }
  ],
  members: [
    {
      id: 'members-list',
      title: 'Member Directory',
      description: 'View all members in your organization including players, coaches, and parents.',
      targetSelector: '.members-table',
      position: 'top',
      mascotEmotion: 'pointing',
    },
    {
      id: 'member-filters',
      title: 'Search and Filter',
      description: 'Quickly find members using search and filters to narrow down your results.',
      targetSelector: '.member-filters',
      position: 'bottom',
      mascotEmotion: 'pointing',
    }
  ],
  reports: [
    {
      id: 'financial-reports',
      title: 'Financial Reports',
      description: 'Track payments, fees, and other financial information across all your events.',
      targetSelector: '.financial-reports',
      position: 'bottom',
      mascotEmotion: 'pointing',
    },
    {
      id: 'export-options',
      title: 'Export Data',
      description: 'Export your data to Excel or CSV format for further analysis or record-keeping.',
      targetSelector: '.export-button',
      position: 'left',
      mascotEmotion: 'pointing',
    }
  ],
  complete: [
    {
      id: 'onboarding-complete',
      title: 'All Set!',
      description: 'You\'re now ready to use MatchPro.ai! If you need help at any time, just click the mascot icon in the corner.',
      targetSelector: 'body',
      mascotEmotion: 'excited',
    }
  ]
};

export interface OnboardingContextType {
  isOnboardingComplete: boolean;
  currentStep: OnboardingStep;
  currentFeatureIndex: number;
  currentFeatures: OnboardingFeature[];
  startOnboarding: () => void;
  nextFeature: () => void;
  previousFeature: () => void;
  skipToNextStep: () => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboardingComplete: false,
  currentStep: 'welcome',
  currentFeatureIndex: 0,
  currentFeatures: [],
  startOnboarding: () => {},
  nextFeature: () => {},
  previousFeature: () => {},
  skipToNextStep: () => {},
  completeOnboarding: () => {},
  restartOnboarding: () => {},
});

export interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);

  // Get features for the current step
  const currentFeatures = ONBOARDING_FEATURES[currentStep] || [];

  // Check localStorage on component mount
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboardingComplete') === 'true';
    setIsOnboardingComplete(onboardingCompleted);
    
    // If onboarding is not complete, start from welcome or where they left off
    if (!onboardingCompleted) {
      const savedStep = localStorage.getItem('onboardingStep') as OnboardingStep;
      const savedIndex = parseInt(localStorage.getItem('onboardingFeatureIndex') || '0', 10);
      
      if (savedStep && ONBOARDING_FEATURES[savedStep]) {
        setCurrentStep(savedStep);
        setCurrentFeatureIndex(savedIndex);
      }
    }
  }, []);

  // Save current progress to localStorage
  useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep);
    localStorage.setItem('onboardingFeatureIndex', currentFeatureIndex.toString());
    localStorage.setItem('onboardingComplete', isOnboardingComplete.toString());
  }, [currentStep, currentFeatureIndex, isOnboardingComplete]);

  // Start the onboarding process
  const startOnboarding = () => {
    setCurrentStep('welcome');
    setCurrentFeatureIndex(0);
    setIsOnboardingComplete(false);
  };

  // Move to the next feature
  const nextFeature = () => {
    // If we're at the last feature of the current step
    if (currentFeatureIndex >= currentFeatures.length - 1) {
      skipToNextStep();
    } else {
      // Otherwise move to the next feature in the current step
      setCurrentFeatureIndex(currentFeatureIndex + 1);
    }
  };

  // Move to the previous feature
  const previousFeature = () => {
    // If we're at the first feature of the current step
    if (currentFeatureIndex <= 0) {
      // Go to the previous step, if there is one
      const steps = Object.keys(ONBOARDING_FEATURES) as OnboardingStep[];
      const currentStepIndex = steps.indexOf(currentStep);
      
      if (currentStepIndex > 0) {
        const previousStep = steps[currentStepIndex - 1];
        setCurrentStep(previousStep);
        // Set to the last feature of the previous step
        setCurrentFeatureIndex(ONBOARDING_FEATURES[previousStep].length - 1);
      }
    } else {
      // Otherwise move to the previous feature in the current step
      setCurrentFeatureIndex(currentFeatureIndex - 1);
    }
  };

  // Skip to the next onboarding step
  const skipToNextStep = () => {
    const steps = Object.keys(ONBOARDING_FEATURES) as OnboardingStep[];
    const currentStepIndex = steps.indexOf(currentStep);
    
    // If we have more steps
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      setCurrentStep(nextStep);
      setCurrentFeatureIndex(0);
      
      // If the next step is 'complete', mark onboarding as complete
      if (nextStep === 'complete') {
        // Wait for the "all set" message to be shown before marking as complete
        setTimeout(() => {
          setIsOnboardingComplete(true);
        }, 5000);
      }
    } else {
      // We've completed all steps
      setIsOnboardingComplete(true);
    }
  };

  // Mark onboarding as complete
  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
  };

  // Restart the onboarding process
  const restartOnboarding = () => {
    setCurrentStep('welcome');
    setCurrentFeatureIndex(0);
    setIsOnboardingComplete(false);
  };

  const value: OnboardingContextType = {
    isOnboardingComplete,
    currentStep,
    currentFeatureIndex,
    currentFeatures,
    startOnboarding,
    nextFeature,
    previousFeature,
    skipToNextStep,
    completeOnboarding,
    restartOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);

export default OnboardingContext;