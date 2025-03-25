import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { MascotCharacter, MascotEmotion } from './MascotCharacter';
import { useOnboarding } from './OnboardingContext';
import './onboarding.css';

export interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
  mascotEmotion?: MascotEmotion;
}

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: OnboardingStep[];
  title?: string;
  onComplete?: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onOpenChange,
  steps,
  title = 'Welcome to MatchPro.ai!',
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding } = useOnboarding();

  // Reset to first step when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    if (onComplete) {
      onComplete();
    }
    completeOnboarding();
  };

  const handleSkip = () => {
    onOpenChange(false);
    completeOnboarding();
  };

  if (steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)}
            className="rounded-full h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {/* Left panel - Image/Mascot section */}
          <div className="flex-1 bg-gradient-to-br from-green-100 to-green-50 dark:from-slate-800 dark:to-slate-900 p-6 md:p-10 flex flex-col items-center justify-center relative">
            <div className="w-full max-w-xs">
              {step.image ? (
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-auto rounded-lg shadow-md mx-auto"
                />
              ) : (
                <div className="w-full h-full flex justify-center items-center py-8">
                  <MascotCharacter 
                    emotion={step.mascotEmotion || 'happy'} 
                    size="lg" 
                    animated={true}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Right panel - Content section */}
          <div className="flex-1 p-6 md:p-10 flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {currentStep === 0 ? title : step.title}
            </h2>
            
            <div className="mb-4 text-slate-600 dark:text-slate-300">
              <p>{step.description}</p>
            </div>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                
                {currentStep === 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={handleSkip}
                    className="text-slate-500"
                  >
                    Skip tour
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <span 
                      key={index}
                      className={cn(
                        "block h-2 w-2 rounded-full transition-colors",
                        index === currentStep 
                          ? "bg-green-500" 
                          : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  ))}
                </div>
                
                <Button 
                  onClick={handleNext}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                  {!isLastStep && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;