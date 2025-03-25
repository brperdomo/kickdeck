import React, { useState } from 'react';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import SpeechBubble from './SpeechBubble';
import './onboarding.css';

interface FloatingMascotButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: { x: number; y: number };
  message?: string;
  mascotEmotion?: MascotEmotion;
  bubblePosition?: 'top' | 'right' | 'bottom' | 'left';
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
  showInitialMessage?: boolean;
  initialDelay?: number;
  hideAfter?: number;
  size?: 'sm' | 'md' | 'lg';
  zIndex?: number;
}

const FloatingMascotButton: React.FC<FloatingMascotButtonProps> = ({
  position = 'bottom-right',
  offset = { x: 20, y: 20 },
  message,
  mascotEmotion = 'waving',
  bubblePosition = 'left',
  actionLabel,
  onAction,
  onClick,
  showInitialMessage = false,
  initialDelay = 2000,
  hideAfter = 0,
  size = 'md',
  zIndex = 100,
}) => {
  // State for showing/hiding speech bubble
  const [showBubble, setShowBubble] = useState(false);
  // State for auto-showing initial message
  const [initialMessageShown, setInitialMessageShown] = useState(false);
  
  // Show initial message after delay if enabled
  React.useEffect(() => {
    if (showInitialMessage && !initialMessageShown && message) {
      const timer = setTimeout(() => {
        setShowBubble(true);
        setInitialMessageShown(true);
        
        // Hide after specified duration if hideAfter > 0
        if (hideAfter > 0) {
          const hideTimer = setTimeout(() => {
            setShowBubble(false);
          }, hideAfter);
          
          return () => clearTimeout(hideTimer);
        }
      }, initialDelay);
      
      return () => clearTimeout(timer);
    }
  }, [showInitialMessage, initialMessageShown, message, initialDelay, hideAfter]);
  
  // Determine position styling
  const getPositionStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex,
    };
    
    switch (position) {
      case 'bottom-right':
        return {
          ...baseStyle,
          right: offset.x,
          bottom: offset.y,
        };
      case 'bottom-left':
        return {
          ...baseStyle,
          left: offset.x,
          bottom: offset.y,
        };
      case 'top-right':
        return {
          ...baseStyle,
          right: offset.x,
          top: offset.y,
        };
      case 'top-left':
        return {
          ...baseStyle,
          left: offset.x,
          top: offset.y,
        };
      default:
        return baseStyle;
    }
  };
  
  // Handle mascot click
  const handleMascotClick = () => {
    if (message) {
      setShowBubble(!showBubble);
    }
    
    if (onClick) {
      onClick();
    }
  };
  
  // Handle action button in speech bubble
  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    setShowBubble(false);
  };
  
  // Close speech bubble
  const handleCloseBubble = () => {
    setShowBubble(false);
  };
  
  return (
    <div style={getPositionStyle()} className="floating-mascot">
      {/* Speech bubble shown when active */}
      {showBubble && message && (
        <div className="floating-mascot-bubble">
          <SpeechBubble
            message={message}
            position={bubblePosition}
            onClose={handleCloseBubble}
            onAction={onAction ? handleAction : undefined}
            actionLabel={actionLabel}
            showMascot={false}
            width={250}
          />
        </div>
      )}
      
      {/* Clickable mascot character */}
      <div 
        className="floating-mascot-button cursor-pointer"
        onClick={handleMascotClick}
        role="button"
        aria-label="Mascot assistant"
        tabIndex={0}
      >
        <MascotCharacter emotion={mascotEmotion} size={size} />
      </div>
    </div>
  );
};

export default FloatingMascotButton;