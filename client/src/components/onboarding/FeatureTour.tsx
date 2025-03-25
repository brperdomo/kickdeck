import React, { useState, useEffect } from 'react';
import FeatureSpotlight from './FeatureSpotlight';

export interface TourStep {
  selector: string;
  title: string;
  description: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  mascotEmotion?: 'happy' | 'excited' | 'thinking' | 'pointing' | 'waving';
}

interface FeatureTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onExit?: () => void;
}

export const FeatureTour: React.FC<FeatureTourProps> = ({
  steps,
  isActive,
  onComplete,
  onExit,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Reset to first step when tour is activated
  useEffect(() => {
    if (isActive) {
      setCurrentStepIndex(0);
    }
  }, [isActive]);

  // Handle step navigation
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Tour complete
      onComplete();
    }
  };

  const handleClose = () => {
    if (onExit) {
      onExit();
    } else {
      onComplete();
    }
  };

  if (!isActive || steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentStepIndex];

  return (
    <FeatureSpotlight
      targetSelector={currentStep.selector}
      title={currentStep.title}
      description={currentStep.description}
      position={currentStep.position || 'bottom'}
      mascotEmotion={currentStep.mascotEmotion || 'pointing'}
      show={isActive}
      onClose={handleClose}
      onNext={nextStep}
      step={currentStepIndex + 1}
      totalSteps={steps.length}
    />
  );
};

export default FeatureTour;