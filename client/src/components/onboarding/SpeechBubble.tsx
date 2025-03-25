import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import './onboarding.css';

interface SpeechBubbleProps {
  message: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  width?: number;
  mascotEmotion?: MascotEmotion;
  showMascot?: boolean;
  className?: string;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  position = 'bottom',
  onClose,
  onAction,
  actionLabel = 'Got it',
  width = 300,
  mascotEmotion = 'excited',
  showMascot = true,
  className = '',
}) => {
  // Determine speech bubble styling based on position
  const getBubbleStyles = () => {
    const baseStyles = {
      width: `${width}px`,
      maxWidth: '100%',
    };
    
    // Add position-specific styles
    switch (position) {
      case 'top':
        return {
          ...baseStyles,
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 95%, 55% 95%, 50% 100%, 45% 95%, 0% 95%)',
        };
      case 'right':
        return {
          ...baseStyles,
          clipPath: 'polygon(5% 0%, 100% 0%, 100% 100%, 5% 100%, 5% 55%, 0% 50%, 5% 45%)',
        };
      case 'bottom':
        return {
          ...baseStyles,
          clipPath: 'polygon(0% 5%, 45% 5%, 50% 0%, 55% 5%, 100% 5%, 100% 100%, 0% 100%)',
        };
      case 'left':
        return {
          ...baseStyles,
          clipPath: 'polygon(0% 0%, 95% 0%, 95% 45%, 100% 50%, 95% 55%, 95% 100%, 0% 100%)',
        };
      default:
        return baseStyles;
    }
  };
  
  // Combined className
  const bubbleClassName = `speech-bubble ${position} bg-white p-4 rounded-lg shadow-md ${className}`;
  
  return (
    <div className="speech-bubble-container">
      {/* Mascot Character (optional) */}
      {showMascot && (
        <div className={`speech-mascot speech-mascot-${position}`}>
          <MascotCharacter emotion={mascotEmotion} size="sm" />
        </div>
      )}
      
      {/* Speech Bubble Card */}
      <Card 
        className={bubbleClassName} 
        style={getBubbleStyles()}
      >
        {/* Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" 
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
        
        {/* Content */}
        <CardContent className="pt-6 pb-2">
          <ReactMarkdown className="prose prose-sm max-w-none">
            {message}
          </ReactMarkdown>
        </CardContent>
        
        {/* Action Button (optional) */}
        {onAction && (
          <CardFooter className="flex justify-end pt-2 pb-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default SpeechBubble;