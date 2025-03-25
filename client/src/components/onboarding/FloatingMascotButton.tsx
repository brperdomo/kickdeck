import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, X } from 'lucide-react';
import { MascotCharacter } from './MascotCharacter';
import { useOnboarding } from './OnboardingContext';
import SpeechBubble from './SpeechBubble';
import './onboarding.css';

interface FloatingMascotButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  message?: string;
  onHelp?: () => void;
}

const FloatingMascotButton: React.FC<FloatingMascotButtonProps> = ({
  position = 'bottom-right',
  message = "Need help? I'm here to assist you!",
  onHelp,
}) => {
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const { isOnboardingComplete, restartOnboarding } = useOnboarding();
  
  // Determine button position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };
  
  // Determine speech bubble position
  const getSpeechBubblePosition = () => {
    if (position.startsWith('bottom')) {
      return 'top';
    } else {
      return 'bottom';
    }
  };
  
  const handleHelp = () => {
    if (onHelp) {
      onHelp();
    } else if (isOnboardingComplete) {
      setShowSpeechBubble(!showSpeechBubble);
    } else {
      restartOnboarding();
    }
  };
  
  return (
    <div className={`fixed ${getPositionClasses()} z-40`}>
      {/* Speech bubble */}
      {showSpeechBubble && (
        <div className="mb-3 absolute bottom-16 right-0">
          <SpeechBubble
            message={message}
            position={getSpeechBubblePosition()}
            onClose={() => setShowSpeechBubble(false)}
            actionLabel="Get Started"
            onAction={() => {
              setShowSpeechBubble(false);
              restartOnboarding();
            }}
            mascotEmotion="happy"
          />
        </div>
      )}
      
      {/* Mascot button */}
      <Button
        onClick={handleHelp}
        className="h-14 w-14 rounded-full p-0 relative shadow-lg overflow-hidden bg-white hover:bg-slate-100 border border-slate-200"
        variant="outline"
      >
        <div className="animate-float">
          <MascotCharacter
            emotion={showSpeechBubble ? "happy" : "neutral"}
            size="md"
            animated={false}
          />
        </div>
        <span className="sr-only">Get help</span>
      </Button>
      
      {/* Notification dot for new users */}
      {!isOnboardingComplete && (
        <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
};

export default FloatingMascotButton;