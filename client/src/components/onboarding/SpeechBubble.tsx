import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import './onboarding.css';

export type SpeechBubblePosition = 'top' | 'right' | 'bottom' | 'left';

export interface SpeechBubbleProps {
  /**
   * The content/message to display
   */
  message: string;
  
  /**
   * The position of the speech bubble relative to its container
   */
  position?: SpeechBubblePosition;
  
  /**
   * Whether to show the mascot alongside the speech bubble
   */
  showMascot?: boolean;
  
  /**
   * The emotion/expression of the mascot
   */
  mascotEmotion?: MascotEmotion;
  
  /**
   * Optional action button label
   */
  actionLabel?: string;
  
  /**
   * Callback when action button is clicked
   */
  onAction?: () => void;
  
  /**
   * Width of the speech bubble in pixels
   */
  width?: number;
  
  /**
   * Additional class names for styling
   */
  className?: string;
  
  /**
   * Callback when closing the speech bubble
   */
  onClose?: () => void;
}

/**
 * A speech bubble component with optional mascot character
 * Used for guiding users and providing contextual help
 */
const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  position = 'right',
  showMascot = true,
  mascotEmotion = 'neutral',
  actionLabel,
  onAction,
  width = 300,
  className = '',
  onClose,
}) => {
  // Construct class names for positioning
  const containerClassName = `speech-bubble-container ${className}`;
  
  // Arrow styles based on position
  const getArrowStyles = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderRadius: '0 0 2px 0',
        };
      case 'right':
        return {
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderRadius: '0 0 0 2px',
        };
      case 'bottom':
        return {
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderRadius: '2px 0 0 0',
        };
      case 'left':
        return {
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderRadius: '0 2px 0 0',
        };
      default:
        return {};
    }
  };
  
  // Mascot position based on bubble position
  const getMascotPosition = () => {
    if (!showMascot) return null;
    
    const mascotClassName = `speech-mascot speech-mascot-${position}`;
    
    return (
      <div className={mascotClassName}>
        <MascotCharacter 
          emotion={mascotEmotion} 
          size="md" 
          animate={mascotEmotion === 'waving' || mascotEmotion === 'excited'} 
        />
      </div>
    );
  };
  
  return (
    <div className={containerClassName} style={{ width: `${width}px` }}>
      {/* The mascot character */}
      {getMascotPosition()}
      
      {/* The speech bubble card */}
      <Card className="relative">
        {/* Close button if onClose is provided */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Content of the speech bubble */}
        <CardContent className="p-4">
          {/* Message text with markdown support */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
            <ReactMarkdown>{message}</ReactMarkdown>
          </div>
          
          {/* Action button if provided */}
          {actionLabel && onAction && (
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={onAction}>
                {actionLabel}
              </Button>
            </div>
          )}
        </CardContent>
        
        {/* The arrow/pointer */}
        <div
          className="absolute w-4 h-4 bg-card"
          style={getArrowStyles()}
        />
      </Card>
    </div>
  );
};

export default SpeechBubble;