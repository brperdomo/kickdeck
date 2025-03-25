import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import './onboarding.css';

interface SpeechBubbleProps {
  /**
   * The message content to display in the bubble
   */
  message: string;
  
  /**
   * Position of the bubble's pointer
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Width of the bubble in pixels
   */
  width?: number;
  
  /**
   * Whether to show the mascot character
   */
  showMascot?: boolean;
  
  /**
   * Emotion of the mascot character
   */
  mascotEmotion?: MascotEmotion;
  
  /**
   * Label for the action button
   */
  actionLabel?: string;
  
  /**
   * Callback for the action button
   */
  onAction?: () => void;
  
  /**
   * Callback when the bubble is closed
   */
  onClose?: () => void;
}

/**
 * A speech bubble component that displays text content with an optional mascot character
 * Used in the onboarding experience to provide information and guidance
 */
const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  position = 'bottom',
  width = 250,
  showMascot = true,
  mascotEmotion = 'neutral',
  actionLabel,
  onAction,
  onClose,
}) => {
  // Determine position-specific styles
  const getPositionStyles = () => {
    const bubbleStyles: React.CSSProperties = {
      width: `${width}px`,
    };
    
    // Add specific styles based on position
    switch (position) {
      case 'top':
        bubbleStyles.marginBottom = '12px';
        break;
      case 'right':
        bubbleStyles.marginLeft = '12px';
        break;
      case 'bottom':
        bubbleStyles.marginTop = '12px';
        break;
      case 'left':
        bubbleStyles.marginRight = '12px';
        break;
    }
    
    return bubbleStyles;
  };
  
  // Helper to determine the appropriate pointer class based on position
  const getPointerClass = () => {
    return `speech-bubble-pointer-${position}`;
  };
  
  return (
    <div className="speech-bubble-container">
      {/* Show mascot on the appropriate side */}
      {showMascot && position !== 'left' && (
        <div className="speech-bubble-mascot left">
          <MascotCharacter emotion={mascotEmotion} size="md" />
        </div>
      )}
      
      {/* The actual speech bubble */}
      <div 
        className={`speech-bubble ${getPointerClass()}`} 
        style={getPositionStyles()}
      >
        {/* Close button if onClose is provided */}
        {onClose && (
          <Button 
            className="speech-bubble-close" 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        )}
        
        {/* Message content with markdown support */}
        <div className="speech-bubble-content">
          <ReactMarkdown>{message}</ReactMarkdown>
        </div>
        
        {/* Action button if provided */}
        {actionLabel && onAction && (
          <div className="speech-bubble-actions">
            <Button 
              variant="default" 
              size="sm" 
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
      
      {/* Show mascot on the right side if position is left */}
      {showMascot && position === 'left' && (
        <div className="speech-bubble-mascot right">
          <MascotCharacter emotion={mascotEmotion} size="md" />
        </div>
      )}
    </div>
  );
};

export default SpeechBubble;