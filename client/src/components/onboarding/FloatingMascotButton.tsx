import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LifeBuoy, X, HelpCircle, Info } from 'lucide-react';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import SpeechBubble from './SpeechBubble';
import { useOnboarding } from './OnboardingContext';
import './onboarding.css';

export type FloatingPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';

interface FloatingMascotButtonProps {
  /**
   * Position of the floating button
   */
  position?: FloatingPosition;
  
  /**
   * Custom position coordinates (used when position is 'custom')
   */
  customPosition?: { top?: number; right?: number; bottom?: number; left?: number };
  
  /**
   * The emotion of the mascot
   */
  mascotEmotion?: MascotEmotion;
  
  /**
   * Message to display when the mascot is clicked
   */
  helpMessage?: string;
  
  /**
   * Label text for the help action
   */
  helpActionLabel?: string;
  
  /**
   * Callback for help action
   */
  onHelpAction?: () => void;
  
  /**
   * Whether to pulse/animate the button for attention
   */
  pulseAnimation?: boolean;
  
  /**
   * Size of the mascot button
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * A floating button with a mascot character that provides help and guidance
 * Used for onboarding and providing contextual assistance
 */
const FloatingMascotButton: React.FC<FloatingMascotButtonProps> = ({
  position = 'bottom-right',
  customPosition,
  mascotEmotion = 'neutral',
  helpMessage = 'Need help? I can guide you through features and answer questions about how to use the platform!',
  helpActionLabel = 'Show tour',
  onHelpAction,
  pulseAnimation = false,
  size = 'md',
  className = '',
}) => {
  // States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(false);
  const { progress } = useOnboarding();
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Map size to pixels
  const sizeMap = {
    sm: 40,
    md: 56,
    lg: 72,
  };
  
  const buttonSize = sizeMap[size];
  
  // Determine position styles
  const getPositionStyles = () => {
    if (position === 'custom' && customPosition) {
      return customPosition;
    }
    
    // Default positions with some padding
    const padding = 20;
    
    switch (position) {
      case 'bottom-right':
        return { bottom: padding, right: padding };
      case 'bottom-left':
        return { bottom: padding, left: padding };
      case 'top-right':
        return { top: padding, right: padding };
      case 'top-left':
        return { top: padding, left: padding };
      default:
        return { bottom: padding, right: padding };
    }
  };
  
  // Close message if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) && 
        isMessageVisible
      ) {
        setIsMessageVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMessageVisible]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Toggle message visibility
  const toggleMessage = () => {
    setIsMessageVisible(!isMessageVisible);
  };
  
  // Hide the message
  const hideMessage = () => {
    setIsMessageVisible(false);
  };
  
  // Get the emotion based on state
  const getEmotion = (): MascotEmotion => {
    if (isMessageVisible) return 'happy';
    return mascotEmotion;
  };
  
  // Get bubble position based on button position
  const getBubblePosition = () => {
    if (position.includes('right')) return 'left';
    if (position.includes('left')) return 'right';
    if (position.includes('top')) return 'bottom';
    return 'top';
  };
  
  // Construct class names
  const buttonClassName = `floating-mascot-button ${pulseAnimation ? 'pulse' : ''} ${className}`;
  
  return (
    <div 
      className="floating-mascot-container"
      style={{ 
        ...getPositionStyles(),
      }}
    >
      {/* Message bubble when expanded */}
      {isMessageVisible && (
        <div className="floating-message">
          <SpeechBubble
            message={helpMessage}
            position={getBubblePosition()}
            showMascot={false}
            width={300}
            onClose={hideMessage}
            onAction={onHelpAction}
            actionLabel={helpActionLabel}
          />
        </div>
      )}
      
      {/* Main button */}
      <Button
        ref={buttonRef}
        onClick={toggleMessage}
        className={buttonClassName}
        variant="default"
        size="icon"
        style={{ 
          width: buttonSize, 
          height: buttonSize,
          borderRadius: '50%',
        }}
      >
        <MascotCharacter
          emotion={getEmotion()}
          size={size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm'}
          animate={isMessageVisible}
        />
      </Button>
      
      {/* Optional expanded menu buttons */}
      {isExpanded && (
        <div className="floating-mascot-menu">
          <Button
            variant="outline"
            size="icon"
            className="floating-menu-item"
            onClick={() => {/* Handle help click */}}
          >
            <HelpCircle size={18} />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="floating-menu-item"
            onClick={() => {/* Handle info click */}}
          >
            <Info size={18} />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="floating-menu-item"
            onClick={() => {/* Handle support click */}}
          >
            <LifeBuoy size={18} />
          </Button>
        </div>
      )}
      
      {/* Toggle expander button */}
      {false && ( // Disabled for now, can enable later if needed
        <Button
          variant="secondary"
          size="icon"
          className="floating-expander"
          onClick={toggleExpanded}
        >
          {isExpanded ? <X size={14} /> : <HelpCircle size={14} />}
        </Button>
      )}
    </div>
  );
};

export default FloatingMascotButton;