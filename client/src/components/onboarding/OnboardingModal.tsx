import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import './onboarding.css';

interface OnboardingStep {
  title: string;
  description: string;
  mascotEmotion?: MascotEmotion;
  nextButtonText?: string;
  prevButtonText?: string;
  skipButtonText?: string;
  footerContent?: React.ReactNode;
}

interface OnboardingModalProps {
  steps: OnboardingStep[];
  initialStep?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  showSkip?: boolean;
  onSkip?: () => void;
  showProgress?: boolean;
  showMascot?: boolean;
  mascotSize?: 'sm' | 'md' | 'lg';
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  steps,
  initialStep = 0,
  open,
  onOpenChange,
  onComplete,
  showSkip = true,
  onSkip,
  showProgress = true,
  showMascot = true,
  mascotSize = 'lg',
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  // Ensure current step is within bounds
  const safeCurrentStep = Math.max(0, Math.min(currentStep, steps.length - 1));
  const currentStepData = steps[safeCurrentStep];
  
  // Progress calculation
  const progress = ((safeCurrentStep + 1) / steps.length) * 100;
  
  // Handle next step
  const handleNext = () => {
    if (safeCurrentStep < steps.length - 1) {
      setCurrentStep(safeCurrentStep + 1);
    } else {
      // Last step - complete the onboarding
      if (onComplete) {
        onComplete();
      }
      onOpenChange(false);
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (safeCurrentStep > 0) {
      setCurrentStep(safeCurrentStep - 1);
    }
  };
  
  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="onboarding-modal sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>
          
          {/* Progress indicator */}
          {showProgress && (
            <div className="w-full h-1 bg-gray-200 rounded-full mb-4 mt-2">
              <div 
                className="h-1 bg-primary rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 py-4">
          {/* Mascot display */}
          {showMascot && (
            <div className="flex-shrink-0 flex items-center justify-center">
              <MascotCharacter 
                emotion={currentStepData.mascotEmotion || 'excited'} 
                size={mascotSize} 
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-grow">
            <DialogDescription className="text-base">
              {currentStepData.description}
            </DialogDescription>
          </div>
        </div>
        
        {/* Custom footer content */}
        {currentStepData.footerContent && (
          <div className="mb-4">
            {currentStepData.footerContent}
          </div>
        )}
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {/* Back button - only show if not on first step */}
            {safeCurrentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="text-sm"
              >
                {currentStepData.prevButtonText || 'Back'}
              </Button>
            )}
            
            {/* Skip button */}
            {showSkip && (
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="text-sm text-gray-500"
              >
                {currentStepData.skipButtonText || 'Skip'}
              </Button>
            )}
          </div>
          
          {/* Next/Complete button */}
          <Button 
            onClick={handleNext}
            className="text-sm"
          >
            {safeCurrentStep < steps.length - 1 
              ? (currentStepData.nextButtonText || 'Next') 
              : 'Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;