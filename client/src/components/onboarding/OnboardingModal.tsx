import React from 'react';
import { useOnboarding, OnboardingStep } from './OnboardingContext';
import { MascotCharacter } from './MascotCharacter';
import SpeechBubble from './SpeechBubble';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight,
  X,
  Sparkles,
  Trophy
} from 'lucide-react';

// Step content definitions
const stepContent: Record<OnboardingStep, {
  title: string;
  content: React.ReactNode;
  emotion: 'happy' | 'excited' | 'thinking' | 'pointing' | 'waving' | 'celebrating';
}> = {
  'welcome': {
    title: "Welcome to MatchPro!",
    content: (
      <div className="space-y-4">
        <p>
          I'm Striker, your MatchPro assistant! I'll help you navigate through the platform 
          and show you how to make the most of its powerful features.
        </p>
        <p>
          Let's start with a quick tour to help you get familiar with everything.
        </p>
      </div>
    ),
    emotion: 'waving'
  },
  'dashboard-overview': {
    title: "Dashboard Overview",
    content: (
      <div className="space-y-4">
        <p>
          This is your dashboard - your home base for everything in MatchPro. From here, you can:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>View upcoming events and tournaments</li>
          <li>Access team registrations</li>
          <li>Manage your household members</li>
          <li>Check recent activities</li>
        </ul>
        <p>The navigation menu on the left gives you quick access to all areas of the platform.</p>
      </div>
    ),
    emotion: 'pointing'
  },
  'event-creation': {
    title: "Creating Events",
    content: (
      <div className="space-y-4">
        <p>
          MatchPro makes it easy to set up and manage soccer events of any size.
        </p>
        <p>
          To create a new event, click the "Create Event" button in the Events tab.
          You can customize everything from age groups to field assignments!
        </p>
        <p>
          The step-by-step form will guide you through setting up your perfect tournament.
        </p>
      </div>
    ),
    emotion: 'excited'
  },
  'team-management': {
    title: "Team Management",
    content: (
      <div className="space-y-4">
        <p>
          Managing teams is simple and efficient. You can:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Register new teams for events</li>
          <li>Add players to rosters</li>
          <li>Process registration payments</li>
          <li>Communicate with team coaches</li>
        </ul>
        <p>
          The Teams section provides a complete view of all registered teams and their status.
        </p>
      </div>
    ),
    emotion: 'happy'
  },
  'reporting': {
    title: "Reports & Analytics",
    content: (
      <div className="space-y-4">
        <p>
          MatchPro provides powerful reporting tools to help you analyze your events.
        </p>
        <p>
          In the Reports section, you can generate:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Financial summaries</li>
          <li>Team participation reports</li>
          <li>Player statistics</li>
          <li>Event performance metrics</li>
        </ul>
        <p>
          Export data in various formats for easy sharing and record-keeping.
        </p>
      </div>
    ),
    emotion: 'thinking'
  },
  'settings': {
    title: "Customizing Your Experience",
    content: (
      <div className="space-y-4">
        <p>
          Make MatchPro your own by customizing the platform to fit your needs.
        </p>
        <p>
          In Settings, you can:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Update your organization information</li>
          <li>Customize the platform's appearance</li>
          <li>Manage user permissions and roles</li>
          <li>Configure email notifications</li>
        </ul>
        <p>
          Take some time to explore the settings and make MatchPro work perfectly for you.
        </p>
      </div>
    ),
    emotion: 'pointing'
  },
  'complete': {
    title: "You're All Set!",
    content: (
      <div className="space-y-4">
        <p>
          Congratulations! You've completed the MatchPro onboarding tour.
        </p>
        <p>
          You're now ready to start using all the powerful features of the platform.
          If you ever need help, look for my icon in the corner of the screen.
        </p>
        <p>
          Good luck, and I hope MatchPro helps make your sports events a huge success!
        </p>
      </div>
    ),
    emotion: 'celebrating'
  }
};

export const OnboardingModal: React.FC = () => {
  const { 
    isOnboarding, 
    currentStep, 
    nextStep, 
    previousStep, 
    endOnboarding,
    skipOnboarding
  } = useOnboarding();

  if (!isOnboarding || !currentStep) {
    return null;
  }

  const { title, content, emotion } = stepContent[currentStep];
  const isFirstStep = currentStep === 'welcome';
  const isLastStep = currentStep === 'complete';

  return (
    <Dialog open={isOnboarding} onOpenChange={() => endOnboarding()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            {isFirstStep && <Sparkles className="h-6 w-6 text-amber-500" />}
            {isLastStep && <Trophy className="h-6 w-6 text-amber-500" />}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
          <div className="w-full sm:w-1/3 flex justify-center">
            <MascotCharacter 
              emotion={emotion} 
              size="lg" 
              animated={true} 
              className="animate-fade-in"
            />
          </div>
          
          <div className="w-full sm:w-2/3">
            <SpeechBubble 
              position="left"
              className="animate-slide-up bg-white/90 dark:bg-slate-900/90"
            >
              {content}
            </SpeechBubble>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {!isFirstStep ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={previousStep}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={skipOnboarding}
              >
                <X className="mr-1 h-4 w-4" />
                Skip Tour
              </Button>
            )}
          </div>
          
          <Button 
            onClick={isLastStep ? endOnboarding : nextStep}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLastStep ? 'Get Started' : 'Next'}
            {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;