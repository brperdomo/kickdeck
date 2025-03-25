import React, { useState } from 'react';
import FeatureSpotlight from './FeatureSpotlight';
import { MascotEmotion } from './MascotCharacter';

export interface TourStep {
  targetSelector: string;
  message: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  mascotEmotion?: MascotEmotion;
  showMascot?: boolean;
  nextLabel?: string;
}

interface FeatureTourProps {
  steps: TourStep[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onComplete?: () => void;
  currentStep?: number;
}

const FeatureTour: React.FC<FeatureTourProps> = ({
  steps,
  open = false,
  onOpenChange,
  onComplete,
  currentStep: initialStep = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isOpen, setIsOpen] = useState(open);

  // Update local state when open prop changes
  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleStepChange = (next: boolean) => {
    if (next) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    } else {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    if (onOpenChange) onOpenChange(false);
    if (onComplete) onComplete();
  };

  if (!isOpen || steps.length === 0 || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <FeatureSpotlight
      targetSelector={step.targetSelector}
      message={`${currentStep + 1}/${steps.length}: ${step.message}`}
      position={step.position || 'bottom'}
      mascotEmotion={step.mascotEmotion || 'pointing'}
      showMascot={step.showMascot !== false}
      open={isOpen}
      onOpenChange={value => {
        setIsOpen(value);
        if (onOpenChange) onOpenChange(value);
      }}
      onNext={() => handleStepChange(true)}
      nextLabel={step.nextLabel || (currentStep === steps.length - 1 ? 'Finish' : 'Next')}
    />
  );
};

export default FeatureTour;