import React, { useState } from 'react';
import { MascotCharacter } from './MascotCharacter';
import { useOnboarding } from './OnboardingContext';
import { Button } from '@/components/ui/button';
import {
  HelpCircle,
  BookOpen,
  Lightbulb,
  RefreshCcw,
  X
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const FloatingMascotButton: React.FC = () => {
  const { startOnboarding } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);

  const handleStartTour = () => {
    setIsOpen(false);
    startOnboarding();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            className="w-14 h-14 rounded-full shadow-lg bg-green-600 hover:bg-green-500 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 hover:scale-110 p-0"
            variant="default"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <div className="scale-90">
                <MascotCharacter emotion="happy" size="sm" animated={false} />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="top" 
          align="end" 
          className="w-64 p-0 shadow-xl rounded-lg border-green-100"
        >
          <div className="p-4 bg-green-50 rounded-t-lg border-b border-green-100">
            <h4 className="font-semibold flex items-center gap-2 text-green-800">
              <HelpCircle className="h-4 w-4" />
              Need assistance?
            </h4>
            <p className="text-sm text-green-700 mt-1">
              I'm Striker, your MatchPro assistant! How can I help you today?
            </p>
          </div>

          <div className="p-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-md p-2 h-auto"
              onClick={handleStartTour}
            >
              <BookOpen className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-sm">Start guided tour</span>
            </Button>

            <Button 
              variant="ghost"
              className="w-full justify-start text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-md p-2 h-auto"
              onClick={() => {
                setIsOpen(false);
                // Open documentation in a new tab
                window.open('https://docs.matchpro.ai', '_blank');
              }}
            >
              <Lightbulb className="mr-2 h-4 w-4 text-amber-500" />
              <span className="text-sm">View documentation</span>
            </Button>

            <Button 
              variant="ghost"
              className="w-full justify-start text-slate-700 hover:text-green-700 hover:bg-green-50 rounded-md p-2 h-auto"
              onClick={() => {
                setIsOpen(false);
                // Reset onboarding state in local storage
                localStorage.removeItem('matchpro_onboarding');
                localStorage.removeItem('matchpro_first_login');
                // Reload the page to apply changes
                window.location.reload();
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4 text-blue-500" />
              <span className="text-sm">Reset tutorials</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default FloatingMascotButton;